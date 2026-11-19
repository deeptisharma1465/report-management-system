import logging
from dataclasses import dataclass

import numpy as np
from sqlalchemy import delete, select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.db.session import SessionLocal
from app.models import Report, User
from app.models.report_chunk import ReportChunk
from app.services.embedding_service import embed_query, embed_texts
from app.services.text_extraction import chunk_text, extract_text

logger = logging.getLogger(__name__)


@dataclass
class SearchResult:
    report: Report
    score: float
    snippet: str | None


# ---------------------------------------------------------------- indexing
def index_report(db: Session, report_id: int) -> None:
    """(Re)build all search chunks for one report."""
    report = db.get(Report, report_id)

    db.execute(delete(ReportChunk).where(ReportChunk.report_id == report_id))

    if report is None or report.is_deleted:
        db.commit()
        return

    header = f"{report.title}. {report.report_type}. {report.description or ''}".strip()
    texts = [header] + chunk_text(extract_text(report.file_path))
    vectors = embed_texts(texts)

    db.add_all(
        ReportChunk(
            report_id=report_id,
            chunk_index=index,
            content=text,
            embedding=vector,
        )
        for index, (text, vector) in enumerate(zip(texts, vectors))
    )
    db.commit()


def index_report_task(report_id: int) -> None:
    """Entry point for FastAPI BackgroundTasks (uses its own DB session)."""
    with SessionLocal() as db:
        try:
            index_report(db, report_id)
        except Exception:
            db.rollback()
            logger.exception("Indexing failed for report %s", report_id)


# ---------------------------------------------------------------- searching
def search_reports(
    db: Session, user: User, query: str, limit: int = 20
) -> list[SearchResult]:
    # Permission filter is applied in SQL, before any scoring.
    stmt = (
        select(
            ReportChunk.report_id,
            ReportChunk.chunk_index,
            ReportChunk.content,
            ReportChunk.embedding,
            Report.title,
        )
        .join(Report, Report.id == ReportChunk.report_id)
        .where(Report.is_deleted.is_(False))
    )
    if user.role != "admin":
        stmt = stmt.where(Report.uploaded_by == user.id)

    rows = db.execute(stmt).all()
    if not rows:
        return []

    matrix = np.asarray([row.embedding for row in rows], dtype=np.float32)
    scores = matrix @ np.asarray(embed_query(query), dtype=np.float32)

    # Best chunk per report.
    best: dict[int, tuple[float, int]] = {}
    for i, row in enumerate(rows):
        score = float(scores[i])
        if row.report_id not in best or score > best[row.report_id][0]:
            best[row.report_id] = (score, i)

    q_lower = query.lower().strip()
    ranked: list[tuple[int, float, int]] = []
    for report_id, (score, row_index) in best.items():
        title_match = q_lower in rows[row_index].title.lower()
        if title_match:
            score = min(1.0, score + 0.2)  # exact title hits rank first
        if score >= settings.search_min_score or title_match:
            ranked.append((report_id, score, row_index))

    ranked.sort(key=lambda item: item[1], reverse=True)
    ranked = ranked[:limit]
    if not ranked:
        return []

    reports = {
        r.id: r
        for r in db.scalars(
            select(Report)
            .options(selectinload(Report.agency), selectinload(Report.uploader))
            .where(Report.id.in_([item[0] for item in ranked]))
        )
    }

    results: list[SearchResult] = []
    for report_id, score, row_index in ranked:
        row = rows[row_index]
        if row.chunk_index == 0:
            snippet = reports[report_id].description
        else:
            snippet = row.content
        if snippet and len(snippet) > 240:
            snippet = snippet[:240].rstrip() + "…"
        results.append(SearchResult(reports[report_id], round(score, 4), snippet))
    return results