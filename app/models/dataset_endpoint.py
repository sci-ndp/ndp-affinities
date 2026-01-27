from datetime import datetime

from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.database import Base


class DatasetEndpoint(Base):
    __tablename__ = "ndp_dataset_endpoint"

    dataset_uid = Column(UUID(as_uuid=True), ForeignKey("ndp_dataset.uid", ondelete="CASCADE"), primary_key=True)
    endpoint_uid = Column(UUID(as_uuid=True), ForeignKey("ndp_endpoint.uid", ondelete="CASCADE"), primary_key=True)
    role = Column(String, nullable=True)
    attrs = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
