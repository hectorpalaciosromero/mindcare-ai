"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Stethoscope, Shield, CheckCircle2 } from "lucide-react";

function RegisterForm() {
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") === "psychologist" ? "psychologist" : "patient";

  const router = useRouter();
  const [role, setRole] = useState<"patient" | "psychologist">(initialRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const nameParts = name.trim().split(/\s+/);
      const first_name = nameParts[0] || "";
      const last_name = nameParts.slice(1).join(" ") || first_name;

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, first_name, last_name, role }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error en el registro");
      }

      const data = await response.json();
      
      if (data.role === "admin") {
        router.push("/admin/dashboard");
      } else if (data.role === "psychologist") {
        router.push("/psychologist/dashboard");
      } else {
        router.push("/patient/dashboard");
      }
    } catch (error: unknown) {
      setErrorMsg((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="w-full max-w-[440px] relative z-10">
      {/* Logo */}
      <Link href="/" className="flex items-center justify-center gap-2.5 mb-10">
        <div className="w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center shadow-lg shadow-purple-500/20 border border-white/10">
          <Image src="/logo.png" alt="MindCare Logo" width={44} height={44} className="object-cover" />
        </div>
        <span className="text-2xl font-bold italic text-[#7C3AED]" style={{ fontFamily: "var(--font-outfit)" }}>MindCare</span>
      </Link>

      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-900/5 border border-white/60 p-9">
        <div className="text-center mb-7">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Crear cuenta</h1>
          <p className="text-gray-500 text-sm mt-2">Selecciona tu rol y completa el registro</p>
        </div>

        {errorMsg && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-3.5 rounded-2xl bg-red-50 border border-red-100/80">
            <p className="text-sm text-red-600 text-center font-medium">{errorMsg}</p>
          </motion.div>
        )}

        {/* Role selector */}
        <div className="grid grid-cols-2 gap-3 mb-7">
          <button type="button" onClick={() => setRole("patient")}
            className={`relative p-5 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all duration-300 ${
              role === "patient" 
              ? "border-[#7C3AED] bg-[#7C3AED]/5 shadow-[0_4px_20px_rgba(124,58,237,0.1)]" 
              : "border-gray-100 bg-gray-50/50 hover:border-gray-200 hover:bg-white"
            }`}>
            {role === "patient" && (
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#7C3AED] rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${role === "patient" ? "bg-[#7C3AED]/10" : "bg-gray-100"}`}>
              <User className={`w-6 h-6 ${role === "patient" ? "text-[#7C3AED]" : "text-gray-400"}`} />
            </div>
            <span className={`text-sm font-bold ${role === "patient" ? "text-[#7C3AED]" : "text-gray-500"}`}>Paciente</span>
          </button>
          <button type="button" onClick={() => setRole("psychologist")}
            className={`relative p-5 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all duration-300 ${
              role === "psychologist" 
              ? "border-[#7C3AED] bg-[#7C3AED]/5 shadow-[0_4px_20px_rgba(124,58,237,0.1)]" 
              : "border-gray-100 bg-gray-50/50 hover:border-gray-200 hover:bg-white"
            }`}>
            {role === "psychologist" && (
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#7C3AED] rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${role === "psychologist" ? "bg-[#7C3AED]/10" : "bg-gray-100"}`}>
              <Stethoscope className={`w-6 h-6 ${role === "psychologist" ? "text-[#7C3AED]" : "text-gray-400"}`} />
            </div>
            <span className={`text-sm font-bold ${role === "psychologist" ? "text-[#7C3AED]" : "text-gray-500"}`}>Psicólogo</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre completo</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 group-focus-within:text-[#7C3AED] transition-colors" />
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre"
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 border-gray-100 bg-gray-50/50 text-sm font-medium focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/8 focus:border-[#7C3AED] transition-all placeholder:text-gray-400 placeholder:font-normal" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Correo electrónico</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 group-focus-within:text-[#7C3AED] transition-colors" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com"
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 border-gray-100 bg-gray-50/50 text-sm font-medium focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/8 focus:border-[#7C3AED] transition-all placeholder:text-gray-400 placeholder:font-normal" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Contraseña</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 group-focus-within:text-[#7C3AED] transition-colors" />
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres"
                className="w-full pl-11 pr-12 py-3.5 rounded-2xl border-2 border-gray-100 bg-gray-50/50 text-sm font-medium focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/8 focus:border-[#7C3AED] transition-all placeholder:text-gray-400 placeholder:font-normal" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1">
                {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="group w-full py-4 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 mt-1"
            style={{ background: "linear-gradient(135deg, #7C3AED, #6366F1)" }}>
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Crear cuenta <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>}
          </button>
        </form>

        {/* Trust */}
        <div className="mt-7 pt-6 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-400">
          <Shield className="w-3.5 h-3.5" />
          Tus datos están protegidos con cifrado AES-256
        </div>
      </div>

      <p className="text-center text-sm text-gray-500 mt-7">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-[#7C3AED] font-bold hover:text-[#6D28D9] transition-colors">Inicia sesión</Link>
      </p>
    </motion.div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-[#7C3AED]/8 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-[#EC4899]/6 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-[#6366F1]/3 via-transparent to-[#7C3AED]/3 rounded-full blur-3xl" />
      </div>
      <Suspense fallback={<div className="w-5 h-5 border-2 border-[#7C3AED]/30 border-t-[#7C3AED] rounded-full animate-spin" />}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
