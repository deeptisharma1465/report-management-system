
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import (
    can_access_agency,
    get_current_user,
    require_admin,
)
from app.db.session import get_db
from app.models import Agency, Report, ReportVersion, User
from app.schemas.report import ReportCreate, ReportResponse, ReportUpdate
from app.schemas.report_version import (
    ReportVersionCreate,
    ReportVersionResponse,
)
from app.services.audit import record_audit

router = APIRouter(prefix="/reports", tags=["Reports"])


# CREATE REPORT
@router.post(
    "",
    response_model=ReportResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_report(
    request: ReportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Report:

    if not can_access_agency(current_user, request.agency_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this agency.",
        )

    agency = db.get(Agency, request.agency_id)

    if agency is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agency not found.",
        )

    report = Report(
        title=request.title,
        description=request.description,
        report_type=request.report_type,
        report_date=request.report_date,
        agency_id=request.agency_id,
        uploaded_by=current_user.id,
    )

    db.add(report)
    db.flush()

    record_audit(
        db,
        action="report_created",
        entity_type="report",
        entity_id=report.id,
        user_id=current_user.id,
        details={
            "title": report.title,
            "agency_id": report.agency_id,
        },
    )

    db.commit()
    db.refresh(report)

    return report


# LIST REPORTS
@router.get("", response_model=list[ReportResponse])
def list_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Report]:

    query = select(Report).where(Report.is_deleted.is_(False))

    if current_user.role != "admin":
        query = query.where(
            Report.agency_id == current_user.agency_id
        )

    query = query.order_by(Report.created_at.desc())

    return list(db.scalars(query).all())


# GET REPORT BY ID
@router.get("/{report_id}", response_model=ReportResponse)
def get_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Report:

    report = db.get(Report, report_id)

    if report is None or report.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found.",
        )

    if not can_access_agency(current_user, report.agency_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this report.",
        )

    return report


# UPDATE REPORT - ADMIN ONLY
@router.patch(
    "/{report_id}",
    response_model=ReportResponse,
)
def update_report(
    report_id: int,
    request: ReportUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> Report:

    report = db.get(Report, report_id)

    if report is None or report.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found.",
        )

    updates = request.model_dump(exclude_unset=True)

    if updates:
        old_values = {
            field: getattr(report, field)
            for field in updates
        }

        for field, value in updates.items():
            setattr(report, field, value)

        record_audit(
            db,
            action="report_updated",
            entity_type="report",
            entity_id=report.id,
            user_id=current_user.id,
            details={
                "old_values": {
                    key: str(value) if value is not None else None
                    for key, value in old_values.items()
                },
                "new_values": {
                    key: str(value) if value is not None else None
                    for key, value in updates.items()
                },
            },
        )

        db.commit()
        db.refresh(report)

    return report


# SOFT DELETE REPORT - ADMIN ONLY
@router.delete(
    "/{report_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_report(
    report_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> None:

    report = db.get(Report, report_id)

    if report is None or report.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found.",
        )

    report.is_deleted = True

    record_audit(
        db,
        action="report_deleted",
        entity_type="report",
        entity_id=report.id,
        user_id=current_user.id,
        details={
            "title": report.title,
            "agency_id": report.agency_id,
            "deletion_type": "soft_delete",
        },
    )

    db.commit()

    return None


# CREATE REPORT VERSION - ADMIN ONLY
@router.post(
    "/{report_id}/versions",
    response_model=ReportVersionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_report_version(
    report_id: int,
    request: ReportVersionCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> ReportVersion:

    report = db.get(Report, report_id)

    if report is None or report.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found.",
        )

    latest_version = db.scalar(
        select(ReportVersion.version_number)
        .where(ReportVersion.report_id == report_id)
        .order_by(ReportVersion.version_number.desc())
        .limit(1)
    )

    next_version_number = (
        1 if latest_version is None else latest_version + 1
    )

    version = ReportVersion(
        report_id=report_id,
        version_number=next_version_number,
        uploaded_by=current_user.id,
        change_note=request.change_note,
    )

    db.add(version)
    db.flush()

    record_audit(
        db,
        action="report_version_created",
        entity_type="report_version",
        entity_id=version.id,
        user_id=current_user.id,
        details={
            "report_id": report.id,
            "version_number": version.version_number,
            "change_note": version.change_note,
        },
    )

    db.commit()
    db.refresh(version)

    return version


# LIST REPORT VERSIONS - ADMIN ONLY
@router.get(
    "/{report_id}/versions",
    response_model=list[ReportVersionResponse],
)
def list_report_versions(
    report_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[ReportVersion]:

    report = db.get(Report, report_id)

    if report is None or report.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found.",
        )

    query = (
        select(ReportVersion)
        .where(ReportVersion.report_id == report_id)
        .order_by(ReportVersion.version_number.desc())
    )

    return list(db.scalars(query).all())
