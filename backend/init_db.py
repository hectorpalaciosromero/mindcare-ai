"""Database initialization script.
Run this script before starting the API to ensure all tables exist.
This avoids concurrent creation issues when running multiple Uvicorn workers.
"""

import logging
from app.database import engine, Base
from app.models.user import User
from app.models.patient import PatientProfile
from app.models.psychologist import PsychologistProfile
from app.models.checkin import Checkin
from app.models.alert import AIAlert
from app.models.exercise import Exercise, ExerciseCompletion
from app.models.session import Session
from app.models.report import WeeklyReport
from app.models.chat import ChatMessage

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db():
    logger.info("Creating database tables if they do not exist...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified.")

if __name__ == "__main__":
    init_db()
