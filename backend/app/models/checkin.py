"""Checkin model — emotional state entries with AI analysis stored as JSONB."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from app.enums import EmotionType


class Checkin(Base):
    __tablename__ = "checkins"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patient_profiles.id"), nullable=False, index=True)
    emotion: Mapped[EmotionType] = mapped_column(SAEnum(EmotionType, name="emotion_type"), nullable=False)
    intensity: Mapped[int] = mapped_column(Integer, nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_analysis: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)

    # Relationships
    patient = relationship("PatientProfile", back_populates="checkins")
