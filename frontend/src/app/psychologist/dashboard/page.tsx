"use client";

import { useState, useEffect } from "react";
import type { PsychologistDashboard, PatientSummary, WeeklyReport, AIAlert, Session } from "@/types";
import Link from "next/link";

import { motion, AnimatePresence } from "framer-motion";
import {
  Users, AlertTriangle, CalendarDays, TrendingUp,
  Search, Filter, ArrowUpRight, ArrowDownRight, Minus,
  FileText, Download, CheckCircle2, Heart, BarChart3, Activity
} from "lucide-react";
import Image from "next/image";
import { jsPDF } from "jspdf";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";

const STATUS_LABELS: Record<string, string> = {
  stable: "Estable",
  needs_attention: "Necesita atención",
  improving: "Mejorando",
  critical: "Crítico",
};

const EMOTION_LABELS: Record<string, string> = {
  happy: "Feliz", calm: "Tranquilo", sad: "Triste",
  anxious: "Ansioso", stressed: "Estresado", angry: "Enojado",
  neutral: "Neutral", excited: "Entusiasmado", tired: "Cansado",
  frustrated: "Frustrado", hopeful: "Esperanzado", lonely: "Solo",
};

const EMOTION_ICONS: Record<string, string> = {
  happy: "/emotions/feliz.png", calm: "/emotions/tranquilo.png", sad: "/emotions/triste.png",
  anxious: "/emotions/ansioso.png", stressed: "/emotions/estresado.png", angry: "/emotions/enojado.png",
};

