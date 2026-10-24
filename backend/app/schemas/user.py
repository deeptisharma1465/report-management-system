
from pydantic import BaseModel, ConfigDict, Field


class UserUpdate(BaseModel):
    role: str | None = Field(default=None, pattern="^(admin|user)$")
    agency_id: int | None = Field(default=None, gt=0)
    is_active: bool | None = None


class UserManagementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    role: str
    is_active: bool
    agency_id: int | None
