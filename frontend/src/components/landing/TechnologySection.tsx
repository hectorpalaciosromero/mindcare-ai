"use client";

import { motion } from "framer-motion";
import { Bot, Database, Cpu, Lock } from "lucide-react";

const techs = [
  { icon: Bot, name: "IA Gemini", desc: "Modelo de lenguaje de última generación de Google para análisis emocional profundo y generación de recomendaciones personalizadas.", gradient: "from-blue-500 to-indigo-600", stat: "Gemini 2.5", statLabel: "Última generación" },
  { icon: Cpu, name: "FastAPI + Python", desc: "Backend de alto rendimiento para procesamiento de datos clínicos en tiempo real con arquitectura asíncrona.", gradient: "from-[#7C3AED] to-purple-600", stat: "<50ms", statLabel: "Tiempo de respuesta" },
  { icon: Database, name: "PostgreSQL", desc: "Base de datos relacional robusta para almacenar de manera estructurada los registros emocionales e historiales clínicos.", gradient: "from-[#EC4899] to-rose-600", stat: "Seguro", statLabel: "Almacenamiento" },
];

export default function TechnologySection() {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50/50">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 text-[#7C3AED] text-sm font-semibold mb-6">
            <Lock className="w-4 h-4" /> Infraestructura Enterprise
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">Tecnología de vanguardia</h2>
          <p className="mt-4 text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">Arquitectura diseñada para la privacidad, el rendimiento y la escalabilidad clínica.</p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-8">
          {techs.map((t, i) => (
            <motion.div key={t.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
              className="group relative bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-center overflow-hidden">
              {/* Top gradient line */}
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${t.gradient}`} />
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${t.gradient} flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                <t.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-extrabold mb-3 text-gray-900">{t.name}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">{t.desc}</p>
              {/* Stat */}
              <div className="pt-4 border-t border-gray-100">
                <p className={`text-2xl font-black bg-gradient-to-r ${t.gradient} bg-clip-text text-transparent`}>{t.stat}</p>
                <p className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-wider">{t.statLabel}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
