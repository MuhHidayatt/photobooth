"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Image as ImageIcon,
  Film,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  Palette,
  Eye,
  RefreshCw,
} from "lucide-react";
import { fetchAdminStats } from "@/utils/adminHelpers";
import { AdminStats } from "@/types/admin";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminStats();
      setStats(data);
    } catch (err) {
      console.error("Error loading admin stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const kpis = [
    {
      title: "Total Pengguna",
      value: stats?.totalUsers ?? "--",
      sub: "+2 minggu ini",
      icon: Users,
      color: "bg-blue-500",
      accent: "border-blue-600",
    },
    {
      title: "Total Strip Foto",
      value: stats?.totalPhotobooths ?? "--",
      sub: "Semua sesi tersimpan",
      icon: ImageIcon,
      color: "bg-amber-500",
      accent: "border-amber-600",
    },
    {
      title: "Animasi GIF/Video",
      value: stats?.totalGifs ?? "--",
      sub: "Loop motion rendered",
      icon: Film,
      color: "bg-emerald-500",
      accent: "border-emerald-600",
    },
    {
      title: "Aktif Hari Ini",
      value: stats?.activeToday ?? "--",
      sub: "Sesi foto real-time",
      icon: Activity,
      color: "bg-purple-500",
      accent: "border-purple-600",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Welcome */}
      <div className="bg-slate-900 border border-slate-800 text-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-800 text-[#FFE66D] text-[10px] font-bold uppercase tracking-widest border border-slate-700">
            <ShieldCheck size={12} />
            <span>Administrator Control Center</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-tight">
            Ringkasan Sistem & Performa Photobooth
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl font-normal leading-relaxed">
            Monitor metrik penggunaan, kelola konten template dan stiker dinamis, serta moderasi seluruh hasil photobooth yang disimpan pengguna.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-slate-900 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(255,255,255,0.4)] hover:bg-slate-100 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white border border-slate-300 p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {kpi.title}
                </span>
                <div className={`p-2 text-white ${kpi.color}`}>
                  <Icon size={16} />
                </div>
              </div>

              <div className="my-3">
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  {kpi.value}
                </div>
                <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                  {kpi.sub}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400">
                <span className="flex items-center gap-1 text-emerald-600 font-bold">
                  <TrendingUp size={11} /> Normal Traffic
                </span>
                <span>Live Sync</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Section: Activity Trends & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Trends Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-300 p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Tren Pembuatan Photobooth (7 Hari Terakhir)
              </h2>
              <p className="text-[10px] text-slate-400 font-normal">
                Jumlah strip & kolase foto yang di-generate pengguna per hari
              </p>
            </div>
            <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-100 border border-slate-300 uppercase">
              Grafik Harian
            </span>
          </div>

          {/* Bar Chart Visualizer */}
          <div className="pt-4 pb-2">
            <div className="flex items-end justify-between gap-3 h-44 px-2">
              {(stats?.activityTrends || []).map((item, i) => {
                const maxVal = Math.max(
                  ...(stats?.activityTrends.map((t) => t.count) || [10])
                );
                const heightPct = Math.max(12, Math.round((item.count / (maxVal || 1)) * 100));

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <div className="text-[10px] font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.count}
                    </div>
                    <div
                      className="w-full bg-slate-800 group-hover:bg-[#FFE66D] group-hover:border-slate-800 border border-slate-900 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      style={{ height: `${heightPct}%` }}
                    />
                    <div className="text-[9.5px] font-bold text-slate-500 uppercase mt-1">
                      {item.dayName}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Actions Shortcuts */}
        <div className="bg-white border border-slate-300 p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-3 flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 mb-3">
              Aksi Cepat Admin
            </h2>
            <div className="space-y-2">
              <Link
                href="/admin/cms"
                className="flex items-center justify-between p-3 border border-slate-200 hover:border-slate-800 hover:bg-slate-50 transition-all text-xs font-bold text-slate-800 group"
              >
                <div className="flex items-center gap-2.5">
                  <Palette size={15} className="text-amber-500" />
                  <div>
                    <div>Kelola Frame & Template</div>
                    <div className="text-[9px] text-slate-400 font-normal">
                      Tambah layout baru tanpa koding
                    </div>
                  </div>
                </div>
                <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>

              <Link
                href="/admin/users"
                className="flex items-center justify-between p-3 border border-slate-200 hover:border-slate-800 hover:bg-slate-50 transition-all text-xs font-bold text-slate-800 group"
              >
                <div className="flex items-center gap-2.5">
                  <Users size={15} className="text-blue-500" />
                  <div>
                    <div>Kelola Pengguna</div>
                    <div className="text-[9px] text-slate-400 font-normal">
                      Ubah role admin & status tier Pro
                    </div>
                  </div>
                </div>
                <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>

              <Link
                href="/admin/moderation"
                className="flex items-center justify-between p-3 border border-slate-200 hover:border-slate-800 hover:bg-slate-50 transition-all text-xs font-bold text-slate-800 group"
              >
                <div className="flex items-center gap-2.5">
                  <ImageIcon size={15} className="text-emerald-500" />
                  <div>
                    <div>Moderasi Foto Publik</div>
                    <div className="text-[9px] text-slate-400 font-normal">
                      Tinjau & hapus hasil foto user
                    </div>
                  </div>
                </div>
                <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 text-[9.5px] text-slate-600 space-y-1">
            <span className="font-bold flex items-center gap-1 text-slate-900">
              <Sparkles size={11} className="text-amber-500" />
              Saran Bisnis & Portofolio
            </span>
            <p className="leading-relaxed">
              Anda dapat mengunggah frame event musiman (Valentine, Wisuda, Ramadhan) di CMS untuk meningkatkan interaksi user.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Creations Feed */}
      <div className="bg-white border border-slate-300 p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Hasil Photobooth Terbaru
            </h2>
            <p className="text-[10px] text-slate-400 font-normal">
              Foto dan animasi yang baru saja di-generate oleh pengguna
            </p>
          </div>
          <Link
            href="/admin/moderation"
            className="text-[10px] font-bold text-slate-800 hover:underline flex items-center gap-1"
          >
            <span>Lihat Semua Galeri</span>
            <ArrowUpRight size={11} />
          </Link>
        </div>

        {stats?.recentCreations && stats.recentCreations.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {stats.recentCreations.map((item) => (
              <div
                key={item.id}
                className="border border-slate-200 bg-slate-50 p-2 flex flex-col justify-between group hover:border-slate-800 transition-colors"
              >
                <div className="aspect-[3/4] bg-slate-200 border border-slate-300 overflow-hidden relative mb-2">
                  {item.jpg_url ? (
                    <img
                      src={item.jpg_url}
                      alt={item.caption || "Strip"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px]">
                      No Preview
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-900 truncate">
                    {item.caption || "Tanpa Judul"}
                  </div>
                  <div className="text-[8.5px] text-slate-400 truncate">
                    Oleh: {item.user_name || item.user_email || "User"}
                  </div>
                  <div className="text-[8px] text-slate-400">
                    {new Date(item.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-200">
            Belum ada strip foto yang tersimpan. Coba buat sesi foto pertama dari halaman utama!
          </div>
        )}
      </div>
    </div>
  );
}
