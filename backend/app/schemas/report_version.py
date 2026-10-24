from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ReportVersionCreate(BaseModel):
    change_note: str | None = Field(default=None, max_length=500)


class ReportVersionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    report_id: int
    version_number: int
    uploaded_by: int
    change_note: str | None
    created_at: datetime