from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class EndpointCreate(BaseModel):
    kind: str
    url: str | None = None
    source_ep: str | None = None
    metadata: dict[str, Any] | None = None


class EndpointUpdate(BaseModel):
    kind: str | None = None
    url: str | None = None
    source_ep: str | None = None
    metadata: dict[str, Any] | None = None


class EndpointResponse(BaseModel):
    uid: UUID
    kind: str
    url: str | None = None
    source_ep: str | None = None
    metadata: dict[str, Any] | None = Field(default=None, validation_alias="metadata_")
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
