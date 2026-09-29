import asyncio
import os
import random
import re
from typing import Literal

# pyrefly: ignore [missing-import]
from dotenv import load_dotenv
# pyrefly: ignore [missing-import]
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage
# pyrefly: ignore [missing-import]
from langchain_groq import ChatGroq
# pyrefly: ignore [missing-import]
from langgraph.graph import END, START, StateGraph
# pyrefly: ignore [missing-import]
from langgraph.types import Send
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field

from state import AgentState
from tools import ALL_TOOLS, TOOL_MAP, _run_ddg_search

load_dotenv()


# ---------------------------------------------------------------------------
# LLM registry — lazy per-model cache
# ---------------------------------------------------------------------------

_llm_cache: dict[str, ChatGroq] = {}


def _llm(model: str, streaming: bool = True) -> ChatGroq:
    key = f"{model}|{streaming}"
    if key not in _llm_cache:
        _llm_cache[key] = ChatGroq(model=model, temperature=0, streaming=streaming)
    return _llm_cache[key]


# ---------------------------------------------------------------------------
# Pydantic structured-output schemas
# ---------------------------------------------------------------------------


class RouteDecision(BaseModel):
    next: Literal["react_researcher", "orchestrator", "coder"] = Field(
        description=(
            "Route to 'react_researcher' for simple factual or single-topic research questions. "
            "Route to 'orchestrator' ONLY for multi-part queries researching 3+ distinct topics. "
            "Route to 'coder' for ANY programming, algorithm, LeetCode, or scripting task (e.g., 'write a Python function'). ONLY route coding tasks to orchestrator if they explicitly require parallel web research first."
        )
    )
    requires_code: bool = Field(
        description="Set to true if the user's request involves writing, debugging, or modifying code."
    )


class SubtaskDecomposition(BaseModel):
    subtasks: list[str] = Field(
        description="Between 2 and 4 focused, independent research sub-tasks derived from the query.",
        min_length=2,
        max_length=4,
    )


class ReviewDecision(BaseModel):
    verdict: Literal["pass", "revise"] = Field(
        description=(
            "'pass' if the code correctly solves the problem and handles edge cases. "
            "'revise' if there are bugs, missing edge cases, security issues, or poor style."
        )
    )
    critique: str = Field(
        description="Specific, actionable feedback on what must be fixed. Empty string if verdict is 'pass'."
    )


# ---------------------------------------------------------------------------
# Robust LLM Wrapper
# ---------------------------------------------------------------------------

class RobustLLM:
    """
    A custom wrapper to definitively catch API errors (like Groq 429 RateLimits) 
    and fall back to the next model, bypassing any edge cases in LangChain's native with_fallbacks.
    """
    def __init__(self, runnables: list):
        self.runnables = runnables

    async def ainvoke(self, *args, **kwargs):
        max_retries = 3
        
        for attempt in range(max_retries):
            last_exc = None
            for i, r in enumerate(self.runnables):
                try:
                    return await r.ainvoke(*args, **kwargs)
                except Exception as e:
                    last_exc = e
                    print(f"[RobustLLM] Model {i} failed: {e}. Trying next...")
            
            # If we reach here, all models in the cascade failed.
            error_msg = str(last_exc)
            # Parse Groq's wait time format, e.g. "try again in 9.32s" or "18m19.008s"
            match = re.search(r"try again in (?:(\d+)m)?([\d\.]+)s", error_msg)
            if match:
                m_part = match.group(1)
                s_part = match.group(2)
                wait_time = float(s_part)
                if m_part:
                    wait_time += int(m_part) * 60
                
                # If the wait time is short enough, automatically sleep and retry
                if wait_time <= 120:
                    wait_time += 1.0  # Add a 1s buffer
                    print(f"[RobustLLM] All models exhausted. Sleeping {wait_time:.1f}s before retry {attempt + 1}/{max_retries}...")
                    await asyncio.sleep(wait_time)
                    continue
            
            # If wait time is too long or parsing failed, raise immediately
            raise last_exc


# ---------------------------------------------------------------------------
# LLM accessor functions with Fallbacks
# ---------------------------------------------------------------------------

_MODEL_CASCADE = [
    "llama-3.3-70b-versatile",        # 128k context - Best reasoning
    "llama-3.2-90b-vision-preview",   # 128k context - High capacity fallback
    "mixtral-8x7b-32768",             # 32k context  - Excellent at long prompts
    "llama3-70b-8192",                # 8k context   - Strong reasoning
    "gemma2-9b-it",                   # 8k context   - Good logic fallback
    "llama3-8b-8192",                 # 8k context - Highest rate limit threshold
]

