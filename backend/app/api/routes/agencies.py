
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import require_admin
from app.db.session import get_db
from app.models import Agency, User
from app.schemas.agency import AgencyCreate, AgencyResponse, AgencyUpdate


router = APIRouter(prefix="/agencies", tags=["Agencies"])


# CREATE AGENCY - ADMIN ONLY
@router.post(
    "",
    response_model=AgencyResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_agency(
    request: AgencyCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> Agency:
    agency = Agency(
        name=request.name.strip(),
        description=request.description,
    )

    if not agency.name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Agency name cannot be empty.",
        )

    db.add(agency)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An agency with this name already exists.",
        )

    db.refresh(agency)
    return agency


# LIST AGENCIES - ADMIN ONLY
@router.get("", response_model=list[AgencyResponse])
def list_agencies(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[Agency]:
    query = select(Agency).order_by(Agency.name)
    return list(db.scalars(query).all())


# UPDATE AGENCY - ADMIN ONLY
@router.patch("/{agency_id}", response_model=AgencyResponse)
def update_agency(
    agency_id: int,
    request: AgencyUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> Agency:
    agency = db.get(Agency, agency_id)

    if agency is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agency not found.",
        )

    updates = request.model_dump(exclude_unset=True)

    if "name" in updates:
        new_name = updates["name"].strip() if updates["name"] is not None else ""

        if not new_name:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Agency name cannot be empty.",
            )

        updates["name"] = new_name

    for field, value in updates.items():
        setattr(agency, field, value)

    if updates:
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An agency with this name already exists.",
            )

        db.refresh(agency)

    return agency
