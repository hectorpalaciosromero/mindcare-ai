"""AI Alert model — crisis detection flags for psychologists."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, Boolean, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class AIAlert(Base):
    __tablename__ = "ai_alerts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patient_profiles.id"), nullable=False)
    psychologist_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("psychologist_profiles.id"), nullable=False)
    priority: Mapped[str] = mapped_column(SAEnum("low", "medium", "high", name="alert_priority"), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    tags: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    acknowledged: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    patient = relationship("PatientProfile", back_populates="alerts")
    psychologist = relationship("PsychologistProfile", back_populates="alerts")
