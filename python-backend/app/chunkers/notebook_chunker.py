
import json

from app.chunkers.common import split_by_lines
from app.chunkers.models import CodeChunk
from app.chunkers.python_chunker import chunk_python


def chunk_notebook(path: str, content: str) -> list[CodeChunk]:
    try:
        notebook = json.loads(content)
    except (json.JSONDecodeError, ValueError):
        return split_by_lines(path, "ipynb", content)

    chunks: list[CodeChunk] = []

    for cell_index, cell in enumerate(notebook.get("cells", [])):
        source = cell.get("source", "")
        if isinstance(source, list):
            source = "".join(source)

        if not isinstance(source, str) or not source.strip():
            continue

        cell_type = cell.get("cell_type")

        if cell_type == "code":
            parts = chunk_python(path, source)
            language = "python"
        elif cell_type == "markdown":
            parts = split_by_lines(path, "markdown", source)
            language = "markdown"
        else:
            continue

        for part in parts:
            part.metadata["cell_index"] = cell_index
            part.metadata["cell_type"] = cell_type
            part.metadata["notebook_path"] = path
            part.language = language
            part.chunk_index = len(chunks)
            chunks.append(part)

    return chunks
