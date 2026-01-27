from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class AffinityTripleCreate(BaseModel):
    dataset_uid: UUID | None = None
    endpoint_uids: list[UUID] | None = None
    service_uids: list[UUID] | None = None
    attrs: dict[str, Any] | None = None
    version: int | None = None


class AffinityTripleUpdate(BaseModel):
    dataset_uid: UUID | None = None
    endpoint_uids: list[UUID] | None = None
    service_uids: list[UUID] | None = None
    attrs: dict[str, Any] | None = None
    version: int | None = None


class AffinityTripleResponse(BaseModel):
    triple_uid: UUID
    dataset_uid: UUID | None = None
    endpoint_uids: list[UUID] | None = None
    service_uids: list[UUID] | None = None
    attrs: dict[str, Any] | None = None
    version: int | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
