import ast
import asyncio

# pyrefly: ignore [missing-import]
import httpx
# pyrefly: ignore [missing-import]
from bs4 import BeautifulSoup
# pyrefly: ignore [missing-import]
from ddgs import DDGS
# pyrefly: ignore [missing-import]
from langchain_core.tools import tool
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Input schemas — strict Pydantic models prevent tool-calling hallucinations
# ---------------------------------------------------------------------------


class SearchInput(BaseModel):
    query: str = Field(description="The search query to look up on DuckDuckGo.")


class ScraperInput(BaseModel):
    url: str = Field(description="The full HTTPS URL of the web page to scrape.")


class CalcInput(BaseModel):
    expression: str = Field(
        description="A safe arithmetic expression to evaluate, e.g. '(12 + 4) * 3.5 / 2'."
    )


# ---------------------------------------------------------------------------
# Safe AST evaluator — whitelist only pure numeric operations
# ---------------------------------------------------------------------------

_SAFE_AST_NODES = (
    ast.Expression,
    ast.BinOp,
    ast.UnaryOp,
    ast.Constant,
    ast.Add,
    ast.Sub,
    ast.Mult,
    ast.Div,
    ast.Pow,
    ast.Mod,
    ast.FloorDiv,
    ast.UAdd,
    ast.USub,
)


def _safe_eval(expression: str) -> float:
    tree = ast.parse(expression.strip(), mode="eval")
    for node in ast.walk(tree):
        if not isinstance(node, _SAFE_AST_NODES):
            raise ValueError(f"Unsafe operation in expression: {type(node).__name__}")
    return eval(compile(tree, "<string>", "eval"))  # noqa: S307


# ---------------------------------------------------------------------------
# DuckDuckGo search helper — uses ddgs>=9.0.0 API directly
# ---------------------------------------------------------------------------


def _run_ddg_search(query: str, max_results: int = 5) -> str:
    """Blocking DuckDuckGo search using the new DDGS API (ddgs>=9.0.0)."""
    results = []
    with DDGS() as ddgs:
        for r in ddgs.text(query, max_results=max_results):
            title = r.get("title", "")
            body = r.get("body", "")
            href = r.get("href", "")
            results.append(f"**{title}**\n{body}\nSource: {href}")
    if not results:
        return "No results found."
    return "\n\n".join(results)


# ---------------------------------------------------------------------------
# Tool definitions
# ---------------------------------------------------------------------------


@tool("web_search", args_schema=SearchInput)
async def web_search(query: str) -> str:
    """Search the web using DuckDuckGo and return a text summary of the top results."""
    # Run the blocking DDGS call in a thread so it doesn't block the async event loop
    return await asyncio.to_thread(_run_ddg_search, query)


@tool("web_scraper", args_schema=ScraperInput)
async def web_scraper(url: str) -> str:
    """Fetch a web page and return its main paragraph text content (max 3000 characters)."""
    async with httpx.AsyncClient(
        timeout=10.0,
        follow_redirects=True,
        headers={"User-Agent": "Mozilla/5.0 (NeuroCollab Research Bot/2.0)"},
    ) as client:
        resp = await client.get(url)
        resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")
    paragraphs = [p.get_text(strip=True) for p in soup.find_all("p") if p.get_text(strip=True)]
    return "\n".join(paragraphs)[:3000] or "No readable paragraph text found on this page."


@tool("calculator", args_schema=CalcInput)
def calculator(expression: str) -> str:
    """Safely evaluate an arithmetic expression and return the numeric result."""
    result = _safe_eval(expression)
    return f"{expression} = {result}"


# ---------------------------------------------------------------------------
# Registry — consumed by graph.py nodes
# ---------------------------------------------------------------------------

ALL_TOOLS = [web_search, web_scraper, calculator]
TOOL_MAP: dict[str, object] = {t.name: t for t in ALL_TOOLS}
