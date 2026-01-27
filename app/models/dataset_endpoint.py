from datetime import datetime

from sqlalchemy import Column, String, DateTime, ForeignKey

from app.database import Base
from app.types import GUID, JSONType


class DatasetEndpoint(Base):
    __tablename__ = "ndp_dataset_endpoint"

    dataset_uid = Column(GUID(), ForeignKey("ndp_dataset.uid", ondelete="CASCADE"), primary_key=True)
    endpoint_uid = Column(GUID(), ForeignKey("ndp_endpoint.uid", ondelete="CASCADE"), primary_key=True)
    role = Column(String, nullable=True)
    attrs = Column(JSONType(), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