def _router_llm():
    runnables = [_llm(m).with_structured_output(RouteDecision) for m in _MODEL_CASCADE]
    return RobustLLM(runnables)


def _main_llm():
    runnables = [_llm(m) for m in _MODEL_CASCADE]
    return RobustLLM(runnables)


def _research_llm():
    """Bind tools with tool_choice='auto'. Uses fallback models on rate limit."""
    runnables = [_llm(m).bind_tools(ALL_TOOLS, tool_choice="auto") for m in _MODEL_CASCADE]
    return RobustLLM(runnables)


def _orchestrator_llm():
    runnables = [_llm(m, streaming=False).with_structured_output(SubtaskDecomposition) for m in _MODEL_CASCADE]
    return RobustLLM(runnables)


def _reviewer_llm():
    runnables = [_llm(m, streaming=False).with_structured_output(ReviewDecision) for m in _MODEL_CASCADE]
    return RobustLLM(runnables)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_GROQ_TOOL_ERRORS = (
    "failed to call a function",
    "tool_use_failed",
    "failed_generation",
    "tool call validation failed",
    "attempted to call tool",
)


def _is_groq_tool_error(exc: Exception) -> bool:
    return any(k in str(exc).lower() for k in _GROQ_TOOL_ERRORS)


async def _safe_research(query: str, max_results: int = 5) -> str:
    """
    Run a DuckDuckGo search directly in Python — no Groq tool-calling involved.
    Returns formatted search results as plain text.
    """
    try:
        return await asyncio.to_thread(_run_ddg_search, query, max_results)
    except Exception as e:
        return f"Search failed: {e}"


async def _research_with_fallback(
    messages: list,
    topic: str,
    is_worker: bool = False,
    max_tool_iters: int = 4,
) -> AIMessage:
    """
    Attempt research via Groq tool-calling.
    If Groq raises a tool-call generation error, fall back to:
      1. Direct DuckDuckGo search in Python
      2. Feed results to a plain (no-tool) LLM for synthesis
    """
    llm = _research_llm()
    plain_llm = _main_llm()
    response = None

    # --- Attempt 1: Groq tool-calling path ---
    try:
        for _ in range(max_tool_iters):
            response = await llm.ainvoke(messages)

            if not response.tool_calls:
                break

            tool_messages: list[ToolMessage] = []
            for tc in response.tool_calls:
                tool_fn = TOOL_MAP.get(tc["name"])
                if tool_fn is None:
                    tool_messages.append(
                        ToolMessage(content=f"Unknown tool: {tc['name']}", tool_call_id=tc["id"])
                    )
                    continue
                try:
                    result = await tool_fn.ainvoke(tc["args"])
                except Exception as e:
                    result = f"Tool error: {e}"
                tool_messages.append(ToolMessage(content=str(result), tool_call_id=tc["id"]))

            messages = messages + [response] + tool_messages

        if response and response.content:
            return response

    except Exception as exc:
        if not _is_groq_tool_error(exc):
            raise  # Re-raise non-tool-calling errors immediately

    # --- Fallback: Direct Python search → plain LLM synthesis ---
    search_results = await _safe_research(topic)

    fallback_messages = [
        SystemMessage(content=(
            "You are a research analyst. Use the provided search results to give a comprehensive, "
            "accurate, and well-structured markdown answer. Cite facts from the results."
        )),
        HumanMessage(content=(
            f"Research topic: {topic}\n\n"
            f"Search results:\n{search_results}\n\n"
            "Please synthesize the above into a clear, structured markdown response."
        )),
    ]
    response = await plain_llm.ainvoke(fallback_messages)
    return response


# ---------------------------------------------------------------------------
# System prompts
# ---------------------------------------------------------------------------

ROUTER_SYSTEM = """\
You are the Smart Router for NeuroCollab, a multi-agent AI workspace.
Analyze the user's query and select the optimal execution strategy.

Routing rules:
- react_researcher: Simple factual, current-events, or single-topic research questions.
- orchestrator: Complex multi-part queries comparing or analyzing 3+ distinct entities or topics.
- coder: ANY programming, logic, scripting, or algorithm task (e.g., 'write a Python function', 'debug this'). Default to coder for ALL code generation unless the user explicitly asks you to research multiple new frameworks first.

IMPORTANT: You MUST respond with valid JSON in the exact format: {"next": "<strategy>", "requires_code": <true/false>}
"""

RESEARCHER_SYSTEM = """\
You are a Senior Research Analyst in NeuroCollab.
Use the available web_search, web_scraper, and calculator tools to find accurate, up-to-date information.

Workflow:
1. Start by calling web_search with a focused query relevant to the user's question.
2. If a search result URL looks promising, call web_scraper on it for deeper content.
3. Use calculator for any numeric computation.
4. Once you have enough information, STOP calling tools and write your final answer in clear markdown.

Do NOT call tools more than 4 times total. After gathering info, always write a final markdown summary.\
"""