export default function PsychologistDashboard() {

  const [activeTab, setActiveTab] = useState<"patients" | "reports" | "alerts" | "sessions" | "analytics">("patients");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [dashboardData, setDashboardData] = useState<PsychologistDashboard | null>(null);
  const [patientsData, setPatientsData] = useState<PatientSummary[]>([]);
  const [reportsData, setReportsData] = useState<WeeklyReport[]>([]);
  const [alertsData, setAlertsData] = useState<AIAlert[]>([]);
  const [sessionsData, setSessionsData] = useState<Session[]>([]);
  const [trendData, setTrendData] = useState<{day: string, score: number | null}[]>([]);
  const [emotionsData, setEmotionsData] = useState<{emotion: string, count: number}[]>([]);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ patient_id: "", scheduled_at: "", notes: "", meeting_url: "" });

  useEffect(() => {
    Promise.all([
      fetch("/api/proxy/psychologists/dashboard").then(r => r.json()),
      fetch("/api/proxy/psychologists/patients").then(r => r.json()),
      fetch("/api/proxy/psychologists/reports").then(r => r.json()),
      fetch("/api/proxy/psychologists/alerts").then(r => r.json()),
      fetch("/api/proxy/psychologists/sessions").then(r => r.json()),
      fetch("/api/proxy/psychologists/analytics/trend").then(r => r.json()),
      fetch("/api/proxy/psychologists/analytics/emotions").then(r => r.json()),
    ]).then(([dash, pats, reps, alts, sess, trend, emotions]) => {
      setDashboardData(dash);
      if (Array.isArray(pats)) setPatientsData(pats);
      if (Array.isArray(reps)) setReportsData(reps);
      if (Array.isArray(alts)) setAlertsData(alts);
      if (Array.isArray(sess)) setSessionsData(sess);
      if (Array.isArray(trend)) setTrendData(trend);
      if (Array.isArray(emotions)) setEmotionsData(emotions);
    }).catch(err => console.error("Error loading dashboard data:", err));

    // Poll alerts every 30s so the psychologist sees new crises without refreshing
    const alertPolling = setInterval(() => {
      fetch("/api/proxy/psychologists/alerts")
        .then(r => r.json())
        .then(alts => {
          if (Array.isArray(alts)) {
            setAlertsData(prev => {
              if (JSON.stringify(prev) !== JSON.stringify(alts)) return alts;
              return prev;
            });
          }
        })
        .catch(err => console.error("Error polling alerts:", err));
        
      fetch("/api/proxy/psychologists/dashboard")
        .then(r => r.json())
        .then(dash => setDashboardData(dash))
        .catch(err => console.error("Error polling dashboard:", err));
    }, 30000);

    return () => clearInterval(alertPolling);
  }, []);

  const filteredPatients = patientsData.filter((p) => {
    const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const improvementVal = dashboardData?.avg_improvement || 0;
  const dynamicKpis = [
    { label: "Pacientes activos", value: dashboardData?.active_patients || 0, desc: "Bajo tu supervisión clínica", icon: Users, gradient: "from-blue-500 to-indigo-500", bg: "bg-blue-50", text: "text-blue-600" },
    { label: "Alertas pendientes", value: dashboardData?.pending_alerts || 0, desc: "Requieren atención inmediata", icon: AlertTriangle, gradient: "from-red-500 to-rose-500", bg: "bg-red-50", text: "text-red-600" },
    { label: "Sesiones esta semana", value: dashboardData?.sessions_this_week || 0, desc: "Videoconsultas programadas", icon: CalendarDays, gradient: "from-violet-500 to-purple-500", bg: "bg-violet-50", text: "text-violet-600" },
    { label: "Mejora promedio", value: `${improvementVal >= 0 ? '+' : ''}${improvementVal}%`, desc: "Tendencia general del grupo", icon: TrendingUp, gradient: improvementVal >= 0 ? "from-emerald-500 to-teal-500" : "from-red-500 to-rose-500", bg: improvementVal >= 0 ? "bg-emerald-50" : "bg-red-50", text: improvementVal >= 0 ? "text-emerald-600" : "text-red-600" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-extrabold tracking-tight">Panel Profesional</h1>
          <p className="text-[var(--text-secondary)] mt-1.5 text-base">Gestiona y monitorea el bienestar emocional de tus pacientes</p>
        </motion.div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        {dynamicKpis.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="group relative bg-white rounded-2xl p-5 border border-gray-100/80 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
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
      <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2">
        <button onClick={() => setActiveTab("patients")}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all shrink-0 ${
            activeTab === "patients" ? "text-white shadow-md" : "text-[var(--text-secondary)] hover:bg-gray-100"
          }`} style={activeTab === "patients" ? { background: "var(--gradient-primary)" } : {}}>
          <Users className="w-4 h-4" /> Mis Pacientes
        </button>
        <button onClick={() => setActiveTab("analytics")}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all shrink-0 ${
            activeTab === "analytics" ? "text-white shadow-md" : "text-[var(--text-secondary)] hover:bg-gray-100"
          }`} style={activeTab === "analytics" ? { background: "var(--gradient-primary)" } : {}}>
          <BarChart3 className="w-4 h-4" /> Analíticas
        </button>
        <button onClick={() => setActiveTab("reports")}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
            activeTab === "reports" ? "text-white shadow-md" : "text-[var(--text-secondary)] hover:bg-gray-100"
          }`} style={activeTab === "reports" ? { background: "var(--gradient-primary)" } : {}}>
          <FileText className="w-4 h-4" /> Informes Semanales
        </button>
        <button onClick={() => setActiveTab("alerts")}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
            activeTab === "alerts" ? "text-white shadow-md" : "text-[var(--text-secondary)] hover:bg-gray-100"
          }`} style={activeTab === "alerts" ? { background: "var(--gradient-primary)" } : {}}>
          <AlertTriangle className="w-4 h-4" /> Alertas {alertsData.filter(a => !a.acknowledged).length > 0 && (
            <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">{alertsData.filter(a => !a.acknowledged).length}</span>
          )}
        </button>
        <button onClick={() => setActiveTab("sessions")}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
            activeTab === "sessions" ? "text-white shadow-md" : "text-[var(--text-secondary)] hover:bg-gray-100"
          }`} style={activeTab === "sessions" ? { background: "var(--gradient-primary)" } : {}}>
          <CalendarDays className="w-4 h-4" /> Sesiones
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "patients" && (
          <motion.div key="patients" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* Alert banner */}
            {(dashboardData?.pending_alerts || 0) > 0 && (
              <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="font-bold text-sm">Alertas de alta prioridad</p>
                  <p className="text-sm text-[var(--text-secondary)]">{dashboardData?.pending_alerts || 0} paciente(s) requieren atención. Revisa sus perfiles.</p>
                </div>
              </div>
            )}

            {/* Search & Filter */}
            <div className="mt-6 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Lista de pacientes</h2>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input type="text" placeholder="Buscar paciente..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-[var(--primary-purple)]/30" />
                  </div>
                  <button 
                    onClick={() => setStatusFilter(statusFilter === 'all' ? 'needs_attention' : statusFilter === 'needs_attention' ? 'stable' : statusFilter === 'stable' ? 'improving' : 'all')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${statusFilter !== 'all' ? 'border-[var(--primary-purple)] bg-purple-50 text-[var(--primary-purple)]' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <Filter className="w-4 h-4" /> {statusFilter === 'all' ? 'Filtrar' : STATUS_LABELS[statusFilter] || statusFilter}
                  </button>
                </div>
              </div>

              {/* Patient cards grid */}
              <div className="grid md:grid-cols-2 gap-4">
                {filteredPatients.length === 0 ? (
                  <p className="text-[var(--text-muted)] col-span-2 text-center py-8">No se encontraron pacientes.</p>
                ) : filteredPatients.map((p) => {
                  const initials = p.name ? p.name.split(" ").map((n: string) => n[0]).join("").substring(0,2) : "??";
                  const score = p.avg_emotional_state || 0;
                  const isRisk = score < 5;
                  
                  const statusConfig: Record<string, { badge: string; border: string; avatarGradient: string }> = {
                    needs_attention: { badge: "bg-red-50 text-red-700 border border-red-200", border: "border-l-red-500", avatarGradient: "from-red-500 to-rose-500" },
                    improving: { badge: "bg-emerald-50 text-emerald-700 border border-emerald-200", border: "border-l-emerald-500", avatarGradient: "from-emerald-500 to-teal-500" },
                    stable: { badge: "bg-blue-50 text-blue-700 border border-blue-200", border: "border-l-blue-500", avatarGradient: "from-blue-500 to-indigo-500" },
                    critical: { badge: "bg-red-50 text-red-700 border border-red-200", border: "border-l-red-600", avatarGradient: "from-red-600 to-rose-600" },
                  };
                  const config = statusConfig[p.status] || statusConfig.stable;
                  
                  let lastCheckinStr = "Sin registros";
                  if (p.last_checkin_at) {
                    const date = new Date(p.last_checkin_at);
                    lastCheckinStr = date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
                  }

                  return (
                    <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className={`group relative border border-gray-100 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 bg-white border-l-4 ${config.border} overflow-hidden`}>
                      {isRisk && <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.avatarGradient} flex items-center justify-center text-white text-sm font-bold shadow-sm`}>
                            {initials}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">{p.name}</h3>
                            <p className="text-xs text-gray-400">{p.age} años</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.badge}`}>{STATUS_LABELS[p.status] || p.status}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Estado promedio</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-xl font-extrabold text-gray-900">{score}</span>
                            {score >= 7 ? <ArrowUpRight className="w-4 h-4 text-emerald-500" /> : score >= 5 ? <Minus className="w-4 h-4 text-amber-500" /> : <ArrowDownRight className="w-4 h-4 text-red-500" />}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Último check-in</p>
                          <p className="text-sm font-semibold mt-1.5 text-gray-700">{lastCheckinStr}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Activity className="w-3.5 h-3.5" /> {p.total_checkins} check-ins registrados
                        </div>
                        <Link href={`/psychologist/patients/${p.id}`}
                          className="text-sm font-bold text-[var(--primary-purple)] hover:text-purple-700 group-hover:underline flex items-center gap-1">
                          Ver detalles <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "reports" && (
          <motion.div key="reports" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-6">
            {/* Reports header */}
            <div className="rounded-2xl p-6 text-white mb-6" style={{ background: "var(--gradient-primary)" }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold">Informes semanales generados por IA</h2>
              </div>
              <p className="text-white/80 text-sm">Resúmenes automáticos del estado emocional de tus pacientes durante la semana.</p>
            </div>

            {/* Report cards */}
            <div className="space-y-6">
              {reportsData.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-[var(--text-muted)]">
                  No hay reportes semanales generados aún.
                </div>
              ) : reportsData.map((r) => {
                const dateEnd = new Date(r.week_end).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                
                return (
                  <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold">{r.patient_name}</h3>
                        <p className="text-sm text-[var(--text-muted)]">Semana terminada el {dateEnd}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[var(--text-muted)]">Estado promedio</p>
                        <div className="flex items-center gap-1 justify-end">
                          <span className={`text-2xl font-bold ${r.avg_state >= 7 ? "text-emerald-600" : r.avg_state >= 5 ? "text-amber-500" : "text-red-600"}`}>{r.avg_state}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-[var(--text-muted)]">Check-ins realizados</p>
                          <p className="font-bold">{r.checkins_count}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                          <Heart className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xs text-[var(--text-muted)]">Ejercicios completados</p>
                          <p className="font-bold">{r.exercises_count}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-semibold mb-2">Emociones principales:</p>
                      <div className="flex gap-2 flex-wrap">
                        {(r.main_emotions || []).map((e: string, idx: number) => (
                          <span key={idx} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-[var(--primary-purple)] text-xs font-medium">
                            {EMOTION_ICONS[e] && (
                              <div className="w-4 h-4 relative shrink-0">
                                <Image src={EMOTION_ICONS[e]} alt="" fill className="object-contain" />
                              </div>
                            )}
                            {EMOTION_LABELS[e] || e}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-purple-50 border border-purple-100 mb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-lg bg-[var(--primary-purple)] flex items-center justify-center">
                          <FileText className="w-3 h-3 text-white" />
                        </div>
                        <span className="font-semibold text-sm">Resumen de la IA:</span>
                      </div>
                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{r.ai_summary}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => {
                          const doc = new jsPDF();
                          const pageWidth = doc.internal.pageSize.getWidth();
                          const margin = 20;
                          const maxWidth = pageWidth - margin * 2;
                          let y = 20;

                          doc.setFillColor(109, 40, 217);
                          doc.rect(0, 0, pageWidth, 40, 'F');
                          doc.setTextColor(255, 255, 255);
                          doc.setFontSize(20);
                          doc.setFont('helvetica', 'bold');
                          doc.text('MindCare', margin, 18);
                          doc.setFontSize(11);
                          doc.setFont('helvetica', 'normal');
                          doc.text('Informe Semanal del Paciente', margin, 28);
                          doc.setFontSize(9);
                          doc.text(`Generado: ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`, margin, 35);

                          y = 55;
                          doc.setTextColor(30, 30, 30);

                          doc.setFontSize(16);
                          doc.setFont('helvetica', 'bold');
                          doc.text(r.patient_name, margin, y);
                          y += 8;
                          doc.setFontSize(10);
                          doc.setFont('helvetica', 'normal');
                          doc.setTextColor(100, 100, 100);
                          doc.text(`Periodo: ${r.week_start} - ${r.week_end}`, margin, y);
                          y += 12;

                          doc.setDrawColor(230, 230, 230);
                          doc.setFillColor(249, 250, 251);
                          doc.roundedRect(margin, y, maxWidth, 22, 3, 3, 'FD');
                          doc.setTextColor(30, 30, 30);
                          doc.setFontSize(9);
                          doc.setFont('helvetica', 'bold');
                          const col = maxWidth / 3;
                          doc.text('Estado Promedio', margin + 5, y + 8);
                          doc.text('Check-ins', margin + col + 5, y + 8);
                          doc.text('Ejercicios', margin + col * 2 + 5, y + 8);
                          doc.setFont('helvetica', 'normal');
                          doc.setFontSize(11);
                          const avgColor = r.avg_state >= 7 ? [16, 185, 129] : r.avg_state >= 5 ? [245, 158, 11] : [239, 68, 68];
                          doc.setTextColor(avgColor[0], avgColor[1], avgColor[2]);
                          doc.text(`${r.avg_state}/10`, margin + 5, y + 17);
                          doc.setTextColor(30, 30, 30);
                          doc.text(`${r.checkins_count}`, margin + col + 5, y + 17);
                          doc.text(`${r.exercises_count}`, margin + col * 2 + 5, y + 17);
                          y += 28;

                          const translatedEmotions = (r.main_emotions || []).map((e: string) => EMOTION_LABELS[e] || e).join(', ');
                          doc.setFontSize(9);
                          doc.setFont('helvetica', 'bold');
                          doc.text('Emociones principales: ', margin, y);
                          doc.setFont('helvetica', 'normal');
                          doc.text(translatedEmotions || '-', margin + 42, y);
                          y += 12;

                          doc.setFontSize(13);
                          doc.setFont('helvetica', 'bold');
                          doc.setTextColor(30, 30, 30);
                          doc.text('Analisis Clinico (IA)', margin, y);
                          y += 3;
                          doc.setDrawColor(109, 40, 217);
                          doc.setLineWidth(0.8);
                          doc.line(margin, y, margin + 45, y);
                          y += 8;
                          doc.setFontSize(10);
                          doc.setFont('helvetica', 'normal');
                          doc.setTextColor(60, 60, 60);
                          const summaryLines = doc.splitTextToSize(r.ai_summary || '', maxWidth);
                          doc.text(summaryLines, margin, y);
                          y += summaryLines.length * 5 + 10;

                          if (r.session_recommendations && r.session_recommendations.length > 0) {
                            if (y > 240) { doc.addPage(); y = 20; }
                            doc.setFontSize(13);
                            doc.setFont('helvetica', 'bold');
                            doc.setTextColor(30, 30, 30);
                            doc.text('Recomendaciones para Sesion', margin, y);
                            y += 3;
                            doc.setDrawColor(34, 197, 94);
                            doc.setLineWidth(0.8);
                            doc.line(margin, y, margin + 55, y);
                            y += 8;
                            doc.setFontSize(10);
                            doc.setFont('helvetica', 'normal');
                            doc.setTextColor(60, 60, 60);
                            r.session_recommendations.forEach((rec: string, idx: number) => {
                              if (y > 270) { doc.addPage(); y = 20; }
                              const recLines = doc.splitTextToSize(`${idx + 1}. ${rec}`, maxWidth - 5);
                              doc.text(recLines, margin + 5, y);
                              y += recLines.length * 5 + 4;
                            });
                          }

                          const pageH = doc.internal.pageSize.getHeight();
                          doc.setDrawColor(230, 230, 230);
                          doc.line(margin, pageH - 15, pageWidth - margin, pageH - 15);
                          doc.setFontSize(8);
                          doc.setTextColor(160, 160, 160);
                          doc.text('MindCare - Documento generado automaticamente. Confidencial.', margin, pageH - 8);
                          doc.text(`Pagina 1`, pageWidth - margin - 15, pageH - 8);

                          doc.save(`MindCare_Informe_${r.patient_name.replace(/\s/g, '_')}_${r.week_end}.pdf`);
                        }}
                        className="py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 hover:shadow-purple transition-all"
                        style={{ background: "var(--gradient-primary)" }}>
                        <Download className="w-4 h-4" /> Descargar informe
                      </button>
                      <button 
                        onClick={() => {
                          const el = document.getElementById(`recs-${r.id}`);
                          if (el) el.classList.toggle('hidden');
                        }}
                        className="py-3 rounded-xl border-2 border-gray-200 font-semibold text-sm hover:border-[var(--primary-purple)] hover:text-[var(--primary-purple)] transition-all flex items-center justify-center gap-2">
                        <FileText className="w-4 h-4" /> Ver recomendaciones
                      </button>
                    </div>
                    {r.session_recommendations && r.session_recommendations.length > 0 && (
                      <div id={`recs-${r.id}`} className="hidden mt-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                        <p className="text-sm font-semibold mb-2">Recomendaciones para sesión:</p>
                        <ul className="space-y-1">
                          {r.session_recommendations.map((rec: string, idx: number) => (
                            <li key={idx} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                              <span className="text-[var(--primary-purple)] mt-0.5">•</span> {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {activeTab === "alerts" && (
          <motion.div key="alerts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-6 space-y-4">
            {alertsData.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-[var(--text-muted)]">
                No hay alertas registradas.
              </div>
            ) : alertsData.map((alert) => (
              <div key={alert.id} className={`bg-white rounded-xl border shadow-sm p-6 ${alert.acknowledged ? 'border-gray-100 opacity-60' : alert.priority === 'high' ? 'border-red-200' : 'border-orange-200'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      alert.priority === 'high' ? 'bg-red-100' : alert.priority === 'medium' ? 'bg-orange-100' : 'bg-yellow-100'
                    }`}>
                      <AlertTriangle className={`w-5 h-5 ${
                        alert.priority === 'high' ? 'text-red-500' : alert.priority === 'medium' ? 'text-orange-500' : 'text-yellow-500'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-bold">{alert.patient_name}</h3>
                      <p className="text-xs text-[var(--text-muted)]">
                        Prioridad: <span className={`font-semibold ${alert.priority === 'high' ? 'text-red-600' : 'text-orange-600'}`}>{alert.priority === 'high' ? 'Alta' : alert.priority === 'medium' ? 'Media' : 'Baja'}</span>
                        {' · '}{new Date(alert.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  {alert.acknowledged ? (
                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Revisada
                    </span>
                  ) : (
                    <button 
                      onClick={async () => {
                        await fetch(`/api/proxy/psychologists/alerts/${alert.id}/acknowledge`, { method: 'PATCH' });
                        setAlertsData(alertsData.map(a => a.id === alert.id ? { ...a, acknowledged: true } : a));
                        if (dashboardData) setDashboardData({ ...dashboardData, pending_alerts: Math.max(0, (dashboardData.pending_alerts || 1) - 1) });
                      }}
                      className="px-4 py-2 rounded-lg text-white text-xs font-semibold transition-all hover:shadow-md"
                      style={{ background: "var(--gradient-primary)" }}>
                      Marcar revisada
                    </button>
                  )}
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-3">{alert.description}</p>
                {alert.tags && alert.tags.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {alert.tags.map((tag: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-xs font-medium">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === "sessions" && (
          <motion.div key="sessions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Sesiones Programadas</h2>
              <button onClick={() => setShowSchedule(!showSchedule)}
                className="px-4 py-2 rounded-lg text-white text-sm font-semibold transition-all hover:shadow-md"
                style={{ background: "var(--gradient-primary)" }}>
                {showSchedule ? "Cancelar" : "+ Nueva Sesión"}
              </button>
            </div>

            {showSchedule && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4">
                <h3 className="font-bold mb-4">Agendar Nueva Sesión</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Paciente</label>
                    <select value={scheduleForm.patient_id}
                      onChange={e => setScheduleForm({ ...scheduleForm, patient_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none">
                      <option value="">Seleccionar paciente...</option>
                      {patientsData.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Fecha y hora</label>
                    <input type="datetime-local" value={scheduleForm.scheduled_at}
                      min={new Date().toISOString().slice(0, 16)}
                      onChange={e => setScheduleForm({ ...scheduleForm, scheduled_at: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Notas (opcional)</label>
                    <input type="text" value={scheduleForm.notes} placeholder="Ej: Seguimiento de ansiedad"
                      onChange={e => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Enlace de videoconsulta (opcional)</label>
                    <input type="url" value={scheduleForm.meeting_url} placeholder="https://meet.google.com/abc-defg-hij"
                      onChange={e => setScheduleForm({ ...scheduleForm, meeting_url: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
                  </div>
                </div>
                <button
                  disabled={!scheduleForm.patient_id || !scheduleForm.scheduled_at}
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/proxy/psychologists/sessions", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(scheduleForm),
                      });
                      const result = await res.json();
                      if (res.ok) {
                        setSessionsData([result, ...sessionsData]);
                        setShowSchedule(false);
                        setScheduleForm({ patient_id: "", scheduled_at: "", notes: "", meeting_url: "" });
                        if (dashboardData) setDashboardData({ ...dashboardData, sessions_this_week: (dashboardData.sessions_this_week || 0) + 1 });
                      } else {
                        alert(result.detail || "Error al agendar");
                      }
                    } catch { alert("Error de conexión"); }
                  }}
                  className="mt-4 px-6 py-2.5 rounded-lg text-white text-sm font-semibold transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "var(--gradient-primary)" }}>
                  Agendar Sesión
                </button>
              </motion.div>
            )}

            <div className="space-y-3">
              {sessionsData.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-[var(--text-muted)]">
                  No hay sesiones programadas. Crea una nueva sesión.
                </div>
              ) : sessionsData.map((s) => {
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
                else if (diffDays < 0) badgeColor = "bg-red-100 text-red-700";
                else if (diffDays === 0) badgeColor = "bg-red-100 text-red-700";
                else if (diffDays === 1) badgeColor = "bg-amber-100 text-amber-700";
                else if (diffDays <= 3) badgeColor = "bg-blue-100 text-blue-700";
                else badgeColor = "bg-green-100 text-green-700";

                return (
                  <div key={s.id} className={`bg-white rounded-xl border shadow-sm p-5 ${isPast && s.status === "scheduled" ? "border-orange-200" : "border-gray-100"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${diffDays === 0 ? 'bg-red-100' : diffDays === 1 ? 'bg-amber-100' : 'bg-indigo-100'}`}>
                          <CalendarDays className={`w-5 h-5 ${diffDays === 0 ? 'text-red-600' : diffDays === 1 ? 'text-amber-600' : 'text-indigo-600'}`} />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm">{s.patient_name}</h3>
                          <p className="text-xs text-[var(--text-muted)]">
                            {sessionDate.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })} a las {sessionDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {relativeLabel && (
                          <span className="text-xs font-medium text-[var(--text-muted)]">{relativeLabel}</span>
                        )}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
                          {statusLabel[s.status] || s.status}
                        </span>
                      </div>
                    </div>
                    {s.notes && <p className="text-xs text-[var(--text-secondary)] mt-2 ml-13">{s.notes}</p>}
                    {s.meeting_url && (
                      <div className="mt-2 ml-13">
                        <a href={s.meeting_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1.5 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                          Abrir videoconsulta
                        </a>
                      </div>
                    )}
                    {s.status === 'scheduled' && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                        <button
                          onClick={async () => {
                            const res = await fetch(`/api/proxy/psychologists/sessions/${s.id}/complete`, { method: "PATCH" });
                            if (res.ok) {
                              setSessionsData(sessionsData.map(sess => sess.id === s.id ? { ...sess, status: "completed" as const } : sess));
                            }
                          }}
                          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Completar
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm("\u00bfCancelar esta sesi\u00f3n?")) return;
                            const res = await fetch(`/api/proxy/psychologists/sessions/${s.id}/cancel`, { method: "PATCH" });
                            if (res.ok) {
                              setSessionsData(sessionsData.map(sess => sess.id === s.id ? { ...sess, status: "cancelled" as const } : sess));
                            }
                          }}
                          className="text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[var(--primary-purple)]" />
                Visión Global de la Clínica
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Status Distribution */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4 text-center">Distribución de Estados de Pacientes</h4>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Estable', value: patientsData.filter(p => p.status === 'stable').length || 1, color: '#22C55E' },
                            { name: 'Mejorando', value: patientsData.filter(p => p.status === 'improving').length || 1, color: '#3B82F6' },
                            { name: 'Necesita atención', value: patientsData.filter(p => p.status === 'needs_attention').length || 1, color: '#F59E0B' },
                            { name: 'Crítico', value: patientsData.filter(p => p.status === 'critical').length || 0, color: '#EF4444' }
                          ].filter(d => d.value > 0)}
                          cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                        >
                          {[
                            { name: 'Estable', value: patientsData.filter(p => p.status === 'stable').length || 1, color: '#22C55E' },
                            { name: 'Mejorando', value: patientsData.filter(p => p.status === 'improving').length || 1, color: '#3B82F6' },
                            { name: 'Necesita atención', value: patientsData.filter(p => p.status === 'needs_attention').length || 1, color: '#F59E0B' },
                            { name: 'Crítico', value: patientsData.filter(p => p.status === 'critical').length || 0, color: '#EF4444' }
                          ].filter(d => d.value > 0).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 mt-2 flex-wrap">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-500"></div><span className="text-xs text-gray-600">Estable</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span className="text-xs text-gray-600">Mejorando</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-amber-500"></div><span className="text-xs text-gray-600">Atención</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500"></div><span className="text-xs text-gray-600">Crítico</span></div>
                  </div>
                </div>

                {/* Clinic Trend */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4 text-center">Evolución Promedio (Últimos 7 días)</h4>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                        <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                        <RechartsTooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          cursor={{ stroke: '#8B5CF6', strokeWidth: 1, strokeDasharray: '5 5' }}
                        />
                        <Area type="monotone" dataKey="score" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-center text-xs text-gray-500 mt-4">Puntuación promedio de bienestar de toda la base de pacientes.</p>
                </div>
              </div>
            </div>

            {/* Row 2: Emotions + Patient Ranking */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Emotions Frequency */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-500" />
                  Emociones Más Reportadas (7 días)
                </h4>
                {emotionsData.length > 0 ? (
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={emotionsData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                        <YAxis dataKey="emotion" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#374151', fontWeight: 500 }} width={80} />
                        <RechartsTooltip
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          formatter={(value: unknown) => [`${value} registros`, 'Frecuencia']}
                        />
                        <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20}>
                          {emotionsData.map((_entry, index) => (
                            <Cell key={`bar-${index}`} fill={['#8B5CF6', '#6366F1', '#EC4899', '#F59E0B', '#EF4444', '#10B981'][index % 6]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-12">Sin datos de emociones aún.</p>
                )}
              </div>

              {/* Patient Risk Ranking */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Ranking de Pacientes por Riesgo
                </h4>
                <div className="space-y-2">
                  {[...patientsData]
                    .sort((a, b) => a.avg_emotional_state - b.avg_emotional_state)
                    .slice(0, 6)
                    .map((p, i) => {
                      const stateColor = p.avg_emotional_state >= 7 ? 'bg-green-500' : p.avg_emotional_state >= 5 ? 'bg-amber-500' : 'bg-red-500';
                      const barWidth = Math.max((p.avg_emotional_state / 10) * 100, 8);
                      return (
                        <div key={p.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                          <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {p.name.split(' ').map((n: string) => n[0]).join('')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                              <div className={`${stateColor} h-1.5 rounded-full transition-all`} style={{ width: `${barWidth}%` }}></div>
                            </div>
                          </div>
                          <span className={`text-sm font-bold ${p.avg_emotional_state >= 7 ? 'text-green-600' : p.avg_emotional_state >= 5 ? 'text-amber-600' : 'text-red-600'}`}>
                            {p.avg_emotional_state}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            p.status === 'stable' ? 'bg-green-100 text-green-700' :
                            p.status === 'improving' ? 'bg-blue-100 text-blue-700' :
                            p.status === 'needs_attention' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {STATUS_LABELS[p.status] || p.status}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
