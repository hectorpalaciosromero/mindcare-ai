"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Shield } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch(`/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Credenciales inválidas");
      }

      const data = await response.json();
      if (data.role === "admin") {
        router.push("/admin/dashboard");
      } else if (data.role === "psychologist") {
        router.push("/psychologist/dashboard");
      } else {
        router.push("/patient/dashboard");
      }
    } catch {
      setErrorMsg("Error al iniciar sesión: verifica tus credenciales.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-[#7C3AED]/8 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-[#EC4899]/6 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-[#6366F1]/3 via-transparent to-[#7C3AED]/3 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px] relative z-10"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center shadow-lg shadow-purple-500/20 border border-white/10">
            <Image src="/logo.png" alt="MindCare Logo" width={44} height={44} className="object-cover" />
          </div>
          <span className="text-2xl font-bold italic text-[#7C3AED]" style={{ fontFamily: "var(--font-outfit)" }}>
            MindCare
          </span>
        </Link>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-900/5 border border-white/60 p-9">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Bienvenido de vuelta</h1>
            <p className="text-gray-500 text-sm mt-2">Ingresa tus credenciales para continuar</p>
          </div>

          {errorMsg && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3.5 rounded-2xl bg-red-50 border border-red-100/80">
              <p className="text-sm text-red-600 text-center font-medium">{errorMsg}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Correo electrónico</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 group-focus-within:text-[#7C3AED] transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 border-gray-100 bg-gray-50/50 text-sm font-medium focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/8 focus:border-[#7C3AED] transition-all placeholder:text-gray-400 placeholder:font-normal"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Contraseña</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 group-focus-within:text-[#7C3AED] transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3.5 rounded-2xl border-2 border-gray-100 bg-gray-50/50 text-sm font-medium focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/8 focus:border-[#7C3AED] transition-all placeholder:text-gray-400"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1">
                  {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="group w-full py-4 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-lg"
              style={{ background: "linear-gradient(135deg, #7C3AED, #6366F1)" }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Iniciar sesión <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-7 pt-6 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-400">
            <Shield className="w-3.5 h-3.5" />
            Conexión cifrada de extremo a extremo
          </div>
        </div>

        {/* Register link */}
        <p className="text-center text-sm text-gray-500 mt-7">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="text-[#7C3AED] font-bold hover:text-[#6D28D9] transition-colors">
            Regístrate aquí
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