ORCHESTRATOR_SYSTEM = """\
You are the Task Orchestrator in NeuroCollab.
Decompose the user's complex multi-part query into 2 to 4 specific, independent research sub-tasks.
Each sub-task must be self-contained and answerable by a single focused researcher.

IMPORTANT: Respond ONLY with valid JSON matching this exact schema:
{"subtasks": ["task 1", "task 2"]}

Do not include any other text, markdown, or explanation outside the JSON.\
"""

WORKER_SYSTEM = """\
You are a specialized Research Worker in NeuroCollab.
You have been assigned one specific sub-task to research thoroughly.

Workflow:
1. Call web_search with a focused query for your sub-task.
2. Optionally call web_scraper on a useful URL for deeper detail.
3. Write a focused, detailed markdown response covering only your assigned sub-task.

Do NOT call tools more than 3 times. Always end with a written markdown answer.\
"""

SYNTHESIZER_SYSTEM = """\
You are the Research Synthesizer in NeuroCollab.
You receive structured results from multiple parallel research workers and must combine them into a single, cohesive response.

Guidelines:
- Organize findings by theme, entity, or dimension as appropriate.
- Highlight key comparisons, contrasts, and insights.
- Remove redundancy while preserving all unique information.
- Use clear markdown with headers, bullet points, and tables where helpful.

IMPORTANT: Write a comprehensive, well-structured final answer. Do not reference the worker structure internally.\
"""

CODER_SYSTEM = """\
You are a Senior Software Engineer in NeuroCollab.
Write clean, production-ready code based on the user's request and available research context.

Guidelines:
- Default to Python unless another language is explicitly requested.
- Include type hints, proper error handling, and concise docstrings.
- Use markdown code blocks with language tags for all code.
- If a reviewer's critique is present in the conversation history, address every point raised before writing new code.

IMPORTANT: Output the code solution and a brief explanation of design decisions. No meta-commentary about your process.\
"""

REVIEWER_SYSTEM = """\
You are a Senior Code Reviewer in NeuroCollab.
Critically evaluate the most recent code output across these dimensions:
1. Correctness — Does it accurately solve the stated problem?
2. Edge cases — Are boundary conditions, empty inputs, and error states handled?
3. Security — Are there obvious vulnerabilities (injection, overflow, unsafe eval)?
4. Style — Is it idiomatic, readable, and maintainable?

IMPORTANT: Respond ONLY with valid JSON in the exact format: {"verdict": "pass" | "revise", "critique": "<specific feedback>"}\
"""


# ---------------------------------------------------------------------------
# Node implementations
# ---------------------------------------------------------------------------


async def router_node(state: AgentState) -> dict:
    messages = [SystemMessage(content=ROUTER_SYSTEM)] + state["messages"]
    decision = await _router_llm().ainvoke(messages)
    return {
        "next_node": decision.next,
        "requires_code": decision.requires_code,
        "sender": "router",
        "revision_count": 0,
        "revision_verdict": "",
    }


async def react_researcher_node(state: AgentState) -> dict:
    user_query = state["messages"][-1].content if state["messages"] else ""
    messages = [SystemMessage(content=RESEARCHER_SYSTEM)] + state["messages"]

    response = await _research_with_fallback(
        messages=messages,
        topic=user_query,
        is_worker=False,
        max_tool_iters=5,
    )

    return {
        "messages": [AIMessage(content=response.content, name="react_researcher")],
        "sender": "react_researcher",
    }


async def orchestrator_node(state: AgentState) -> dict:
    messages = [SystemMessage(content=ORCHESTRATOR_SYSTEM)] + state["messages"]
    try:
        decomposition = await _orchestrator_llm().ainvoke(messages)
        subtasks = decomposition.subtasks
    except Exception:
        # Fallback: ask plain LLM to produce a list of subtasks as JSON
        import json
        fallback_resp = await _main_llm().ainvoke(
            messages + [HumanMessage(content='Output ONLY valid JSON: {"subtasks": ["task 1", "task 2"]}')]
        )
        try:
            raw = json.loads(fallback_resp.content)
            subtasks = raw.get("subtasks", [fallback_resp.content])
        except Exception:
            subtasks = [state["messages"][-1].content if state["messages"] else "General research"]

    return {"subtasks": subtasks, "sender": "orchestrator"}


