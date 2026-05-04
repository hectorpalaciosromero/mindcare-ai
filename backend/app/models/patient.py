"""Patient profile — tracks emotional state, streaks, and assignments."""

import uuid
from datetime import date, datetime, timezone
from sqlalchemy import String, Float, Integer, Date, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    psychologist_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("psychologist_profiles.id"), nullable=True)
    enrollment_date: Mapped[date] = mapped_column(Date, default=date.today)
    avg_emotional_state: Mapped[float] = mapped_column(Float, default=5.0)
    total_checkins: Mapped[int] = mapped_column(Integer, default=0)
    total_sessions: Mapped[int] = mapped_column(Integer, default=0)
    exercises_completed: Mapped[int] = mapped_column(Integer, default=0)
    current_streak: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(SAEnum("stable", "improving", "needs_attention", name="patient_status"), default="stable")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="patient_profile")
    psychologist = relationship("PsychologistProfile", back_populates="patients")
    checkins = relationship("Checkin", back_populates="patient", order_by="Checkin.created_at.desc()")
    exercise_completions = relationship("ExerciseCompletion", back_populates="patient")
    weekly_reports = relationship("WeeklyReport", back_populates="patient")
    alerts = relationship("AIAlert", back_populates="patient")
    sessions = relationship("Session", back_populates="patient")
