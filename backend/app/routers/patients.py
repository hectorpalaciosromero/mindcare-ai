"""Patient router — dashboard, check-ins, exercises, recommendations."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession, joinedload
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.patient import PatientProfile
from app.models.checkin import Checkin
from app.models.exercise import Exercise, ExerciseCompletion
from app.models.session import Session
from app.models.psychologist import PsychologistProfile
from app.schemas import CheckinCreate, CheckinOut, PatientDashboard, ExerciseOut, SessionOut
from app.services.auth_service import require_role
from app.services.ai_service import analyze_checkin

router = APIRouter(prefix="/api/patients", tags=["Patients"])

# Maps English DB enum values back to Spanish for Gemini AI context
EMOTION_ES = {
    "happy": "Feliz",
    "calm": "Tranquilo",
    "sad": "Triste",
    "anxious": "Ansioso",
    "stressed": "Estresado",
    "angry": "Enojado",
}


@router.get("/dashboard", response_model=PatientDashboard)
def get_dashboard(
    current_user: User = Depends(require_role("patient")),
    db: DBSession = Depends(get_db),
):
    profile = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    # Next session
    next_session = (
        db.query(Session)
        .filter(Session.patient_id == profile.id, Session.status == "scheduled")
        .order_by(Session.scheduled_at)
        .first()
    )
    if next_session:
        months_es = {
            1: "enero", 2: "febrero", 3: "marzo", 4: "abril",
            5: "mayo", 6: "junio", 7: "julio", 8: "agosto",
            9: "septiembre", 10: "octubre", 11: "noviembre", 12: "diciembre",
        }
        d = next_session.scheduled_at
        next_session_str = f"{d.day} de {months_es[d.month]}"
    else:
        next_session_str = None

    # General state label
    avg = profile.avg_emotional_state
    state = "Positivo" if avg >= 7 else "Neutral" if avg >= 4 else "Necesita atención"

    return PatientDashboard(
        first_name=current_user.first_name,
        current_streak=profile.current_streak,
        general_state=state,
        exercises_completed=profile.exercises_completed,
        next_session=next_session_str,
        avg_emotional_state=profile.avg_emotional_state,
    )


@router.post("/checkins", response_model=CheckinOut, status_code=201)
async def create_checkin(
    data: CheckinCreate,
    current_user: User = Depends(require_role("patient")),
    db: DBSession = Depends(get_db),
):
    profile = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    # Retain Spanish localization for Gemini NLP context
    spanish_emotion = EMOTION_ES.get(data.emotion.value, data.emotion.value)
    ai_result = await analyze_checkin(spanish_emotion, data.intensity, data.note)

    checkin = Checkin(
        patient_id=profile.id,
        emotion=data.emotion,
        intensity=data.intensity,
        note=data.note,
        ai_analysis=ai_result,
    )
    db.add(checkin)

    profile.total_checkins += 1

    # Recalibrate 20-period moving average
    recent_checkins = (
        db.query(Checkin.intensity)
        .filter(Checkin.patient_id == profile.id)
        .order_by(Checkin.created_at.desc())
        .limit(19)
        .all()
    )
    all_intensities = [c.intensity for c in recent_checkins] + [data.intensity]
    profile.avg_emotional_state = round(sum(all_intensities) / len(all_intensities), 1)

    # Compute consecutive daily streak
    from datetime import datetime, timedelta, timezone
    now = datetime.now(timezone.utc)
    last_checkin = (
        db.query(Checkin)
        .filter(Checkin.patient_id == profile.id, Checkin.id != checkin.id)
        .order_by(Checkin.created_at.desc())
        .first()
    )
    if last_checkin:
        diff = (now.date() - last_checkin.created_at.date()).days
        if diff == 1:
            profile.current_streak += 1
        elif diff > 1:
            profile.current_streak = 1
    else:
        profile.current_streak = 1

    db.commit()
    db.refresh(checkin)
    return checkin


@router.get("/checkins", response_model=list[CheckinOut])
def get_checkins(
    limit: int = 20,
    current_user: User = Depends(require_role("patient")),
    db: DBSession = Depends(get_db),
):
    profile = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    checkins = (
        db.query(Checkin)
        .filter(Checkin.patient_id == profile.id)
        .order_by(Checkin.created_at.desc())
        .limit(limit)
        .all()
    )
    return checkins


@router.get("/exercises", response_model=list[ExerciseOut])
def get_exercises(
    current_user: User = Depends(require_role("patient")),
    db: DBSession = Depends(get_db),
):
    profile = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
    exercises = db.query(Exercise).all()

    completed_ids = {
        ec.exercise_id
        for ec in db.query(ExerciseCompletion).filter(ExerciseCompletion.patient_id == profile.id).all()
    }

    result = []
    for ex in exercises:
        out = ExerciseOut.model_validate(ex)
        out.completed = ex.id in completed_ids
        result.append(out)
    return result


@router.post("/exercises/{exercise_id}/complete", status_code=201)
def complete_exercise(
    exercise_id: str,
    current_user: User = Depends(require_role("patient")),
    db: DBSession = Depends(get_db),
):
    profile = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    # Prevent double completion
    already = db.query(ExerciseCompletion).filter(
        ExerciseCompletion.patient_id == profile.id,
        ExerciseCompletion.exercise_id == exercise.id,
    ).first()
    if already:
        return {"status": "already_completed"}

    completion = ExerciseCompletion(patient_id=profile.id, exercise_id=exercise.id)
    db.add(completion)
    profile.exercises_completed += 1
    db.commit()
    return {"status": "completed"}


@router.get("/sessions", response_model=list[SessionOut])
def get_patient_sessions(
    current_user: User = Depends(require_role("patient")),
    db: DBSession = Depends(get_db),
):
    profile = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    sessions = (
        db.query(Session)
        .options(joinedload(Session.psychologist).joinedload(PsychologistProfile.user))
        .filter(Session.patient_id == profile.id)
        .order_by(Session.scheduled_at.desc())
        .all()
    )

    result = []
    for s in sessions:
        psi_name = f"{s.psychologist.user.first_name} {s.psychologist.user.last_name}" if s.psychologist and s.psychologist.user else "Tu Psicólogo"
        result.append(SessionOut(
            id=s.id,
            patient_id=s.patient_id,
            psychologist_id=s.psychologist_id,
            patient_name=f"{current_user.first_name} {current_user.last_name}",
            psychologist_name=psi_name,
            scheduled_at=s.scheduled_at,
            status=s.status,
            notes=s.notes,
            meeting_url=s.meeting_url,
        ))

    return result


@router.patch("/sessions/{session_id}/cancel")
def cancel_patient_session(
    session_id: str,
    current_user: User = Depends(require_role("patient")),
    db: DBSession = Depends(get_db),
):
    profile = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    session = db.query(Session).filter(
        Session.id == session_id,
        Session.patient_id == profile.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status != "scheduled":
        raise HTTPException(status_code=400, detail="Solo se pueden cancelar sesiones programadas")

    session.status = "cancelled"
    db.commit()
    return {"status": "cancelled", "id": str(session.id)}