async def worker_node(state: AgentState) -> dict:
    # Stagger parallel DDG requests to avoid rate-limit bursts
    await asyncio.sleep(random.uniform(0.3, 1.5))

    subtask = state.get("subtask", "")
    messages = [
        SystemMessage(content=WORKER_SYSTEM),
        HumanMessage(content=f"Research this specific sub-task: {subtask}"),
    ]

    response = await _research_with_fallback(
        messages=messages,
        topic=subtask,
        is_worker=True,
        max_tool_iters=4,
    )

    return {
        "worker_results": [f"**Sub-task:** {subtask}\n\n{response.content}"],
    }


async def synthesizer_node(state: AgentState) -> dict:
    combined = "\n\n---\n\n".join(state.get("worker_results", []))
    original_query = state["messages"][-1].content if state["messages"] else ""
    messages = [
        SystemMessage(content=SYNTHESIZER_SYSTEM),
        HumanMessage(
            content=f"**Original query:**\n{original_query}\n\n**Research results from parallel workers:**\n\n{combined}"
        ),
    ]
    response = await _main_llm().ainvoke(messages)
    return {
        "messages": [AIMessage(content=response.content, name="synthesizer")],
        "sender": "synthesizer",
    }


async def coder_node(state: AgentState) -> dict:
    messages = [SystemMessage(content=CODER_SYSTEM)] + state["messages"]
    response = await _main_llm().ainvoke(messages)
    return {
        "messages": [AIMessage(content=response.content, name="coder")],
        "sender": "coder",
    }


async def reviewer_node(state: AgentState) -> dict:
    revision_count = state.get("revision_count", 0)
    messages = [SystemMessage(content=REVIEWER_SYSTEM)] + state["messages"]
    decision = await _reviewer_llm().ainvoke(messages)
    new_count = revision_count + 1

    # Allow revision only while under the 3-loop cap
    should_revise = decision.verdict == "revise" and new_count < 3

    if should_revise:
        critique_msg = HumanMessage(
            content=f"**Code Review — Revision {new_count}/3 Required:**\n\n{decision.critique}",
            name="reviewer",
        )
        return {
            "messages": [critique_msg],
            "revision_count": new_count,
            "revision_verdict": "revise",
            "sender": "reviewer",
        }

    suffix = " (max revisions reached — accepting best effort)" if new_count >= 3 and decision.verdict == "revise" else ""
    approved_msg = HumanMessage(
        content=f"**Code Review — Approved{suffix} ✓**\n\n{decision.critique or 'Code meets all requirements.'}",
        name="reviewer",
    )
    return {
        "messages": [approved_msg],
        "revision_count": new_count,
        "revision_verdict": "pass",
        "sender": "reviewer",
    }


# ---------------------------------------------------------------------------
# Routing functions
# ---------------------------------------------------------------------------


def route_after_router(state: AgentState) -> str:
    return state.get("next_node", END)


def route_after_orchestrator(state: AgentState) -> list[Send]:
    return [Send("worker", {**state, "subtask": task}) for task in state.get("subtasks", [])]


def route_after_synthesizer(state: AgentState) -> str:
    if state.get("requires_code"):
        return "coder"
    return END


def route_after_reviewer(state: AgentState) -> str:
    if state.get("revision_verdict") == "revise":
        return "coder"
    return END


# ---------------------------------------------------------------------------
# Graph assembly
# ---------------------------------------------------------------------------


def build_graph() -> StateGraph:
    graph = StateGraph(AgentState)

    graph.add_node("router", router_node)
    graph.add_node("react_researcher", react_researcher_node)
    graph.add_node("orchestrator", orchestrator_node)
    graph.add_node("worker", worker_node)
    graph.add_node("synthesizer", synthesizer_node)
    graph.add_node("coder", coder_node)
    graph.add_node("reviewer", reviewer_node)

    # Entry point
    graph.add_edge(START, "router")

    # Smart Router → three execution strategies
    graph.add_conditional_edges(
        "router",
        route_after_router,
        {
            "react_researcher": "react_researcher",
            "orchestrator": "orchestrator",
            "coder": "coder",
        },
    )

    # ReACT path — single-hop to END
    graph.add_edge("react_researcher", END)

    # Orchestrator-Worker fan-out via Send API → fan-in at synthesizer
    graph.add_conditional_edges("orchestrator", route_after_orchestrator, ["worker"])
    graph.add_edge("worker", "synthesizer")
    graph.add_conditional_edges(
        "synthesizer",
        route_after_synthesizer,
        {"coder": "coder", END: END},
    )

    # Reflexion loop — coder → reviewer → (revise: back to coder | pass: END)
    graph.add_edge("coder", "reviewer")
    graph.add_conditional_edges(
        "reviewer",
        route_after_reviewer,
        {"coder": "coder", END: END},
    )

    return graph.compile()


workflow = build_graph()
