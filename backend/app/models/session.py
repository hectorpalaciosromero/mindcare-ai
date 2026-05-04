"""Session model — scheduled appointments between patients and psychologists."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Text, String, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patient_profiles.id"), nullable=False)
    psychologist_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("psychologist_profiles.id"), nullable=False)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(SAEnum("scheduled", "completed", "cancelled", name="session_status"), default="scheduled")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    meeting_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    patient = relationship("PatientProfile", back_populates="sessions")
    psychologist = relationship("PsychologistProfile", back_populates="sessions")
