"""Celery application and async task definitions."""

from celery import Celery
from celery.schedules import crontab

from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "mindcare",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "generate-weekly-reports": {
            "task": "app.tasks.generate_reports.generate_all_weekly_reports",
            "schedule": crontab(hour=23, minute=0, day_of_week="sunday"),
        },
        "analyze-patterns": {
            "task": "app.tasks.analyze_patterns.detect_crisis_patterns",
            "schedule": crontab(hour="*/6"),  # Every 6 hours
        },
    },
)
