from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class DatasetEndpointCreate(BaseModel):
    dataset_uid: UUID
    endpoint_uid: UUID
    role: str | None = None
    attrs: dict[str, Any] | None = None


class DatasetEndpointResponse(BaseModel):
    dataset_uid: UUID
    endpoint_uid: UUID
    role: str | None = None
    attrs: dict[str, Any] | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
