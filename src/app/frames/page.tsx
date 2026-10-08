"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Plus,
  Search,
  Filter,
  Layers,
  Heart,
  ArrowRight,
  RefreshCw,
  CheckCircle,
  LogIn,
} from "lucide-react";
import { CommunityFrameTemplate } from "@/types/template";
import {
  fetchCommunityTemplates,
  deleteCommunityTemplate,
  incrementTemplateUsage,
} from "@/utils/templateHelpers";
import { usePhotoboothStore, LAYOUTS } from "@/store/usePhotoboothStore";
import { useAuthStore } from "@/store/useAuthStore";
import TemplateCard from "@/components/templates/TemplateCard";
import CreateTemplateModal from "@/components/templates/CreateTemplateModal";

export default function FramesPage() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const {
    setSelectedLayout,
    setSelectedTheme,
    setCaption,
    setStickers,
    applyFilter,
    setStep,
    setFrameImage,
  } = usePhotoboothStore();

  const [frames, setFrames] = useState<CommunityFrameTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "strip" | "grid" | "mine">("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load frames on mount
  useEffect(() => {
    async function loadFrames() {
      setLoading(true);
      try {
        const data = await fetchCommunityTemplates();
        setFrames(data);
      } catch (err) {
        console.error("Failed to load community frames:", err);
      } finally {
        setLoading(false);
      }
    }
    loadFrames();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handle clicking "+ Buat Frame Baru"
  const handleOpenCreateFrame = () => {
    if (!user) {
      // User must be logged in to create a frame
      router.push("/login?redirect=/frames&reason=create");
      return;
    }
    setIsCreateModalOpen(true);
  };

  // Handle clicking "Gunakan Frame"
  const handleUseFrame = async (frame: CommunityFrameTemplate) => {
    // If user is not logged in, direct them to login page
    if (!user) {
      router.push("/login?redirect=/frames&reason=use");
      return;
    }

    // 1. Select matching layout
    const layout =
      LAYOUTS.find((l) => l.frames === frame.frames && l.type === frame.type) || {
        id: `tpl_layout_${frame.id}`,
        name: frame.name,
        frames: frame.frames,
        previewClass: frame.type === "grid" ? "grid-cols-2" : `grid-rows-${frame.frames}`,
        type: frame.type,
        badge: "Community",
      };
    setSelectedLayout(layout);

    // 2. Select theme from frame colors
    setSelectedTheme({
      id: `theme_${frame.id}`,
      name: frame.name,
      bg: frame.bg_color,
      text: frame.text_color,
      border: `border border-[${frame.text_color}]`,
      accent: frame.bg_color,
      uiBg: "#FFFFFF",
      uiActiveBg: frame.bg_color,
    });

    // 3. Set caption
    if (frame.caption) {
      setCaption(frame.caption);
    }

    // 4. Set stickers
    if (frame.stickers && frame.stickers.length > 0) {
      setStickers(frame.stickers);
    } else {
      setStickers([]);
    }

    // 5. Set filter recommendation if any
    if (frame.default_filter && frame.default_filter !== "none") {
      applyFilter(frame.default_filter);
    }

    // 6. Set custom frame image (Canva / Photoshop PNG overlay or background)
    setFrameImage(frame.image_url || null, frame.frame_mode || "overlay");

    // 7. Increment usage
    await incrementTemplateUsage(frame.id);

    // 8. Redirect to photobooth camera
    setStep("camera");
    router.push("/");
  };

  // Handle delete
  const handleDeleteFrame = async (frameId: string) => {
    if (!window.confirm("Yakin ingin menghapus frame ini?")) return;
    try {
      await deleteCommunityTemplate(frameId);
      setFrames((prev) => prev.filter((t) => t.id !== frameId));
      showToast("Frame berhasil dihapus.");
    } catch (err) {
      console.error("Error deleting frame:", err);
    }
  };

  // Handle frame created
  const handleFrameCreated = (newFrame: CommunityFrameTemplate) => {
    setFrames((prev) => [newFrame, ...prev]);
    showToast(`Frame "${newFrame.name}" berhasil dipublikasikan!`);
  };

  // Filter & Search
  const filteredFrames = frames.filter((frame) => {
    // Filter tab
    if (filterType === "strip" && frame.type !== "strip") return false;
    if (filterType === "grid" && frame.type !== "grid") return false;
    if (filterType === "mine") {
      if (!user) return false;
      if (frame.user_id !== user.id && frame.creator_name !== profile?.display_name) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = frame.name.toLowerCase().includes(q);
      const matchCreator = frame.creator_name.toLowerCase().includes(q);
      const matchDesc = frame.description?.toLowerCase().includes(q);
      return matchName || matchCreator || matchDesc;
    }

    return true;
  });

  return (
    <div className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 font-mono">
      
      {/* TOAST ALERT */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 p-3 bg-emerald-500 text-white font-mono text-xs font-bold border border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2"
          >
            <CheckCircle size={14} />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold text-amber-600 tracking-[0.25em] uppercase">
              ✦ COMMUNITY SHOWCASE
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-[10px] text-slate-400">
              {frames.length} Frame Tersedia
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold uppercase tracking-tight text-slate-900">
            Koleksi Frame Komunitas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            Jelajahi ragam desain frame strip & grid karya pengguna Posean, gunakan langsung dalam 1-klik, atau buat dan bagikan frame kreasimu sendiri!
          </p>
        </div>

        {/* Primary CTA */}
        <button
          onClick={handleOpenCreateFrame}
          className="w-full sm:w-auto px-5 py-3 border border-slate-900 bg-[#FFE66D] hover:bg-[#ffde43] text-slate-950 font-mono text-xs font-bold uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
        >
          <Plus size={16} />
          <span>Buat Frame Baru</span>
        </button>
      </div>

      {/* GUEST NOTICE BANNER IF NOT LOGGED IN */}
      {!user && (
        <div className="my-5 p-4 bg-amber-50/90 border border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[3px_3px_0px_0px_rgba(245,158,11,1)]">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👀✨</span>
            <div>
              <p className="text-xs font-black text-amber-950 uppercase tracking-tight">
                Eits, naksir frame-nya? Login dulu yaa!
              </p>
              <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                Masuk akun sebentar yuk, biar kamu bebas pakai semua frame komunitas ini dan bisa bikin karyamu sendiri yang estetik.
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push("/login?redirect=/frames")}
            className="w-full sm:w-auto px-4 py-2 border border-slate-900 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer flex-shrink-0"
          >
            <LogIn size={13} />
            <span>Gas Login Dulu</span>
          </button>
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className="py-6 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none select-none -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3.5 py-2 text-xs font-bold uppercase transition-all whitespace-nowrap cursor-pointer border ${
              filterType === "all"
                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            }`}
          >
            Semua Frame ({frames.length})
          </button>
          <button
            onClick={() => setFilterType("strip")}
            className={`px-3.5 py-2 text-xs font-bold uppercase transition-all whitespace-nowrap cursor-pointer border ${
              filterType === "strip"
                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            }`}
          >
            Vertical Strip
          </button>
          <button
            onClick={() => setFilterType("grid")}
            className={`px-3.5 py-2 text-xs font-bold uppercase transition-all whitespace-nowrap cursor-pointer border ${
              filterType === "grid"
                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            }`}
          >
            Grid 2x2
          </button>
          {user && (
            <button
              onClick={() => setFilterType("mine")}
              className={`px-3.5 py-2 text-xs font-bold uppercase transition-all whitespace-nowrap cursor-pointer border ${
                filterType === "mine"
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
              }`}
            >
              Frame Saya
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama atau kreator frame..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-none focus:outline-none focus:border-slate-800"
          />
        </div>
      </div>

      {/* FRAMES GRID */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
          <RefreshCw size={24} className="animate-spin text-slate-600" />
          <p className="text-xs uppercase tracking-wider font-bold">Memuat Frame Komunitas...</p>
        </div>
      ) : filteredFrames.length === 0 ? (
        <div className="py-20 border-2 border-dashed border-slate-300 bg-white/50 text-center p-8 flex flex-col items-center justify-center gap-3">
          <Sparkles size={32} className="text-slate-300" />
          <p className="font-bold text-sm text-slate-700 uppercase">Tidak Ada Frame yang Ditemukan</p>
          <p className="text-xs text-slate-400 max-w-sm">
            {searchQuery
              ? `Tidak ada hasil pencarian untuk "${searchQuery}". Coba kata kunci lain.`
              : "Belum ada frame pada kategori ini. Jadilah orang pertama yang membuatnya!"}
          </p>
          <button
            onClick={handleOpenCreateFrame}
            className="mt-2 px-4 py-2 border border-slate-900 bg-[#FFE66D] text-slate-950 text-xs font-bold uppercase cursor-pointer"
          >
            + Buat Frame Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredFrames.map((frame) => {
            const canDelete =
              user?.id === frame.user_id ||
              profile?.role === "admin" ||
              frame.creator_name === profile?.display_name;

            return (
              <TemplateCard
                key={frame.id}
                template={frame}
                onUseTemplate={handleUseFrame}
                onDeleteTemplate={handleDeleteFrame}
                canDelete={canDelete}
              />
            );
          })}
        </div>
      )}

      {/* CREATE MODAL */}
      <CreateTemplateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleFrameCreated}
      />

    </div>
  );
}
