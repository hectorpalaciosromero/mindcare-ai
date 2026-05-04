"use client";

import { useState, useEffect } from "react";
import type { User } from "@/types";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Phone, GraduationCap, Heart, Shield, ExternalLink, PhoneCall } from "lucide-react";

export default function PatientProfilePage() {

  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/proxy/auth/me")
      .then(r => r.json())
      .then(d => { setProfile(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <Link href="/patient/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" />
        Volver al dashboard
      </Link>

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold mb-2">Mi Perfil</h1>
        <p className="text-[var(--text-secondary)]">Información de tu cuenta en MindCare</p>
      </motion.div>

      {/* Profile Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        
        <div className="h-24 relative" style={{ background: "var(--gradient-primary)" }}>
          <div className="absolute -bottom-10 left-6">
            <div className="w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center border-4 border-white">
              <span className="text-3xl font-bold text-[var(--primary-purple)]">
                {profile?.first_name?.[0]}{profile?.last_name?.[0]}
              </span>
            </div>
          </div>
        </div>
        
        <div className="pt-14 px-6 pb-6">
          <h2 className="text-2xl font-bold">{profile?.first_name} {profile?.last_name}</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">Paciente</p>
          
          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50">
              <Mail className="w-5 h-5 text-[var(--primary-purple)]" />
              <div>
                <p className="text-xs text-[var(--text-muted)]">Correo electrónico</p>
                <p className="text-sm font-medium">{profile?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50">
              <Phone className="w-5 h-5 text-[var(--primary-purple)]" />
              <div>
                <p className="text-xs text-[var(--text-muted)]">Teléfono</p>
                <p className="text-sm font-medium">{profile?.phone || "No registrado"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50">
              <GraduationCap className="w-5 h-5 text-[var(--primary-purple)]" />
              <div>
                <p className="text-xs text-[var(--text-muted)]">Edad</p>
                <p className="text-sm font-medium">{profile?.age ? `${profile.age} años` : "No registrada"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50">
              <Shield className="w-5 h-5 text-[var(--primary-purple)]" />
              <div>
                <p className="text-xs text-[var(--text-muted)]">Rol</p>
                <p className="text-sm font-medium">Paciente</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Crisis Resources — MANDATORY for mental health platforms */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="mt-6 bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
        
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <Heart className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Recursos de Ayuda</h3>
              <p className="text-xs text-[var(--text-muted)]">Si necesitas ayuda urgente, no estás solo/a</p>
            </div>
          </div>

          <div className="space-y-3">
            <a href="tel:024" className="flex items-center justify-between p-4 rounded-xl bg-red-50 hover:bg-red-100 transition-colors group">
              <div className="flex items-center gap-3">
                <PhoneCall className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-semibold text-red-800">Línea de Atención a la Crisis</p>
                  <p className="text-xs text-red-600">024 — Disponible 24/7</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-red-400 group-hover:text-red-600 transition-colors" />
            </a>
            
            <a href="tel:017" className="flex items-center justify-between p-4 rounded-xl bg-orange-50 hover:bg-orange-100 transition-colors group">
              <div className="flex items-center gap-3">
                <PhoneCall className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="font-semibold text-orange-800">Teléfono de la Esperanza</p>
                  <p className="text-xs text-orange-600">717 003 717 — Atención emocional</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-orange-400 group-hover:text-orange-600 transition-colors" />
            </a>

            <a href="https://www.telefonodelaesperanza.org" target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors group">
              <div className="flex items-center gap-3">
                <ExternalLink className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-semibold text-blue-800">Chat de Apoyo Online</p>
                  <p className="text-xs text-blue-600">telefonodelaesperanza.org</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-blue-400 group-hover:text-blue-600 transition-colors" />
            </a>
          </div>

          <p className="text-xs text-[var(--text-muted)] mt-4 text-center">
            MindCare es una herramienta de acompañamiento, no sustituye la atención profesional.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
