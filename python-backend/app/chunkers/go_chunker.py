
from app.chunkers.common import chunk_by_declarations
from app.chunkers.models import CodeChunk


def chunk_go(path: str, content: str) -> list[CodeChunk]:
    return chunk_by_declarations(
        path,
        "go",
        content,
        r"^\s*func\s+(?:\([^)]*\)\s*)?\w+|^\s*type\s+\w+\s+(?:struct|interface)\b",
    )
