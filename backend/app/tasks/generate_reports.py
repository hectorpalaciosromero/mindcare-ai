"""Celery task — generates AI-powered weekly reports for all patient-psychologist pairs."""

import logging
from datetime import datetime, timedelta, timezone, date

from app.tasks import celery_app
from app.database import SessionLocal
from app.models.patient import PatientProfile
from app.models.checkin import Checkin
from app.models.exercise import ExerciseCompletion
from app.models.report import WeeklyReport
from app.services.ai_service import generate_weekly_summary

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.generate_reports.generate_all_weekly_reports")
def generate_all_weekly_reports():
    """Runs weekly via Celery Beat — generates Gemini summaries for each patient."""
    db = SessionLocal()
    try:
        patients = db.query(PatientProfile).filter(PatientProfile.psychologist_id.isnot(None)).all()
        now = datetime.now(timezone.utc)
        week_end = now.date()
        week_start = week_end - timedelta(days=7)

        for patient in patients:
            try:
                checkins = (
                    db.query(Checkin)
                    .filter(
                        Checkin.patient_id == patient.id,
                        Checkin.created_at >= datetime.combine(week_start, datetime.min.time()).replace(tzinfo=timezone.utc),
                        Checkin.created_at < datetime.combine(week_end, datetime.min.time()).replace(tzinfo=timezone.utc),
                    )
                    .all()
                )

                exercises_count = (
                    db.query(ExerciseCompletion)
                    .filter(
                        ExerciseCompletion.patient_id == patient.id,
                        ExerciseCompletion.completed_at >= datetime.combine(week_start, datetime.min.time()).replace(tzinfo=timezone.utc),
                    )
                    .count()
                )

                if not checkins:
                    continue

                checkins_data = [
                    {"emotion": c.emotion, "intensity": c.intensity, "note": c.note or ""}
                    for c in checkins
                ]
                avg_state = sum(c.intensity for c in checkins) / len(checkins)
                patient_name = f"{patient.user.first_name} {patient.user.last_name}"

                # Celery workers are sync — we use asyncio.run() to bridge the async Gemini SDK call
                import asyncio
                ai_result = asyncio.run(generate_weekly_summary(patient_name, checkins_data, exercises_count))

                report = WeeklyReport(
                    patient_id=patient.id,
                    psychologist_id=patient.psychologist_id,
                    week_start=week_start,
                    week_end=week_end,
                    avg_state=round(avg_state, 1),
                    checkins_count=len(checkins),
                    exercises_count=exercises_count,
                    main_emotions={"main_emotions": ai_result.get("main_emotions", [])},
                    ai_summary=ai_result.get("summary", ""),
                    session_recommendations={"session_recommendations": ai_result.get("session_recommendations", [])},
                )
                db.add(report)
                db.commit()

                logger.info(f"Report generated for patient {patient_name}")

            except Exception as e:
                logger.error(f"Error generating report for patient {patient.id}: {e}")
                db.rollback()

    finally:
        db.close()
