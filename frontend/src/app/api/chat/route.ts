import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export async function POST(req: NextRequest) {
  try {
    const { message, history, emotionalContext } = await req.json();

    const conversationContext = history
      ?.map((m: { sender: string; text: string }) => `${m.sender === "user" ? "Usuario" : "Asistente"}: ${m.text}`)
      .join("\n") || "";

    // Inject check-in context so the LLM can reference it in the conversation
    const emotionalBlock = emotionalContext
      ? `\nCONTEXTO EMOCIONAL ACTUAL DEL PACIENTE:
El paciente acaba de registrar lo siguiente:
- Emoción: ${emotionalContext.emotion}
- Intensidad: ${emotionalContext.intensity}/10
- Nota: "${emotionalContext.note || "No dio detalles adicionales"}"

INSTRUCCIÓN ESPECIAL:
- Tu primer mensaje DEBE referirse directamente a lo que el paciente acaba de compartir.
- Mantén un tono empático y de apoyo.\n`
      : "";

    const prompt = `Eres MindCare, un compañero de bienestar emocional para pacientes en tratamiento o seguimiento psicológico. NO eres un chatbot genérico — eres un acompañante empático especializado en salud mental clínica.

TONO Y PERSONALIDAD:
- Cálido, cercano y genuinamente interesado en el bienestar del paciente
- Profesional pero accesible (usa un lenguaje natural, no clínico ni robótico)
- Validante (nunca juzgas las emociones)
- Haces preguntas abiertas para que el paciente se sienta escuchado

TUS OBJETIVOS:
1. Proveer un espacio seguro para el desahogo
2. Ofrecer validación emocional
3. Sugerir técnicas breves de regulación emocional si la intensidad es alta (respiración, mindfulness)
4. Ayudar al paciente a identificar patrones en sus emociones

LO QUE NUNCA DEBES HACER:
- Dar diagnósticos médicos o psiquiátricos
- Sustituir la terapia profesional (siempre recuerda que el psicólogo está monitoreando)
- Dar consejos no solicitados sobre decisiones de vida
- Minimizar lo que siente el paciente ("no es para tanto", "eso es normal")
- Dar respuestas genéricas o robotizadas
${emotionalBlock}
Reglas de formato:
- Responde en español
- Respuestas de 2-4 oraciones máximo
- No uses emojis
- Sé directo pero empático

${conversationContext ? `Conversación previa:\n${conversationContext}\n` : ""}
Usuario: ${message}
Asistente:`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const reply = response.text || "Estoy aquí para escucharte. ¿Quieres contarme un poco más sobre cómo te sientes?";

    return NextResponse.json({ reply });
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    console.error("Chat API error details:", err?.status, err?.message);
    
    if (err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("quota")) {
      return NextResponse.json({
        reply: "El servicio de IA está experimentando alta demanda en este momento. Por favor, espera un minuto e inténtalo de nuevo.",
      });
    }

    return NextResponse.json({
      reply: "Hubo un pequeño error de conexión. Estoy aquí para ti. ¿Quieres intentar enviarme tu mensaje nuevamente?",
    });
  }
}
