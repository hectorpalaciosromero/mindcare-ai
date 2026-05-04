"""Exercise and ExerciseCompletion models."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Exercise(Base):
    __tablename__ = "exercises"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(SAEnum("breathing", "mindfulness", "journaling", "relaxation", name="exercise_type"), nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)

    completions = relationship("ExerciseCompletion", back_populates="exercise")


class ExerciseCompletion(Base):
    __tablename__ = "exercise_completions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patient_profiles.id"), nullable=False)
    exercise_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("exercises.id"), nullable=False)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    patient = relationship("PatientProfile", back_populates="exercise_completions")
    exercise = relationship("Exercise", back_populates="completions")
