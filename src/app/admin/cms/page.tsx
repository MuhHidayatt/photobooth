"use client";

import React, { useState, useEffect } from "react";
import {
  Palette,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Crown,
  Layers,
  Smile,
  RefreshCw,
  Sparkles,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import {
  fetchCmsFrames,
  saveCmsFrame,
  deleteCmsFrame,
  fetchCmsStickers,
  saveCmsSticker,
  deleteCmsSticker,
} from "@/utils/adminHelpers";
import { CmsFrameItem, CmsStickerItem } from "@/types/admin";
import { THEMES } from "@/store/usePhotoboothStore";
import CreateTemplateModal from "@/components/templates/CreateTemplateModal";

export default function AdminCmsPage() {
  const [activeTab, setActiveTab] = useState<"frames" | "stickers" | "themes">("frames");

  // Frames state
  const [frames, setFrames] = useState<CmsFrameItem[]>([]);
  const [framesLoading, setFramesLoading] = useState(true);
  const [isFrameModalOpen, setIsFrameModalOpen] = useState(false);
  const [isCustomFrameModalOpen, setIsCustomFrameModalOpen] = useState(false);
  const [newFrame, setNewFrame] = useState({
    name: "",
    type: "strip" as "strip" | "grid",
    frames: 4,
    aspect_ratio: "4/3",
    bg_color: "#FFFFFF",
    text_color: "#1E293B",
    is_pro: false,
    is_active: true,
  });

  // Stickers state
  const [stickers, setStickers] = useState<CmsStickerItem[]>([]);
  const [stickersLoading, setStickersLoading] = useState(true);
  const [isStickerModalOpen, setIsStickerModalOpen] = useState(false);
  const [newSticker, setNewSticker] = useState({
    name: "",
    category: "Doodles" as "Doodles" | "Icons" | "Aesthetic" | "Words",
    is_pro: false,
    is_active: true,
  });

  const loadFrames = async () => {
    setFramesLoading(true);
    try {
      const data = await fetchCmsFrames();
      setFrames(data);
    } finally {
      setFramesLoading(false);
    }
  };

  const loadStickers = async () => {
    setStickersLoading(true);
    try {
      const data = await fetchCmsStickers();
      setStickers(data);
    } finally {
      setStickersLoading(false);
    }
  };

  useEffect(() => {
    loadFrames();
    loadStickers();
  }, []);

  const handleCreateFrame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFrame.name.trim()) return;

    try {
      const created = await saveCmsFrame(newFrame);
      setFrames((prev) => [created, ...prev]);
      setIsFrameModalOpen(false);
      setNewFrame({
        name: "",
        type: "strip",
        frames: 4,
        aspect_ratio: "4/3",
        bg_color: "#FFFFFF",
        text_color: "#1E293B",
        is_pro: false,
        is_active: true,
      });
    } catch {
      alert("Gagal menyimpan frame baru.");
    }
  };

  const handleDeleteFrame = async (id: string) => {
    if (!confirm("Hapus template frame ini dari sistem?")) return;
    try {
      await deleteCmsFrame(id);
      setFrames((prev) => prev.filter((f) => f.id !== id));
    } catch {
      alert("Gagal menghapus frame.");
    }
  };

  const handleCreateSticker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSticker.name.trim()) return;

    try {
      const created = await saveCmsSticker(newSticker);
      setStickers((prev) => [created, ...prev]);
      setIsStickerModalOpen(false);
      setNewSticker({
        name: "",
        category: "Doodles",
        is_pro: false,
        is_active: true,
      });
    } catch {
      alert("Gagal menyimpan stiker baru.");
    }
  };

  const handleDeleteSticker = async (id: string) => {
    if (!confirm("Hapus stiker ini dari sistem?")) return;
    try {
      await deleteCmsSticker(id);
      setStickers((prev) => prev.filter((s) => s.id !== id));
    } catch {
      alert("Gagal menghapus stiker.");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-300 p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-tight">
            CMS Studio (Kelola Konten)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Tambah template frame, dekorasi doodle, dan tema warna tanpa menyentuh kode program
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === "frames" && (
            <>
              <button
                onClick={() => setIsCustomFrameModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#FFE66D] border border-slate-900 text-slate-950 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:brightness-95 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
              >
                <Upload size={13} />
                <span>🖼️ Upload Frame Canva / Photoshop</span>
              </button>

              <button
                onClick={() => setIsFrameModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-800 text-slate-800 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-50 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
              >
                <Plus size={13} />
                <span>+ Layout Standar</span>
              </button>
            </>
          )}

          {activeTab === "stickers" && (
            <button
              onClick={() => setIsStickerModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:brightness-95 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
            >
              <Plus size={13} />
              <span>Tambah Stiker Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-300 bg-white">
        <button
          onClick={() => setActiveTab("frames")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "frames"
              ? "border-slate-900 text-slate-900 bg-slate-50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Layers size={14} />
          <span>Frames & Layouts ({frames.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("stickers")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "stickers"
              ? "border-slate-900 text-slate-900 bg-slate-50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Smile size={14} />
          <span>Stickers & Doodles ({stickers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("themes")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "themes"
              ? "border-slate-900 text-slate-900 bg-slate-50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Palette size={14} />
          <span>Theme Presets ({THEMES.length})</span>
        </button>
      </div>

      {/* TAB 1: FRAMES */}
      {activeTab === "frames" && (
        <div className="space-y-4">
          {/* Skenario A Feature Callout Banner */}
          <div className="p-3 bg-amber-50/80 border border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[#FFE66D] border border-slate-900 flex items-center justify-center font-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex-shrink-0">
                🖼️
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase">
                  Skenario A: Upload Gambar Desain Sendiri (Canva / Photoshop / Procreate)
                </h3>
                <p className="text-[10px] text-slate-600 mt-0.5">
                  Admin dapat mengunggah frame PNG transparan beresolusi tinggi, menata posisi lubang slot foto, serta menentukan akses Free atau PRO.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCustomFrameModalOpen(true)}
              className="px-3.5 py-2 bg-slate-900 text-white text-[11px] font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-800 cursor-pointer flex-shrink-0 flex items-center gap-1.5"
            >
              <Upload size={12} />
              <span>Upload Desain Sekarang</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {frames.map((f) => (
              <div
                key={f.id}
                className="bg-white border border-slate-300 p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 border border-slate-200 uppercase">
                      {f.type.toUpperCase()} • {f.frames} FRAMES
                    </span>
                    {f.is_pro ? (
                      <span className="flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-100 border border-amber-300 px-1.5 py-0.5">
                        <Crown size={10} /> PRO
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 border border-slate-200">
                        FREE
                      </span>
                    )}
                  </div>

                  {f.image_url ? (
                    <div className="h-40 border border-slate-300 bg-slate-100 relative overflow-hidden flex items-center justify-center p-2 group shadow-inner">
                      <img
                        src={f.image_url}
                        alt={f.name}
                        className="max-h-full max-w-full object-contain shadow-xs transition-transform group-hover:scale-105 duration-200"
                      />
                      <div className="absolute top-1.5 left-1.5 bg-slate-900/90 text-white text-[8px] font-bold px-1.5 py-0.5 uppercase tracking-wider backdrop-blur-xs flex items-center gap-1">
                        <Sparkles size={9} className="text-[#FFE66D]" />
                        <span>{f.frame_mode === "background" ? "Background" : "Canva / PNG"}</span>
                      </div>
                      {f.creator_name && (
                        <div className="absolute bottom-1.5 right-1.5 bg-white/90 text-slate-800 text-[8px] font-bold px-1.5 py-0.5 border border-slate-300 truncate max-w-[120px]">
                          {f.creator_name}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className="h-28 border border-slate-300 p-2 flex flex-col items-center justify-center gap-1 shadow-inner"
                      style={{ backgroundColor: f.bg_color, color: f.text_color }}
                    >
                      <div className="text-xs font-bold">{f.name}</div>
                      <div className="text-[9px] opacity-75">
                        {f.frames} Shots Collage
                      </div>
                    </div>
                  )}

                  <div className="text-xs space-y-1">
                    <div className="text-xs font-bold text-slate-900 truncate">{f.name}</div>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 border border-slate-300"
                        style={{ backgroundColor: f.bg_color }}
                      />
                      <span className="text-[9.5px] text-slate-500 font-bold">
                        {f.image_url ? "Custom Graphic Frame" : f.bg_color}
                      </span>
                    </div>
                  </div>
                </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle size={11} /> Aktif
                </span>
                <button
                  onClick={() => handleDeleteFrame(f.id)}
                  className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                  title="Hapus Frame"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
          </div>
        </div>
      )}

      {/* TAB 2: STICKERS */}
      {activeTab === "stickers" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {stickers.map((s) => (
            <div
              key={s.id}
              className="bg-white border border-slate-300 p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between items-center text-center group"
            >
              <div className="w-12 h-12 bg-slate-100 border border-slate-200 flex items-center justify-center my-2 text-slate-700">
                <Smile size={24} />
              </div>

              <div className="w-full space-y-1">
                <div className="text-[11px] font-bold text-slate-800 truncate">
                  {s.name}
                </div>
                <div className="text-[9px] text-slate-400 uppercase">
                  {s.category}
                </div>
              </div>

              <div className="w-full pt-2 mt-2 border-t border-slate-100 flex items-center justify-between">
                {s.is_pro ? (
                  <span className="text-[8.5px] font-bold text-amber-700 bg-amber-50 px-1 border border-amber-200">
                    PRO
                  </span>
                ) : (
                  <span className="text-[8.5px] text-slate-400">FREE</span>
                )}
                <button
                  onClick={() => handleDeleteSticker(s.id)}
                  className="text-red-500 hover:text-red-700 p-0.5 cursor-pointer"
                  title="Hapus Stiker"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: THEMES */}
      {activeTab === "themes" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {THEMES.map((thm) => (
            <div
              key={thm.id}
              className="bg-white border border-slate-300 p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-900 text-xs uppercase">
                  {thm.name}
                </div>
                <span className="text-[9px] px-1.5 py-0.2 bg-slate-100 border border-slate-300">
                  Built-in
                </span>
              </div>

              <div
                className="h-20 border border-slate-300 flex items-center justify-center font-bold text-xs"
                style={{ backgroundColor: thm.bg, color: thm.text }}
              >
                Sample Text Strip
              </div>

              <div className="text-[10px] space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Background:</span>
                  <span className="font-bold">{thm.bg}</span>
                </div>
                <div className="flex justify-between">
                  <span>Accent:</span>
                  <span className="font-bold">{thm.accent}</span>
                </div>
                <div className="flex justify-between">
                  <span>Text:</span>
                  <span className="font-bold">{thm.text}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: Tambah Frame */}
      {isFrameModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateFrame}
            className="bg-white border border-slate-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-md w-full p-5 space-y-4 font-mono text-xs animate-in fade-in zoom-in-95"
          >
            <div className="border-b border-slate-200 pb-2">
              <h2 className="text-sm font-bold uppercase text-slate-900">
                Tambah Template Frame Baru
              </h2>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">
                Nama Frame
              </label>
              <input
                type="text"
                required
                placeholder="contoh: Pastel Summer Strip"
                value={newFrame.name}
                onChange={(e) => setNewFrame({ ...newFrame, name: e.target.value })}
                className="w-full p-2 border border-slate-300 text-xs focus:border-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">
                  Tipe Layout
                </label>
                <select
                  value={newFrame.type}
                  onChange={(e) =>
                    setNewFrame({
                      ...newFrame,
                      type: e.target.value as "strip" | "grid",
                    })
                  }
                  className="w-full p-2 border border-slate-300 text-xs bg-white"
                >
                  <option value="strip">Strip Vertikal</option>
                  <option value="grid">Grid 2x2</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">
                  Jumlah Frame
                </label>
                <select
                  value={newFrame.frames}
                  onChange={(e) =>
                    setNewFrame({ ...newFrame, frames: Number(e.target.value) })
                  }
                  className="w-full p-2 border border-slate-300 text-xs bg-white"
                >
                  <option value={3}>3 Frames</option>
                  <option value={4}>4 Frames</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">
                  Warna Latar (Hex)
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={newFrame.bg_color}
                    onChange={(e) =>
                      setNewFrame({ ...newFrame, bg_color: e.target.value })
                    }
                    className="w-8 h-8 p-0 border border-slate-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={newFrame.bg_color}
                    onChange={(e) =>
                      setNewFrame({ ...newFrame, bg_color: e.target.value })
                    }
                    className="flex-1 p-2 border border-slate-300 text-xs uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">
                  Warna Teks (Hex)
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={newFrame.text_color}
                    onChange={(e) =>
                      setNewFrame({ ...newFrame, text_color: e.target.value })
                    }
                    className="w-8 h-8 p-0 border border-slate-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={newFrame.text_color}
                    onChange={(e) =>
                      setNewFrame({ ...newFrame, text_color: e.target.value })
                    }
                    className="flex-1 p-2 border border-slate-300 text-xs uppercase"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="frame-pro"
                checked={newFrame.is_pro}
                onChange={(e) =>
                  setNewFrame({ ...newFrame, is_pro: e.target.checked })
                }
                className="cursor-pointer"
              />
              <label
                htmlFor="frame-pro"
                className="text-[10px] font-bold text-slate-700 cursor-pointer select-none"
              >
                Hanya untuk Pengguna Pro / VIP
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsFrameModalOpen(false)}
                className="px-3 py-2 border border-slate-300 bg-white text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 text-white font-bold hover:bg-slate-800 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                Simpan Frame
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Tambah Stiker */}
      {isStickerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateSticker}
            className="bg-white border border-slate-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-sm w-full p-5 space-y-4 font-mono text-xs animate-in fade-in zoom-in-95"
          >
            <div className="border-b border-slate-200 pb-2">
              <h2 className="text-sm font-bold uppercase text-slate-900">
                Tambah Stiker Baru
              </h2>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">
                Nama Stiker
              </label>
              <input
                type="text"
                required
                placeholder="contoh: Star Retro"
                value={newSticker.name}
                onChange={(e) =>
                  setNewSticker({ ...newSticker, name: e.target.value })
                }
                className="w-full p-2 border border-slate-300 text-xs focus:border-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">
                Kategori
              </label>
              <select
                value={newSticker.category}
                onChange={(e) =>
                  setNewSticker({
                    ...newSticker,
                    category: e.target.value as any,
                  })
                }
                className="w-full p-2 border border-slate-300 text-xs bg-white"
              >
                <option value="Doodles">Doodles</option>
                <option value="Icons">Icons</option>
                <option value="Aesthetic">Aesthetic</option>
                <option value="Words">Words / Typography</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="sticker-pro"
                checked={newSticker.is_pro}
                onChange={(e) =>
                  setNewSticker({ ...newSticker, is_pro: e.target.checked })
                }
                className="cursor-pointer"
              />
              <label
                htmlFor="sticker-pro"
                className="text-[10px] font-bold text-slate-700 cursor-pointer select-none"
              >
                Khusus Pengguna Pro
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsStickerModalOpen(false)}
                className="px-3 py-2 border border-slate-300 bg-white text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 text-white font-bold hover:bg-slate-800 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                Simpan Stiker
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Skenario A: Upload Gambar Desain Sendiri Modal (Canva / Photoshop / Procreate) */}
      <CreateTemplateModal
        isOpen={isCustomFrameModalOpen}
        onClose={() => setIsCustomFrameModalOpen(false)}
        onCreated={() => {
          loadFrames();
        }}
        isAdmin={true}
      />
    </div>
  );
}
