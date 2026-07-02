import operator
from typing import Annotated, TypedDict

from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class AgentState(TypedDict):
    # Core conversation history — append-only via LangGraph reducer
    messages: Annotated[list[BaseMessage], add_messages]

    # Router control
    next_node: str
    requires_code: bool
    sender: str

    # Orchestrator-Worker pattern
    subtasks: list[str]   # Decomposed sub-task strings from orchestrator
    subtask: str          # Current sub-task injected per-worker via Send API
    worker_results: Annotated[list[str], operator.add]  # Fan-in accumulator

    # Reflexion pattern
    revision_count: int      # How many reviewer → coder loops have occurred
    revision_verdict: str    # "pass" | "revise" — set by reviewer node
