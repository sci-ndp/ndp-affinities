from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ServiceCreate(BaseModel):
    type: str | None = None
    openapi_url: str | None = None
    version: str | None = None
    source_ep: str | None = None
    metadata: dict[str, Any] | None = None


class ServiceUpdate(BaseModel):
    type: str | None = None
    openapi_url: str | None = None
    version: str | None = None
    source_ep: str | None = None
    metadata: dict[str, Any] | None = None


class ServiceResponse(BaseModel):
    uid: UUID
    type: str | None = None
    openapi_url: str | None = None
    version: str | None = None
    source_ep: str | None = None
    metadata: dict[str, Any] | None = Field(default=None, validation_alias="metadata_")
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
