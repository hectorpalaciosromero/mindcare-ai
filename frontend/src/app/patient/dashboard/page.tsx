"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Checkin, PatientDashboard, Exercise, Session } from "@/types";

import { motion, AnimatePresence } from "framer-motion";
import { Flame, SmilePlus, CheckCircle2, CalendarDays, Send, MessageCircle, ArrowLeft, Mic, MicOff, Activity, Dumbbell, Brain, Shield } from "lucide-react";
import Image from "next/image";

const emotions = [
  { id: "happy", name: "Feliz", icon: "/emotions/feliz.png", color: "bg-green-500", gradient: "from-green-400 to-emerald-500" },
  { id: "calm", name: "Tranquilo", icon: "/emotions/tranquilo.png", color: "bg-blue-500", gradient: "from-blue-400 to-cyan-500" },
  { id: "sad", name: "Triste", icon: "/emotions/triste.png", color: "bg-gray-500", gradient: "from-gray-400 to-slate-500" },
  { id: "anxious", name: "Ansioso", icon: "/emotions/ansioso.png", color: "bg-orange-500", gradient: "from-orange-400 to-amber-500" },
  { id: "stressed", name: "Estresado", icon: "/emotions/estresado.png", color: "bg-red-500", gradient: "from-red-400 to-rose-500" },
  { id: "angry", name: "Enojado", icon: "/emotions/enojado.png", color: "bg-purple-500", gradient: "from-purple-400 to-fuchsia-500" },
];

// Maps English DB enum values back to Spanish for display
const EMOTION_LABEL: Record<string, string> = {
  happy: "Feliz", calm: "Tranquilo", sad: "Triste",
  anxious: "Ansioso", stressed: "Estresado", angry: "Enojado",
};

const EXERCISE_TYPE: Record<string, string> = {
  breathing: "Respiración",
  mindfulness: "Mindfulness",
  journaling: "Escritura",
  relaxation: "Relajación",
  meditation: "Meditación",
};

const tabs = [
  { id: "checkin", label: "¿Cómo te sientes?", Icon: MessageCircle },
  { id: "history", label: "Historial Emocional", Icon: Activity },
  { id: "exercises", label: "Ejercicios", Icon: Dumbbell },
  { id: "sessions", label: "Mis Citas", Icon: CalendarDays },
];

function getGreeting(): { text: string; emoji: string } {
  const h = new Date().getHours();
  if (h < 12) return { text: "Buenos días", emoji: "☀️" };
  if (h < 19) return { text: "Buenas tardes", emoji: "🌤️" };
  return { text: "Buenas noches", emoji: "🌙" };
}

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
}

