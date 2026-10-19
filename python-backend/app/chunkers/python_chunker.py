
import ast

from app.chunkers.common import split_by_lines
from app.chunkers.models import CodeChunk
from app.core.config import settings


def chunk_python(path: str, content: str) -> list[CodeChunk]:
    lines = content.splitlines()

    if not lines:
        return []

    try:
        tree = ast.parse(content)
    except (SyntaxError, ValueError, MemoryError, RecursionError):
        return split_by_lines(path, "python", content)

    chunks: list[CodeChunk] = []
    buffer_start: int | None = None
    buffer_end: int | None = None

    def emit_source_range(start: int, end: int) -> None:
        source = "\n".join(lines[start - 1:end])

        if not source.strip():
            return

        if len(source) <= settings.max_chunk_chars:
            chunks.append(
                CodeChunk(
                    path=path,
                    language="python",
                    content=source,
                    start_line=start,
                    end_line=end,
                    chunk_index=len(chunks),
                )
            )
            return

        for part in split_by_lines(path, "python", source):
            part.start_line += start - 1
            part.end_line += start - 1
            part.chunk_index = len(chunks)
            chunks.append(part)

    def flush() -> None:
        nonlocal buffer_start, buffer_end

        if buffer_start is not None and buffer_end is not None:
            emit_source_range(buffer_start, buffer_end)

        buffer_start = None
        buffer_end = None

    for node in tree.body:
        node_start = getattr(node, "lineno", None)
        node_end = getattr(node, "end_lineno", None)

        if node_start is None or node_end is None:
            continue

        decorators = getattr(node, "decorator_list", [])
        if decorators:
            node_start = min(
                node_start,
                *(decorator.lineno for decorator in decorators),
            )

        node_source = "\n".join(lines[node_start - 1:node_end])

        if len(node_source) > settings.max_chunk_chars:
            flush()
            emit_source_range(node_start, node_end)
            continue

        if buffer_start is None:
            buffer_start = node_start
            buffer_end = node_end
            continue

        candidate = "\n".join(
            lines[buffer_start - 1:node_end]
        )

        if len(candidate) > settings.max_chunk_chars:
            flush()
            buffer_start = node_start
            buffer_end = node_end
        else:
            buffer_end = node_end

    flush()

    return chunks or split_by_lines(path, "python", content)
