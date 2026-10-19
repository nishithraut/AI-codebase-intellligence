
from dataclasses import dataclass, field


@dataclass
class CodeChunk:
    path: str
    language: str
    content: str
    start_line: int
    end_line: int
    chunk_index: int
    metadata: dict = field(default_factory=dict)