export default function PatientDashboard() {

  const [activeTab, setActiveTab] = useState("checkin");
  const [selectedEmotion, setSelectedEmotion] = useState<number | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [chatMode, setChatMode] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [emotionalContext, setEmotionalContext] = useState<Record<string, unknown> | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [historyData, setHistoryData] = useState<Checkin[]>([]);
  const [dashboardData, setDashboardData] = useState<PatientDashboard | null>(null);
  const [exercisesData, setExercisesData] = useState<Exercise[]>([]);
  const [sessionsData, setSessionsData] = useState<Session[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/proxy/patients/dashboard").then(r => r.json()).then(d => setDashboardData(d)).catch(() => console.error("Error de operaci�n interna."));
    fetch("/api/proxy/patients/exercises").then(r => r.json()).then(d => { if (Array.isArray(d)) setExercisesData(d); }).catch(() => console.error("Error de operaci�n interna."));
  }, []);

  useEffect(() => {
    if (activeTab === "history") {
      fetch("/api/proxy/patients/checkins").then(r => r.json()).then(d => { if (Array.isArray(d)) setHistoryData(d); }).catch(() => console.error("Error de operaci�n interna."));
    } else if (activeTab === "sessions") {
      fetch("/api/proxy/patients/sessions").then(r => r.json()).then(d => { if (Array.isArray(d)) setSessionsData(d); }).catch(() => console.error("Error de operaci�n interna."));
    }
  }, [activeTab]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  // Web Speech API
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = "es-ES";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results).map(r => r[0].transcript).join("");
      setChatInput(transcript);
      if (event.results[0].isFinal) setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, []);

  const toggleVoice = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isListening) { recognitionRef.current.stop(); setIsListening(false); }
    else { setChatInput(""); recognitionRef.current.start(); setIsListening(true); }
  }, [isListening]);

  // Submit check-in → transition to chat
  const handleSubmitCheckin = async () => {
    if (selectedEmotion === null) return;
    setSubmitting(true);
    const emotion = emotions[selectedEmotion];

    try {
      const response = await fetch("/api/proxy/patients/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emotion: emotion.id, intensity, note }),
      });
      const data = await response.json();
      const analysisText = typeof data.ai_analysis === "object" && data.ai_analysis
        ? data.ai_analysis.analysis_text || "Tu estado ha sido registrado."
        : data.ai_analysis || "Tu estado ha sido registrado.";

      // We pass the raw check-in data into the initial chat context. 
      // This prevents the LLM from 'forgetting' the user's current emotion on the very first interaction.
      const ctx = { emotion: emotion.name, intensity, note, aiAnalysis: analysisText };
      setEmotionalContext(ctx);
setChatMode(true);
      setChatLoading(true);

      const chatRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Acabo de registrar que me siento ${emotion.name} con intensidad ${intensity}/10. ${note || ""}`,
          history: [],
          emotionalContext: ctx,
        }),
      });
      const chatData = await chatRes.json();

      setChatMessages([
        { id: "system-1", sender: "bot", text: chatData.reply || analysisText },
      ]);
    } catch {
      setChatMode(true);
      setChatMessages([
        { id: "system-1", sender: "bot", text: "Tu check-in fue registrado. Estoy aquí para conversar contigo sobre cómo te sientes. ¿Quieres contarme más?" },
      ]);
    } finally {
      setSubmitting(false);
      setChatLoading(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), sender: "user", text: chatInput.trim() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.text,
          history: chatMessages.slice(-8).map(m => ({ sender: m.sender, text: m.text })),
          emotionalContext,
        }),
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: "bot", text: data.reply }]);
    } catch {
      setChatMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: "bot", text: "Estoy aquí para ti. ¿Quieres intentar contarme de otra forma?" }]);
    } finally {
      setChatLoading(false);
    }
  };

  const resetCheckin = () => {
    setChatMode(false);
    setChatMessages([]);
    setSelectedEmotion(null);
    setNote("");
    setIntensity(5);
    setEmotionalContext(null);
  };

  return (
    <div>
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {getGreeting().text}, {dashboardData?.first_name || "Bienvenido(a)"} {getGreeting().emoji}
          </h1>
          <p className="text-[var(--text-secondary)] mt-1.5 text-base">Tu bienestar importa. Aquí tienes un resumen de tu progreso.</p>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        {[
          { label: "Racha activa", value: `${dashboardData?.current_streak || 0} ${(dashboardData?.current_streak || 0) === 1 ? 'día' : 'días'}`, desc: "Check-ins consecutivos", icon: Flame, gradient: "from-orange-500 to-amber-500", bg: "bg-orange-50", text: "text-orange-600" },
          { label: "Estado general", value: dashboardData?.general_state || "Neutral", desc: "Basado en tu último check-in", icon: SmilePlus, gradient: "from-emerald-500 to-teal-500", bg: "bg-emerald-50", text: "text-emerald-600" },
          { label: "Ejercicios", value: `${dashboardData?.exercises_completed || 0}`, desc: "Actividades completadas", icon: CheckCircle2, gradient: "from-violet-500 to-purple-500", bg: "bg-violet-50", text: "text-violet-600" },
          { label: "Próxima cita", value: dashboardData?.next_session || "Sin agendar", desc: "Videoconsulta programada", icon: CalendarDays, gradient: "from-blue-500 to-indigo-500", bg: "bg-blue-50", text: "text-blue-600" },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="group relative bg-white rounded-2xl p-5 border border-gray-100/80 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
            {/* Gradient accent bar */}
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${kpi.gradient}`} />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{kpi.label}</span>
              <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <kpi.icon className={`w-5 h-5 ${kpi.text}`} />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-gray-900">{kpi.value}</p>
            <p className="text-xs text-gray-400 mt-1">{kpi.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 inline-flex gap-1 flex-wrap">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all duration-200 ${
              activeTab === tab.id ? "text-white shadow-md" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
            }`}
            style={activeTab === tab.id ? { background: "var(--gradient-primary)" } : {}}>
            <tab.Icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "checkin" && (
          <motion.div key="checkin" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-6">
            {!chatMode ? (
              /* Emotion form */
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#A855F7] flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">¿Cómo te sientes ahora?</h2>
                    <p className="text-sm text-[var(--text-muted)]">Selecciona tu emoción y nuestra IA conversará contigo</p>
                  </div>
                </div>

                {/* Emotion picker */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-8">
                  {emotions.map((e, i) => (
                    <button key={e.name} onClick={() => setSelectedEmotion(i)}
                      className={`relative p-4 rounded-2xl flex flex-col items-center gap-3 transition-all duration-300 ${
                        selectedEmotion === i 
                        ? "bg-white border-2 border-[#7C3AED] shadow-[0_8px_30px_rgb(124,58,237,0.15)] scale-105 z-10" 
                        : "bg-gray-50/80 border-2 border-transparent hover:bg-white hover:border-gray-200 hover:shadow-md"
                      }`}>
                      {selectedEmotion === i && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#7C3AED] rounded-full flex items-center justify-center shadow-sm">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className="w-16 h-16 relative mb-1">
                        <Image src={e.icon} alt={e.name} fill className="object-contain" />
                      </div>
                      <span className={`text-sm font-semibold transition-colors ${
                        selectedEmotion === i ? "text-[#7C3AED]" : "text-gray-500"
                      }`}>{e.name}</span>
                    </button>
                  ))}
                </div>

                {/* Intensity slider */}
                <div className="mb-10 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-bold text-gray-800">Nivel de Intensidad</p>
                    <div className="px-3 py-1 bg-purple-50 text-[#7C3AED] rounded-lg font-bold text-lg">
                      {intensity} <span className="text-xs font-medium text-purple-400">/ 10</span>
                    </div>
                  </div>
                  <div className="relative pt-2">
                    <input type="range" min="1" max="10" value={intensity} onChange={(e) => setIntensity(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-100 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #7C3AED 0%, #a855f7 ${(intensity - 1) * 11.11}%, #f3f4f6 ${(intensity - 1) * 11.11}%, #f3f4f6 100%)`
                      }}
                    />

                    {/* WebKit browsers don't natively support range progress coloring.
                        We dynamically calculate the gradient based on the intensity value 
                        to fake the fill effect without needing a heavy external library. */}
                    <style jsx>{`
                      input[type=range]::-webkit-slider-thumb {
                        appearance: none;
                        width: 20px;
                        height: 20px;
                        border-radius: 50%;
                        background: #fff;
                        border: 3px solid #7C3AED;
                        cursor: pointer;
                        box-shadow: 0 2px 6px rgba(124, 58, 237, 0.3);
                        transition: transform 0.1s;
                      }
                      input[type=range]::-webkit-slider-thumb:hover {
                        transform: scale(1.2);
                      }
                    `}</style>
                  </div>
                  <div className="flex justify-between mt-3 text-xs font-medium text-gray-400">
                    <span>Muy leve</span>
                    <span>Moderado</span>
                    <span>Muy intenso</span>
                  </div>
                </div>

                {/* Note */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Cuéntanos más sobre cómo te sientes</h3>
                  <textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 500))}
                    placeholder="Describe qué está pasando, qué pensamientos tienes, qué situaciones te están afectando..."
                    className="w-full h-32 px-5 py-4 rounded-2xl border-2 border-gray-100 bg-gray-50/50 text-sm resize-none focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all placeholder:text-gray-400" />
                  <p className="text-xs text-[var(--text-muted)] mt-1">{note.length} /500 caracteres</p>
                </div>

                {/* Submit */}
                <button onClick={handleSubmitCheckin} disabled={selectedEmotion === null || submitting}
                  className="group w-full py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_30px_rgb(124,58,237,0.25)] hover:shadow-[0_8px_30px_rgb(124,58,237,0.4)] hover:-translate-y-0.5"
                  style={{ background: selectedEmotion !== null ? "var(--gradient-button)" : "#9ca3af", boxShadow: selectedEmotion === null ? "none" : undefined }}>
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Brain className="w-5 h-5 group-hover:scale-110 transition-transform" /> 
                      Registrar y conversar con IA
                    </>
                  )}
                </button>

                {/* Privacy */}
                <div className="mt-8 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100/50 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-emerald-900">Espacio confidencial protegido</p>
                    <p className="text-xs text-emerald-700/70 mt-1 leading-relaxed">Tu registro emocional está cifrado y solo es accesible para ti y tu psicólogo asignado. Al enviar, nuestra IA clínica iniciará una conversación empática para apoyarte.</p>
                  </div>
                </div>
              </div>
            ) : (
              /* AI chat (post check-in) */
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Chat Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between" style={{ background: "linear-gradient(135deg, #7C3AED08, #A855F708)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#A855F7] flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">MindCare — Tu compañero de bienestar</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {selectedEmotion !== null && (
                          <span className="inline-flex items-center gap-1.5">
                            <Image src={emotions[selectedEmotion].icon} alt="" width={16} height={16} /> 
                            {emotions[selectedEmotion].name} · Intensidad {intensity}/10
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <button onClick={resetCheckin} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-gray-100 rounded-lg transition-all">
                    <ArrowLeft className="w-3.5 h-3.5" /> Nuevo check-in
                  </button>
                </div>

                {/* Chat Messages */}
                <div className="h-[400px] overflow-y-auto p-6 space-y-4">
                  {chatMessages.map((msg) => (
                    <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                      {msg.sender === "bot" && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#A855F7] flex items-center justify-center mr-3 shrink-0 mt-1">
                          <MessageCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-[var(--primary-purple)] text-white rounded-br-md"
                          : "bg-gray-50 border border-gray-100 text-[var(--text-primary)] rounded-bl-md"
                      }`}>
                        {msg.text}
                      </div>
                    </motion.div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#A855F7] flex items-center justify-center mr-3 shrink-0">
                        <MessageCircle className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-md flex gap-1.5">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
                      placeholder={isListening ? "Escuchando..." : "Escribe cómo te sientes..."}
                      className={`flex-1 px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-purple)]/30 ${
                        isListening ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"
                      }`} />
                    <button onClick={sendChatMessage} disabled={!chatInput.trim() || chatLoading}
                      className="w-11 h-11 rounded-xl bg-[var(--primary-purple)] flex items-center justify-center text-white hover:bg-[var(--primary-purple-hover)] transition-colors disabled:opacity-50">
                      <Send className="w-4 h-4" />
                    </button>
                    <button onClick={toggleVoice}
                      className={`w-11 h-11 rounded-xl flex items-center justify-center text-white transition-all ${
                        isListening ? "bg-red-500 hover:bg-red-600 animate-pulse" : "bg-[var(--primary-purple)] hover:bg-[var(--primary-purple-hover)]"
                      }`}>
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "history" && (
          <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-6 space-y-4">
            {historyData.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-[var(--text-secondary)]">
                Aún no tienes check-ins registrados. ¡Anímate a hacer el primero!
              </div>
            ) : (
              historyData.map((e) => {
                const spanishEmotion = EMOTION_LABEL[e.emotion] || e.emotion;
                const emotionConfig = emotions.find(em => em.name === spanishEmotion) || emotions[0];
                const dateObj = new Date(e.created_at);
                const dateStr = dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={e.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 relative shrink-0">
                          <Image src={emotionConfig.icon} alt={spanishEmotion} fill className="object-contain" />
                        </div>
                        <div>
                          <span className="font-bold">{spanishEmotion}</span>
                          <p className="text-xs text-[var(--text-muted)]">{dateStr}</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-[var(--primary-purple)]">{e.intensity}/10</span>
                    </div>
                    {e.note && <p className="text-sm text-[var(--text-secondary)] pl-6 mb-3">{e.note}</p>}
                    {e.ai_analysis && (
                      <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100/50 flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
                          <Brain className="w-3.5 h-3.5 text-purple-600" />
                        </div>
                        <div>
                          <span className="font-semibold text-[var(--primary-purple)] text-xs uppercase tracking-wide block mb-1">Insight Clínico (IA)</span>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {(() => {
                              const rawText = typeof e.ai_analysis === 'object' ? e.ai_analysis.analysis_text : e.ai_analysis;
                              // Translate seed data english enums to spanish for UX
                              return rawText.replace('happy', 'Felicidad').replace('sad', 'Tristeza').replace('anxious', 'Ansiedad').replace('stressed', 'Estrés').replace('calm', 'Calma').replace('angry', 'Enojo');
                            })()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </motion.div>
        )}

        {activeTab === "exercises" && (
          <motion.div key="exercises" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-6 grid sm:grid-cols-2 gap-4">
            {exercisesData.length === 0 ? (
              <div className="col-span-2 text-center py-8 text-[var(--text-muted)]">Cargando ejercicios...</div>
            ) : exercisesData.map((ex) => (
              <div key={ex.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-[var(--primary-purple)] text-xs font-medium">{EXERCISE_TYPE[ex.type] || ex.type}</span>
                  <span className="text-xs text-[var(--text-muted)]">{ex.duration_minutes} min</span>
                </div>
                <h3 className="font-bold mb-1">{ex.title}</h3>
                <p className="text-xs text-[var(--text-muted)] mb-3 leading-relaxed">{ex.description}</p>
                <button
                  onClick={async () => {
                    if (ex.completed) return;
                    await fetch(`/api/proxy/patients/exercises/${ex.id}/complete`, { method: "POST" });
                    setExercisesData(exercisesData.map(e => e.id === ex.id ? { ...e, completed: true } : e));
                    fetch("/api/proxy/patients/dashboard").then(r => r.json()).then(d => setDashboardData(d));
                  }}
                  disabled={ex.completed}
                  className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all ${
                    ex.completed ? "bg-green-50 text-green-700 border border-green-200" : "text-white hover:shadow-purple"
                  }`} style={!ex.completed ? { background: "var(--gradient-primary)" } : {}}>
                  {ex.completed ? "✓ Completado" : "Comenzar"}
                </button>
              </div>
            ))}
          </motion.div>
        )}
        {activeTab === "sessions" && (
          <motion.div key="sessions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-6 space-y-4">
            {sessionsData.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-[var(--text-muted)]">
                No tienes citas programadas en este momento.
              </div>
            ) : (
              sessionsData.map((s) => {
                const sessionDate = new Date(s.scheduled_at);
                const now = new Date();
                const isPast = sessionDate < now;
                const diffMs = sessionDate.getTime() - now.getTime();
                const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

                let relativeLabel = '';
                if (s.status === 'completed') relativeLabel = '';
                else if (s.status === 'cancelled') relativeLabel = '';
                else if (diffDays < 0) relativeLabel = `Hace ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'día' : 'días'}`;
                else if (diffDays === 0) relativeLabel = 'Hoy';
                else if (diffDays === 1) relativeLabel = 'Mañana';
                else relativeLabel = `En ${diffDays} días`;

                const statusLabel: Record<string, string> = { scheduled: "Programada", completed: "Completada", cancelled: "Cancelada" };
                let badgeColor = "bg-blue-100 text-blue-700";
                if (s.status === 'completed') badgeColor = "bg-green-100 text-green-700";
                else if (s.status === 'cancelled') badgeColor = "bg-gray-100 text-gray-500";
                else if (diffDays < 0 || diffDays === 0) badgeColor = "bg-red-100 text-red-700";
                else if (diffDays === 1) badgeColor = "bg-amber-100 text-amber-700";
                else if (diffDays <= 3) badgeColor = "bg-blue-100 text-blue-700";
                else badgeColor = "bg-green-100 text-green-700";

                return (
                  <div key={s.id} className={`bg-white rounded-xl border shadow-sm p-6 ${isPast && s.status === "scheduled" ? "border-orange-200" : "border-gray-100"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${diffDays === 0 ? 'bg-red-100' : diffDays === 1 ? 'bg-amber-100' : 'bg-indigo-100'}`}>
                          <CalendarDays className={`w-6 h-6 ${diffDays === 0 ? 'text-red-600' : diffDays === 1 ? 'text-amber-600' : 'text-indigo-600'}`} />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{s.psychologist_name || "Tu Psicólogo"}</h3>
                          <p className="text-sm text-[var(--text-secondary)] mt-1">
                            {sessionDate.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })} a las {sessionDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          {relativeLabel && (
                            <span className="text-sm font-medium text-[var(--text-muted)]">{relativeLabel}</span>
                          )}
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
                            {statusLabel[s.status] || s.status}
                          </span>
                        </div>
                        {s.status === 'scheduled' && !isPast && (
                          <div className="flex items-center gap-2 mt-1">
                            {s.meeting_url ? (
                              <a href={s.meeting_url} target="_blank" rel="noopener noreferrer"
                                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                                Ingresar a videoconsulta
                              </a>
                            ) : (
                              <span className="text-sm text-gray-400 flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                                Enlace pendiente
                              </span>
                            )}
                            <button
                              onClick={async () => {
                                if (!confirm("\u00bfEst\u00e1s seguro de que deseas cancelar esta cita?")) return;
                                const res = await fetch(`/api/proxy/patients/sessions/${s.id}/cancel`, { method: "PATCH" });
                                if (res.ok) {
                                  setSessionsData(sessionsData.map(sess => sess.id === s.id ? { ...sess, status: "cancelled" as const } : sess));
                                }
                              }}
                              className="text-sm font-semibold text-red-600 hover:text-red-700 flex items-center gap-1.5 bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Cancelar cita
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

