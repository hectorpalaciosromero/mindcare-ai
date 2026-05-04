"use client";

import { useState, useEffect } from "react";
import type { AdminUser } from "@/types";
import Link from "next/link";
import { ArrowLeft, Search, Filter, Ban } from "lucide-react";
import { motion } from "framer-motion";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  psychologist: "Psicólogo",
  patient: "Paciente",
};
const getInitials = (name: string) => {
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
};
const getRelativeTime = (dateString: string) => {
  const diffMs = new Date().getTime() - new Date(dateString).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Justo ahora";
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours} hr`;
  if (diffDays === 1) return "Ayer";
  return `Hace ${diffDays} días`;
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/proxy/admin/dashboard")
      .then(r => r.json())
      .then(d => {
        setUsers(d.recent_users || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-8">
        <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          Volver al Panel Admin
        </Link>
        <div className="flex items-end justify-between">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
              {!loading && (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full border border-gray-200 mt-2">
                  {searchTerm 
                    ? `${filteredUsers.length} resultado${filteredUsers.length !== 1 ? 's' : ''}` 
                    : `${users.length} en total`}
                </span>
              )}
            </div>
            <p className="text-gray-500 mt-1">Administra los permisos, roles y estados de las cuentas.</p>
          </motion.div>
          
          <div className="flex gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar usuario..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-64"
              />
            </div>
            <button 
              onClick={() => setRoleFilter(roleFilter === 'all' ? 'patient' : roleFilter === 'patient' ? 'psychologist' : roleFilter === 'psychologist' ? 'admin' : 'all')}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${roleFilter !== 'all' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:bg-gray-50'}`}>
              <Filter className="w-4 h-4" />
              {roleFilter === 'all' ? 'Filtrar' : ROLE_LABELS[roleFilter] || roleFilter}
            </button>
          </div>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
      >
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Nombre</th>
                  <th className="px-6 py-4 font-medium">Correo electrónico</th>
                  <th className="px-6 py-4 font-medium">Rol</th>
                  <th className="px-6 py-4 font-medium">Estado</th>
                  <th className="px-6 py-4 font-medium">Registro</th>
                  <th className="px-6 py-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((u: AdminUser) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                        {getInitials(u.name)}
                      </div>
                      {u.name}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        u.role === 'admin' ? 'bg-red-100 text-red-700' : 
                        u.role === 'psychologist' ? 'bg-purple-100 text-purple-700' : 
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1.5 text-xs font-medium ${u.is_active !== false ? 'text-green-600' : 'text-red-600'}`}>
                        <span className={`w-2 h-2 rounded-full ${u.is_active !== false ? 'bg-green-500' : 'bg-red-500'}`}></span> 
                        {u.is_active !== false ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {getRelativeTime(u.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {u.role !== 'admin' && (
                          <button 
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/proxy/admin/users/${u.id}/toggle-active`, { method: 'PATCH' });
                                const result = await res.json();
                                setUsers(users.map(user => user.id === u.id ? { ...user, is_active: result.is_active } : user));
                              } catch { /* handled */ }
                            }}
                            className={`p-1.5 rounded-md transition-colors ${
                              u.is_active !== false 
                                ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50' 
                                : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                            }`} 
                            title={u.is_active !== false ? "Desactivar Usuario" : "Reactivar Usuario"}
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      No se encontraron usuarios.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}

