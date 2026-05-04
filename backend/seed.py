"""Seed script — populates the database with demo data for development and demo purposes."""

import os
import uuid
from datetime import datetime, timedelta, timezone, date

from app.database import SessionLocal
from app.models.user import User
from app.models.patient import PatientProfile
from app.models.psychologist import PsychologistProfile
from app.models.checkin import Checkin
from app.models.alert import AIAlert
from app.models.exercise import Exercise, ExerciseCompletion
from app.models.session import Session
from app.models.report import WeeklyReport
from app.services.auth_service import hash_password


def seed():
    db = SessionLocal()

    try:
        if db.query(User).first():
            print("Database already seeded. Skipping.")
            return

        # Admin
        admin_pass = os.getenv("ADMIN_PASSWORD", "admin123")
        admin = User(
            email="hpalacios@mindcare.com",
            password_hash=hash_password(admin_pass),
            role="admin",
            first_name="Héctor",
            last_name="Palacios",
            age=26,
        )
        db.add(admin)
        db.flush()

        # Psychologist
        psi_user = User(
            email="f.palacios@mindcare.dev",
            password_hash=hash_password("1234567"),
            role="psychologist",
            first_name="Fernanda",
            last_name="Palacios",
            age=32,
            phone="+52 33 1234 5678",
        )
        db.add(psi_user)
        db.flush()

        psi = PsychologistProfile(
            user_id=psi_user.id,
            license_number="PSI-JAL-2024-0042",
            specialty="Terapia cognitivo-conductual",
            active_patients=6,
        )
        db.add(psi)
        db.flush()

        # Patients
        patient_data = [
            {"email": "america.singer@correo.com", "first_name": "America", "last_name": "Singer", "age": 21, "status": "stable"},
            {"email": "maxon.schreave@correo.com", "first_name": "Maxon", "last_name": "Schreave", "age": 23, "status": "needs_attention"},
            {"email": "marlee.tames@correo.com", "first_name": "Marlee", "last_name": "Tames", "age": 20, "status": "improving"},
            {"email": "aspen.leger@correo.com", "first_name": "Aspen", "last_name": "Leger", "age": 22, "status": "stable"},
            {"email": "celeste.newsome@correo.com", "first_name": "Celeste", "last_name": "Newsome", "age": 19, "status": "needs_attention"},
            {"email": "gavril.fadaye@correo.com", "first_name": "Gavril", "last_name": "Fadaye", "age": 24, "status": "improving"},
        ]

        patients = []
        for pd in patient_data:
            user = User(
                email=pd["email"],
                password_hash=hash_password("1234567"),
                role="patient",
                first_name=pd["first_name"],
                last_name=pd["last_name"],
                age=pd["age"],
            )
            db.add(user)
            db.flush()

            profile = PatientProfile(
                user_id=user.id,
                psychologist_id=psi.id,
                avg_emotional_state=round(5 + (hash(pd["email"]) % 40) / 10, 1),
                total_checkins=5 + hash(pd["email"]) % 10,
                current_streak=1 + hash(pd["email"]) % 7,
                status=pd["status"],
            )
            db.add(profile)
            db.flush()
            patients.append(profile)

        now = datetime.now(timezone.utc)

        # Checkins distributed across 7 days for realistic analytics
        checkin_patterns = {
            # America (stable) — consistent positive
            0: [("happy", 7), ("calm", 6), ("happy", 8), ("calm", 7), ("happy", 6)],
            # Maxon (needs_attention) — declining pattern
            1: [("anxious", 8), ("stressed", 9), ("sad", 7), ("anxious", 8), ("stressed", 9)],
            # Marlee (improving) — upward trend
            2: [("sad", 6), ("calm", 5), ("happy", 7), ("calm", 6), ("happy", 8)],
            # Aspen (stable)
            3: [("calm", 5), ("happy", 6), ("calm", 5), ("calm", 6), ("happy", 5)],
            # Celeste (needs_attention)
            4: [("stressed", 8), ("anxious", 7), ("sad", 8), ("stressed", 9), ("anxious", 8)],
            # Gavril (improving)
            5: [("anxious", 6), ("calm", 5), ("happy", 6), ("calm", 4), ("happy", 7)],
        }

        for idx, patient in enumerate(patients):
            pattern = checkin_patterns.get(idx, [("calm", 5)])
            for day_offset, (emotion, intensity) in enumerate(pattern):
                checkin = Checkin(
                    patient_id=patient.id,
                    emotion=emotion,
                    intensity=intensity,
                    note=f"Check-in automático día {day_offset + 1}",
                    ai_analysis={
                        "analysis_text": f"Registro de {emotion} con intensidad {intensity}/10.",
                        "risk_level": "high" if intensity >= 8 else "medium" if intensity >= 6 else "low",
                        "detected_patterns": [emotion],
                        "tags": [emotion],
                        "recommendation": "Continúa con tus check-ins diarios.",
                    },
                    created_at=now - timedelta(days=len(pattern) - day_offset),
                )
                db.add(checkin)

        # AI Alert for Maxon
        alert = AIAlert(
            patient_id=patients[1].id,
            psychologist_id=psi.id,
            priority="high",
            description="Se ha detectado un patrón preocupante en los últimos 5 días para Maxon Schreave. Se registraron 5 check-ins con emociones negativas de alta intensidad (promedio 8.2/10).",
            tags={"tags": ["Ansiedad elevada", "Estrés persistente"]},
        )
        db.add(alert)

        # Exercises
        exercises_data = [
            ("Respiración 4-7-8", "Inhala 4s, sostén 7s, exhala 8s. Repite 4 ciclos.", "breathing", 5),
            ("Body Scan", "Escaneo corporal guiado de pies a cabeza.", "mindfulness", 10),
            ("Diario de gratitud", "Escribe 3 cosas por las que estés agradecido(a) hoy.", "journaling", 8),
            ("Relajación muscular progresiva", "Tensa y relaja cada grupo muscular por 10 segundos.", "relaxation", 15),
        ]
        for title, desc, etype, duration in exercises_data:
            db.add(Exercise(title=title, description=desc, type=etype, duration_minutes=duration))

        # Sessions
        session1 = Session(patient_id=patients[0].id, psychologist_id=psi.id, scheduled_at=now + timedelta(days=3), status="scheduled", meeting_url="https://meet.google.com/abc-defg-hij", notes="Seguimiento semanal")
        session2 = Session(patient_id=patients[1].id, psychologist_id=psi.id, scheduled_at=now - timedelta(days=2), status="completed", notes="Sesión de seguimiento completada.")
        session3 = Session(patient_id=patients[2].id, psychologist_id=psi.id, scheduled_at=now + timedelta(hours=2), status="scheduled", meeting_url="https://meet.google.com/xyz-uvwq-rst", notes="Sesión urgente")
        db.add_all([session1, session2, session3])

        # Weekly Report for America
        report = WeeklyReport(
            patient_id=patients[0].id,
            psychologist_id=psi.id,
            week_start=now.date() - timedelta(days=7),
            week_end=now.date(),
            avg_state=7.0,
            checkins_count=5,
            exercises_count=2,
            main_emotions={"main_emotions": ["Feliz", "Tranquilo"]},
            ai_summary="America muestra un estado emocional consistentemente positivo esta semana.",
            session_recommendations={"session_recommendations": ["Reforzar estrategias de mantenimiento", "Explorar metas a mediano plazo"]},
        )
        db.add(report)

        db.commit()
        print("Database seeded successfully!")

    except Exception as e:
        db.rollback()
        print(f"Seed error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
