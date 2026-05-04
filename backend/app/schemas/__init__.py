"""Pydantic schemas for request/response validation."""

from pydantic import BaseModel, EmailStr
from typing import Optional, Literal
from datetime import date, datetime
import uuid
from app.enums import UserRole, EmotionType

# Auth

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    role: UserRole
    first_name: str
    last_name: str
    age: Optional[int] = None
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str

class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    role: str
    first_name: str
    last_name: str
    age: Optional[int] = None
    phone: Optional[str] = None

    model_config = {"from_attributes": True}

# Check-in

class CheckinCreate(BaseModel):
    emotion: EmotionType
    intensity: int
    note: Optional[str] = None

class CheckinOut(BaseModel):
    id: uuid.UUID
    emotion: str
    intensity: int
    note: Optional[str] = None
    ai_analysis: Optional[dict] = None
    created_at: datetime

    model_config = {"from_attributes": True}

# Patient Dashboard

class PatientDashboard(BaseModel):
    first_name: str
    current_streak: int
    general_state: str
    exercises_completed: int
    next_session: Optional[str] = None
    avg_emotional_state: float

# Patient (for psychologist views)

class PatientSummary(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    age: Optional[int] = None
    status: str
    avg_emotional_state: float
    total_checkins: int
    last_checkin_at: Optional[datetime] = None

class PatientDetail(BaseModel):
    id: uuid.UUID
    name: str
    age: Optional[int] = None
    email: str
    phone: Optional[str] = None
    status: str
    enrollment_date: date
    avg_emotional_state: float
    total_checkins: int
    total_sessions: int
    exercises_completed: int

class WeeklyEvolution(BaseModel):
    day: str
    score: Optional[float] = None

# Psychologist Dashboard

class PsychologistDashboard(BaseModel):
    active_patients: int
    pending_alerts: int
    sessions_this_week: int
    avg_improvement: float

class DailyTrend(BaseModel):
    day: str
    score: Optional[float] = None

class EmotionCount(BaseModel):
    emotion: str
    count: int

# Weekly Report

class WeeklyReportOut(BaseModel):
    id: uuid.UUID
    patient_name: str
    week_start: date
    week_end: date
    avg_state: float
    checkins_count: int
    exercises_count: int
    main_emotions: Optional[list] = None
    ai_summary: Optional[str] = None
    session_recommendations: Optional[list] = None
    generated_at: datetime

# AI Alert

class AlertOut(BaseModel):
    id: uuid.UUID
    patient_name: str
    priority: str
    description: str
    tags: Optional[list] = None
    acknowledged: bool
    created_at: datetime

# Session

class SessionCreate(BaseModel):
    patient_id: uuid.UUID
    scheduled_at: datetime
    notes: Optional[str] = None
    meeting_url: Optional[str] = None

class SessionUpdate(BaseModel):
    status: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    notes: Optional[str] = None
    meeting_url: Optional[str] = None

class SessionOut(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    psychologist_id: uuid.UUID
    patient_name: Optional[str] = None
    psychologist_name: Optional[str] = None
    scheduled_at: datetime
    status: str
    notes: Optional[str] = None
    meeting_url: Optional[str] = None

    model_config = {"from_attributes": True}

# Exercise

class ExerciseOut(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    type: str
    duration_minutes: int
    completed: bool = False

    model_config = {"from_attributes": True}

# Chat

class ChatMessage(BaseModel):
    message: str
    history: Optional[list] = None
