"use client";

import { use, useEffect, useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import type { PatientDetail, Checkin, WeeklyEvolution, WeeklyReport } from "@/types";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, CheckCircle2, Activity, Check, X, FileText, Download
} from "lucide-react";
import Image from "next/image";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";

const STATUS_LABELS: Record<string, string> = {
  stable: "Estable",
  needs_attention: "Necesita atención",
  improving: "Mejorando",
  critical: "Crítico",
};

const EMOTION_LABELS: Record<string, string> = {
  happy: "Feliz", calm: "Tranquilo", sad: "Triste",
  anxious: "Ansioso", stressed: "Estresado", angry: "Enojado",
};

const EMOTION_ICONS: Record<string, string> = {
  happy: "/emotions/feliz.png", calm: "/emotions/tranquilo.png", sad: "/emotions/triste.png",
  anxious: "/emotions/ansioso.png", stressed: "/emotions/estresado.png", angry: "/emotions/enojado.png",
};

function getBarColor(score: number) {
  if (score >= 7) return "#22C55E";
  if (score >= 5) return "#F59E0B";
  return "#EF4444";
}

export default function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [evolution, setEvolution] = useState<WeeklyEvolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<WeeklyReport | null>(null);

  const reportRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `MindCare_Informe_${patient?.name || 'Paciente'}`,
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/proxy/psychologists/patients/${id}`).then(r => r.json()),
      fetch(`/api/proxy/psychologists/patients/${id}/checkins`).then(r => r.json()),
      fetch(`/api/proxy/psychologists/patients/${id}/evolution`).then(r => r.json())
    ]).then(([patData, chks, evo]) => {
      setPatient(patData);
      if (Array.isArray(chks)) setCheckins(chks);
      if (Array.isArray(evo)) setEvolution(evo);
    }).catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="p-10 text-center text-[var(--text-muted)]">Cargando datos del paciente...</div>;
  }

  if (!patient || patient.error) {
    return <div className="p-10 text-center text-red-500">Error: No se encontró al paciente.</div>;
  }

  const initials = patient.name ? patient.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2) : "??";
  const isRisk = patient.avg_emotional_state < 5;
  const statusColor = isRisk ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700";
  const enrollDateStr = new Date(patient.enrollment_date).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });

  // Generate recommendations from actual check-in data
  const recentEmotions = checkins.slice(0, 5).map((c: Checkin) => EMOTION_LABELS[c.emotion as string] || c.emotion);
  const avgIntensity = checkins.length > 0 ? checkins.reduce((sum: number, c: Checkin) => sum + (c.intensity as number), 0) / checkins.length : 0;
  
  const recommendations: string[] = [];
  if (recentEmotions.includes("Ansioso") || recentEmotions.includes("Estresado")) {
    recommendations.push("Evaluar nivel de carga académica y posibles factores de estrés");
    recommendations.push("Introducir técnicas de regulación emocional (respiración 4-7-8, grounding)");
  }
  if (recentEmotions.includes("Triste")) {
    recommendations.push("Explorar red de apoyo social del paciente");
    recommendations.push("Considerar evaluación de estado de ánimo prolongado");
  }
  if (avgIntensity >= 7) {
    recommendations.push("Priorizar seguimiento cercano — intensidad promedio elevada");
  }
  if (recentEmotions.includes("Feliz") || recentEmotions.includes("Tranquilo")) {
    recommendations.push("Reforzar hábitos positivos y rutinas de bienestar actuales");
  }
  if (checkins.length === 0) {
    recommendations.push("Incentivar al paciente a retomar check-ins regulares");
  }
  if (recommendations.length === 0) {
    recommendations.push("Mantener frecuencia de sesiones actual", "Revisar progreso de ejercicios asignados");
  }

  return (
    <>
    <div>
      {/* Breadcrumb */}
      <Link href="/psychologist/dashboard" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--primary-purple)] mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Volver a la lista
      </Link>

      {/* Patient header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#A855F7] flex items-center justify-center text-white text-xl font-bold">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{patient.name}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-muted)] mt-1">
                <span>👤 {patient.age || "?"} años</span>
                <span>✉️ {patient.email}</span>
                <span>📞 {patient.phone || "Sin teléfono"}</span>
              </div>
            </div>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${statusColor}`}>{STATUS_LABELS[patient.status] || patient.status}</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Fecha de ingreso", value: enrollDateStr },
            { label: "Estado promedio", value: `${patient.avg_emotional_state || 0}/10`, extra: isRisk ? "↓" : "↑", extraColor: isRisk ? "text-red-500" : "text-green-500" },
            { label: "Check-ins totales", value: patient.total_checkins?.toString() || "0" },
            { label: "Sesiones realizadas", value: patient.total_sessions?.toString() || "0" },
          ].map((s) => (
            <div key={s.label} className="p-3 rounded-xl bg-gray-50">
              <p className="text-xs text-[var(--text-muted)]">{s.label}</p>
              <p className="text-lg font-bold mt-1">
                {s.value} {s.extra && <span className={s.extraColor}>{s.extra}</span>}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Weekly Evolution Chart */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold mb-6">Evolución semanal</h2>
        <div className="h-64 mt-4">
          {evolution.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] mx-auto self-center flex h-full items-center justify-center">Sin datos de evolución</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={evolution} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: "var(--text-muted)", fontWeight: 500 }} 
                  dy={10}
                />
                <YAxis 
                  domain={[0, 10]} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: "var(--text-muted)", fontWeight: 500 }} 
                  ticks={[0, 2, 4, 6, 8, 10]}
                />
                <Tooltip 
                  cursor={{ fill: "var(--bg-secondary)", opacity: 0.4 }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const val = payload[0].value;
                      return (
                        <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100">
                          <p className="font-bold mb-1">{label}</p>
                          <p className="text-sm">Estado: <span className="font-bold">{val}/10</span></p>
                        </div>
                      );
                    }
                    if (active) {
                       return (
                        <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100">
                          <p className="font-bold mb-1">{label}</p>
                          <p className="text-sm text-gray-400 font-medium">Sin datos registrados</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="score" 
                  radius={[6, 6, 0, 0] as [number, number, number, number]} 
                  maxBarSize={40}
                >
                  {evolution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.score === null || entry.score === undefined ? 'transparent' : getBarColor(entry.score)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* Patient Entries */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold mb-6">Entradas recientes del paciente</h2>
        <div className="space-y-6">
          {checkins.length === 0 ? <p className="text-sm text-[var(--text-muted)]">Sin entradas recientes.</p> : checkins.map((e, i) => {
            const dateStr = new Date(e.created_at).toLocaleDateString("es-ES", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
            return (
              <div key={e.id || i} className="border border-gray-100 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {EMOTION_ICONS[e.emotion] ? (
                      <div className="w-10 h-10 relative shrink-0">
                        <Image src={EMOTION_ICONS[e.emotion]} alt={EMOTION_LABELS[e.emotion]} fill className="object-contain" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-100" />
                    )}
                    <div>
                      <h3 className="font-bold">{EMOTION_LABELS[e.emotion] || e.emotion}</h3>
                      <p className="text-xs text-[var(--text-muted)]">{dateStr}</p>
                    </div>
                  </div>
                  <span className={`text-2xl font-bold ${e.intensity >= 7 ? "text-green-500" : "text-red-500"}`}>{e.intensity}/10</span>
                </div>
                {e.note && (
                  <div className="p-3 rounded-lg bg-gray-50 mb-3">
                    <p className="text-xs font-semibold text-[var(--text-muted)] mb-1">Nota del paciente:</p>
                    <p className="text-sm text-[var(--text-secondary)]">{e.note}</p>
                  </div>
                )}
                {e.ai_analysis && (
                  <div className="p-3 rounded-lg bg-purple-50 border border-purple-100">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-5 h-5 rounded bg-[var(--primary-purple)] flex items-center justify-center">
                        <Activity className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs font-semibold">Análisis de la IA:</span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">{typeof e.ai_analysis === 'object' ? e.ai_analysis?.analysis_text || JSON.stringify(e.ai_analysis) : e.ai_analysis}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Session Recommendations */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="rounded-2xl p-6 text-white" style={{ background: "var(--gradient-primary)" }}>
        <h2 className="text-xl font-bold mb-4">Recomendaciones para la próxima sesión</h2>
        <div className="space-y-3">
          {recommendations.map((r) => (
            <div key={r} className="flex items-start gap-2.5">
              <Check className="w-5 h-5 text-white shrink-0 mt-0.5" />
              <p className="text-white/90 text-sm">{r}</p>
            </div>
          ))}
        </div>
        <button
          onClick={async () => {
            if (isGenerating) return;
            setIsGenerating(true);
            try {
              const res = await fetch(`/api/proxy/psychologists/patients/${id}/generate-report`, { method: 'POST' });
              const result = await res.json();
              if (res.ok) {
                setGeneratedReport(result);
              } else {
                alert(result.detail || 'Error al generar el reporte');
              }
            } catch {
              alert('Error de conexión al generar el reporte');
            } finally {
              setIsGenerating(false);
            }
          }}
          disabled={isGenerating}
          className={`mt-4 w-full py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-sm transition-all backdrop-blur-sm border border-white/20 flex items-center justify-center gap-2 ${isGenerating ? 'opacity-70 cursor-wait' : ''}`}>
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generando reporte...
            </>
          ) : (
            <>📊 Generar Reporte Semanal con IA</>
          )}
        </button>
      </motion.div>
    </div>

      {/* AI Report Modal Overlay */}
      <AnimatePresence>
        {generatedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setGeneratedReport(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            {/* Modal Content */}
            <motion.div
              ref={reportRef}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10 print:static print:bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center print:bg-gray-100">
                    <FileText className="w-5 h-5 text-[var(--primary-purple)] print:text-gray-800" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Reporte IA Semanal</h2>
                    <p className="text-sm text-gray-500">Paciente: {generatedReport.patient_name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setGeneratedReport(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors print:hidden"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto custom-scrollbar print:overflow-visible">
                
                {/* Metrics summary */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Período</p>
                    <p className="text-sm font-medium">
                      {new Date(generatedReport.week_start).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - {new Date(generatedReport.week_end).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Estado Promedio</p>
                    <p className={`text-lg font-bold ${generatedReport.avg_state >= 7 ? 'text-green-600' : 'text-orange-600'}`}>
                      {generatedReport.avg_state.toFixed(1)}/10
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Actividad</p>
                    <p className="text-sm font-medium">{generatedReport.checkins_count} registros</p>
                  </div>
                </div>

                {/* Analysis Section */}
                <div className="mb-8">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">
                    <Activity className="w-5 h-5 text-indigo-500" />
                    Análisis Clínico y Progreso
                  </h3>
                  <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                    {generatedReport.ai_summary?.split('\n').map((paragraph: string, i: number) => (
                      paragraph.trim() ? <p key={i} className="mb-3">{paragraph}</p> : null
                    ))}
                  </div>
                </div>

                {/* Recommendations Section */}
                {generatedReport.session_recommendations && generatedReport.session_recommendations.length > 0 && (
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      Plan de Acción Recomendado
                    </h3>
                    <ul className="space-y-3">
                      {generatedReport.session_recommendations.map((rec: string, idx: number) => (
                        <li key={idx} className="flex gap-3 text-gray-700 bg-green-50/50 p-3 rounded-lg border border-green-100/50">
                          <span className="text-green-500 mt-0.5 font-bold">•</span>
                          <span className="text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 print:hidden">
                <button
                  onClick={handlePrint}
                  className="px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Descargar PDF
                </button>
                <button
                  onClick={() => setGeneratedReport(null)}
                  className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
