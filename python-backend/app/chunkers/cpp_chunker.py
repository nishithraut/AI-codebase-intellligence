
from app.chunkers.common import chunk_by_declarations
from app.chunkers.models import CodeChunk


def chunk_cpp(path: str, content: str) -> list[CodeChunk]:
    return chunk_by_declarations(
        path,
        "cpp",
        content,
        r"^\s*(?:class|struct|namespace|enum)\s+\w+|^\s*(?:[\w:*&<>]+\s+)+\w+\s*\([^;]*\)\s*(?:const\s*)?(?:noexcept\s*)?\{",
    )
