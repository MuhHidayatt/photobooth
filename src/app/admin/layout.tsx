"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { isSupabaseConfigured } from "@/lib/supabase";
import AuthModal from "@/components/AuthModal";
import {
  LayoutDashboard,
  Users,
  Image as ImageIcon,
  Palette,
  Settings,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Menu,
  X,
  Database,
  ExternalLink,
  Sparkles,
  Lock,
  LogIn,
  LogOut,
  RefreshCw,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading, initialize, signOut } = useAuthStore();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const navItems = [
    {
      label: "Overview",
      href: "/admin",
      icon: LayoutDashboard,
      desc: "Metrik & Aktivitas",
    },
    {
      label: "CMS Studio",
      href: "/admin/cms",
      icon: Palette,
      desc: "Kelola Frame & Stiker",
    },
    {
      label: "User Management",
      href: "/admin/users",
      icon: Users,
      desc: "Daftar User & Hak Akses",
    },
    {
      label: "Moderasi Galeri",
      href: "/admin/moderation",
      icon: ImageIcon,
      desc: "Monitor Foto Seluruh User",
    },
    {
      label: "Pengaturan",
      href: "/admin/settings",
      icon: Settings,
      desc: "Branding & Sistem",
    },
  ];

  // 1. Loading State while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA] text-slate-800 font-mono select-none">
        <RefreshCw size={28} className="animate-spin text-slate-900 mb-3" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Memverifikasi Otoritas Admin...
        </span>
      </div>
    );
  }

  // 2. Gate: User Belum Login Sama Sekali
  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] p-4 font-mono select-none">
        <div className="bg-white border-2 border-slate-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-md w-full p-8 text-center space-y-5 animate-in fade-in zoom-in-95">
          <div className="w-14 h-14 bg-slate-900 border border-slate-800 text-[#FFE66D] flex items-center justify-center mx-auto shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <Lock size={26} />
          </div>

          <div className="space-y-1.5">
            <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-red-500 bg-red-50 border border-red-200 px-2.5 py-0.5">
              Area Khusus Administrator
            </span>
            <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight pt-1">
              Login Diperlukan
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              Dashboard ini hanya dapat diakses oleh administrator resmi. Silakan masuk menggunakan akun Admin Anda terlebih dahulu.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2.5 border-t border-slate-100">
            <button
              onClick={() => setAuthModalOpen(true)}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn size={14} className="text-[#FFE66D]" />
              <span>Login Sebagai Admin</span>
            </button>

            <Link
              href="/"
              className="w-full py-2.5 px-4 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5"
            >
              <ArrowLeft size={12} />
              <span>Kembali ke Photobooth</span>
            </Link>
          </div>
        </div>

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
        />
      </div>
    );
  }

  // 3. Gate: User Sudah Login TAPI Bukan Admin (Role !== 'admin')
  const isAdmin = profile?.role === "admin";
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] p-4 font-mono select-none">
        <div className="bg-white border-2 border-red-600 shadow-[6px_6px_0px_0px_rgba(220,38,38,1)] max-w-md w-full p-8 text-center space-y-5 animate-in fade-in zoom-in-95">
          <div className="w-14 h-14 bg-red-600 border border-red-700 text-white flex items-center justify-center mx-auto shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <ShieldAlert size={28} />
          </div>

          <div className="space-y-1.5">
            <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-red-700 bg-red-100 border border-red-300 px-2.5 py-0.5">
              403 • Akses Ditolak
            </span>
            <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight pt-1">
              Bukan Akun Administrator
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              Akun Anda (<strong>{profile.email}</strong>) terdaftar sebagai <strong>Pengguna Biasa</strong>.
              Hanya administrator yang diizinkan mengakses panel ini.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2.5 border-t border-slate-100">
            <Link
              href="/"
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-1.5"
            >
              <ArrowLeft size={13} />
              <span>Kembali ke Photobooth & Galeri</span>
            </Link>

            <button
              onClick={async () => {
                await signOut();
                router.push("/");
              }}
              className="w-full py-2.5 px-4 border border-red-200 text-red-600 hover:bg-red-50 font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut size={12} />
              <span>Ganti Akun / Logout</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authenticated Admin: Render Full Admin Dashboard
  return (
    <div className="min-h-screen flex bg-[#F8F9FA] text-slate-800 font-mono">
      {/* Mobile Sidebar Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Desktop & Mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-300 flex flex-col justify-between transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand header */}
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-white">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                P
              </div>
              <div className="leading-tight">
                <div className="font-bold tracking-wider text-xs text-slate-900 uppercase">
                  POSEAN ADMIN
                </div>
                <div className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Verified Control Panel
                </div>
              </div>
            </Link>
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden p-1 text-slate-500 hover:text-slate-900"
            >
              <X size={18} />
            </button>
          </div>

          {/* Environment Status Pill */}
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between text-[10px]">
            <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Database size={11} /> Environment:
            </span>
            <span
              className={`px-2 py-0.5 font-bold uppercase text-[9px] border ${
                isSupabaseConfigured
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                  : "bg-amber-50 text-amber-700 border-amber-300"
              }`}
            >
              {isSupabaseConfigured ? "Supabase Live" : "Local Sandbox"}
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <div className="px-3 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Menu Utama
            </div>
            {navItems.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname?.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold transition-all border ${
                    isActive
                      ? "bg-slate-900 text-white border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-x-1"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-transparent"
                  }`}
                >
                  <Icon
                    size={16}
                    className={isActive ? "text-[#FFE66D]" : "text-slate-500"}
                  />
                  <div className="flex-1">
                    <div>{item.label}</div>
                    <div
                      className={`text-[9px] font-normal tracking-tight ${
                        isActive ? "text-slate-300" : "text-slate-400"
                      }`}
                    >
                      {item.desc}
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer with Back to App link and User Info */}
        <div className="p-4 border-t border-slate-200 bg-white space-y-3">
          <Link
            href="/"
            className="flex items-center justify-between w-full p-2 text-xs font-bold border border-slate-800 bg-[#FFE66D] text-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:brightness-95 active:translate-x-[1px] active:translate-y-[1px] transition-all"
          >
            <span className="flex items-center gap-2">
              <ArrowLeft size={13} />
              <span>Buka Photobooth</span>
            </span>
            <ExternalLink size={12} />
          </Link>

          {/* Admin Identity pill */}
          <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200">
            <img
              src={
                profile.avatar_url ||
                `https://api.dicebear.com/7.x/pixel-art/svg?seed=${
                  profile.display_name || "Admin"
                }`
              }
              alt="Admin"
              className="w-7 h-7 border border-slate-300 object-cover"
            />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold text-slate-800 truncate">
                {profile.display_name || "Administrator"}
              </div>
              <div className="text-[8.5px] text-slate-400 truncate">
                {profile.email}
              </div>
            </div>
            <ShieldCheck size={14} className="text-emerald-600 flex-shrink-0" />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
            >
              <Menu size={16} />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">
                Admin Panel
              </span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <span className="text-xs font-bold text-slate-800 uppercase">
                {navItems.find((n) =>
                  n.href === "/admin"
                    ? pathname === "/admin"
                    : pathname?.startsWith(n.href)
                )?.label || "Dashboard"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-xs"
            >
              <Sparkles size={11} className="text-amber-500" />
              <span>Lihat Sisi Pengguna</span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
