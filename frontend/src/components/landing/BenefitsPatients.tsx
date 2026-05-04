"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Shield, Zap, Brain, CalendarCheck } from "lucide-react";

const benefits = [
  { icon: Shield, title: "Espacio seguro y confidencial", desc: "Expresa tus emociones libremente en un entorno 100% privado y protegido.", color: "text-blue-600 bg-blue-100" },
  { icon: Zap, title: "Ayuda instantánea", desc: "No esperes a la próxima sesión. Recibe apoyo inmediato cuando más lo necesites.", color: "text-purple-600 bg-purple-100" },
  { icon: Brain, title: "Autoconocimiento emocional", desc: "Aprende a identificar y gestionar tus emociones con herramientas prácticas.", color: "text-pink-600 bg-pink-100" },
  { icon: CalendarCheck, title: "Sesiones más efectivas", desc: "Tu psicólogo llega preparado con información clave sobre tu semana.", color: "text-green-600 bg-green-100" },
];

export default function BenefitsPatients() {
  return (
    <section id="beneficios" className="py-24">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        {/* Image side */}
        <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-[var(--border-light)] bg-white">
            <Image
              src="/patient_wellness.png"
              alt="Bienestar Emocional"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          {/* Floating card */}
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }}
            className="absolute -bottom-4 -right-4 bg-white rounded-xl shadow-lg p-3 flex items-center gap-2 border border-gray-100">
            <div className="w-8 h-8 relative">
              <Image src="/emotions/feliz.png" alt="Feliz" fill className="object-contain" />
            </div>
            <div>
              <p className="text-xs font-semibold">Estado: Positivo</p>
              <p className="text-[10px] text-[var(--text-muted)]">Hace 2 horas</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Benefits list */}
        <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
          <h2 className="text-4xl md:text-5xl font-bold mb-10">Beneficios para pacientes</h2>
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
      </div>
    </section>
  );
}
