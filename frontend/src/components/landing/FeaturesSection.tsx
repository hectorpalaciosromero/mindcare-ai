"use client";

import { motion } from "framer-motion";
import { SmilePlus, HeartHandshake, TrendingUp, Check } from "lucide-react";

const features = [
  {
    icon: SmilePlus,
    step: "01",
    title: "Registro emocional diario",
    description: "Registra cómo te sientes cada día y nuestra IA analiza tu estado emocional para ofrecerte una respuesta empática y personalizada al instante.",
    bullets: ["Análisis emocional con IA Gemini", "Conversación empática post-registro", "Alertas automáticas al psicólogo si detecta riesgo"],
    gradient: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50",
  },
  {
    icon: HeartHandshake,
    step: "02",
    title: "Apoyo inmediato 24/7",
    description: "Conversa con tu compañero de bienestar impulsado por IA en cualquier momento. Recibe técnicas de regulación emocional sin esperar a la consulta.",
    bullets: ["Chat conversacional con IA", "Ejercicios de respiración y mindfulness", "Disponible las 24 horas del día"],
    gradient: "from-[#7C3AED] to-purple-600",
    bg: "bg-purple-50",
  },
  {
    icon: TrendingUp,
    step: "03",
    title: "Optimización terapéutica",
    description: "Tu psicólogo recibe informes semanales generados por IA con el resumen de tu estado emocional, para sesiones más efectivas y enfocadas.",
    bullets: ["Informes semanales generados por IA", "Gráficas de evolución emocional", "Seguimiento de progreso entre sesiones"],
    gradient: "from-[#EC4899] to-rose-600",
    bg: "bg-pink-50",
  },
];

export default function FeaturesSection() {
  return (
    <section id="funciones" className="py-24 bg-gradient-to-b from-gray-50/50 to-white">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 text-[#7C3AED] text-sm font-semibold mb-6">
            ¿Cómo funciona?
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">Tres pilares de MindCare</h2>
          <p className="mt-4 text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">Un proceso inteligente que transforma el cuidado de la salud mental desde el primer día.</p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
              className="group relative bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              {/* Top gradient accent */}
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${f.gradient}`} />
              
              {/* Step number watermark */}
              <div className="absolute top-4 right-6 text-6xl font-black text-gray-100/80 select-none">{f.step}</div>
              
              <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                <f.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-extrabold mb-3 text-gray-900">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">{f.description}</p>
              <ul className="space-y-3">
                {f.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2.5 text-sm">
                    <div className={`w-5 h-5 rounded-full ${f.bg} flex items-center justify-center shrink-0`}>
                      <Check className="w-3 h-3 text-[var(--primary-purple)]" />
                    </div>
                    <span className="text-gray-600 font-medium">{b}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
