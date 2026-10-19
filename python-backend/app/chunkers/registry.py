
from pathlib import PurePosixPath

from app.chunkers.common import split_by_lines
from app.chunkers.cpp_chunker import chunk_cpp
from app.chunkers.go_chunker import chunk_go
from app.chunkers.java_chunker import chunk_java
from app.chunkers.javascript_chunker import chunk_javascript
from app.chunkers.models import CodeChunk
from app.chunkers.notebook_chunker import chunk_notebook
from app.chunkers.other_chunker import chunk_other
from app.chunkers.python_chunker import chunk_python
from app.chunkers.rust_chunker import chunk_rust


def chunk_file(path: str, content: str) -> list[CodeChunk]:
    extension = PurePosixPath(path).suffix.lower()

    if extension == ".ipynb":
        return chunk_notebook(path, content)

    if extension in {".py", ".pyi"}:
        return chunk_python(path, content)

    if extension == ".java":
        return chunk_java(path, content)

    if extension in {".cpp", ".cc", ".cxx", ".hpp", ".hh", ".hxx", ".h"}:
        return chunk_cpp(path, content)

    if extension in {".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx"}:
        return chunk_javascript(path, content)

    if extension == ".go":
        return chunk_go(path, content)

    if extension == ".rs":
        return chunk_rust(path, content)

    return chunk_other(path, content)
