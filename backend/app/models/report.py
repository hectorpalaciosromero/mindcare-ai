"""Weekly report model — AI-generated summaries stored as JSONB."""

import uuid
from datetime import date, datetime, timezone
from sqlalchemy import Float, Integer, Text, Date, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class WeeklyReport(Base):
    __tablename__ = "weekly_reports"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patient_profiles.id"), nullable=False)
    psychologist_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("psychologist_profiles.id"), nullable=False)
    week_start: Mapped[date] = mapped_column(Date, nullable=False)
    week_end: Mapped[date] = mapped_column(Date, nullable=False)
    avg_state: Mapped[float] = mapped_column(Float, nullable=False)
    checkins_count: Mapped[int] = mapped_column(Integer, default=0)
    exercises_count: Mapped[int] = mapped_column(Integer, default=0)
    main_emotions: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    ai_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    session_recommendations: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    patient = relationship("PatientProfile", back_populates="weekly_reports")
    psychologist = relationship("PsychologistProfile", back_populates="weekly_reports")
