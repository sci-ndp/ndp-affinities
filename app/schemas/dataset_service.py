from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class DatasetServiceCreate(BaseModel):
    dataset_uid: UUID
    service_uid: UUID
    role: str | None = None
    attrs: dict[str, Any] | None = None


class DatasetServiceResponse(BaseModel):
    dataset_uid: UUID
    service_uid: UUID
    role: str | None = None
    attrs: dict[str, Any] | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
