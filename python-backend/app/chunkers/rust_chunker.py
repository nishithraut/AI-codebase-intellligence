
from app.chunkers.common import chunk_by_declarations
from app.chunkers.models import CodeChunk


def chunk_rust(path: str, content: str) -> list[CodeChunk]:
    return chunk_by_declarations(
        path,
        "rust",
        content,
        r"^\s*(?:pub(?:\([^)]*\))?\s+)?(?:async\s+)?fn\s+\w+|^\s*(?:pub\s+)?(?:struct|enum|trait|impl|mod)\s+\w+",
    )
