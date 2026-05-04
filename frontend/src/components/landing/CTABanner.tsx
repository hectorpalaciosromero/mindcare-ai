"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export default function CTABanner() {
  const [authState, setAuthState] = useState<{ loggedIn: boolean; role?: string }>({ loggedIn: false });

  useEffect(() => {
    fetch("/api/proxy/auth/me")
      .then(async (res) => {
        if (res.ok) {
          const user = await res.json();
          setAuthState({ loggedIn: true, role: user.role });
        }
      })
      .catch(() => {});
  }, []);

  const dashboardPath = authState.role === "admin"
    ? "/admin/dashboard"
    : authState.role === "psychologist"
      ? "/psychologist/dashboard"
      : "/patient/dashboard";

  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden py-20 px-8 text-center"
          style={{ background: "linear-gradient(135deg, #7C3AED 0%, #A855F7 40%, #EC4899 100%)" }}
        >
          {/* Decorative circles */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
          <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-white/5 rounded-full" />
          <div className="absolute top-10 right-20 w-2 h-2 bg-white/30 rounded-full animate-pulse" />
          <div className="absolute bottom-16 left-16 w-1.5 h-1.5 bg-white/20 rounded-full animate-pulse" style={{ animationDelay: "1s" }} />

          <div className="relative z-10 max-w-2xl mx-auto">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/15 backdrop-blur-sm text-white text-sm font-semibold mb-8 border border-white/20">
              <Sparkles className="w-4 h-4" /> Diseñado para el bienestar emocional
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight tracking-tight">
              {authState.loggedIn ? "Tu bienestar emocional te espera" : "Comienza tu viaje hacia el bienestar emocional"}
            </h2>
            <p className="text-white/80 text-lg mb-10 leading-relaxed max-w-xl mx-auto">
              {authState.loggedIn 
                ? "Vuelve a tu panel para continuar monitoreando tu progreso y acceder a todas las herramientas de MindCare."
                : "Únete a la comunidad de personas que ya están transformando su salud mental con el apoyo de la inteligencia artificial."
              }
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {authState.loggedIn ? (
                <Link
                  href={dashboardPath}
                  className="group px-10 py-4 rounded-full bg-white text-[var(--primary-purple)] font-bold text-base shadow-lg hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
                >
                  Ir a mi panel <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="group px-10 py-4 rounded-full bg-white text-[var(--primary-purple)] font-bold text-base shadow-lg hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
                  >
                    Registrarme como paciente
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href="/register?role=psychologist"
                    className="px-10 py-4 rounded-full border-2 border-white/40 text-white font-bold text-base hover:bg-white/10 hover:border-white/60 transition-all backdrop-blur-sm"
                  >
                    Soy psicólogo
                  </Link>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
