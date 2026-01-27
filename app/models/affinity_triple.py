import uuid
from datetime import datetime

from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY

from app.database import Base


class AffinityTriple(Base):
    __tablename__ = "ndp_affinity_triple"

    triple_uid = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dataset_uid = Column(UUID(as_uuid=True), ForeignKey("ndp_dataset.uid", ondelete="CASCADE"), nullable=True)
    endpoint_uids = Column(ARRAY(UUID(as_uuid=True)), nullable=True)
    service_uids = Column(ARRAY(UUID(as_uuid=True)), nullable=True)
    attrs = Column(JSONB, nullable=True)
    version = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
