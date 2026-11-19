import logging
from pathlib import Path

logger = logging.getLogger(__name__)

# services/ -> app/ -> backend/
BACKEND_DIR = Path(__file__).resolve().parents[2]


def _read_pdf(path: Path) -> str:
    from pypdf import PdfReader

    reader = PdfReader(str(path))
    return "\n".join((page.extract_text() or "") for page in reader.pages)


def _read_docx(path: Path) -> str:
    from docx import Document

    doc = Document(str(path))
    parts = [p.text for p in doc.paragraphs if p.text.strip()]
    for table in doc.tables:
        for row in table.rows:
            parts.append(" ".join(cell.text for cell in row.cells))
    return "\n".join(parts)


def _read_pptx(path: Path) -> str:
    from pptx import Presentation

    prs = Presentation(str(path))
    parts: list[str] = []
    for slide in prs.slides:
        for shape in slide.shapes:
            if getattr(shape, "has_text_frame", False) and shape.has_text_frame:
                parts.append(shape.text_frame.text)
    return "\n".join(parts)


def extract_text(relative_file_path: str | None) -> str:
    """Return plain text from a stored report file, or '' on any failure."""
    if not relative_file_path:
        return ""

    path = BACKEND_DIR / relative_file_path
    if not path.is_file():
        return ""

    readers = {".pdf": _read_pdf, ".docx": _read_docx, ".pptx": _read_pptx}
    reader = readers.get(path.suffix.lower())
    if reader is None:
        return ""

    try:
        return reader(path)
    except Exception:
        logger.exception("Could not extract text from %s", path)
        return ""


def chunk_text(
    text: str,
    words_per_chunk: int = 180,
    overlap: int = 30,
    max_chunks: int = 60,
) -> list[str]:
    """Split text into overlapping word windows (MiniLM reads ~256 tokens)."""
    words = text.split()
    if not words:
        return []

    chunks: list[str] = []
    step = words_per_chunk - overlap
    for start in range(0, len(words), step):
        chunks.append(" ".join(words[start : start + words_per_chunk]))
        if len(chunks) >= max_chunks or start + words_per_chunk >= len(words):
            break
    return chunks