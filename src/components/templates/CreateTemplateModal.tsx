"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Sparkles,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  Palette,
  Layers,
  Type,
  Smile,
  AlertCircle,
  HelpCircle,
  Trash2,
} from "lucide-react";
import { ActiveSticker, FILTERS } from "@/store/usePhotoboothStore";
import { STICKERS } from "@/components/StickerAssets";
import { CommunityFrameTemplate } from "@/types/template";
import { useAuthStore } from "@/store/useAuthStore";
import { uploadBase64ToStorage } from "@/utils/supabaseHelpers";

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newTemplate: CommunityFrameTemplate) => void;
  initialValues?: {
    name?: string;
    description?: string;
    type?: "strip" | "grid";
    frames?: number;
    bg_color?: string;
    text_color?: string;
    caption?: string;
    default_filter?: string;
    stickers?: ActiveSticker[];
    image_url?: string;
    frame_mode?: "overlay" | "background";
  };
}

const PRESET_BG_COLORS = [
  { name: "Cream", hex: "#E9E2D8" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Pastel Pink", hex: "#FFE4E6" },
  { name: "Matcha", hex: "#7C8F63" },
  { name: "Peach", hex: "#DDA07A" },
  { name: "Sky Blue", hex: "#7B99B7" },
  { name: "Terracotta", hex: "#B56B52" },
  { name: "Charcoal", hex: "#18181B" },
];

const PRESET_TEXT_COLORS = [
  { name: "Dark Slate", hex: "#1E293B" },
  { name: "Pure White", hex: "#FFFFFF" },
  { name: "Deep Maroon", hex: "#881337" },
  { name: "Espresso", hex: "#78350F" },
  { name: "Forest", hex: "#14532D" },
];

export default function CreateTemplateModal({
  isOpen,
  onClose,
  onCreated,
  initialValues,
}: CreateTemplateModalProps) {
  const { user, profile } = useAuthStore();

  // Mode switcher: "upload" (Canva / Photoshop) vs "studio" (Warna & Stiker)
  const [creationMode, setCreationMode] = useState<"upload" | "studio">(
    initialValues?.image_url ? "upload" : "upload"
  );

  // Common metadata
  const [name, setName] = useState(initialValues?.name || "");
  const [description, setDescription] = useState(initialValues?.description || "");
  const [layoutType, setLayoutType] = useState<"strip" | "grid">(
    initialValues?.type || "strip"
  );
  const [framesCount, setFramesCount] = useState<number>(
    initialValues?.frames || 4
  );
  const [defaultFilter, setDefaultFilter] = useState(initialValues?.default_filter || "none");

  // Custom Image Upload State (Skenario A)
  const [frameImage, setFrameImage] = useState<string | null>(
    initialValues?.image_url || null
  );
  const [frameMode, setFrameMode] = useState<"overlay" | "background">(
    initialValues?.frame_mode || "overlay"
  );
  const [hideDefaultFooter, setHideDefaultFooter] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [imageFileName, setImageFileName] = useState<string>("");

  // Studio Mode State
  const [bgColor, setBgColor] = useState(initialValues?.bg_color || "#E9E2D8");
  const [textColor, setTextColor] = useState(initialValues?.text_color || "#1E293B");
  const [caption, setCaption] = useState(initialValues?.caption || "POSEAN MEMORIES ♡");
  const [stickers, setStickers] = useState<ActiveSticker[]>(
    initialValues?.stickers || []
  );
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [studioSubTab, setStudioSubTab] = useState<"colors" | "stickers" | "caption">("colors");

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [mobileViewTab, setMobileViewTab] = useState<"form" | "preview">("form");

  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle image file selection
  const handleFileProcess = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Mohon pilih file gambar yang valid (PNG, JPG, WEBP).");
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      setErrorMsg("Ukuran file terlalu besar (maksimal 12MB).");
      return;
    }

    setErrorMsg("");
    setImageFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setFrameImage(result);
      if (!name) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        setName(`${cleanName.charAt(0).toUpperCase() + cleanName.slice(1)} Frame`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  // Add sticker to template
  const handleAddSticker = (type: string) => {
    const newSticker: ActiveSticker = {
      id: `st_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      x: 35 + Math.random() * 20,
      y: 35 + Math.random() * 20,
      scale: 1.0,
      rotation: Math.floor((Math.random() - 0.5) * 20),
    };
    setStickers([...stickers, newSticker]);
    setSelectedStickerId(newSticker.id);
  };

  const handleDeleteSticker = (id: string) => {
    setStickers(stickers.filter((s) => s.id !== id));
    if (selectedStickerId === id) setSelectedStickerId(null);
  };

  // Sticker dragging within the preview container
  const handleStickerPointerDown = (e: React.PointerEvent, sticker: ActiveSticker) => {
    e.stopPropagation();
    setSelectedStickerId(sticker.id);

    const container = previewRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const targetEl = e.currentTarget as HTMLElement;
    targetEl.setPointerCapture(e.pointerId);

    const onPointerMove = (moveEvt: PointerEvent) => {
      const relX = ((moveEvt.clientX - rect.left) / rect.width) * 100;
      const relY = ((moveEvt.clientY - rect.top) / rect.height) * 100;

      const safeX = Math.max(5, Math.min(95, relX));
      const safeY = Math.max(5, Math.min(95, relY));

      setStickers((prev) =>
        prev.map((s) => (s.id === sticker.id ? { ...s, x: safeX, y: safeY } : s))
      );
    };

    const onPointerUp = (upEvt: PointerEvent) => {
      targetEl.removeEventListener("pointermove", onPointerMove);
      targetEl.removeEventListener("pointerup", onPointerUp);
      try {
        targetEl.releasePointerCapture(upEvt.pointerId);
      } catch {
        // ignore
      }
    };

    targetEl.addEventListener("pointermove", onPointerMove);
    targetEl.addEventListener("pointerup", onPointerUp);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg("Eits! Anda harus login terlebih dahulu untuk mempublikasikan frame.");
      return;
    }
    if (!name.trim()) {
      setErrorMsg("Mohon masukkan nama frame kreasi Anda.");
      return;
    }
    if (creationMode === "upload" && !frameImage) {
      setErrorMsg("Mohon unggah gambar desain frame (dari Canva/Photoshop) terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      let finalImageUrl: string | undefined = undefined;

      // If user uploaded an image and it's base64 dataUrl, upload to storage
      if (creationMode === "upload" && frameImage) {
        if (frameImage.startsWith("data:")) {
          finalImageUrl = await uploadBase64ToStorage(user.id, frameImage, "png");
        } else {
          finalImageUrl = frameImage;
        }
      }

      const { createCommunityTemplate } = await import("@/utils/templateHelpers");

      const creatorName = profile?.display_name || user?.user_metadata?.full_name || "Community Creator";
      const creatorAvatar =
        profile?.avatar_url ||
        `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(creatorName)}`;

      const newTpl = await createCommunityTemplate({
        user_id: user?.id,
        creator_name: creatorName,
        creator_avatar: creatorAvatar,
        name: name.trim(),
        description: description.trim(),
        type: layoutType,
        frames: framesCount,
        bg_color: creationMode === "upload" ? (frameMode === "background" ? "#FFFFFF" : bgColor) : bgColor,
        text_color: textColor,
        caption: hideDefaultFooter ? "" : caption.trim(),
        default_filter: defaultFilter,
        stickers: creationMode === "upload" ? [] : stickers,
        image_url: finalImageUrl,
        frame_mode: creationMode === "upload" ? frameMode : undefined,
      });

      onCreated(newTpl);
      onClose();
    } catch (err: any) {
      console.error("Error creating community frame:", err);
      setErrorMsg(err?.message || "Gagal membuat frame. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isGrid = layoutType === "grid";

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border-2 border-slate-900 w-full max-w-4xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] my-auto flex flex-col overflow-hidden max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* MODAL HEADER */}
        <div className="px-5 py-3.5 border-b-2 border-slate-900 bg-[#FFE66D] flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-white border border-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Sparkles size={16} className="text-slate-900" />
            </div>
            <div>
              <h2 className="font-mono font-bold text-xs sm:text-sm uppercase tracking-tight text-slate-900">
                Buat Frame Komunitas Baru
              </h2>
              <span className="text-[9px] font-mono text-slate-700 block -mt-0.5">
                Bagikan karya frame estetikmu untuk dinikmati seluruh pengguna Posean
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-800 hover:bg-black/10 border border-transparent hover:border-slate-900 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* ERROR NOTIFICATION */}
        {errorMsg && (
          <div className="mx-5 mt-4 p-2.5 bg-red-50 border border-red-400 text-red-800 font-mono text-xs flex items-center gap-2">
            <AlertCircle size={14} className="flex-shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* TOP MODE TOGGLE (Skenario A vs Studio) */}
        <div className="px-5 pt-4 pb-2 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-200/80 border border-slate-300 font-mono text-xs">
            <button
              type="button"
              onClick={() => setCreationMode("upload")}
              className={`py-2 px-3 flex items-center justify-center gap-2 font-bold uppercase transition-all cursor-pointer ${
                creationMode === "upload"
                  ? "bg-slate-900 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)]"
                  : "text-slate-700 hover:text-slate-950 hover:bg-slate-100"
              }`}
            >
              <Upload size={14} />
              <span>🖼️ Upload Canva / Photoshop</span>
            </button>
            <button
              type="button"
              onClick={() => setCreationMode("studio")}
              className={`py-2 px-3 flex items-center justify-center gap-2 font-bold uppercase transition-all cursor-pointer ${
                creationMode === "studio"
                  ? "bg-slate-900 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)]"
                  : "text-slate-700 hover:text-slate-950 hover:bg-slate-100"
              }`}
            >
              <Palette size={14} />
              <span>🎨 Studio Warna & Stiker</span>
            </button>
          </div>
        </div>

        {/* Mobile View Switcher (Form vs Live Preview) */}
        <div className="flex md:hidden border-b border-slate-300 bg-slate-100 font-mono text-[10px] select-none">
          <button
            type="button"
            onClick={() => setMobileViewTab("form")}
            className={`flex-1 py-2.5 text-center font-bold uppercase transition-all cursor-pointer ${
              mobileViewTab === "form"
                ? "bg-white text-slate-900 border-b-2 border-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            ✏️ Form Desain
          </button>
          <button
            type="button"
            onClick={() => setMobileViewTab("preview")}
            className={`flex-1 py-2.5 text-center font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mobileViewTab === "preview"
                ? "bg-white text-slate-900 border-b-2 border-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>👁️ Lihat Pratinjau</span>
            {frameImage && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
          </button>
        </div>

        {/* MODAL BODY (2 COLUMNS: CONTROLS & PREVIEW) */}
        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row font-mono">
          
          {/* LEFT: FORM CONTROLS */}
          <div className={`flex-1 p-4 sm:p-5 space-y-4 border-b md:border-b-0 md:border-r border-slate-200 ${mobileViewTab === "form" ? "block" : "hidden md:block"}`}>
            
            {/* 1. Name & Description */}
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  NAMA FRAME <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Y2K Cyber Angel / Cute Summer Strip"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-800 rounded-none focus:outline-none focus:ring-1 focus:ring-slate-800"
                  maxLength={40}
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  DESKRIPSI SINGKAT
                </label>
                <input
                  type="text"
                  placeholder="Deskripsikan konsep frame atau tema estetikanya..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-none focus:outline-none focus:border-slate-800"
                  maxLength={100}
                />
              </div>
            </div>

            {/* 2. Format Layout Selection */}
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
                BENTUK STRIP FOTO:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setLayoutType("strip");
                    setFramesCount(4);
                  }}
                  className={`p-2 border text-center text-xs font-bold transition-all cursor-pointer ${
                    layoutType === "strip" && framesCount === 4
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 bg-white hover:bg-slate-50 text-slate-800"
                  }`}
                >
                  <span className="block text-[11px]">4 Foto</span>
                  <span className="text-[8px] opacity-70">Life4Cuts</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLayoutType("strip");
                    setFramesCount(3);
                  }}
                  className={`p-2 border text-center text-xs font-bold transition-all cursor-pointer ${
                    layoutType === "strip" && framesCount === 3
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 bg-white hover:bg-slate-50 text-slate-800"
                  }`}
                >
                  <span className="block text-[11px]">3 Foto</span>
                  <span className="text-[8px] opacity-70">Trio Strip</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLayoutType("strip");
                    setFramesCount(2);
                  }}
                  className={`p-2 border text-center text-xs font-bold transition-all cursor-pointer ${
                    layoutType === "strip" && framesCount === 2
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 bg-white hover:bg-slate-50 text-slate-800"
                  }`}
                >
                  <span className="block text-[11px]">2 Foto</span>
                  <span className="text-[8px] opacity-70">Duo Strip</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLayoutType("grid");
                    setFramesCount(4);
                  }}
                  className={`p-2 border text-center text-xs font-bold transition-all cursor-pointer ${
                    layoutType === "grid"
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 bg-white hover:bg-slate-50 text-slate-800"
                  }`}
                >
                  <span className="block text-[11px]">Grid 2x2</span>
                  <span className="text-[8px] opacity-70">Postcard</span>
                </button>
              </div>
            </div>

            {/* 3. MODE A: UPLOAD CANVA / PHOTOSHOP IMAGE */}
            {creationMode === "upload" && (
              <div className="space-y-4 pt-1">
                {/* File Dropzone */}
                <div>
                  <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                    UNGGAH FILE GAMBAR DESAIN (PNG / JPG) <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileProcess(e.target.files[0]);
                      }
                    }}
                  />

                  {!frameImage ? (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                      }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                        isDragOver
                          ? "border-amber-500 bg-amber-50"
                          : "border-slate-400 bg-slate-50 hover:bg-white hover:border-slate-800"
                      }`}
                    >
                      <div className="p-3 bg-[#FFE66D] border border-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <Upload size={20} className="text-slate-950" />
                      </div>
                      <p className="text-xs font-bold text-slate-800 mt-1 uppercase">
                        Klik atau Drag & Drop Gambar ke Sini
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Mendukung PNG, JPG, WebP (Maks 12MB)
                      </p>
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 border border-amber-300 mt-1">
                        ✨ PNG Transparan direkomendasikan untuk efek bingkai bolong
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 border border-slate-800 bg-slate-50 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-12 border border-slate-300 bg-white overflow-hidden flex items-center justify-center flex-shrink-0">
                          <img
                            src={frameImage}
                            alt="Uploaded preview"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-slate-900 truncate">
                            {imageFileName || "Desain_Frame.png"}
                          </p>
                          <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle size={10} />
                            <span>Gambar siap dipublikasikan</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1 text-[10px] font-bold border border-slate-300 bg-white hover:bg-slate-100 cursor-pointer"
                        >
                          Ganti
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFrameImage(null);
                            setImageFileName("");
                          }}
                          className="p-1 text-red-500 hover:bg-red-50 border border-transparent hover:border-red-300 cursor-pointer"
                          title="Hapus gambar"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Frame Layer Mode Selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-700 uppercase block">
                    POSISI LAYER DESAIN:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFrameMode("overlay")}
                      className={`p-2 border text-left cursor-pointer transition-all ${
                        frameMode === "overlay"
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <span className="text-xs font-bold block">✨ Overlay (Menimpa Foto)</span>
                      <span className="text-[8.5px] opacity-75 leading-tight block mt-0.5">
                        PNG transparan menutup di atas foto kamera (ala bingkai cutout Canva)
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFrameMode("background")}
                      className={`p-2 border text-left cursor-pointer transition-all ${
                        frameMode === "background"
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <span className="text-xs font-bold block">🖼️ Background (Di Belakang)</span>
                      <span className="text-[8.5px] opacity-75 leading-tight block mt-0.5">
                        Gambar berada di latar belakang, slot foto diletakkan rapi di atasnya
                      </span>
                    </button>
                  </div>
                </div>

                {/* Footer Visibility Option */}
                <div className="p-2.5 bg-slate-100 border border-slate-300 flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="hide-footer-chk"
                    checked={hideDefaultFooter}
                    onChange={(e) => setHideDefaultFooter(e.target.checked)}
                    className="mt-0.5 cursor-pointer"
                  />
                  <label htmlFor="hide-footer-chk" className="text-[10px] text-slate-700 cursor-pointer leading-tight">
                    <span className="font-bold block">Sembunyikan Teks Footer Bawaan</span>
                    <span>
                      Centang jika gambar desain Canva Anda sudah memiliki logo, tulisan, atau tanggal sendiri di bagian bawah.
                    </span>
                  </label>
                </div>

                {/* Canva Dimension Cheat Sheet */}
                <div className="p-2.5 bg-amber-50/70 border border-amber-300 text-[9.5px] text-amber-900 space-y-1">
                  <div className="flex items-center gap-1 font-bold uppercase text-[10px]">
                    <HelpCircle size={11} />
                    <span>Panduan Ukuran Kanvas Canva / Photoshop:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 pl-1 opacity-90">
                    <li>
                      <strong>Strip 4 Foto:</strong> Rasio 1:3.27 (misal: 600 x 1960 px atau 300 x 980 px)
                    </li>
                    <li>
                      <strong>Strip 3 Foto:</strong> Rasio 1:2.53 (misal: 600 x 1520 px atau 300 x 760 px)
                    </li>
                    <li>
                      <strong>Grid 2x2:</strong> Rasio 3.8:4.4 (misal: 760 x 880 px atau 1200 x 1390 px)
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* 4. MODE B: STUDIO PALETTE & DOODLES */}
            {creationMode === "studio" && (
              <div className="space-y-4 pt-1">
                {/* Sub tabs */}
                <div className="flex border-b border-slate-300">
                  <button
                    type="button"
                    onClick={() => setStudioSubTab("colors")}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1 border-b-2 ${
                      studioSubTab === "colors"
                        ? "border-slate-900 text-slate-900 bg-white"
                        : "border-transparent text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    <Palette size={11} />
                    <span>Warna</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudioSubTab("stickers")}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1 border-b-2 ${
                      studioSubTab === "stickers"
                        ? "border-slate-900 text-slate-900 bg-white"
                        : "border-transparent text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    <Smile size={11} />
                    <span>Stiker ({stickers.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudioSubTab("caption")}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1 border-b-2 ${
                      studioSubTab === "caption"
                        ? "border-slate-900 text-slate-900 bg-white"
                        : "border-transparent text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    <Type size={11} />
                    <span>Caption</span>
                  </button>
                </div>

                {/* Subtab: Colors */}
                {studioSubTab === "colors" && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                        Warna Background Frame
                      </label>
                      <div className="grid grid-cols-4 gap-1.5 mb-1.5">
                        {PRESET_BG_COLORS.map((c) => (
                          <button
                            key={c.hex}
                            type="button"
                            onClick={() => setBgColor(c.hex)}
                            className={`flex items-center gap-1 p-1 border text-[9px] transition-all cursor-pointer ${
                              bgColor.toLowerCase() === c.hex.toLowerCase()
                                ? "border-slate-900 ring-1 ring-slate-900"
                                : "border-slate-300 hover:border-slate-400 bg-white"
                            }`}
                          >
                            <span
                              className="w-3.5 h-3.5 border border-slate-300 inline-block flex-shrink-0"
                              style={{ backgroundColor: c.hex }}
                            />
                            <span className="truncate">{c.name}</span>
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                          className="w-7 h-7 p-0 border border-slate-400 cursor-pointer rounded-none"
                        />
                        <input
                          type="text"
                          value={bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                          className="w-24 px-2 py-0.5 text-xs border border-slate-300 bg-white uppercase font-mono"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                        Warna Teks & Border
                      </label>
                      <div className="grid grid-cols-3 gap-1.5 mb-1.5">
                        {PRESET_TEXT_COLORS.map((c) => (
                          <button
                            key={c.hex}
                            type="button"
                            onClick={() => setTextColor(c.hex)}
                            className={`flex items-center gap-1 p-1 border text-[9px] transition-all cursor-pointer ${
                              textColor.toLowerCase() === c.hex.toLowerCase()
                                ? "border-slate-900 ring-1 ring-slate-900"
                                : "border-slate-300 hover:border-slate-400 bg-white"
                            }`}
                          >
                            <span
                              className="w-3.5 h-3.5 border border-slate-300 inline-block flex-shrink-0"
                              style={{ backgroundColor: c.hex }}
                            />
                            <span className="truncate">{c.name}</span>
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          className="w-7 h-7 p-0 border border-slate-400 cursor-pointer rounded-none"
                        />
                        <input
                          type="text"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          className="w-24 px-2 py-0.5 text-xs border border-slate-300 bg-white uppercase font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Subtab: Stickers */}
                {studioSubTab === "stickers" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        KLIK UNTUK MENAMBAH STIKER:
                      </span>
                      {stickers.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setStickers([])}
                          className="text-[9px] text-red-500 hover:underline cursor-pointer"
                        >
                          Hapus Semua
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {STICKERS.map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => handleAddSticker(st.id)}
                          className="p-1.5 border border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-800 flex flex-col items-center gap-1 transition-all cursor-pointer"
                        >
                          <div className="w-6 h-6">{st.render(textColor)}</div>
                          <span className="text-[8px] text-slate-600 truncate max-w-full">
                            {st.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subtab: Caption */}
                {studioSubTab === "caption" && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-600 uppercase block">
                      Teks Caption di Bawah Strip
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: BEST MEMORIES 2026 ♡"
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-800 rounded-none focus:outline-none focus:ring-1 focus:ring-slate-800"
                      maxLength={35}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Filter recommendation */}
            <div className="pt-2 border-t border-slate-200">
              <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                Rekomendasi Filter Warna Kamera
              </label>
              <select
                value={defaultFilter}
                onChange={(e) => setDefaultFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-none focus:outline-none focus:border-slate-800"
              >
                {FILTERS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.badge})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* RIGHT: LIVE INTERACTIVE PREVIEW */}
          <div className={`w-full md:w-[380px] p-4 sm:p-5 bg-slate-200/80 flex flex-col items-center justify-center select-none min-h-[340px] overflow-hidden ${mobileViewTab === "preview" ? "flex" : "hidden md:flex"}`}>
            <span className="text-[9px] font-mono font-bold tracking-widest text-slate-500 uppercase mb-2">
              ✦ PRATINJAU STRIP FRAME ✦
            </span>

            {/* The Strip preview box */}
            <div
              ref={previewRef}
              className={`relative border-2 border-slate-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-3 flex flex-col transition-all duration-200 overflow-hidden ${
                isGrid ? "w-[220px] h-[270px]" : "w-[170px] min-h-[350px]"
              }`}
              style={{
                backgroundColor:
                  creationMode === "upload" && frameMode === "background" && frameImage
                    ? "transparent"
                    : bgColor,
                color: textColor,
              }}
            >
              {/* If Background mode with custom image */}
              {creationMode === "upload" && frameMode === "background" && frameImage && (
                <img
                  src={frameImage}
                  alt="Background frame preview"
                  className="absolute inset-0 w-full h-full object-fill pointer-events-none z-0"
                />
              )}

              {/* Photo slots container */}
              <div
                className={`w-full flex-1 gap-2 relative z-10 ${
                  isGrid
                    ? "grid grid-cols-2 grid-rows-2 h-[180px]"
                    : "flex flex-col"
                }`}
              >
                {Array.from({ length: framesCount }).map((_, idx) => (
                  <div
                    key={idx}
                    className="w-full flex-1 bg-black/15 border border-black/20 flex items-center justify-center min-h-[50px] relative overflow-hidden"
                  >
                    <span className="text-[8.5px] font-mono opacity-50 font-bold tracking-widest uppercase">
                      PHOTO #{idx + 1}
                    </span>
                  </div>
                ))}

                {/* Stickers placed in studio mode */}
                {creationMode === "studio" &&
                  stickers.map((st) => {
                    const stDef = STICKERS.find((s) => s.id === st.type);
                    const isSelected = selectedStickerId === st.id;

                    return (
                      <div
                        key={st.id}
                        onPointerDown={(e) => handleStickerPointerDown(e, st)}
                        className={`absolute w-8 h-8 cursor-move group select-none z-30 ${
                          isSelected
                            ? "border border-dashed border-sky-500 ring-1 ring-sky-500/30"
                            : ""
                        }`}
                        style={{
                          left: `${st.x}%`,
                          top: `${st.y}%`,
                          transform: `translate(-50%, -50%) scale(${st.scale || 1}) rotate(${st.rotation || 0}deg)`,
                        }}
                      >
                        {stDef?.render(textColor)}
                        {isSelected && (
                          <button
                            type="button"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={() => handleDeleteSticker(st.id)}
                            className="absolute -top-3 -right-3 p-0.5 bg-red-500 text-white border border-slate-900 hover:bg-red-600 transition-colors pointer-events-auto cursor-pointer"
                          >
                            <X size={8} />
                          </button>
                        )}
                      </div>
                    );
                  })}
              </div>

              {/* OVERLAY MODE: Uploaded Canva PNG covers the strip! */}
              {creationMode === "upload" && frameMode === "overlay" && frameImage && (
                <img
                  src={frameImage}
                  alt="Frame overlay cutout"
                  className="absolute inset-0 w-full h-full object-fill pointer-events-none z-20"
                />
              )}

              {/* Strip Footer / Caption */}
              {!hideDefaultFooter && (
                <div className="pt-2.5 pb-0.5 text-center relative z-10 mt-auto">
                  <p
                    className="text-[8.5px] font-mono font-bold uppercase tracking-wider truncate max-w-full px-1"
                    style={{ color: textColor }}
                  >
                    {creationMode === "studio" ? caption || "POSEAN MEMORIES" : caption || "POSEAN MEMORIES"}
                  </p>
                  <p
                    className="text-[6.5px] font-mono uppercase tracking-[0.2em] opacity-60 mt-0.5"
                    style={{ color: textColor }}
                  >
                    GOOD MOMENTS
                  </p>
                </div>
              )}
            </div>

            <p className="text-[9px] text-slate-500 font-mono text-center mt-3">
              {creationMode === "upload"
                ? frameImage
                  ? "✓ Desain gambar berhasil dipasang di pratinjau"
                  : "Unggah gambar untuk melihat tampilan bingkai"
                : "Geser stiker di atas strip untuk menata posisi"}
            </p>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-5 py-3 border-t-2 border-slate-900 bg-white flex items-center justify-between select-none">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 hover:border-slate-800 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !name.trim() || (creationMode === "upload" && !frameImage)}
            className="px-6 py-2.5 border border-slate-900 bg-[#FFE66D] hover:bg-[#ffde43] text-slate-950 font-mono text-xs font-bold uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Sparkles size={13} />
            <span>{isSubmitting ? "Mempublikasikan..." : "🚀 Publikasikan Frame"}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
