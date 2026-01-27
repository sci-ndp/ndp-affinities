import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime

from app.database import Base
from app.types import GUID, JSONType


class Service(Base):
    __tablename__ = "ndp_service"

    uid = Column(GUID(), primary_key=True, default=uuid.uuid4)
    type = Column(String, nullable=True)
    openapi_url = Column(String, nullable=True)
    version = Column(String, nullable=True)
    source_ep = Column(String, nullable=True)
    metadata_ = Column("metadata", JSONType(), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
