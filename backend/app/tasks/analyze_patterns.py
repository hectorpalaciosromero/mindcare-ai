"""Celery task — detects crisis patterns in recent check-ins and generates AI alerts."""

import logging
from datetime import datetime, timedelta, timezone

from app.tasks import celery_app
from app.database import SessionLocal
from app.models.patient import PatientProfile
from app.models.checkin import Checkin
from app.models.alert import AIAlert

logger = logging.getLogger(__name__)

# Thresholds for crisis detection
HIGH_INTENSITY_THRESHOLD = 7
CONSECUTIVE_DAYS_THRESHOLD = 3
NEGATIVE_EMOTIONS = {"anxious", "stressed", "angry", "sad"}


@celery_app.task(name="app.tasks.analyze_patterns.detect_crisis_patterns")
def detect_crisis_patterns():
    """Runs every 6h — flags high-intensity negative streaks as alerts."""
    db = SessionLocal()
    try:
        patients = db.query(PatientProfile).filter(PatientProfile.psychologist_id.isnot(None)).all()
        cutoff = datetime.now(timezone.utc) - timedelta(days=5)

        for patient in patients:
            try:
                recent_checkins = (
                    db.query(Checkin)
                    .filter(Checkin.patient_id == patient.id, Checkin.created_at >= cutoff)
                    .order_by(Checkin.created_at.desc())
                    .all()
                )

                if len(recent_checkins) < CONSECUTIVE_DAYS_THRESHOLD:
                    continue

                high_negative = [
                    c for c in recent_checkins
                    if c.emotion in NEGATIVE_EMOTIONS and c.intensity >= HIGH_INTENSITY_THRESHOLD
                ]

                if len(high_negative) >= CONSECUTIVE_DAYS_THRESHOLD:
                    existing = (
                        db.query(AIAlert)
                        .filter(
                            AIAlert.patient_id == patient.id,
                            AIAlert.created_at >= cutoff,
                            AIAlert.acknowledged == False,
                        )
                        .first()
                    )
                    if existing:
                        continue

                    avg_intensity = sum(c.intensity for c in high_negative) / len(high_negative)
                    emotions_detected = list({c.emotion for c in high_negative})
                    patient_name = f"{patient.user.first_name} {patient.user.last_name}"

                    tags = []
                    if "anxious" in emotions_detected:
                        tags.append("Ansiedad elevada")
                    if "stressed" in emotions_detected:
                        tags.append("Estrés persistente")
                    if "sad" in emotions_detected:
                        tags.append("Estado depresivo")
                    if avg_intensity >= 8:
                        tags.append("Síntomas físicos posibles")

                    alert = AIAlert(
                        patient_id=patient.id,
                        psychologist_id=patient.psychologist_id,
                        priority="high" if avg_intensity >= 8 else "medium",
                        description=(
                            f"Se ha detectado un patrón preocupante en los últimos 5 días para {patient_name}. "
                            f"Se registraron {len(high_negative)} check-ins con emociones negativas de alta intensidad "
                            f"(promedio {avg_intensity:.1f}/10). Emociones predominantes: {', '.join(emotions_detected)}."
                        ),
                        tags={"tags": tags},
                    )
                    db.add(alert)

                    patient.status = "needs_attention"
                    db.commit()

                    logger.warning(f"Crisis alert created for patient {patient_name}")

            except Exception as e:
                logger.error(f"Error analyzing patterns for patient {patient.id}: {e}")
                db.rollback()

    finally:
        db.close()
