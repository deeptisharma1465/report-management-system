from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models import User
from app.schemas.report import ReportResponse
from app.schemas.search import SearchHit, SearchResponse
from app.services.search_service import search_reports

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("/reports", response_model=SearchResponse)
def semantic_search_reports(
    q: str = Query(..., min_length=2, max_length=200),
    limit: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SearchResponse:
    results = search_reports(db, current_user, q.strip(), limit)

    return SearchResponse(
        query=q,
        results=[
            SearchHit(
                report=ReportResponse.model_validate(item.report),
                score=item.score,
                snippet=item.snippet,
            )
            for item in results
        ],
    )