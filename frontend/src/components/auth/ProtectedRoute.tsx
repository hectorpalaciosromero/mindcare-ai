// Auth guard — verifies session via /api/auth/me (cookie-based).

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "patient" | "psychologist" | "admin";
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ok" | "denied">("loading");

  useEffect(() => {
    fetch("/api/proxy/auth/me")
      .then(async (res) => {
        if (!res.ok) throw new Error("Unauthorized");
        const user = await res.json();
        if (requiredRole && user.role !== requiredRole) {
          let target = "/patient/dashboard";
          if (user.role === "admin") target = "/admin/dashboard";
          if (user.role === "psychologist") target = "/psychologist/dashboard";
          router.replace(target);
          setStatus("denied");
        } else {
          setStatus("ok");
        }
      })
      .catch(() => {
        router.replace("/login");
        setStatus("denied");
      });
  }, [requiredRole, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[var(--primary-purple)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--text-muted)]">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (status === "denied") return null;

  return <>{children}</>;
}
