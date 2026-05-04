"""Gemini AI service — emotion analysis, chat, and report generation."""

import google.generativeai as genai
from app.config import get_settings

settings = get_settings()
genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-2.5-flash")


async def analyze_checkin(emotion: str, intensity: int, note: str | None) -> dict:
    """Run Gemini analysis on a check-in and return structured JSON."""
    prompt = f"""Eres un asistente de salud mental profesional de la plataforma MindCare.
Analiza el siguiente registro emocional de un paciente:

- Emoción: {emotion}
- Intensidad: {intensity}/10
- Nota: "{note or 'Sin nota adicional'}"

Responde EXCLUSIVAMENTE en formato JSON con esta estructura:
{{
  "analysis_text": "Análisis empático de 2-3 oraciones en español",
  "risk_level": "low|medium|high",
  "detected_patterns": ["patrón1", "patrón2"],
  "tags": ["etiqueta1", "etiqueta2"],
  "recommendation": "Una sugerencia práctica breve"
}}"""

    try:
        response = model.generate_content(prompt)
        import json
        text = response.text.strip()
        # Gemini sometimes ignores the JSON-only instruction and wraps the response in markdown blocks.
        # We manually strip the fences to prevent json.loads from crashing in production.
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        return json.loads(text)
    except Exception:
        return {
            "analysis_text": "Tu estado emocional ha sido registrado. Reconocer cómo te sientes es el primer paso hacia el bienestar.",
            "risk_level": "low",
            "detected_patterns": [],
            "tags": [emotion],
            "recommendation": "Continúa con tus check-ins diarios para mantener tu racha activa.",
        }


async def generate_chat_reply(message: str, history: list[dict] | None = None) -> str:
    """Gemini-based chat reply with conversation history."""
    context = ""
    if history:
        context = "\n".join(
            f"{'Usuario' if m.get('sender') == 'user' else 'Asistente'}: {m.get('content', m.get('text', ''))}"
            for m in history[-8:]
        )

    prompt = f"""Eres el asistente virtual de MindCare, plataforma clínica de salud mental.

Rol: Responder preguntas sobre servicios, agendar citas, dar información sobre bienestar emocional.
Reglas: Español, cálido, profesional, máximo 2-3 oraciones, sin emojis, nunca diagnosticar.

{f'Conversación previa:\n{context}\n' if context else ''}
Usuario: {message}
Asistente:"""

    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception:
        return "Estoy aquí para ayudarte. ¿Podrías reformular tu pregunta?"


async def generate_weekly_summary(
    patient_name: str,
    checkins: list[dict],
    exercises_count: int,
) -> dict:
    """Weekly summary via Gemini for psychologist reports."""
    checkin_summary = "\n".join(
        f"- {c['emotion']} ({c['intensity']}/10): {c.get('note', 'Sin nota')}"
        for c in checkins
    )

    prompt = f"""Eres un asistente clínico de la plataforma MindCare.
Genera un resumen semanal para el psicólogo sobre el siguiente paciente:

Paciente: {patient_name}
Check-ins de la semana:
{checkin_summary}
Ejercicios completados: {exercises_count}

Responde en JSON:
{{
  "summary": "Resumen clínico de 3-4 oraciones en español",
  "main_emotions": ["emoción1", "emoción2"],
  "session_recommendations": ["recomendación1", "recomendación2", "recomendación3"]
}}"""

    try:
        response = model.generate_content(prompt)
        import json
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        return json.loads(text)
    except Exception:
        return {
            "summary": f"Resumen pendiente de generación para {patient_name}.",
            "main_emotions": [],
            "session_recommendations": ["Revisar check-ins manualmente"],
        }
