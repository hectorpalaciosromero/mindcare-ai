"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { AdminDashboardData, AdminUser } from "@/types";
import Link from "next/link";
import { motion } from "framer-motion";
import { Users, Activity, HeartPulse, BrainCircuit, LogOut, CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  psychologist: "Psicólogo",
  patient: "Paciente",
};
const getInitials = (name: string) => {
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
};
const getRelativeTime = (dateString: string) => {
  const diffMs = new Date().getTime() - new Date(dateString).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Justo ahora";
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours} hr`;
  if (diffDays === 1) return "Ayer";
  return `Hace ${diffDays} días`;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiLatency, setAiLatency] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/proxy/admin/dashboard")
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    const start = performance.now();
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "ping", history: [] }),
    }).then(() => {
      setAiLatency(Math.round(performance.now() - start));
    }).catch(() => setAiLatency(-1));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const m = data?.metrics || { total_patients: 0, total_psychologists: 0, total_checkins: 0, active_ai_models: 0, avg_intensity: 0 };
  const users = data?.recent_users || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold">Vista Global de Plataforma</h1>
          <p className="text-[var(--text-secondary)] mt-1">Supervisa el rendimiento y adopción del sistema MindCare</p>
        </motion.div>
        <button 
          onClick={handleLogout} 
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 rounded-xl transition-all shadow-sm"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Pacientes activos", value: m.total_patients || 0, icon: Users, color: "text-blue-600 bg-blue-50 border-blue-100" },
          { label: "Psicólogos en red", value: m.total_psychologists || 0, icon: ShieldCheck, color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
          { label: "Check-ins procesados", value: m.total_checkins || 0, icon: Activity, color: "text-purple-600 bg-purple-50 border-purple-100" },
          { label: "Modelos IA activos", value: m.active_ai_models || 1, icon: BrainCircuit, color: "text-green-600 bg-green-50 border-green-100" },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className={`rounded-2xl p-6 border ${kpi.color} bg-white bg-opacity-50 backdrop-blur-sm shadow-sm`}>
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${kpi.color} border-none`}>
                <kpi.icon className="w-6 h-6" />
              </div>
            </div>
            <p className="text-sm font-semibold text-gray-500">{kpi.label}</p>
            <p className="text-3xl font-bold mt-1 text-gray-900">{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* System Health */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
          className="col-span-1 bg-gray-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <HeartPulse className="w-32 h-32" />
          </div>
          <h2 className="text-xl font-bold mb-6">Salud del Sistema</h2>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Estado general</span>
                <span className="text-green-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Operativo</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: "100%" }} />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Gemini AI Latencia</span>
                <span className="text-blue-400 font-bold">{aiLatency !== null ? (aiLatency === -1 ? 'Error' : `${aiLatency}ms`) : 'Midiendo...'}</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: aiLatency && aiLatency > 0 ? `${Math.min(aiLatency / 20, 100)}%` : '0%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Intensidad Promedio (Global)</span>
                <span className="text-indigo-400 font-bold">{m.avg_intensity}/10</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${(m.avg_intensity / 10) * 100}%` }} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recent Users Table */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-xl font-bold">Usuarios Recientes</h2>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-100">
              Últimos 5 registros
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Nombre</th>
                  <th className="px-6 py-4 font-medium">Correo electrónico</th>
                  <th className="px-6 py-4 font-medium">Rol</th>
                  <th className="px-6 py-4 font-medium">Estado</th>
                  <th className="px-6 py-4 font-medium">Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.slice(0, 5).map((u: AdminUser) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors cursor-pointer group">
                    <td className="px-6 py-4 font-medium text-gray-900 group-hover:text-indigo-600 transition-colors flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                        {getInitials(u.name)}
                      </div>
                      {u.name}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        u.role === 'admin' ? 'bg-red-100 text-red-700' : 
                        u.role === 'psychologist' ? 'bg-purple-100 text-purple-700' : 
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span> Activo
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {getRelativeTime(u.created_at)}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">No hay usuarios registrados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-100 bg-gray-50/50 p-4">
            <Link href="/admin/users" className="w-full flex items-center justify-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors py-2">
              Ver todos los usuarios
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
