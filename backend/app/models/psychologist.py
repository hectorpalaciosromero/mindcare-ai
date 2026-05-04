"""Psychologist profile — license, specialty, and patient management."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey
from app.database import Base


class PsychologistProfile(Base):
    __tablename__ = "psychologist_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    license_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    specialty: Mapped[str | None] = mapped_column(String(100), nullable=True)
    active_patients: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="psychologist_profile")
    patients = relationship("PatientProfile", back_populates="psychologist")
    sessions = relationship("Session", back_populates="psychologist")
    weekly_reports = relationship("WeeklyReport", back_populates="psychologist")
    alerts = relationship("AIAlert", back_populates="psychologist")
