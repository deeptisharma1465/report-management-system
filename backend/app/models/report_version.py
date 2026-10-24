
from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ReportVersion(Base):
    __tablename__ = "report_versions"

    __table_args__ = (
        UniqueConstraint(
            "report_id",
            "version_number",
            name="uq_report_version_number",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    report_id: Mapped[int] = mapped_column(
        ForeignKey("reports.id"), nullable=False
    )
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)

    uploaded_by: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False
    )
    change_note: Mapped[str | None] = mapped_column(
        String(500), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    report: Mapped["Report"] = relationship()
    uploader: Mapped["User"] = relationship()
