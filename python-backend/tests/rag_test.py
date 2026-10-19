
import asyncio

import pytest

from app.graphs.rag_graph import (
    build_rag_graph,
    extract_text,
    prepare_context,
)


def test_prepare_context_formats_source_code():
    chunks = [
        {
            "path": "app/main.py",
            "language": "python",
            "startLine": 1,
            "endLine": 3,
            "content": "def main():\n    return True",
        }
    ]

    context = prepare_context(chunks)

    assert "app/main.py" in context
    assert "Language: python" in context
    assert "Lines: 1-3" in context
    assert "def main():" in context


def test_prepare_context_handles_empty_chunks():
    assert prepare_context([]) == ""


def test_extract_text_handles_string():
    assert extract_text("Hello") == "Hello"


def test_extract_text_handles_content_blocks():
    content = [
        {"text": "First"},
        {"text": "Second"},
    ]

    assert extract_text(content) == "First\nSecond"


def test_graph_rejects_invalid_repository_id():
    async def run():
        graph = build_rag_graph()

        with pytest.raises(ValueError, match="Invalid repository ID"):
            await graph.ainvoke(
                {
                    "repository_id": "invalid-id",
                    "query": "Explain the architecture",
                    "limit": 5,
                },
                config={"configurable": {"database": object()}},
            )

    asyncio.run(run())
