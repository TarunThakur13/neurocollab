import json
import os
from collections import defaultdict
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from langchain_core.messages import HumanMessage

from graph import workflow
import models
import database
import auth

load_dotenv()

# Create DB tables
models.Base.metadata.create_all(bind=database.engine)


# ---------------------------------------------------------------------------
# Streaming configuration
# ---------------------------------------------------------------------------

# Nodes that produce LLM token streams (streamed to the frontend as chat bubbles)
TOKEN_STREAM_NODES = {"react_researcher", "coder", "synthesizer", "worker"}

# Reviewer uses structured output — no tokens, but gets agent_start/done via chain events
REVIEWER_NODES = {"reviewer"}

# Union — all nodes that create visible agent bubbles in the UI
ALL_AGENT_NODES = TOKEN_STREAM_NODES | REVIEWER_NODES

# Status message emitted when each node's chain begins
NODE_STATUS_MAP: dict[str, tuple[str, str]] = {
    "router":           ("orchestrator", "🔀 Analyzing query complexity and selecting execution strategy..."),
    "orchestrator":     ("orchestrator", "⚙️ Decomposing query into parallel research sub-tasks..."),
    "react_researcher": ("researcher",   "🔎 Initializing ReACT reasoning loop..."),
    "worker":           ("researcher",   "🔬 Launching parallel research worker..."),
    "synthesizer":      ("orchestrator", "🔄 Synthesizing results from parallel workers..."),
    "reviewer":         ("reviewer",     "🔍 Reviewing code for accuracy and edge cases..."),
    "coder":            ("coder",        "💻 Generating production-ready code..."),
}

# Maps LangGraph node names to the AgentRole the frontend understands
FRONTEND_AGENT_MAP: dict[str, str] = {
    "react_researcher": "researcher",
    "worker":           "researcher",
    "synthesizer":      "orchestrator",
    "orchestrator":     "orchestrator",
    "router":           "orchestrator",
    "coder":            "coder",
    "reviewer":         "reviewer",
}


def _tool_status(tool_name: str, tool_input: dict) -> str | None:
    if tool_name == "web_search":
        return f'🔍 Searching: "{tool_input.get("query", "")}"...'
    if tool_name == "web_scraper":
        return f'🌐 Scraping: {tool_input.get("url", "")}...'
    if tool_name == "calculator":
        return f'🧮 Computing: {tool_input.get("expression", "")}...'
    return None


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI):
    key_status = "OK" if os.getenv("GROQ_API_KEY") else "MISSING -- set GROQ_API_KEY in .env"
    print(f"NeuroCollab v2 backend starting | GROQ_API_KEY: {key_status}")
    yield
    print("NeuroCollab v2 backend shut down.")


app = FastAPI(
    title="NeuroCollab API",
    description="Production-grade multi-agent AI workspace — Reflexion + Orchestrator-Worker + ReACT",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "neurocollab-backend", "version": "2.0.0"}


