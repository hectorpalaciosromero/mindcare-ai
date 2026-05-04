"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";

const navLinks = [
  { label: "Inicio", href: "#inicio" },
  { label: "Funciones", href: "#funciones" },
  { label: "Beneficios", href: "#beneficios" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authState, setAuthState] = useState<{ loggedIn: boolean; role?: string; name?: string }>({ loggedIn: false });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    fetch("/api/proxy/auth/me")
      .then(async (res) => {
        if (res.ok) {
          const user = await res.json();
          setAuthState({ loggedIn: true, role: user.role, name: user.first_name });
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
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 backdrop-blur-xl shadow-md"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shadow-md group-hover:shadow-purple transition-shadow border border-gray-100">
            <Image src="/logo.png" alt="MindCare Logo" width={40} height={40} className="object-cover" />
          </div>
          <span
            className="text-xl font-bold italic text-[#7C3AED]"
            style={{ fontFamily: "var(--font-outfit, 'Outfit', cursive)" }}
          >
            MindCare AI
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--primary-purple)] transition-colors relative group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--primary-purple)] group-hover:w-full transition-all duration-300" />
            </a>
          ))}
          
          {authState.loggedIn ? (
            <Link
              href={dashboardPath}
              className="group px-6 py-2.5 rounded-full text-white text-sm font-semibold transition-all shadow-md hover:shadow-purple flex items-center gap-2"
              style={{ background: "var(--gradient-primary)" }}
            >
              Ir al Panel <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-6 py-2.5 rounded-full bg-[var(--primary-purple)] text-white text-sm font-semibold hover:bg-[var(--primary-purple-hover)] transition-all shadow-md hover:shadow-purple"
            >
              Acceder
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-100"
          >
            <div className="px-6 py-4 flex flex-col gap-3">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--primary-purple)] py-2"
                >
                  {link.label}
                </a>
              ))}
              {authState.loggedIn ? (
                <Link
                  href={dashboardPath}
                  className="px-6 py-2.5 rounded-full text-white text-sm font-semibold text-center mt-2 flex items-center justify-center gap-2"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  Ir al Panel <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="px-6 py-2.5 rounded-full bg-[var(--primary-purple)] text-white text-sm font-semibold text-center mt-2"
                >
                  Acceder
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
