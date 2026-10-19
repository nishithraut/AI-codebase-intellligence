
import re
from pathlib import PurePosixPath

from app.chunkers.models import CodeChunk
from app.core.config import settings


IGNORED_DIRECTORIES = {
    ".git", ".hg", ".svn", ".venv", "venv", "env",
    "node_modules", "__pycache__", ".pytest_cache",
    ".mypy_cache", ".ruff_cache", "dist", "build",
    "target", "vendor", "coverage", ".next", ".nuxt",
    ".turbo", ".idea", ".vscode", "pods", "bin",
    "obj", "out", "deriveddata",
}

IGNORED_FILENAMES = {
    "package-lock.json", "yarn.lock", "pnpm-lock.yaml",
    "bun.lockb", "bun.lock", "poetry.lock", "uv.lock",
    "pipfile.lock", "cargo.lock", "composer.lock",
    "gemfile.lock", "go.sum", "gradle.lockfile",
    ".ds_store", "thumbs.db",
}

IGNORED_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico",
    ".svg", ".mp4", ".mov", ".avi", ".mkv", ".mp3",
    ".wav", ".flac", ".pdf", ".zip", ".gz", ".7z",
    ".rar", ".exe", ".dll", ".so", ".dylib", ".bin",
    ".class", ".pyc", ".pyo", ".o", ".a", ".lib",
    ".woff", ".woff2", ".ttf", ".otf", ".eot",
    ".sqlite", ".db", ".parquet", ".feather",
}

SENSITIVE_FILENAMES = {
    ".env", "id_rsa", "id_dsa", "id_ed25519",
    "credentials", "secrets.json", "service-account.json",
}

PRIVATE_KEY_PATTERN = re.compile(
    r"-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----"
    r"[\s\S]*?"
    r"-----END [A-Z0-9 ]*PRIVATE KEY-----"
)

SECRET_ASSIGNMENT_PATTERN = re.compile(
    r"(?i)\b("
    r"api[_-]?key|client[_-]?secret|access[_-]?token|"
    r"auth[_-]?token|password|passwd|secret(?:[_-]?key)?|"
    r"private[_-]?key|aws[_-]?secret[_-]?access[_-]?key"
    r")(\s*[:=]\s*)(['\"]?)([^\s'\";,]+)(['\"]?)"
)

TOKEN_PATTERNS = [
    re.compile(r"\bgh[pousr]_[A-Za-z0-9_]{20,}\b"),
    re.compile(r"\bsk-[A-Za-z0-9_-]{20,}\b"),
    re.compile(r"\bAIza[0-9A-Za-z_-]{30,}\b"),
    re.compile(r"\bxox[baprs]-[A-Za-z0-9-]{10,}\b"),
]


def normalize_path(path: str) -> str:
    return path.replace("\\", "/").lstrip("/")


def should_skip_file(path: str, content: str) -> bool:
    normalized = normalize_path(path)
    parsed = PurePosixPath(normalized)

    if not normalized or ".." in parsed.parts:
        return True

    parts = {part.lower() for part in parsed.parts}
    filename = parsed.name.lower()
    extension = parsed.suffix.lower()

    if parts & IGNORED_DIRECTORIES:
        return True

    if filename in IGNORED_FILENAMES:
        return True

    if filename in SENSITIVE_FILENAMES:
        return True

    if filename.startswith(".env."):
        return True

    if extension in IGNORED_EXTENSIONS:
        return True

    if len(content.encode("utf-8", errors="replace")) > (
        settings.max_file_size_bytes
    ):
        return True

    if "\x00" in content:
        return True

    return False


def redact_secrets(content: str) -> str:
    # Redact the complete private-key block, not just its header.
    result = PRIVATE_KEY_PATTERN.sub(
        "[REDACTED PRIVATE KEY]",
        content,
    )

    # Preserve the key name and assignment separator for context.
    result = SECRET_ASSIGNMENT_PATTERN.sub(
        lambda match: (
            f"{match.group(1)}{match.group(2)}"
            f"{match.group(3)}[REDACTED]"
            f"{match.group(5) if match.group(3) else ''}"
        ),
        result,
    )

    for pattern in TOKEN_PATTERNS:
        result = pattern.sub("[REDACTED TOKEN]", result)

    return result


def split_by_lines(
    path: str,
    language: str,
    content: str,
    max_chars: int | None = None,
    overlap_lines: int | None = None,
) -> list[CodeChunk]:
    max_chars = (
        settings.max_chunk_chars if max_chars is None else max_chars
    )
    overlap_lines = (
        settings.chunk_overlap_lines
        if overlap_lines is None
        else overlap_lines
    )

    if max_chars < 1:
        raise ValueError("max_chars must be greater than zero")

    if overlap_lines < 0:
        raise ValueError("overlap_lines cannot be negative")

    lines = content.splitlines()
    if not lines:
        return []

    chunks: list[CodeChunk] = []
    start = 0

    while start < len(lines):
        # Split a single oversized line into bounded fragments.
        if len(lines[start]) > max_chars:
            line = lines[start]
            fragments = [
                line[index:index + max_chars]
                for index in range(0, len(line), max_chars)
            ]

            for fragment_index, fragment in enumerate(fragments):
                chunks.append(
                    CodeChunk(
                        path=path,
                        language=language,
                        content=fragment,
                        start_line=start + 1,
                        end_line=start + 1,
                        chunk_index=len(chunks),
                        metadata={
                            "fragmentIndex": fragment_index,
                            "fragmentCount": len(fragments),
                        },
                    )
                )

            start += 1
            continue

        end = start
        size = 0

        while end < len(lines):
            line_size = len(lines[end]) + 1

            if len(lines[end]) > max_chars:
                break

            if end > start and size + line_size > max_chars:
                break

            size += line_size
            end += 1

        # Defensive fallback to guarantee progress.
        if end == start:
            end += 1

        chunk_content = "\n".join(lines[start:end])

        if chunk_content.strip():
            chunks.append(
                CodeChunk(
                    path=path,
                    language=language,
                    content=chunk_content,
                    start_line=start + 1,
                    end_line=end,
                    chunk_index=len(chunks),
                )
            )

        if end >= len(lines):
            break

        start = max(start + 1, end - overlap_lines)

    return chunks


def chunk_by_declarations(
    path: str,
    language: str,
    content: str,
    declaration_pattern: str,
) -> list[CodeChunk]:
    lines = content.splitlines()

    if not lines:
        return []

    pattern = re.compile(declaration_pattern)

    starts = [
        index
        for index, line in enumerate(lines)
        if pattern.search(line)
    ]

    if not starts:
        return split_by_lines(path, language, content)

    if starts[0] != 0:
        starts.insert(0, 0)

    chunks: list[CodeChunk] = []

    for index, start in enumerate(starts):
        end = (
            starts[index + 1]
            if index + 1 < len(starts)
            else len(lines)
        )

        segment = "\n".join(lines[start:end])

        if len(segment) <= settings.max_chunk_chars:
            if segment.strip():
                chunks.append(
                    CodeChunk(
                        path=path,
                        language=language,
                        content=segment,
                        start_line=start + 1,
                        end_line=end,
                        chunk_index=len(chunks),
                    )
                )
            continue

        parts = split_by_lines(path, language, segment)

        for part in parts:
            part.start_line += start
            part.end_line += start
            part.chunk_index = len(chunks)
            chunks.append(part)

    return chunks
