
from app.chunkers.common import chunk_by_declarations
from app.chunkers.models import CodeChunk


def chunk_javascript(path: str, content: str) -> list[CodeChunk]:
    return chunk_by_declarations(
        path,
        "javascript",
        content,
        r"^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:function|class)\s+\w+|^\s*(?:export\s+)?(?:const|let|var)\s+\w+\s*=\s*(?:async\s*)?(?:\([^)]*\)|[\w$]+)\s*=>|^\s*(?:export\s+)?(?:interface|type|enum)\s+\w+",
    )
