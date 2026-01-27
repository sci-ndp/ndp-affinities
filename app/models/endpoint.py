import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime

from app.database import Base
from app.types import GUID, JSONType


class Endpoint(Base):
    __tablename__ = "ndp_endpoint"

    uid = Column(GUID(), primary_key=True, default=uuid.uuid4)
    kind = Column(String, nullable=False)
    url = Column(String, nullable=True)
    source_ep = Column(String, nullable=True)
    metadata_ = Column("metadata", JSONType(), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
