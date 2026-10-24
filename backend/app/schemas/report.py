
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class ReportCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    report_type: str = Field(min_length=1, max_length=100)
    report_date: date
    agency_id: int = Field(gt=0)


class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    report_type: str
    report_date: date
    agency_id: int
    uploaded_by: int
    is_deleted: bool
    created_at: datetime
    updated_at: datetime


class ReportUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    report_type: str | None = Field(default=None, min_length=1, max_length=100)
    report_date: date | None = None
