"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, ShieldCheck, Clock, ArrowRight } from "lucide-react";

export default function HeroSection() {
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
    <section
      id="inicio"
      className="relative min-h-screen flex items-center overflow-hidden pt-20"
    >
      {/* Subtle background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-[#7C3AED]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-[#EC4899]/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-6 w-full grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left content */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex flex-col gap-6"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] text-sm font-medium w-fit"
          >
            <Sparkles className="w-4 h-4" />
            Impulsado por IA Gemini
          </motion.div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight">
            Tu bienestar{" "}
            <br className="hidden sm:block" />
            emocional,{" "}
            <span className="text-gradient">
              nuestra prioridad
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-[var(--text-secondary)] leading-relaxed max-w-lg">
            Plataforma inteligente que utiliza IA para registrar y analizar tu
            estado emocional diario, ofreciendo apoyo continuo las 24 horas y
            optimizando tus sesiones de terapia.
          </p>

          {/* CTAs — auth aware */}
          <div className="flex flex-wrap gap-4 mt-2">
            {authState.loggedIn ? (
              <Link
                href={dashboardPath}
                className="group px-8 py-3.5 rounded-full text-white font-semibold text-base shadow-lg hover:shadow-purple transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
                style={{ background: "var(--gradient-primary)" }}
              >
                Ir a mi panel <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="px-8 py-3.5 rounded-full text-white font-semibold text-base shadow-lg hover:shadow-purple transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  Comenzar ahora
                </Link>
                <Link
                  href="/register?role=psychologist"
                  className="px-8 py-3.5 rounded-full border-2 border-[var(--border-light)] text-[var(--text-primary)] font-semibold text-base hover:border-[var(--primary-purple)] hover:text-[var(--primary-purple)] transition-all"
                >
                  Portal Psicólogo
                </Link>
              </>
            )}
          </div>

          {/* Trust badges */}
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
              </div>
              100% confidencial
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
              </div>
              Disponible 24/7
            </div>
          </div>
        </motion.div>

        {/* Right — Hero visual */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
          className="relative hidden lg:flex justify-center items-center"
        >
          <div className="relative w-full max-w-lg aspect-square lg:aspect-[4/5]">
            {/* Glow backdrop */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED]/30 via-[#A855F7]/20 to-[#EC4899]/30 rounded-3xl blur-2xl scale-105" />

            {/* Main image */}
            <div className="relative w-full h-full rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
              <Image
                src="/portal_MindCare.png"
                alt="Plataforma de bienestar emocional guiada por IA"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
