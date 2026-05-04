"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { BarChart3, Clock, Activity, LineChart } from "lucide-react";

const benefits = [
  { icon: BarChart3, title: "Informes generados por IA", desc: "Reciba resúmenes semanales automáticos del estado emocional de cada paciente, generados por inteligencia artificial.", color: "text-blue-600 bg-blue-100" },
  { icon: Clock, title: "Sesiones más productivas", desc: "Llegue a cada sesión con el contexto completo: emociones registradas, intensidad y notas del paciente.", color: "text-purple-600 bg-purple-100" },
  { icon: Activity, title: "Sistema de alertas clínicas", desc: "Reciba notificaciones automáticas cuando un paciente registre estados emocionales críticos.", color: "text-pink-600 bg-pink-100" },
  { icon: LineChart, title: "Evolución visual", desc: "Visualice gráficas de tendencia emocional semanal de cada paciente para identificar patrones.", color: "text-amber-600 bg-amber-100" },
];

export default function BenefitsPsychologists() {
  return (
    <section className="py-24 bg-white/50">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        {/* Benefits list */}
        <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
          <h2 className="text-4xl md:text-5xl font-bold mb-10">Beneficios para psicólogos</h2>
          <div className="space-y-6">
            {benefits.map((b, i) => (
              <motion.div key={b.title} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="flex items-start gap-4 group">
                <div className={`w-12 h-12 rounded-xl ${b.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                  <b.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{b.title}</h3>
                  <p className="text-[var(--text-secondary)] text-sm mt-1 leading-relaxed">{b.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Image side */}
        <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-[var(--border-light)] bg-[#0f0f17]">
            <Image
              src="/panel_profesional_render.png"
              alt="MindCare Pro - Panel Profesional"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          {/* Floating alert */}
          <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }}
            className="absolute -top-3 -left-3 bg-white rounded-xl shadow-lg p-3 flex items-center gap-2 border border-gray-100">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <Activity className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <p className="text-xs font-semibold">Alerta detectada</p>
              <p className="text-[10px] text-[var(--text-muted)]">Paciente requiere atención</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
