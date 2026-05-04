"""Psychologist router — dashboard, patients, alerts, reports."""

from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession, joinedload
from sqlalchemy import func, cast, Date

from app.database import get_db
from app.models.user import User
from app.models.patient import PatientProfile
from app.models.psychologist import PsychologistProfile
from app.models.checkin import Checkin
from app.models.alert import AIAlert
from app.models.session import Session
from app.models.report import WeeklyReport
from app.schemas import (
    PsychologistDashboard, PatientSummary, PatientDetail,
    WeeklyEvolution, CheckinOut, AlertOut, WeeklyReportOut, DailyTrend, EmotionCount,
    SessionCreate, SessionUpdate, SessionOut,
)
from app.services.auth_service import require_role

router = APIRouter(prefix="/api/psychologists", tags=["Psychologists"])


def _get_profile(user: User, db: DBSession) -> PsychologistProfile:
    profile = db.query(PsychologistProfile).filter(PsychologistProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Psychologist profile not found")
    return profile


@router.get("/dashboard", response_model=PsychologistDashboard)
def get_dashboard(
    current_user: User = Depends(require_role("psychologist")),
    db: DBSession = Depends(get_db),
):
    profile = _get_profile(current_user, db)

    active = db.query(PatientProfile).filter(PatientProfile.psychologist_id == profile.id).count()
    pending_alerts = db.query(AIAlert).filter(
        AIAlert.psychologist_id == profile.id, AIAlert.acknowledged == False
    ).count()

    # Compare this week's avg intensity vs last week's to calculate improvement delta.
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    two_weeks_ago = datetime.now(timezone.utc) - timedelta(days=14)

    sessions_week = db.query(Session).filter(
        Session.psychologist_id == profile.id,
        Session.scheduled_at >= week_ago,
    ).count()

    patient_ids = [s.id for s in db.query(PatientProfile).filter(PatientProfile.psychologist_id == profile.id).all()]
    
    recent_avg = db.query(func.avg(Checkin.intensity)).filter(
        Checkin.patient_id.in_(patient_ids),
        Checkin.created_at >= week_ago,
    ).scalar()
    
    older_avg = db.query(func.avg(Checkin.intensity)).filter(
        Checkin.patient_id.in_(patient_ids),
        Checkin.created_at >= two_weeks_ago,
        Checkin.created_at < week_ago,
    ).scalar()

    if recent_avg and older_avg and older_avg > 0:
        avg_improvement = round(((float(recent_avg) - float(older_avg)) / float(older_avg)) * 100, 1)
    else:
        avg_improvement = 0.0

    return PsychologistDashboard(
        active_patients=active,
        pending_alerts=pending_alerts,
        sessions_this_week=sessions_week,
        avg_improvement=avg_improvement,
    )


@router.get("/analytics/trend", response_model=list[DailyTrend])
def get_analytics_trend(
    current_user: User = Depends(require_role("psychologist")),
    db: DBSession = Depends(get_db),
):
    """Daily avg intensity across all assigned patients (7-day window)."""
    profile = _get_profile(current_user, db)
    patient_ids = [
        s.id for s in db.query(PatientProfile).filter(
            PatientProfile.psychologist_id == profile.id
        ).all()
    ]

    if not patient_ids:
        return []

    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

    rows = (
        db.query(
            cast(Checkin.created_at, Date).label("day"),
            func.avg(Checkin.intensity).label("avg_score"),
        )
        .filter(
            Checkin.patient_id.in_(patient_ids),
            Checkin.created_at >= week_ago,
        )
        .group_by(cast(Checkin.created_at, Date))
        .order_by(cast(Checkin.created_at, Date))
        .all()
    )

    score_map = {row.day: round(float(row.avg_score), 1) for row in rows}

    today = datetime.now(timezone.utc).date()
    result = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        label = DAY_LABELS[d.weekday()]
        if d == today:
            label = "Hoy"
        result.append(DailyTrend(day=label, score=score_map.get(d)))

    return result


@router.get("/analytics/emotions", response_model=list[EmotionCount])
def get_emotions_frequency(
    current_user: User = Depends(require_role("psychologist")),
    db: DBSession = Depends(get_db),
):
    """Emotion distribution counts for the last 7 days."""
    profile = _get_profile(current_user, db)
    patient_ids = [
        s.id for s in db.query(PatientProfile).filter(
            PatientProfile.psychologist_id == profile.id
        ).all()
    ]

    if not patient_ids:
        return []

    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    EMOTION_LABELS = {
        "happy": "Feliz", "calm": "Tranquilo", "sad": "Triste",
        "anxious": "Ansioso", "stressed": "Estresado", "angry": "Enojado",
    }

    rows = (
        db.query(Checkin.emotion, func.count(Checkin.id).label("count"))
        .filter(
            Checkin.patient_id.in_(patient_ids),
            Checkin.created_at >= week_ago,
        )
        .group_by(Checkin.emotion)
        .order_by(func.count(Checkin.id).desc())
        .all()
    )

    return [
        EmotionCount(emotion=EMOTION_LABELS.get(row.emotion, row.emotion), count=row.count)
        for row in rows
    ]

@router.get("/patients", response_model=list[PatientSummary])
def get_patients(
    current_user: User = Depends(require_role("psychologist")),
    db: DBSession = Depends(get_db),
):
    profile = _get_profile(current_user, db)

    patients = (
        db.query(PatientProfile)
        .options(joinedload(PatientProfile.user))
        .filter(PatientProfile.psychologist_id == profile.id)
        .all()
    )

    result = []
    for s in patients:
        last_checkin = (
            db.query(Checkin)
            .filter(Checkin.patient_id == s.id)
            .order_by(Checkin.created_at.desc())
            .first()
        )
        result.append(PatientSummary(
            id=s.id,
            user_id=s.user_id,
            name=f"{s.user.first_name} {s.user.last_name}",
            age=s.user.age,
            status=s.status,
            avg_emotional_state=s.avg_emotional_state,
            total_checkins=s.total_checkins,
            last_checkin_at=last_checkin.created_at if last_checkin else None,
        ))
    return result


@router.get("/patients/{patient_id}", response_model=PatientDetail)
def get_patient_detail(
    patient_id: str,
    current_user: User = Depends(require_role("psychologist")),
    db: DBSession = Depends(get_db),
):
    profile = _get_profile(current_user, db)
    patient = db.query(PatientProfile).filter(
        PatientProfile.id == patient_id,
        PatientProfile.psychologist_id == profile.id,
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    return PatientDetail(
        id=patient.id,
        name=f"{patient.user.first_name} {patient.user.last_name}",
        age=patient.user.age,
        email=patient.user.email,
        phone=patient.user.phone,
        status=patient.status,
        enrollment_date=patient.enrollment_date,
        avg_emotional_state=patient.avg_emotional_state,
        total_checkins=patient.total_checkins,
        total_sessions=patient.total_sessions,
        exercises_completed=patient.exercises_completed,
    )


@router.get("/patients/{patient_id}/checkins", response_model=list[CheckinOut])
def get_patient_checkins(
    patient_id: str,
    limit: int = 20,
    current_user: User = Depends(require_role("psychologist")),
    db: DBSession = Depends(get_db),
):
    profile = _get_profile(current_user, db)
    patient = db.query(PatientProfile).filter(
        PatientProfile.id == patient_id,
        PatientProfile.psychologist_id == profile.id,
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    return (
        db.query(Checkin)
        .filter(Checkin.patient_id == patient.id)
        .order_by(Checkin.created_at.desc())
        .limit(limit)
        .all()
    )


@router.get("/patients/{patient_id}/evolution", response_model=list[WeeklyEvolution])
def get_patient_evolution(
    patient_id: str,
    current_user: User = Depends(require_role("psychologist")),
    db: DBSession = Depends(get_db),
):
    profile = _get_profile(current_user, db)
    patient = db.query(PatientProfile).filter(
        PatientProfile.id == patient_id,
        PatientProfile.psychologist_id == profile.id,
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
    result = []
    now = datetime.now(timezone.utc)

    for i in range(6, -1, -1):
        day = now - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)

        avg = db.query(func.avg(Checkin.intensity)).filter(
            Checkin.patient_id == patient.id,
            Checkin.created_at >= day_start,
            Checkin.created_at < day_end,
        ).scalar()

        result.append(WeeklyEvolution(
            day=days[day.weekday()],
            score=round(float(avg), 1) if avg is not None else None,
        ))
    return result


@router.get("/alerts", response_model=list[AlertOut])
def get_alerts(
    current_user: User = Depends(require_role("psychologist")),
    db: DBSession = Depends(get_db),
):
    profile = _get_profile(current_user, db)
    alerts = (
        db.query(AIAlert)
        .options(joinedload(AIAlert.patient).joinedload(PatientProfile.user))
        .filter(AIAlert.psychologist_id == profile.id)
        .order_by(AIAlert.created_at.desc())
        .limit(20)
        .all()
    )

    result = []
    for a in alerts:
        patient = a.patient
        result.append(AlertOut(
            id=a.id,
            patient_name=f"{patient.user.first_name} {patient.user.last_name}" if patient else "Unknown",
            priority=a.priority,
            description=a.description,
            tags=a.tags.get("tags", []) if isinstance(a.tags, dict) else a.tags,
            acknowledged=a.acknowledged,
            created_at=a.created_at,
        ))
    return result


@router.patch("/alerts/{alert_id}/acknowledge")
def acknowledge_alert(
    alert_id: str,
    current_user: User = Depends(require_role("psychologist")),
    db: DBSession = Depends(get_db),
):
    profile = _get_profile(current_user, db)
    alert = db.query(AIAlert).filter(
        AIAlert.id == alert_id, AIAlert.psychologist_id == profile.id
    ).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.acknowledged = True
    db.commit()
    return {"status": "acknowledged"}


@router.post("/patients/{patient_id}/generate-report")
async def generate_report_for_patient(
    patient_id: str,
    current_user: User = Depends(require_role("psychologist")),
    db: DBSession = Depends(get_db),
):
    """On-demand Gemini weekly report for a single patient."""
    from app.models.exercise import ExerciseCompletion
    from app.models.report import WeeklyReport as WR
    from app.services.ai_service import generate_weekly_summary

    profile = _get_profile(current_user, db)
    patient = db.query(PatientProfile).filter(
        PatientProfile.id == patient_id,
        PatientProfile.psychologist_id == profile.id,
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    now = datetime.now(timezone.utc)
    week_end = now.date()
    week_start = week_end - timedelta(days=7)

    checkins = (
        db.query(Checkin)
        .filter(
            Checkin.patient_id == patient.id,
            Checkin.created_at >= datetime.combine(week_start, datetime.min.time()).replace(tzinfo=timezone.utc),
        )
        .all()
    )

    if not checkins:
        raise HTTPException(status_code=400, detail="No hay check-ins esta semana para generar reporte")

    exercises_count = (
        db.query(ExerciseCompletion)
        .filter(ExerciseCompletion.patient_id == patient.id)
        .count()
    )

    checkins_data = [
        {"emotion": c.emotion, "intensity": c.intensity, "note": c.note or ""}
        for c in checkins
    ]
    avg_state = sum(c.intensity for c in checkins) / len(checkins)
    patient_name = f"{patient.user.first_name} {patient.user.last_name}"

    ai_result = await generate_weekly_summary(patient_name, checkins_data, exercises_count)

    report = WR(
        patient_id=patient.id,
        psychologist_id=profile.id,
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
    db.refresh(report)

    return {
        "id": str(report.id),
        "patient_name": patient_name,
        "week_start": str(report.week_start),
        "week_end": str(report.week_end),
        "avg_state": report.avg_state,
        "ai_summary": report.ai_summary,
        "status": "generated",
    }


@router.get("/reports", response_model=list[WeeklyReportOut])
def get_reports(
    current_user: User = Depends(require_role("psychologist")),
    db: DBSession = Depends(get_db),
):
    profile = _get_profile(current_user, db)
    reports = (
        db.query(WeeklyReport)
        .options(joinedload(WeeklyReport.patient).joinedload(PatientProfile.user))
        .filter(WeeklyReport.psychologist_id == profile.id)
        .order_by(WeeklyReport.generated_at.desc())
        .limit(20)
        .all()
    )

    result = []
    for r in reports:
        patient = r.patient
        result.append(WeeklyReportOut(
            id=r.id,
            patient_name=f"{patient.user.first_name} {patient.user.last_name}" if patient else "Unknown",
            week_start=r.week_start,
            week_end=r.week_end,
            avg_state=r.avg_state,
            checkins_count=r.checkins_count,
            exercises_count=r.exercises_count,
            main_emotions=r.main_emotions.get("main_emotions", []) if isinstance(r.main_emotions, dict) else r.main_emotions,
            ai_summary=r.ai_summary,
            session_recommendations=r.session_recommendations.get("session_recommendations", []) if isinstance(r.session_recommendations, dict) else r.session_recommendations,
            generated_at=r.generated_at,
        ))
    return result


# Sessions

@router.get("/sessions", response_model=list[SessionOut])
def get_sessions(
    current_user: User = Depends(require_role("psychologist")),
    db: DBSession = Depends(get_db),
):
    profile = _get_profile(current_user, db)
    sessions = (
        db.query(Session)
        .options(joinedload(Session.patient).joinedload(PatientProfile.user))
        .filter(Session.psychologist_id == profile.id)
        .order_by(Session.scheduled_at.desc())
        .limit(20)
        .all()
    )
    result = []
    for s in sessions:
        patient = s.patient
        patient_name = f"{patient.user.first_name} {patient.user.last_name}" if patient else "Desconocido"
        result.append(SessionOut(
            id=s.id,
            patient_id=s.patient_id,
            psychologist_id=s.psychologist_id,
            patient_name=patient_name,
            psychologist_name=f"{current_user.first_name} {current_user.last_name}",
            scheduled_at=s.scheduled_at,
            status=s.status,
            notes=s.notes,
            meeting_url=s.meeting_url,
        ))
    return result


@router.post("/sessions", response_model=SessionOut, status_code=201)
def create_session(
    data: SessionCreate,
    current_user: User = Depends(require_role("psychologist")),
    db: DBSession = Depends(get_db),
):
    profile = _get_profile(current_user, db)
    patient = db.query(PatientProfile).filter(
        PatientProfile.id == data.patient_id,
        PatientProfile.psychologist_id == profile.id,
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Prevent scheduling in the past
    if data.scheduled_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="No se puede agendar una cita en el pasado")

    session = Session(
        patient_id=patient.id,
        psychologist_id=profile.id,
        scheduled_at=data.scheduled_at,
        status="scheduled",
        notes=data.notes,
        meeting_url=data.meeting_url,
    )
    db.add(session)
    patient.total_sessions += 1
    db.commit()
    db.refresh(session)

    patient_name = f"{patient.user.first_name} {patient.user.last_name}"
    return SessionOut(
        id=session.id,
        patient_id=session.patient_id,
        psychologist_id=session.psychologist_id,
        patient_name=patient_name,
        psychologist_name=f"{current_user.first_name} {current_user.last_name}",
        scheduled_at=session.scheduled_at,
        status=session.status,
        notes=session.notes,
        meeting_url=session.meeting_url,
    )


@router.patch("/sessions/{session_id}/cancel")
def cancel_session(
    session_id: str,
    current_user: User = Depends(require_role("psychologist")),
    db: DBSession = Depends(get_db),
):
    profile = _get_profile(current_user, db)
    session = db.query(Session).filter(
        Session.id == session_id,
        Session.psychologist_id == profile.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status != "scheduled":
        raise HTTPException(status_code=400, detail="Solo se pueden cancelar sesiones programadas")

    session.status = "cancelled"
    db.commit()
    return {"status": "cancelled", "id": str(session.id)}


@router.patch("/sessions/{session_id}/complete")
def complete_session(
    session_id: str,
    current_user: User = Depends(require_role("psychologist")),
    db: DBSession = Depends(get_db),
):
    profile = _get_profile(current_user, db)
    session = db.query(Session).filter(
        Session.id == session_id,
        Session.psychologist_id == profile.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status != "scheduled":
        raise HTTPException(status_code=400, detail="Solo se pueden completar sesiones programadas")

    session.status = "completed"
    db.commit()
    return {"status": "completed", "id": str(session.id)}


@router.patch("/sessions/{session_id}/reschedule")
def reschedule_session(
    session_id: str,
    data: SessionUpdate,
    current_user: User = Depends(require_role("psychologist")),
    db: DBSession = Depends(get_db),
):
    profile = _get_profile(current_user, db)
    session = db.query(Session).filter(
        Session.id == session_id,
        Session.psychologist_id == profile.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status != "scheduled":
        raise HTTPException(status_code=400, detail="Solo se pueden reagendar sesiones programadas")

    if data.scheduled_at:
        if data.scheduled_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="No se puede reagendar a una fecha pasada")
        session.scheduled_at = data.scheduled_at
    if data.notes is not None:
        session.notes = data.notes
    if data.meeting_url is not None:
        session.meeting_url = data.meeting_url

    db.commit()
    db.refresh(session)
    return {
        "status": "rescheduled",
        "id": str(session.id),
        "scheduled_at": session.scheduled_at.isoformat(),
    }

