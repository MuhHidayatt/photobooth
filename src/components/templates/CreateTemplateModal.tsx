"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Sparkles,
  Upload,
  CheckCircle,
  Palette,
  Type,
  Smile,
  AlertCircle,
  HelpCircle,
  Trash2,
  Sliders,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Eye,
} from "lucide-react";
import { ActiveSticker, FILTERS } from "@/store/usePhotoboothStore";
import { STICKERS } from "@/components/StickerAssets";
import { CommunityFrameTemplate, CustomSlot } from "@/types/template";
import { useAuthStore } from "@/store/useAuthStore";
import { uploadBase64ToStorage } from "@/utils/supabaseHelpers";
import { detectFrameSlots, generateDefaultSlots } from "@/utils/frameDetector";

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newTemplate: CommunityFrameTemplate) => void;
  isAdmin?: boolean;
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
    custom_slots?: CustomSlot[];
    frame_aspect_ratio?: number;
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

let stickerCounter = 0;
function createStickerItem(type: string): ActiveSticker {
  stickerCounter++;
  const offset = (stickerCounter * 17) % 25;
  return {
    id: `st_${Date.now()}_${stickerCounter}`,
    type,
    x: 35 + offset,
    y: 35 + offset,
    scale: 1.0,
    rotation: ((stickerCounter % 7) - 3) * 4,
  };
}

