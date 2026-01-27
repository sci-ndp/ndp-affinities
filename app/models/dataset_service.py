from datetime import datetime

from sqlalchemy import Column, String, DateTime, ForeignKey

from app.database import Base
from app.types import GUID, JSONType


class DatasetService(Base):
    __tablename__ = "ndp_dataset_service"

    dataset_uid = Column(GUID(), ForeignKey("ndp_dataset.uid", ondelete="CASCADE"), primary_key=True)
    service_uid = Column(GUID(), ForeignKey("ndp_service.uid", ondelete="CASCADE"), primary_key=True)
    role = Column(String, nullable=True)
    attrs = Column(JSONType(), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
