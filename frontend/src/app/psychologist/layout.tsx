"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { AIAlert } from "@/types";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Bell, User, LogOut, ChevronDown } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function PsychologistLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [userName, setUserName] = useState("");
  
  const notificationsRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/proxy/auth/me")
      .then(res => res.json())
      .then(data => { if (data?.first_name) setUserName(data.first_name); })
      .catch(() => {});

    fetch("/api/proxy/psychologists/alerts")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setUnreadAlerts(data.filter((a: AIAlert) => !a.acknowledged).length);
        }
      })
      .catch(err => console.error("Error fetching layout alerts:", err));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <ProtectedRoute requiredRole="psychologist">
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shadow-md shadow-purple-500/20 border border-gray-100">
              <Image src="/logo.png" alt="MindCare Logo" width={36} height={36} className="object-cover" />
            </div>
            <span className="text-lg font-bold italic text-[#7C3AED]" style={{ fontFamily: "var(--font-outfit)" }}>
              MindCare Pro
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {/* Real notification bell */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 rounded-lg transition-colors ${showNotifications ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                title={unreadAlerts > 0 ? "Tienes nuevas alertas" : "Sin notificaciones"}
              >
                <Bell className="w-5 h-5 text-[var(--text-secondary)]" />
                {unreadAlerts > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center px-1 shadow-sm">{unreadAlerts}</span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-gray-100 shadow-xl py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">Alertas Recientes</h3>
                    {unreadAlerts > 0 && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">{unreadAlerts} nuevas</span>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {unreadAlerts === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Bell className="w-5 h-5 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500">No tienes alertas pendientes</p>
                      </div>
                    ) : (
                      <div className="px-4 py-8 text-center">
                        <p className="text-sm text-gray-500">Tienes {unreadAlerts} alertas pendientes.<br/>Revisa la pestaña &quot;Alertas&quot; en tu panel.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                  {userName ? userName[0].toUpperCase() : <User className="w-4 h-4" />}
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showDropdown && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-gray-100 shadow-xl py-2 z-50">
                  {userName && (
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-bold text-gray-900">{userName}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <p className="text-xs text-gray-500">Psicólogo(a) · Activo</p>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
    </ProtectedRoute>
  );
}