export default function CreateTemplateModal({
  isOpen,
  onClose,
  onCreated,
  isAdmin = false,
  initialValues,
}: CreateTemplateModalProps) {
  const { user, profile } = useAuthStore();
  const [isPro, setIsPro] = useState(false);

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
  const [customSlots, setCustomSlots] = useState<CustomSlot[]>(
    initialValues?.custom_slots || []
  );
  const [frameAspectRatio, setFrameAspectRatio] = useState<number | null>(
    initialValues?.frame_aspect_ratio || null
  );
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [detectionMessage, setDetectionMessage] = useState<string | null>(null);
  const [isCalibrateOpen, setIsCalibrateOpen] = useState<boolean>(false);

  // Auto-Trim & Full-Bleed Canva State
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(
    initialValues?.image_url || null
  );
  const [isAutoTrim, setIsAutoTrim] = useState<boolean>(true);
  const [trimZoom, setTrimZoom] = useState<number>(1.0);
  const [wasAutoTrimmed, setWasAutoTrimmed] = useState<boolean>(false);

  const [hideDefaultFooter, setHideDefaultFooter] = useState<boolean>(
    initialValues?.caption ? false : true
  );
  const [isAdvancedOpen, setIsAdvancedOpen] = useState<boolean>(false);
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

  // Centralized detection runner
  const runDetection = async (
    baseImg: string,
    trim: boolean,
    zoom: number = 1.0,
    count: number = framesCount,
    grid: boolean = layoutType === "grid"
  ) => {
    setIsDetecting(true);
    const detection = await detectFrameSlots(baseImg, count, grid, {
      autoTrim: trim,
      extraZoom: zoom,
    });

    if (trim && detection.wasTrimmed && detection.trimmedImageUrl) {
      setFrameImage(detection.trimmedImageUrl);
      setWasAutoTrimmed(true);
    } else {
      setFrameImage(baseImg);
      setWasAutoTrimmed(false);
    }

    setCustomSlots(detection.slots);
    setFrameAspectRatio(detection.imageAspectRatio);
    setDetectionMessage(detection.message || null);
    setIsDetecting(false);
  };

  // Handle image file selection with transparent slot detection
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
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      setOriginalImageUrl(result);
      const cleanBase = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[-_]/g, " ")
        .trim()
        .replace(/\s+frames?$/i, "")
        .trim();
      const generatedName = `${cleanBase.charAt(0).toUpperCase() + cleanBase.slice(1)} Frame`;
      if (!name || name.toLowerCase().includes("frame frame")) {
        setName(generatedName);
      }

      await runDetection(result, isAutoTrim, trimZoom, framesCount, layoutType === "grid");
    };
    reader.readAsDataURL(file);
  };

  const handleToggleAutoTrim = async (trim: boolean) => {
    setIsAutoTrim(trim);
    const source = originalImageUrl || frameImage;
    if (source) {
      await runDetection(source, trim, trimZoom, framesCount, layoutType === "grid");
    }
  };

  const handleZoomChange = async (zoom: number) => {
    setTrimZoom(zoom);
    const source = originalImageUrl || frameImage;
    if (source) {
      await runDetection(source, isAutoTrim, zoom, framesCount, layoutType === "grid");
    }
  };

  const handleRedetect = async () => {
    const source = originalImageUrl || frameImage;
    if (!source) return;
    await runDetection(source, isAutoTrim, trimZoom, framesCount, layoutType === "grid");
  };

  const handleLayoutChange = async (type: "strip" | "grid", count: number) => {
    setLayoutType(type);
    setFramesCount(count);
    const source = originalImageUrl || frameImage;
    if (source) {
      await runDetection(source, isAutoTrim, trimZoom, count, type === "grid");
    }
  };

  // Calibration helper handlers
  const handleSlotWidthChange = (val: number) => {
    setCustomSlots((prev) => {
      const current = prev.length > 0 ? prev : generateDefaultSlots(framesCount, layoutType === "grid");
      return current.map((s) => ({
        ...s,
        width: val,
        x: layoutType === "grid" ? s.x : Math.round(((100 - val) / 2) * 10) / 10,
      }));
    });
  };

  const handleSlotHeightChange = (val: number) => {
    setCustomSlots((prev) => {
      const current = prev.length > 0 ? prev : generateDefaultSlots(framesCount, layoutType === "grid");
      return current.map((s) => ({
        ...s,
        height: val,
      }));
    });
  };

  const handleSlotXChange = (val: number) => {
    setCustomSlots((prev) => {
      const current = prev.length > 0 ? prev : generateDefaultSlots(framesCount, layoutType === "grid");
      return current.map((s) => ({
        ...s,
        x: val,
      }));
    });
  };

  const handleSlotYOffsetChange = (val: number) => {
    setCustomSlots((prev) => {
      const current = prev.length > 0 ? prev : generateDefaultSlots(framesCount, layoutType === "grid");
      const currentFirstY = current[0]?.y || 5;
      const delta = val - currentFirstY;
      return current.map((s) => ({
        ...s,
        y: Math.max(0, Math.min(95, Math.round((s.y + delta) * 10) / 10)),
      }));
    });
  };

  const handleSlotGapChange = (val: number) => {
    setCustomSlots((prev) => {
      const current = prev.length > 0 ? prev : generateDefaultSlots(framesCount, layoutType === "grid");
      const startY = current[0]?.y || 5;
      const slotH = current[0]?.height || 20;
      return current.map((s, idx) => ({
        ...s,
        y: Math.round((startY + idx * (slotH + val)) * 10) / 10,
      }));
    });
  };

  const handleSlotRadiusChange = (val: number) => {
    setCustomSlots((prev) => {
      return prev.map((s) => ({
        ...s,
        borderRadius: val,
      }));
    });
  };

  const currentSlotWidth = customSlots[0]?.width || 88;
  const currentSlotHeight = customSlots[0]?.height || 22;
  const currentSlotX = customSlots[0]?.x || 6;
  const currentSlotY = customSlots[0]?.y || 5;
  const currentSlotRadius = customSlots[0]?.borderRadius || 6;
  const currentSlotGap =
    customSlots.length > 1
      ? Math.max(0, Math.round((customSlots[1].y - (customSlots[0].y + customSlots[0].height)) * 10) / 10)
      : 3;


  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  // Add sticker to template
  const handleAddSticker = (type: string) => {
    const newSticker = createStickerItem(type);
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
        custom_slots: creationMode === "upload" && customSlots.length > 0 ? customSlots : undefined,
        frame_aspect_ratio: creationMode === "upload" && frameAspectRatio ? frameAspectRatio : undefined,
      });


      // If created by an admin or in admin mode, also save directly into cms_frames
      if (isAdmin || profile?.role === "admin") {
        try {
          const { saveCmsFrame } = await import("@/utils/adminHelpers");
          await saveCmsFrame({
            id: newTpl.id,
            name: name.trim(),
            type: layoutType,
            frames: framesCount,
            aspect_ratio: layoutType === "grid" ? "1/1" : "4/3",
            bg_color: creationMode === "upload" ? (frameMode === "background" ? "#FFFFFF" : bgColor) : bgColor,
            text_color: textColor,
            is_pro: isPro,
            is_active: true,
            image_url: finalImageUrl,
            frame_mode: creationMode === "upload" ? frameMode : undefined,
            creator_name: creatorName,
          });
        } catch (e) {
          console.warn("saveCmsFrame failed:", e);
        }
      }

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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white border-2 border-slate-900 w-full max-w-5xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] my-auto flex flex-col overflow-hidden h-[92vh] max-h-[820px] animate-in fade-in zoom-in-95 duration-150">
        
        {/* MODAL HEADER */}
        <div className="px-5 py-3 border-b-2 border-slate-900 bg-[#FFE66D] flex items-center justify-between select-none flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-white border border-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Sparkles size={16} className="text-slate-900" />
            </div>
            <div>
              <h2 className="font-mono font-bold text-xs sm:text-sm uppercase tracking-tight text-slate-900">
                {isAdmin ? "Admin Studio: Buat / Upload Desain Frame" : "Buat Frame Komunitas Baru"}
              </h2>
              <span className="text-[9px] font-mono text-slate-700 block -mt-0.5">
                {isAdmin
                  ? "Skenario A: Unggah desain Canva / Photoshop resmi dan atur ketersediaan akses"
                  : "Bagikan karya frame estetikmu untuk dinikmati seluruh pengguna Posean"}
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
          <div className="mx-5 mt-3 p-2.5 bg-red-50 border border-red-400 text-red-800 font-mono text-xs flex items-center gap-2 flex-shrink-0">
            <AlertCircle size={14} className="flex-shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* TOP MODE TOGGLE (Skenario A vs Studio) */}
        <div className="px-4 sm:px-6 pt-3 pb-2 bg-slate-50 border-b border-slate-200 flex-shrink-0">
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
        <div className="flex md:hidden border-b border-slate-300 bg-slate-100 font-mono text-[10px] select-none flex-shrink-0">
          <button
            type="button"
            onClick={() => setMobileViewTab("form")}
            className={`flex-1 py-2 text-center font-bold uppercase transition-all cursor-pointer ${
              mobileViewTab === "form"
                ? "bg-white text-slate-900 border-b-2 border-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            ✏️ Form Pengaturan
          </button>
          <button
            type="button"
            onClick={() => setMobileViewTab("preview")}
            className={`flex-1 py-2 text-center font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mobileViewTab === "preview"
                ? "bg-white text-slate-900 border-b-2 border-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Eye size={12} />
            <span>Pratinjau Strip</span>
            {frameImage && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
          </button>
        </div>

        {/* MODAL BODY (2 COLUMNS: CONTROLS & PREVIEW) */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden font-mono">
          
          {/* LEFT: FORM CONTROLS */}
          <div
            className={`flex-1 min-w-0 overflow-y-auto p-4 sm:p-5 space-y-4 ${
              mobileViewTab === "form" ? "block" : "hidden md:block"
            }`}
          >
            {/* MODE A: UPLOAD CANVA / PHOTOSHOP */}
            {creationMode === "upload" && (
              <div className="space-y-4">
                {/* 1. File Upload Box / File Card */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-800 uppercase flex items-center gap-1.5">
                      <span className="w-5 h-5 bg-slate-900 text-white text-[10px] flex items-center justify-center font-mono font-bold">1</span>
                      <span>Unggah Desain Bingkai (PNG / JPG)</span>
                      <span className="text-red-500">*</span>
                    </label>
                    {frameImage && (
                      <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 font-bold">
                        ✓ Siap Digunakan
                      </span>
                    )}
                  </div>

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
                          : "border-slate-400 bg-slate-50 hover:bg-amber-50/40 hover:border-slate-800"
                      }`}
                    >
                      <div className="p-2.5 bg-[#FFE66D] border border-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <Upload size={22} className="text-slate-950" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 uppercase">
                          Klik atau Drag & Drop Gambar ke Sini
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Mendukung PNG transparan, JPG, WebP (Maks 12MB)
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-1 border border-emerald-300 mt-1">
                        <Sparkles size={11} className="text-emerald-700 flex-shrink-0" />
                        <span>Margin kanvas Canva otomatis dipangkas langsung FULL tepi-ke-tepi</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 border-2 border-slate-900 bg-slate-50 flex items-center justify-between gap-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-14 border border-slate-300 bg-white overflow-hidden flex items-center justify-center flex-shrink-0 shadow-xs">
                          <img
                            src={frameImage}
                            alt="Uploaded preview"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {imageFileName || name || "Desain_Frame.png"}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 text-[9px]">
                            <span className="text-emerald-700 font-bold flex items-center gap-1 bg-emerald-100 px-1.5 py-0.5 border border-emerald-300">
                              <CheckCircle size={10} />
                              <span>Auto Full-Bleed</span>
                            </span>
                            <span className="text-slate-600 bg-slate-200 px-1.5 py-0.5 font-mono">
                              {framesCount} Foto
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1 text-[10px] font-bold border border-slate-800 bg-white hover:bg-slate-100 cursor-pointer shadow-xs"
                        >
                          Ganti
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFrameImage(null);
                            setOriginalImageUrl(null);
                            setImageFileName("");
                          }}
                          className="p-1 text-red-600 hover:bg-red-50 border border-slate-300 hover:border-red-400 cursor-pointer"
                          title="Hapus gambar"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Nama Frame */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-800 uppercase flex items-center gap-1.5">
                    <span className="w-5 h-5 bg-slate-900 text-white text-[10px] flex items-center justify-center font-mono font-bold">2</span>
                    <span>Nama Frame</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Pastel Happy Birthday / Cute Summer Strip"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-800 rounded-none focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono"
                    maxLength={50}
                    required
                  />
                </div>

                {/* 3. Bentuk Strip Foto */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-800 uppercase flex items-center gap-1.5">
                    <span className="w-5 h-5 bg-slate-900 text-white text-[10px] flex items-center justify-center font-mono font-bold">3</span>
                    <span>Bentuk Strip Foto</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => handleLayoutChange("strip", 4)}
                      className={`p-2.5 border text-center transition-all cursor-pointer ${
                        layoutType === "strip" && framesCount === 4
                          ? "border-slate-900 bg-slate-900 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]"
                          : "border-slate-300 bg-white hover:bg-slate-50 text-slate-800 hover:border-slate-800"
                      }`}
                    >
                      <span className="block text-xs font-bold">4 Foto</span>
                      <span className="text-[9px] opacity-75">Life4Cuts</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleLayoutChange("strip", 3)}
                      className={`p-2.5 border text-center transition-all cursor-pointer ${
                        layoutType === "strip" && framesCount === 3
                          ? "border-slate-900 bg-slate-900 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]"
                          : "border-slate-300 bg-white hover:bg-slate-50 text-slate-800 hover:border-slate-800"
                      }`}
                    >
                      <span className="block text-xs font-bold">3 Foto</span>
                      <span className="text-[9px] opacity-75">Trio Strip</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleLayoutChange("strip", 2)}
                      className={`p-2.5 border text-center transition-all cursor-pointer ${
                        layoutType === "strip" && framesCount === 2
                          ? "border-slate-900 bg-slate-900 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]"
                          : "border-slate-300 bg-white hover:bg-slate-50 text-slate-800 hover:border-slate-800"
                      }`}
                    >
                      <span className="block text-xs font-bold">2 Foto</span>
                      <span className="text-[9px] opacity-75">Duo Strip</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleLayoutChange("grid", 4)}
                      className={`p-2.5 border text-center transition-all cursor-pointer ${
                        layoutType === "grid"
                          ? "border-slate-900 bg-slate-900 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]"
                          : "border-slate-300 bg-white hover:bg-slate-50 text-slate-800 hover:border-slate-800"
                      }`}
                    >
                      <span className="block text-xs font-bold">Grid 2x2</span>
                      <span className="text-[9px] opacity-75">Postcard</span>
                    </button>
                  </div>
                </div>

                {/* 4. Collapsible Accordion: Pengaturan Lanjutan & Kalibrasi */}
                <div className="pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                    className="w-full p-2.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-300 flex items-center justify-between text-left transition-colors cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <Sliders size={13} className="text-slate-700" />
                      <span className="text-[11px] font-bold text-slate-800 uppercase">
                        ⚙️ Pengaturan Lanjutan & Kalibrasi (Opsional)
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                      {isAdvancedOpen ? (
                        <>
                          <span>Tutup</span>
                          <ChevronUp size={14} />
                        </>
                      ) : (
                        <>
                          <span>Buka</span>
                          <ChevronDown size={14} />
                        </>
                      )}
                    </span>
                  </button>

                  {isAdvancedOpen && (
                    <div className="mt-2.5 p-3.5 bg-slate-50 border border-slate-300 space-y-3.5 animate-in fade-in duration-150">
                      
                      {/* Pangkas Full-Bleed Canva */}
                      {frameImage && (
                        <div className="space-y-2 p-2.5 bg-white border border-slate-200">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-slate-700 uppercase">
                              Format Tampilan Strip (Full-Bleed)
                            </label>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                              {isAutoTrim ? "Mode: FULL STRIP" : "Mode: ORIGINAL"}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleAutoTrim(true)}
                              className={`p-2 border text-left cursor-pointer transition-all ${
                                isAutoTrim
                                  ? "border-slate-900 bg-slate-900 text-white"
                                  : "border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
                              }`}
                            >
                              <span className="text-[10px] font-bold block">✂️ Pangkas Jadi FULL (Canva)</span>
                              <span className="text-[8px] opacity-80 block mt-0.5">
                                Potong margin kanvas kosong agar bingkai 100% tepi ke tepi
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleAutoTrim(false)}
                              className={`p-2 border text-left cursor-pointer transition-all ${
                                !isAutoTrim
                                  ? "border-slate-900 bg-slate-900 text-white"
                                  : "border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
                              }`}
                            >
                              <span className="text-[10px] font-bold block">📐 Ukuran Asli</span>
                              <span className="text-[8px] opacity-80 block mt-0.5">
                                Tampilkan seluruh kanvas apa adanya tanpa pemotongan
                              </span>
                            </button>
                          </div>

                          {isAutoTrim && (
                            <div className="pt-2 border-t border-slate-100">
                              <div className="flex justify-between items-center mb-1 text-[9px]">
                                <span className="font-bold text-slate-700 uppercase">
                                  Zoom / Pangkas Ekstra (Hilangkan Bayangan Luar)
                                </span>
                                <span className="font-mono text-slate-800 font-bold">
                                  {Math.round((trimZoom - 1.0) * 100)}%
                                </span>
                              </div>
                              <input
                                type="range"
                                min={1.0}
                                max={1.3}
                                step={0.02}
                                value={trimZoom}
                                onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                                className="w-full accent-slate-900 cursor-pointer h-1.5"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Posisi Layer Desain */}
                      <div className="space-y-1.5 p-2.5 bg-white border border-slate-200">
                        <label className="text-[10px] font-bold text-slate-700 uppercase block">
                          Posisi Layer Desain
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
                            <span className="text-[10px] font-bold block">✨ Overlay (Menimpa Foto)</span>
                            <span className="text-[8px] opacity-80 block mt-0.5">
                              PNG transparan menutup di atas foto kamera (ala bingkai cutout)
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
                            <span className="text-[10px] font-bold block">🖼️ Background (Di Belakang)</span>
                            <span className="text-[8px] opacity-80 block mt-0.5">
                              Gambar berada di latar belakang, slot foto rapi di depannya
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Kalibrasi Lubang Slot Foto */}
                      {frameImage && frameMode === "overlay" && (
                        <div className="p-2.5 bg-sky-50/70 border border-sky-300 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Sparkles size={13} className="text-sky-600 flex-shrink-0" />
                              <span className="text-[10px] font-bold text-sky-950 truncate">
                                {isDetecting ? "Memindai lubang foto..." : detectionMessage || "Kalibrasi Lubang Slot Foto"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={handleRedetect}
                                disabled={isDetecting}
                                className="px-2 py-1 text-[9px] font-bold border border-sky-300 bg-white hover:bg-sky-100 text-sky-800 flex items-center gap-1 cursor-pointer"
                              >
                                <RotateCcw size={10} />
                                <span>Pindai Ulang</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setIsCalibrateOpen(!isCalibrateOpen)}
                                className={`px-2 py-1 text-[9px] font-bold border transition-colors cursor-pointer ${
                                  isCalibrateOpen
                                    ? "bg-slate-900 text-white border-slate-900"
                                    : "bg-white text-slate-800 border-slate-400 hover:border-slate-800"
                                }`}
                              >
                                {isCalibrateOpen ? "Tutup Slider" : "Atur Posisi (Slider)"}
                              </button>
                            </div>
                          </div>

                          {isCalibrateOpen && (
                            <div className="pt-2 border-t border-sky-200 space-y-2">
                              <div className="flex justify-between items-center text-[9px]">
                                <span className="text-slate-600">Geser slider untuk menyesuaikan slot:</span>
                                <button
                                  type="button"
                                  onClick={() => setCustomSlots(generateDefaultSlots(framesCount, layoutType === "grid"))}
                                  className="text-sky-700 hover:underline font-bold cursor-pointer"
                                >
                                  Reset Default
                                </button>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-[9px]">
                                <div className="bg-white p-2 border border-slate-200">
                                  <div className="flex justify-between mb-0.5">
                                    <span className="font-bold text-slate-700">Lebar Slot</span>
                                    <span className="font-mono text-slate-500">{Math.round(currentSlotWidth)}%</span>
                                  </div>
                                  <input
                                    type="range"
                                    min={40}
                                    max={98}
                                    value={Math.round(currentSlotWidth)}
                                    onChange={(e) => handleSlotWidthChange(Number(e.target.value))}
                                    className="w-full accent-slate-900 cursor-pointer h-1.5"
                                  />
                                </div>

                                <div className="bg-white p-2 border border-slate-200">
                                  <div className="flex justify-between mb-0.5">
                                    <span className="font-bold text-slate-700">Tinggi Slot</span>
                                    <span className="font-mono text-slate-500">{Math.round(currentSlotHeight)}%</span>
                                  </div>
                                  <input
                                    type="range"
                                    min={10}
                                    max={50}
                                    value={Math.round(currentSlotHeight)}
                                    onChange={(e) => handleSlotHeightChange(Number(e.target.value))}
                                    className="w-full accent-slate-900 cursor-pointer h-1.5"
                                  />
                                </div>

                                <div className="bg-white p-2 border border-slate-200">
                                  <div className="flex justify-between mb-0.5">
                                    <span className="font-bold text-slate-700">Geser Horizontal (X)</span>
                                    <span className="font-mono text-slate-500">{Math.round(currentSlotX)}%</span>
                                  </div>
                                  <input
                                    type="range"
                                    min={0}
                                    max={30}
                                    value={Math.round(currentSlotX)}
                                    onChange={(e) => handleSlotXChange(Number(e.target.value))}
                                    className="w-full accent-slate-900 cursor-pointer h-1.5"
                                  />
                                </div>

                                <div className="bg-white p-2 border border-slate-200">
                                  <div className="flex justify-between mb-0.5">
                                    <span className="font-bold text-slate-700">Geser Vertikal (Y)</span>
                                    <span className="font-mono text-slate-500">{Math.round(currentSlotY)}%</span>
                                  </div>
                                  <input
                                    type="range"
                                    min={0}
                                    max={30}
                                    value={Math.round(currentSlotY)}
                                    onChange={(e) => handleSlotYOffsetChange(Number(e.target.value))}
                                    className="w-full accent-slate-900 cursor-pointer h-1.5"
                                  />
                                </div>

                                <div className="bg-white p-2 border border-slate-200">
                                  <div className="flex justify-between mb-0.5">
                                    <span className="font-bold text-slate-700">Jarak Antar Slot</span>
                                    <span className="font-mono text-slate-500">{Math.round(currentSlotGap)}%</span>
                                  </div>
                                  <input
                                    type="range"
                                    min={0}
                                    max={15}
                                    value={Math.round(currentSlotGap)}
                                    onChange={(e) => handleSlotGapChange(Number(e.target.value))}
                                    className="w-full accent-slate-900 cursor-pointer h-1.5"
                                  />
                                </div>

                                <div className="bg-white p-2 border border-slate-200">
                                  <div className="flex justify-between mb-0.5">
                                    <span className="font-bold text-slate-700">Lengkungan Sudut</span>
                                    <span className="font-mono text-slate-500">{Math.round(currentSlotRadius)}px</span>
                                  </div>
                                  <input
                                    type="range"
                                    min={0}
                                    max={24}
                                    value={Math.round(currentSlotRadius)}
                                    onChange={(e) => handleSlotRadiusChange(Number(e.target.value))}
                                    className="w-full accent-slate-900 cursor-pointer h-1.5"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Filter Kamera */}
                      <div className="p-2.5 bg-white border border-slate-200 space-y-1">
                        <label className="text-[10px] font-bold text-slate-700 uppercase block">
                          Rekomendasi Filter Warna Kamera
                        </label>
                        <select
                          value={defaultFilter}
                          onChange={(e) => setDefaultFilter(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 font-mono"
                        >
                          {FILTERS.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name} ({f.badge})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Deskripsi Singkat */}
                      <div className="p-2.5 bg-white border border-slate-200 space-y-1">
                        <label className="text-[10px] font-bold text-slate-700 uppercase block">
                          Deskripsi Singkat (Opsional)
                        </label>
                        <input
                          type="text"
                          placeholder="Konsep frame atau tema estetikanya..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 font-mono"
                          maxLength={100}
                        />
                      </div>

                      {/* Admin PRO / VIP */}
                      {(isAdmin || profile?.role === "admin") && (
                        <div className="p-2.5 bg-amber-50 border border-amber-300 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="admin-pro-chk"
                              checked={isPro}
                              onChange={(e) => setIsPro(e.target.checked)}
                              className="cursor-pointer"
                            />
                            <label htmlFor="admin-pro-chk" className="text-[10px] font-bold text-amber-900 cursor-pointer select-none">
                              👑 Tandai Sebagai Frame Eksklusif PRO / VIP
                            </label>
                          </div>
                          <span className="text-[9px] bg-amber-200 text-amber-800 px-1.5 py-0.5 font-bold uppercase">
                            Admin
                          </span>
                        </div>
                      )}

                      {/* Opsi Teks Tambahan / Footer Bawaan */}
                      <div className="p-2.5 bg-white border border-slate-200 flex items-start gap-2">
                        <input
                          type="checkbox"
                          id="hide-footer-chk"
                          checked={hideDefaultFooter}
                          onChange={(e) => setHideDefaultFooter(e.target.checked)}
                          className="mt-0.5 cursor-pointer"
                        />
                        <label htmlFor="hide-footer-chk" className="text-[10px] text-slate-700 cursor-pointer leading-tight">
                          <span className="font-bold block">Sembunyikan Teks Footer Bawaan</span>
                          <span className="text-[8.5px] text-slate-500">
                            Centang agar gambar Canva bersih tanpa tulisan tambahan di bagian bawah.
                          </span>
                        </label>
                      </div>

                      {/* Canva Cheat Sheet */}
                      <div className="p-2.5 bg-amber-50/60 border border-amber-300 text-[9.5px] text-amber-900 space-y-1">
                        <div className="flex items-center gap-1 font-bold uppercase text-[10px]">
                          <HelpCircle size={11} />
                          <span>Ukuran Rekomendasi Kanvas Canva:</span>
                        </div>
                        <ul className="list-disc list-inside space-y-0.5 pl-1 opacity-90">
                          <li>Strip 4 Foto: 600 x 1960 px (rasio 1:3.27)</li>
                          <li>Strip 3 Foto: 600 x 1520 px (rasio 1:2.53)</li>
                          <li>Grid 2x2: 760 x 880 px (rasio 3.8:4.4)</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MODE B: STUDIO PALETTE & DOODLES */}
            {creationMode === "studio" && (
              <div className="space-y-4">
                {/* 1. Nama Frame */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-800 uppercase flex items-center gap-1.5">
                    <span className="w-5 h-5 bg-slate-900 text-white text-[10px] flex items-center justify-center font-mono font-bold">1</span>
                    <span>Nama Frame</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Pastel Cute Studio Frame"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-800 rounded-none focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono"
                    maxLength={50}
                    required
                  />
                </div>

                {/* 2. Bentuk Strip Foto */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-800 uppercase flex items-center gap-1.5">
                    <span className="w-5 h-5 bg-slate-900 text-white text-[10px] flex items-center justify-center font-mono font-bold">2</span>
                    <span>Bentuk Strip Foto</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => handleLayoutChange("strip", 4)}
                      className={`p-2.5 border text-center transition-all cursor-pointer ${
                        layoutType === "strip" && framesCount === 4
                          ? "border-slate-900 bg-slate-900 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]"
                          : "border-slate-300 bg-white hover:bg-slate-50 text-slate-800 hover:border-slate-800"
                      }`}
                    >
                      <span className="block text-xs font-bold">4 Foto</span>
                      <span className="text-[9px] opacity-75">Life4Cuts</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleLayoutChange("strip", 3)}
                      className={`p-2.5 border text-center transition-all cursor-pointer ${
                        layoutType === "strip" && framesCount === 3
                          ? "border-slate-900 bg-slate-900 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]"
                          : "border-slate-300 bg-white hover:bg-slate-50 text-slate-800 hover:border-slate-800"
                      }`}
                    >
                      <span className="block text-xs font-bold">3 Foto</span>
                      <span className="text-[9px] opacity-75">Trio Strip</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleLayoutChange("strip", 2)}
                      className={`p-2.5 border text-center transition-all cursor-pointer ${
                        layoutType === "strip" && framesCount === 2
                          ? "border-slate-900 bg-slate-900 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]"
                          : "border-slate-300 bg-white hover:bg-slate-50 text-slate-800 hover:border-slate-800"
                      }`}
                    >
                      <span className="block text-xs font-bold">2 Foto</span>
                      <span className="text-[9px] opacity-75">Duo Strip</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleLayoutChange("grid", 4)}
                      className={`p-2.5 border text-center transition-all cursor-pointer ${
                        layoutType === "grid"
                          ? "border-slate-900 bg-slate-900 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]"
                          : "border-slate-300 bg-white hover:bg-slate-50 text-slate-800 hover:border-slate-800"
                      }`}
                    >
                      <span className="block text-xs font-bold">Grid 2x2</span>
                      <span className="text-[9px] opacity-75">Postcard</span>
                    </button>
                  </div>
                </div>

                {/* Studio Subtabs */}
                <div className="space-y-3 pt-1">
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

                {/* Filter recommendation & description */}
                <div className="pt-2 border-t border-slate-200 space-y-3">
                  <div>
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

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                      Deskripsi Singkat (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Tema frame atau konsep estetikanya..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-none focus:outline-none focus:border-slate-800"
                      maxLength={100}
                    />
                  </div>

                  {(isAdmin || profile?.role === "admin") && (
                    <div className="p-2.5 bg-amber-50 border border-amber-300 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="admin-pro-chk-studio"
                          checked={isPro}
                          onChange={(e) => setIsPro(e.target.checked)}
                          className="cursor-pointer"
                        />
                        <label htmlFor="admin-pro-chk-studio" className="text-[10px] font-bold text-amber-900 cursor-pointer select-none">
                          👑 Tandai Sebagai Frame Eksklusif PRO / VIP
                        </label>
                      </div>
                      <span className="text-[9px] bg-amber-200 text-amber-800 px-1.5 py-0.5 font-bold uppercase">
                        Admin
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: LIVE INTERACTIVE PREVIEW */}
          <div
            className={`w-full md:w-[360px] lg:w-[400px] flex-shrink-0 bg-slate-100/90 border-t-2 md:border-t-0 md:border-l-2 border-slate-900 p-4 sm:p-5 flex flex-col items-center justify-between select-none overflow-y-auto ${
              mobileViewTab === "preview" ? "flex" : "hidden md:flex"
            }`}
          >
            {/* Top Indicator */}
            <div className="w-full flex items-center justify-between mb-2 px-1 flex-shrink-0">
              <span className="text-[10px] font-mono font-bold tracking-wider text-slate-700 uppercase flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-500" />
                <span>Pratinjau Strip</span>
              </span>
              {creationMode === "upload" && isAutoTrim && wasAutoTrimmed && (
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300">
                  ✨ Full-Bleed
                </span>
              )}
            </div>

            {/* The Strip preview box */}
            <div className="flex-1 w-full flex items-center justify-center py-2 min-h-0">
              <div
                ref={previewRef}
                className="relative border-2 border-slate-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col transition-all duration-200 overflow-hidden bg-white"
                style={{
                  aspectRatio:
                    creationMode === "upload" && frameAspectRatio
                      ? `${frameAspectRatio}`
                      : isGrid
                        ? "3.8/4.4"
                        : "1/3.2",
                  maxHeight: isGrid ? "min(340px, 45vh)" : "min(480px, 56vh)",
                  width: isGrid ? "min(240px, 85%)" : undefined,
                  height: isGrid ? undefined : "min(480px, 56vh)",
                  padding:
                    creationMode === "upload" && customSlots.length > 0
                      ? 0
                      : undefined,
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

                {/* Photo slots: Custom Calibrated Slots OR Default Slots */}
                {creationMode === "upload" && customSlots.length > 0 ? (
                  <div className="absolute inset-0 w-full h-full pointer-events-none z-10">
                    {customSlots.map((slot, idx) => (
                      <div
                        key={idx}
                        className="absolute bg-black/15 border border-sky-500/40 flex items-center justify-center overflow-hidden transition-all duration-75"
                        style={{
                          left: `${slot.x}%`,
                          top: `${slot.y}%`,
                          width: `${slot.width}%`,
                          height: `${slot.height}%`,
                          borderRadius: slot.borderRadius ? `${slot.borderRadius}px` : undefined,
                        }}
                      >
                        <span className="text-[8px] font-mono text-slate-800 bg-white/85 px-1 py-0.5 border border-slate-300 font-bold uppercase tracking-wider shadow-xs">
                          Foto #{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className={`w-full flex-1 gap-2 relative z-10 p-2.5 ${
                      isGrid
                        ? "grid grid-cols-2 grid-rows-2 h-full"
                        : "flex flex-col"
                    }`}
                  >
                    {Array.from({ length: framesCount }).map((_, idx) => (
                      <div
                        key={idx}
                        className="w-full flex-1 bg-black/10 border border-black/20 flex items-center justify-center relative overflow-hidden"
                      >
                        <span className="text-[8px] font-mono opacity-50 font-bold tracking-widest uppercase">
                          Foto #{idx + 1}
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
                )}

                {/* OVERLAY MODE: Uploaded Canva PNG covers the strip! */}
                {creationMode === "upload" && frameMode === "overlay" && frameImage && (
                  <img
                    src={frameImage}
                    alt="Frame overlay cutout"
                    className="absolute inset-0 w-full h-full object-fill pointer-events-none z-20"
                  />
                )}

                {/* Calibration Visual Guides when editing slots */}
                {creationMode === "upload" && isCalibrateOpen && customSlots.length > 0 && (
                  <div className="absolute inset-0 w-full h-full pointer-events-none z-30">
                    {customSlots.map((slot, idx) => (
                      <div
                        key={`calib-${idx}`}
                        className="absolute border-2 border-dashed border-sky-600 bg-sky-400/20 flex items-center justify-center"
                        style={{
                          left: `${slot.x}%`,
                          top: `${slot.y}%`,
                          width: `${slot.width}%`,
                          height: `${slot.height}%`,
                          borderRadius: slot.borderRadius ? `${slot.borderRadius}px` : undefined,
                        }}
                      >
                        <span className="text-[8px] font-mono bg-sky-600 text-white px-1 py-0.5 font-bold shadow-xs">
                          Slot #{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Strip Footer / Caption */}
                {((creationMode === "studio" && caption) || (creationMode === "upload" && !hideDefaultFooter && caption)) && (
                  <div className="pt-2 pb-1 text-center relative z-25 mt-auto bg-white/70 backdrop-blur-xs">
                    <p
                      className="text-[8px] font-mono font-bold uppercase tracking-wider truncate max-w-full px-1"
                      style={{ color: textColor }}
                    >
                      {caption}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Preview Bottom Info / Helper */}
            <div className="w-full mt-2 p-2 bg-white border border-slate-300 font-mono text-[9px] text-center flex-shrink-0">
              {creationMode === "upload" ? (
                frameImage ? (
                  <div className="space-y-0.5">
                    <p className="font-bold text-emerald-700 flex items-center justify-center gap-1">
                      <CheckCircle size={11} />
                      <span>Desain Siap Digunakan</span>
                    </p>
                    <p className="text-slate-500 text-[8.5px]">
                      {isAutoTrim ? "✓ Full-bleed aktif" : "Ukuran kanvas asli"} • {framesCount} Slot Foto
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-500">
                    Unggah gambar desain untuk melihat pratinjau strip
                  </p>
                )
              ) : (
                <p className="text-slate-600">
                  Geser stiker di atas strip untuk menyesuaikan posisi
                </p>
              )}
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-5 py-3 border-t-2 border-slate-900 bg-white flex items-center justify-between select-none flex-shrink-0">
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
