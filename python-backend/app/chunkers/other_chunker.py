
from pathlib import PurePosixPath

from app.chunkers.common import split_by_lines
from app.chunkers.models import CodeChunk


LANGUAGE_BY_EXTENSION = {
    ".pyi": "python",
    ".sql": "sql",
    ".php": "php",
    ".rb": "ruby",
    ".swift": "swift",
    ".kt": "kotlin",
    ".kts": "kotlin",
    ".scala": "scala",
    ".cs": "csharp",
    ".fs": "fsharp",
    ".fsx": "fsharp",
    ".dart": "dart",
    ".lua": "lua",
    ".r": "r",
    ".R": "r",
    ".jl": "julia",
    ".pl": "perl",
    ".pm": "perl",
    ".ex": "elixir",
    ".exs": "elixir",
    ".erl": "erlang",
    ".hrl": "erlang",
    ".hs": "haskell",
    ".lhs": "haskell",
    ".clj": "clojure",
    ".cljs": "clojurescript",
    ".elm": "elm",
    ".vue": "vue",
    ".svelte": "svelte",
    ".html": "html",
    ".htm": "html",
    ".css": "css",
    ".scss": "scss",
    ".sass": "sass",
    ".less": "less",
    ".json": "json",
    ".jsonc": "json",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".toml": "toml",
    ".xml": "xml",
    ".md": "markdown",
    ".mdx": "markdown",
    ".rst": "restructuredtext",
    ".txt": "text",
    ".sh": "shell",
    ".bash": "shell",
    ".zsh": "shell",
    ".ps1": "powershell",
    ".bat": "batch",
    ".cmd": "batch",
    ".dockerfile": "dockerfile",
    ".tf": "terraform",
    ".hcl": "hcl",
    ".proto": "protobuf",
    ".graphql": "graphql",
    ".gql": "graphql",
    ".sol": "solidity",
    ".v": "verilog",
    ".sv": "systemverilog",
    ".m": "objective-c-or-matlab",
    ".mm": "objective-c",
    ".make": "makefile",
    ".mk": "makefile",
    ".gradle": "gradle",
    ".properties": "properties",
    ".ini": "ini",
    ".cfg": "ini",
    ".conf": "config",
    ".log": "log",
}


def detect_language(path: str) -> str:
    filename = PurePosixPath(path).name.lower()

    if filename == "dockerfile":
        return "dockerfile"
    if filename in {"makefile", "gnumakefile"}:
        return "makefile"

    extension = PurePosixPath(path).suffix
    return LANGUAGE_BY_EXTENSION.get(extension, "text")


def chunk_other(path: str, content: str) -> list[CodeChunk]:
    language = detect_language(path)
    return split_by_lines(path, language, content)
