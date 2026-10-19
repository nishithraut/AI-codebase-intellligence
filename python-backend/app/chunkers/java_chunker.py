
from app.chunkers.common import chunk_by_declarations
from app.chunkers.models import CodeChunk


def chunk_java(path: str, content: str) -> list[CodeChunk]:
    return chunk_by_declarations(
        path,
        "java",
        content,
        r"^\s*(?:public|protected|private|static|final|abstract|synchronized|native|default|\s)*(?:class|interface|enum|record)\s+\w+|^\s*(?:public|protected|private|static|final|abstract|synchronized|native|default)\b.*\([^;]*\)\s*(?:throws\b.*)?\s*\{",
    )
