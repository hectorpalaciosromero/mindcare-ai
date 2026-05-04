"""Shared Enums for SQLAlchemy Models and Pydantic Schemas."""

import enum

class UserRole(str, enum.Enum):
    patient = "patient"
    psychologist = "psychologist"
    admin = "admin"

class EmotionType(str, enum.Enum):
    happy = "happy"
    calm = "calm"
    sad = "sad"
    anxious = "anxious"
    stressed = "stressed"
    angry = "angry"
