"use client";

import React, { useState } from "react";
import {
  Settings,
  Save,
  Database,
  Shield,
  Layers,
  Sparkles,
  CheckCircle,
  RotateCcw,
} from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function AdminSettingsPage() {
  const [brandTitle, setBrandTitle] = useState("POSEAN");
  const [brandSubtitle, setBrandSubtitle] = useState("Good Moments");
  const [enableWatermark, setEnableWatermark] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(
      "posean_brand_settings",
      JSON.stringify({ brandTitle, brandSubtitle, enableWatermark })
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleResetDemo = () => {
    if (
      confirm(
        "Reset data demo lokal (users, frames, stickers) kembali ke pengaturan awal?"
      )
    ) {
      localStorage.removeItem("posean_admin_mock_users");
      localStorage.removeItem("posean_cms_frames");
      localStorage.removeItem("posean_cms_stickers");
      alert("Data demo berhasil di-reset.");
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-slate-300 p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-tight">
          Pengaturan Sistem & Branding
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Konfigurasi watermark photobooth, status integrasi database cloud, dan preferensi platform
        </p>
      </div>

      {/* Main Settings Form */}
      <form
        onSubmit={handleSave}
        className="bg-white border border-slate-300 p-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-6 font-mono text-xs"
      >
        <div className="border-b border-slate-200 pb-3">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Sparkles size={14} className="text-amber-500" />
            <span>Kustomisasi Watermark & Identitas Brand</span>
          </h2>
          <p className="text-[10px] text-slate-400 font-normal mt-0.5">
            Teks watermark yang akan dicetak di bagian footer strip foto pengguna
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              Judul Brand Utama
            </label>
            <input
              type="text"
              value={brandTitle}
              onChange={(e) => setBrandTitle(e.target.value)}
              className="w-full p-2.5 border border-slate-300 text-xs focus:border-slate-800"
              placeholder="POSEAN"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              Tagline / Subtitle
            </label>
            <input
              type="text"
              value={brandSubtitle}
              onChange={(e) => setBrandSubtitle(e.target.value)}
              className="w-full p-2.5 border border-slate-300 text-xs focus:border-slate-800"
              placeholder="Good Moments"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200">
          <input
            type="checkbox"
            id="wm-enable"
            checked={enableWatermark}
            onChange={(e) => setEnableWatermark(e.target.checked)}
            className="w-4 h-4 cursor-pointer"
          />
          <label
            htmlFor="wm-enable"
            className="text-[11px] font-bold text-slate-700 cursor-pointer select-none"
          >
            Aktifkan Watermark bawaan untuk pengguna Free Tier (Otomatis dilepas untuk member Pro)
          </label>
        </div>

        {/* Diagnostic Cloud Status */}
        <div className="border-t border-slate-200 pt-5 space-y-3">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Database size={14} className="text-blue-500" />
            <span>Status Koneksi Supabase & Cloud Storage</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px]">
            <div className="p-3 bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 block font-bold">Status Supabase Auth & DB:</span>
              <span
                className={`font-bold uppercase inline-flex items-center gap-1 ${
                  isSupabaseConfigured ? "text-emerald-700" : "text-amber-700"
                }`}
              >
                {isSupabaseConfigured
                  ? "✓ Terhubung (Live Production)"
                  : "⚠ Mode Sandbox Demo (Local Storage)"}
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 block font-bold">Bucket Penyimpanan Gambar:</span>
              <span className="font-bold uppercase text-slate-800">
                photobooths (High Res JPEG & GIF)
              </span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={handleResetDemo}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 text-slate-600 hover:text-red-600 text-xs font-bold cursor-pointer"
          >
            <RotateCcw size={12} />
            <span>Reset Demo Data</span>
          </button>

          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 text-white font-bold text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-800 cursor-pointer active:translate-x-[1px] active:translate-y-[1px]"
          >
            {saved ? <CheckCircle size={13} className="text-emerald-400" /> : <Save size={13} />}
            <span>{saved ? "Pengaturan Tersimpan!" : "Simpan Pengaturan"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