@app.get("/history")
def get_history(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    history = db.query(models.TaskHistory).filter(models.TaskHistory.user_id == current_user.id).order_by(models.TaskHistory.timestamp.desc()).all()
    return history

@app.post("/history")
def save_history(task_data: dict, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_history = models.TaskHistory(
        task_id=task_data["taskId"],
        timestamp=task_data["timestamp"],
        user_prompt=task_data["userPrompt"],
        agent_responses=task_data["agentResponses"],
        user_id=current_user.id
    )
    db.add(db_history)
    db.commit()
    return {"status": "success"}


# ---------------------------------------------------------------------------
# WebSocket endpoint — streams astream_events v2 to the Next.js frontend
# ---------------------------------------------------------------------------


@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    await websocket.accept()
    db = database.SessionLocal()
    try:
        user = await auth.get_current_user(token=token, db=db)
    except HTTPException:
        await websocket.send_json({"status": "error", "message": "Authentication failed"})
        await websocket.close()
        db.close()
        return
    finally:
        db.close()

    try:
        while True:
            raw = await websocket.receive_text()

            try:
                data = json.loads(raw)
                user_message = data.get("message", raw)
            except json.JSONDecodeError:
                user_message = raw

            if not user_message.strip():
                await websocket.send_json({"status": "error", "message": "Empty input"})
                continue

            await websocket.send_json({
                "agent": "orchestrator",
                "type": "status",
                "content": "Received query. Initializing NeuroCollab v2 agents...",
                "status": "streaming",
            })

            # ------------------------------------------------------------------
            # Per-request tracking (reset for every new message)
            # ------------------------------------------------------------------
            # active_node_counts: how many parallel instances of each node are live
            # This correctly handles N parallel workers (all map to "researcher")
            active_node_counts: dict[str, int] = defaultdict(int)

            # token_stream_started: set of node names that have emitted agent_start
            # Prevents duplicate agent_start for parallel workers
            token_stream_started: set[str] = set()

            try:
                async for event in workflow.astream_events(
                    {
                        "messages": [HumanMessage(content=user_message)],
                        "worker_results": [],
                        "subtasks": [],
                        "subtask": "",
                        "revision_count": 0,
                        "revision_verdict": "",
                        "next_node": "",
                        "sender": "",
                    },
                    version="v2",
                ):
                    kind: str = event.get("event", "")
                    name: str = event.get("name", "")
                    metadata: dict = event.get("metadata", {})
                    lg_node: str = metadata.get("langgraph_node", "")

                    # ----------------------------------------------------------
                    # Node chain starts: emit status + track active counts
                    # The `name == lg_node` guard filters out inner chain events
                    # ----------------------------------------------------------
                    if kind == "on_chain_start" and name in NODE_STATUS_MAP and name == lg_node:
                        is_first_instance = True

                        if name in ALL_AGENT_NODES:
                            active_node_counts[name] += 1
                            is_first_instance = active_node_counts[name] == 1

                        if is_first_instance:
                            agent_role, status_text = NODE_STATUS_MAP[name]
                            await websocket.send_json({
                                "agent": agent_role,
                                "type": "status",
                                "content": status_text,
                                "status": "streaming",
                            })

                        # Reviewer: no tokens expected — open bubble immediately on chain_start
                        if name in REVIEWER_NODES and is_first_instance:
                            await websocket.send_json({
                                "agent": FRONTEND_AGENT_MAP[name],
                                "type": "agent_start",
                                "status": "streaming",
                            })

                    # ----------------------------------------------------------
                    # Token streaming — fires for every LLM output chunk
                    # Opens the agent bubble on the first token for each node type
                    # ----------------------------------------------------------
                    elif kind == "on_chat_model_stream" and lg_node in TOKEN_STREAM_NODES:
                        chunk = event.get("data", {}).get("chunk")
                        if chunk and hasattr(chunk, "content") and chunk.content:
                            frontend_agent = FRONTEND_AGENT_MAP.get(lg_node, "orchestrator")

                            if lg_node not in token_stream_started:
                                token_stream_started.add(lg_node)
                                await websocket.send_json({
                                    "agent": frontend_agent,
                                    "type": "agent_start",
                                    "status": "streaming",
                                })

                            await websocket.send_json({
                                "agent": frontend_agent,
                                "type": "token",
                                "token": chunk.content,
                                "status": "streaming",
                            })

                    # ----------------------------------------------------------
                    # Node chain ends: decrement counter, close bubble when all
                    # parallel instances of a node type are finished
                    # ----------------------------------------------------------
                    elif kind == "on_chain_end" and name in ALL_AGENT_NODES and name == lg_node:
                        active_node_counts[name] = max(0, active_node_counts[name] - 1)

                        if active_node_counts[name] == 0:
                            frontend_agent = FRONTEND_AGENT_MAP.get(name, "orchestrator")
                            is_reviewer = name in REVIEWER_NODES
                            
                            # The reviewer uses structured output (no token streaming).
                            # We manually extract and emit its final message here.
                            if is_reviewer:
                                output_data = event.get("data", {}).get("output", {})
                                if isinstance(output_data, dict):
                                    msgs = output_data.get("messages", [])
                                    if msgs and hasattr(msgs[-1], "content"):
                                        await websocket.send_json({
                                            "agent": frontend_agent,
                                            "type": "token",
                                            "token": msgs[-1].content,
                                            "status": "streaming",
                                        })

                            has_streamed = name in token_stream_started

                            if is_reviewer or has_streamed:
                                await websocket.send_json({
                                    "agent": frontend_agent,
                                    "type": "agent_done",
                                    "status": "streaming",
                                })
                                token_stream_started.discard(name)

                    # ----------------------------------------------------------
                    # Tool events: status messages + source citations
                    # ----------------------------------------------------------
                    elif kind == "on_tool_start":
                        tool_input = event.get("data", {}).get("input", {})
                        status_text = _tool_status(name, tool_input)
                        if status_text:
                            await websocket.send_json({
                                "agent": "researcher",
                                "type": "status",
                                "content": status_text,
                                "status": "streaming",
                            })

                    elif kind == "on_tool_end" and name == "web_scraper":
                        tool_input = event.get("data", {}).get("input", {})
                        url = tool_input.get("url", "")
                        if url:
                            await websocket.send_json({
                                "agent": "researcher",
                                "type": "source",
                                "url": url,
                                "status": "streaming",
                            })

                # Failsafe: close any bubbles that didn't get agent_done
                for node_name in list(token_stream_started):
                    await websocket.send_json({
                        "agent": FRONTEND_AGENT_MAP.get(node_name, "orchestrator"),
                        "type": "agent_done",
                        "status": "streaming",
                    })

                # Graceful completion message
                await websocket.send_json({
                    "agent": "orchestrator",
                    "type": "agent_start",
                    "status": "streaming"
                })
                await websocket.send_json({
                    "agent": "orchestrator",
                    "type": "token",
                    "token": "\n\n✅ **Task completed successfully!**",
                    "status": "streaming"
                })
                await websocket.send_json({
                    "agent": "orchestrator",
                    "type": "agent_done",
                    "status": "streaming"
                })

                await websocket.send_json({"status": "complete"})

            except Exception as e:
                # Close any open bubbles
                for node_name in list(token_stream_started):
                    await websocket.send_json({
                        "agent": FRONTEND_AGENT_MAP.get(node_name, "orchestrator"),
                        "type": "agent_done",
                        "status": "streaming",
                    })

                # Output a friendly error message as a chat bubble
                await websocket.send_json({
                    "agent": "orchestrator",
                    "type": "agent_start",
                    "status": "streaming"
                })
                error_msg = f"\n\n❌ **System Error:** The agents encountered an unexpected issue and had to halt.\n\n*Details: {str(e)}*"
                await websocket.send_json({
                    "agent": "orchestrator",
                    "type": "token",
                    "token": error_msg,
                    "status": "streaming"
                })
                await websocket.send_json({
                    "agent": "orchestrator",
                    "type": "agent_done",
                    "status": "streaming"
                })

                # Emit the raw error status for the frontend console/fallback
                await websocket.send_json({
                    "status": "error",
                    "message": f"Graph execution error: {str(e)}",
                })

    except WebSocketDisconnect:
        pass
    except Exception:
        pass
