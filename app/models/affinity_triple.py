import uuid
from datetime import datetime

from sqlalchemy import Column, Integer, DateTime, ForeignKey

from app.database import Base
from app.types import GUID, JSONType, GUIDArray


class AffinityTriple(Base):
    __tablename__ = "ndp_affinity_triple"

    triple_uid = Column(GUID(), primary_key=True, default=uuid.uuid4)
    dataset_uid = Column(GUID(), ForeignKey("ndp_dataset.uid", ondelete="CASCADE"), nullable=True)
    endpoint_uids = Column(GUIDArray(), nullable=True)
    service_uids = Column(GUIDArray(), nullable=True)
    attrs = Column(JSONType(), nullable=True)
    version = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
