from typing import Literal
from uuid import UUID

from pydantic import BaseModel


class LinkedNode(BaseModel):
    uid: UUID
    name: str | None = None


class LinkedEntitiesResponse(BaseModel):
    input_uid: UUID
    input_type: Literal["dataset", "endpoint", "service"]
    datasets: list[LinkedNode]
    endpoints: list[LinkedNode]
    services: list[LinkedNode]
