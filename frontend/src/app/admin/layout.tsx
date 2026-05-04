"use client";

import Link from "next/link";
import Image from "next/image";
import { Bell, User } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="admin">
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <header className="sticky top-0 z-40 bg-gray-900 text-white border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center border border-gray-700">
              <Image src="/logo.png" alt="MindCare Logo" width={36} height={36} className="object-cover" />
            </div>
            <span className="text-lg font-bold italic" style={{ fontFamily: "var(--font-outfit)" }}>
              MindCare Admin
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-lg hover:bg-gray-800 transition-colors">
              <Bell className="w-5 h-5 text-gray-400" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-800 transition-colors">
              <User className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
    </ProtectedRoute>
  );
}
