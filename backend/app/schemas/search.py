from pydantic import BaseModel

from app.schemas.report import ReportResponse


class SearchHit(BaseModel):
    report: ReportResponse
    score: float
    snippet: str | None = None


class SearchResponse(BaseModel):
    query: str
    results: list[SearchHit]