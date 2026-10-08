"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Shield,
  ShieldCheck,
  Star,
  CheckCircle,
  XCircle,
  RefreshCw,
  Crown,
  Filter,
} from "lucide-react";
import {
  fetchAdminUsers,
  updateAdminUserRole,
  updateAdminUserTier,
} from "@/utils/adminHelpers";
import { AdminUserItem } from "@/types/admin";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user" | "pro">("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminUsers();
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleRole = async (user: AdminUserItem) => {
    const nextRole = user.role === "admin" ? "user" : "admin";
    if (
      !confirm(
        `Ubah peran "${user.display_name || user.email}" menjadi ${nextRole.toUpperCase()}?`
      )
    )
      return;

    setUpdatingId(user.id);
    try {
      await updateAdminUserRole(user.id, nextRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: nextRole } : u))
      );
    } catch (err) {
      alert("Gagal mengubah role pengguna.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleTier = async (user: AdminUserItem) => {
    const nextTier = !user.is_pro;
    setUpdatingId(user.id);
    try {
      await updateAdminUserTier(user.id, nextTier);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_pro: nextTier } : u))
      );
    } catch (err) {
      alert("Gagal mengubah status tier pengguna.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.display_name.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (roleFilter === "admin") return u.role === "admin";
    if (roleFilter === "user") return u.role === "user";
    if (roleFilter === "pro") return u.is_pro;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-300 p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-tight">
              Manajemen Pengguna
            </h1>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-300">
              {users.length} Akun Terdaftar
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Kelola hak akses role administrator dan penetapan status keanggotaan Pro
          </p>
        </div>

        <button
          onClick={loadUsers}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:brightness-95 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-300 p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Cari email atau nama pengguna..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 text-xs focus:outline-none focus:border-slate-800"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter size={11} /> Filter:
          </span>
          {(
            [
              { key: "all", label: "Semua" },
              { key: "admin", label: "Admin Saja" },
              { key: "user", label: "User Biasa" },
              { key: "pro", label: "Member Pro" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setRoleFilter(tab.key)}
              className={`px-2.5 py-1 text-[10px] font-bold border transition-all cursor-pointer whitespace-nowrap ${
                roleFilter === tab.key
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-300 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none">
                <th className="py-3 px-4">Pengguna</th>
                <th className="py-3 px-4">Terdaftar</th>
                <th className="py-3 px-4 text-center">Strip Dibuat</th>
                <th className="py-3 px-4 text-center">Status Tier</th>
                <th className="py-3 px-4 text-center">Peran (Role)</th>
                <th className="py-3 px-4 text-right">Aksi Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const isBusy = updatingId === u.id;
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatar_url}
                            alt={u.display_name}
                            className="w-8 h-8 border border-slate-300 bg-slate-100 object-cover flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                              <span>{u.display_name || "Tanpa Nama"}</span>
                              {u.role === "admin" && (
                                <span className="px-1.5 py-0.2 bg-purple-100 text-purple-700 text-[8.5px] font-bold border border-purple-300 uppercase">
                                  Admin
                                </span>
                              )}
                              {u.is_pro && (
                                <span className="px-1.5 py-0.2 bg-amber-100 text-amber-700 text-[8.5px] font-bold border border-amber-300 uppercase flex items-center gap-0.5">
                                  <Crown size={9} /> Pro
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                        {new Date(u.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      <td className="py-3 px-4 text-center font-bold text-slate-800 text-[11px]">
                        {u.creations_count}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleTier(u)}
                          disabled={isBusy}
                          className={`px-2.5 py-1 text-[9.5px] font-bold border transition-transform active:scale-95 cursor-pointer ${
                            u.is_pro
                              ? "bg-amber-100 text-amber-800 border-amber-400 hover:bg-amber-200"
                              : "bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200"
                          }`}
                          title="Klik untuk mengubah tier Free / Pro"
                        >
                          {u.is_pro ? "★ PRO ACCESS" : "FREE TIER"}
                        </button>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-[9.5px] font-bold border ${
                            u.role === "admin"
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-slate-100 text-slate-700 border-slate-300"
                          }`}
                        >
                          {u.role === "admin" ? (
                            <ShieldCheck size={11} className="text-[#FFE66D]" />
                          ) : (
                            <Shield size={11} />
                          )}
                          {u.role.toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleRole(u)}
                          disabled={isBusy}
                          className="px-2.5 py-1 bg-white border border-slate-800 hover:bg-slate-50 text-[10px] font-bold text-slate-800 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                        >
                          {u.role === "admin" ? "Jadikan User" : "Jadikan Admin"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    Tidak ada pengguna yang cocok dengan filter pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
