"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Undo2, Crown, Sparkles, X, CheckCircle, RefreshCw, Plus, ArrowRight } from "lucide-react";
import {
  usePhotoboothStore,
  LAYOUTS,
  LayoutOption,
} from "@/store/usePhotoboothStore";
import { useAuthStore } from "@/store/useAuthStore";
import { fetchCmsFrames } from "@/utils/adminHelpers";
import {
  fetchCommunityTemplates,
  incrementTemplateUsage,
} from "@/utils/templateHelpers";
import { CommunityFrameTemplate } from "@/types/template";
import { STICKERS } from "@/components/StickerAssets";
import CreateTemplateModal from "@/components/templates/CreateTemplateModal";
import { FRAME_PRESETS, FramePreset } from "@/data/framePresets";

export default function LayoutStep() {
  const router = useRouter();
  const {
    selectedLayout,
    setSelectedLayout,
    setSelectedTheme,
    setCaption,
    setStickers,
    applyFilter,
    setStep,
    setFrameImage,
  } = usePhotoboothStore();
  const { user, profile, setIsPro } = useAuthStore();

  const [activeTab, setActiveTab] = useState<"standard" | "themes" | "community">("standard");
  const [allLayouts, setAllLayouts] = useState<LayoutOption[]>(LAYOUTS);
  const [communityTemplates, setCommunityTemplates] = useState<CommunityFrameTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [proModalOpen, setProModalOpen] = useState(false);
  const [pendingProLayout, setPendingProLayout] = useState<LayoutOption | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // 1. Load CMS frames
        const cmsFrames = await fetchCmsFrames();
        if (cmsFrames && cmsFrames.length > 0) {
          const mappedCms: LayoutOption[] = cmsFrames
            .filter((f) => f.is_active)
            .map((f) => ({
              id: f.id,
              name: f.name,
              frames: f.frames,
              previewClass:
                f.type === "grid" ? "grid-cols-2" : `grid-rows-${f.frames}`,
              type: f.type,
              badge: f.is_pro ? "★ PRO" : "Admin Custom",
              is_pro: f.is_pro,
              bg_color: f.bg_color,
              text_color: f.text_color,
            }));

          const existingIds = new Set(LAYOUTS.map((l) => String(l.id)));
          const uniqueCms = mappedCms.filter((c) => !existingIds.has(String(c.id)));
          setAllLayouts([...LAYOUTS, ...uniqueCms]);
        }

        // 2. Load Community Templates
        const templates = await fetchCommunityTemplates();
        setCommunityTemplates(templates);
      } catch (err) {
        console.error("Failed to load layouts & templates:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleSelectLayout = (layout: LayoutOption) => {
    const isUserPro = profile?.is_pro || profile?.role === "admin";

    if (layout.is_pro && !isUserPro) {
      setPendingProLayout(layout);
      setProModalOpen(true);
      return;
    }

    applyLayout(layout);
  };

  const applyLayout = (layout: LayoutOption) => {
    setSelectedLayout(layout);
    setFrameImage(null); // Clear custom image when choosing standard layouts

    if (layout.bg_color && layout.text_color) {
      setSelectedTheme({
        id: `custom_${layout.id}`,
        name: layout.name,
        bg: layout.bg_color,
        text: layout.text_color,
        border: `border border-[${layout.text_color}]`,
        accent: layout.bg_color,
        uiBg: "#FFFFFF",
        uiActiveBg: layout.bg_color,
      });
    }

    setStep("camera");
  };

  // Apply one of the 8 built-in themed frames (transparent PNG overlay + explicit grid slots)
  const handleSelectFramePreset = (preset: FramePreset) => {
    setSelectedLayout({
      id: `preset_${preset.id}`,
      name: preset.name,
      frames: preset.total,
      previewClass: preset.type === "grid" ? "grid-cols-2" : `grid-rows-${preset.total}`,
      type: preset.type,
      badge: preset.badge,
    });
    setSelectedTheme({
      id: `preset_${preset.id}`,
      name: preset.name,
      bg: preset.bg_color,
      text: preset.text_color,
      border: `border border-[${preset.text_color}]`,
      accent: preset.bg_color,
      uiBg: "#FFFFFF",
      uiActiveBg: preset.bg_color,
    });
    setCaption("");
    setStickers([]);
    setFrameImage(preset.image, "overlay", preset.slots, preset.aspectRatio);
    setStep("camera");
  };

  // Handle selection of community template
  const handleSelectCommunityTemplate = async (template: CommunityFrameTemplate) => {
    // If user is not logged in, direct to login page
    if (!user) {
      router.push("/login?redirect=/&reason=use");
      return;
    }

    // 1. Layout
    const layout =
      LAYOUTS.find((l) => l.frames === template.frames && l.type === template.type) || {
        id: `tpl_layout_${template.id}`,
        name: template.name,
        frames: template.frames,
        previewClass: template.type === "grid" ? "grid-cols-2" : `grid-rows-${template.frames}`,
        type: template.type,
        badge: "Community",
      };
    setSelectedLayout(layout);

    // 2. Theme
    setSelectedTheme({
      id: `theme_${template.id}`,
      name: template.name,
      bg: template.bg_color,
      text: template.text_color,
      border: `border border-[${template.text_color}]`,
      accent: template.bg_color,
      uiBg: "#FFFFFF",
      uiActiveBg: template.bg_color,
    });

    // 3. Caption
    if (template.caption) {
      setCaption(template.caption);
    }

    // 4. Stickers
    if (template.stickers && template.stickers.length > 0) {
      setStickers(template.stickers);
    } else {
      setStickers([]);
    }

    // 5. Filter
    if (template.default_filter && template.default_filter !== "none") {
      applyFilter(template.default_filter);
    }

    // 6. Custom Frame Image (Canva / Photoshop overlay or background)
    let finalImageUrl = template.image_url || null;
    let finalSlots = template.custom_slots || null;
    let finalAspectRatio = template.frame_aspect_ratio || null;

    if (
      template.image_url &&
      template.type !== "grid" &&
      !template.image_url.startsWith("/frames/") &&
      ((template.custom_slots && template.custom_slots[0]?.width < 70) ||
        (template.frame_aspect_ratio && template.frame_aspect_ratio > 0.45))
    ) {
      try {
        const { detectFrameSlots } = await import("@/utils/frameDetector");
        const detection = await detectFrameSlots(template.image_url, template.frames, false, {
          autoTrim: true,
          extraZoom: 1.05,
        });
        if (detection.wasTrimmed && detection.trimmedImageUrl) {
          finalImageUrl = detection.trimmedImageUrl;
          finalSlots = detection.slots;
          finalAspectRatio = detection.imageAspectRatio;
        }
      } catch (e) {
        console.warn("Auto-trim in LayoutStep failed:", e);
      }
    }

    setFrameImage(
      finalImageUrl,
      template.frame_mode || "overlay",
      finalSlots,
      finalAspectRatio
    );

    // 7. Increment usage
    await incrementTemplateUsage(template.id);

    setStep("camera");
  };

  const handleUnlockProDemo = async () => {
    try {
      await setIsPro(true);
    } catch (err) {
      console.error("Error setting pro status:", err);
    }
    setProModalOpen(false);
    if (pendingProLayout) {
      applyLayout(pendingProLayout);
    }
  };

  return (
    <motion.div
      key="layout"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full flex flex-col items-center gap-6"
    >
      {/* HEADER TITLE */}
      <div className="w-full text-center space-y-1 select-none">
        <span className="text-[8px] lg:text-[10px] font-bold text-slate-400 tracking-[0.3em] uppercase font-mono">
          CHOOSE FORMAT & TEMPLATE
        </span>
        <h2 className="text-lg lg:text-2xl font-bold text-slate-800 uppercase font-mono tracking-tight">
          Pilih Format Photobooth
        </h2>
        <p className="text-[10px] text-slate-400 font-mono">
          Gunakan layout standar atau pilih kreasi frame dari komunitas
        </p>
      </div>

      {/* TAB SELECTOR: STANDAR VS KOMUNITAS */}
      <div className="w-full max-w-sm sm:max-w-xl flex items-center border border-slate-900 bg-white p-1 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-mono text-[10px] sm:text-xs select-none">
        <button
          onClick={() => setActiveTab("standard")}
          className={`flex-1 py-2 sm:py-2.5 px-2 text-center font-bold uppercase transition-all cursor-pointer ${
            activeTab === "standard"
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          Layout Standar
        </button>
        <button
          onClick={() => setActiveTab("themes")}
          data-testid="tab-frame-themes"
          className={`flex-1 py-2 sm:py-2.5 px-2 text-center font-bold uppercase transition-all cursor-pointer ${
            activeTab === "themes"
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          Tema Frame ({FRAME_PRESETS.length})
        </button>
        <button
          onClick={() => setActiveTab("community")}
          className={`flex-1 py-2 sm:py-2.5 px-2 text-center font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === "community"
              ? "bg-[#FFE66D] text-slate-950 font-black"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Sparkles size={13} className="text-amber-500" />
          <span>Komunitas ({communityTemplates.length})</span>
        </button>
      </div>

      {/* TAB: THEMED FRAME PRESETS (8 transparent PNG frames) */}
      {activeTab === "themes" && (
        <div className="w-full max-w-5xl flex flex-col items-center gap-4 select-none">
          <p className="text-[10px] sm:text-[11px] text-slate-500 font-mono text-center">
            Pilih tema frame — jumlah foto &amp; susunan slot sudah diatur otomatis:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 w-full">
            {FRAME_PRESETS.map((preset) => (
              <button
                key={preset.id}
                data-testid={`frame-preset-${preset.id}`}
                onClick={() => handleSelectFramePreset(preset)}
                className="bg-white border border-slate-800 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 p-3 flex flex-col items-center gap-2.5 text-left transition-all cursor-pointer group"
              >
                <div className="w-full h-48 sm:h-56 flex items-center justify-center bg-gradient-to-br from-sky-200 via-rose-100 to-amber-100 border border-slate-200 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preset.image}
                    alt={`Frame ${preset.name}`}
                    loading="lazy"
                    className="max-h-full max-w-full object-contain drop-shadow-md transition-transform group-hover:scale-[1.03]"
                  />
                </div>
                <div className="w-full border-t border-slate-100 pt-2 flex flex-col gap-0.5">
                  <span className="text-[11px] font-bold text-slate-900 font-mono truncate block uppercase">
                    {preset.name}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">
                    {preset.cols} kolom × {preset.rows} baris · {preset.total} foto
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TAB 1: STANDARD & CMS LAYOUTS */}
      {activeTab === "standard" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4 w-full max-w-sm sm:max-w-3xl lg:max-w-4xl mt-1 select-none">
          {allLayouts.map((layout) => {
            const isSelected = selectedLayout.id === layout.id;
            const isPro = !!layout.is_pro;

            return (
              <button
                key={layout.id}
                onClick={() => handleSelectLayout(layout)}
                className={`flex flex-col items-center p-3 sm:p-4 lg:p-5 rounded-none border transition-all cursor-pointer justify-between relative group ${
                  isSelected
                    ? "border-slate-900 bg-slate-900/5 scale-98 shadow-none"
                    : isPro
                      ? "border-amber-400 bg-gradient-to-b from-amber-50/40 to-white hover:border-slate-900 shadow-[3px_3px_0px_0px_rgba(245,158,11,1)]"
                      : "border-slate-350 bg-white hover:bg-slate-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                }`}
                style={isSelected ? { borderWidth: "3px" } : {}}
              >
                {/* Badge */}
                {isPro ? (
                  <span className="absolute -top-2.5 px-2 py-0.5 bg-amber-400 text-slate-950 border border-slate-950 text-[7.5px] font-black font-mono uppercase tracking-wider flex items-center gap-0.5 shadow-xs">
                    <Crown size={9} />
                    <span>★ PRO</span>
                  </span>
                ) : layout.badge ? (
                  <span className="absolute -top-2 px-1.5 py-0.5 bg-[#FFE66D] text-slate-900 border border-slate-900 text-[7px] font-black font-mono uppercase tracking-wider">
                    {layout.badge}
                  </span>
                ) : null}

                {/* Layout Preview Graphic */}
                {layout.type === "grid" ? (
                  <div
                    className="w-16 h-20 sm:w-16 sm:h-24 lg:w-20 lg:h-28 border border-slate-800 p-1.5 grid grid-cols-2 gap-1 rounded-none mb-2.5 transition-transform group-hover:scale-102"
                    style={{
                      backgroundColor: layout.bg_color || "#F8FAFC",
                      borderColor: layout.text_color || "#0F172A",
                    }}
                  >
                    {Array.from({ length: 4 }).map((_, fIdx) => (
                      <div
                        key={fIdx}
                        className="w-full h-full border border-slate-300 bg-zinc-200 rounded-none aspect-[4/3]"
                      />
                    ))}
                  </div>
                ) : (
                  <div
                    className="w-10 h-20 sm:w-12 sm:h-24 lg:w-14 lg:h-28 border border-slate-800 p-1 flex flex-col gap-1 rounded-none mb-2.5 transition-transform group-hover:scale-102"
                    style={{
                      backgroundColor: layout.bg_color || "#F8FAFC",
                      borderColor: layout.text_color || "#0F172A",
                    }}
                  >
                    {Array.from({ length: layout.frames }).map((_, fIdx) => (
                      <div
                        key={fIdx}
                        className="w-full flex-1 border border-slate-300 bg-zinc-200 rounded-none"
                      />
                    ))}
                  </div>
                )}

                <div className="text-center w-full">
                  <span className="text-[10px] sm:text-xs font-black text-slate-900 font-mono uppercase tracking-tight block truncate">
                    {layout.name}
                  </span>
                  <span className="text-[8px] text-slate-400 font-mono flex items-center justify-center gap-1 mt-0.5">
                    <span>{layout.frames} Snaps</span>
                    {layout.bg_color && (
                      <span
                        className="w-2 h-2 rounded-full border border-slate-400"
                        style={{ backgroundColor: layout.bg_color }}
                      />
                    )}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* TAB 2: COMMUNITY TEMPLATES */}
      {activeTab === "community" && (
        <div className="w-full max-w-5xl flex flex-col items-center gap-4">
          
          {/* Action bar */}
          <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 font-mono text-xs pb-2 border-b border-slate-200">
            <span className="text-slate-500 text-[10px] sm:text-[11px]">
              Klik frame di bawah untuk langsung menggunakan tema & stikernya:
            </span>
            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
              <button
                onClick={() => {
                  if (!user) {
                    router.push("/login?redirect=/&reason=create");
                  } else {
                    setCreateModalOpen(true);
                  }
                }}
                className="flex-1 sm:flex-initial px-3 py-2 border border-slate-800 bg-[#FFE66D] text-slate-950 font-bold text-[10px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer flex items-center justify-center gap-1"
              >
                <Plus size={12} />
                <span>+ Buat Frame</span>
              </button>
              <Link
                href="/frames"
                className="flex-1 sm:flex-initial px-3 py-2 border border-slate-800 bg-white hover:bg-slate-50 text-slate-800 font-bold text-[10px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer flex items-center justify-center gap-1"
              >
                <span>Lihat Semua</span>
                <ArrowRight size={11} />
              </Link>
            </div>
          </div>

          {/* Grid of Community Templates */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 w-full select-none">
            {communityTemplates.slice(0, 8).map((tpl) => {
              const isGrid = tpl.type === "grid";

              return (
                <button
                  key={tpl.id}
                  onClick={() => handleSelectCommunityTemplate(tpl)}
                  className="bg-white border border-slate-800 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 p-3 flex flex-col items-center justify-between text-left transition-all cursor-pointer group"
                >
                  {/* Miniature strip preview */}
                  <div
                    className={`relative border border-slate-900 p-1.5 flex flex-col mb-2.5 transition-transform group-hover:scale-[1.02] ${
                      isGrid ? "w-20 h-24" : "w-16 min-h-[110px]"
                    }`}
                    style={{
                      backgroundColor: tpl.bg_color,
                      color: tpl.text_color,
                    }}
                  >
                    <div
                      className={`w-full flex-1 gap-0.5 relative z-0 ${
                        isGrid
                          ? "grid grid-cols-2 grid-rows-2 h-16"
                          : "flex flex-col"
                      }`}
                    >
                      {Array.from({ length: tpl.frames }).map((_, fIdx) => (
                        <div
                          key={fIdx}
                          className="w-full flex-1 bg-black/10 border border-black/10 flex items-center justify-center min-h-[16px]"
                        >
                          <span className="text-[5px] font-mono opacity-50">#{fIdx + 1}</span>
                        </div>
                      ))}

                      {/* Stickers on mini preview */}
                      {tpl.stickers?.slice(0, 3).map((st) => {
                        const stDef = STICKERS.find((s) => s.id === st.type);
                        return (
                          <div
                            key={st.id}
                            className="absolute w-3.5 h-3.5 pointer-events-none select-none z-10"
                            style={{
                              left: `${st.x}%`,
                              top: `${st.y}%`,
                              transform: `translate(-50%, -50%) scale(${st.scale || 1}) rotate(${st.rotation || 0}deg)`,
                            }}
                          >
                            {stDef?.render(tpl.text_color)}
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-1 text-center truncate">
                      <p
                        className="text-[5px] font-mono font-bold uppercase truncate"
                        style={{ color: tpl.text_color }}
                      >
                        {tpl.caption || "POSEAN"}
                      </p>
                    </div>
                  </div>

                  {/* Template Meta */}
                  <div className="w-full border-t border-slate-100 pt-2 flex flex-col gap-0.5">
                    <span className="text-[11px] font-bold text-slate-900 font-mono truncate block">
                      {tpl.name}
                    </span>
                    <div className="flex items-center justify-between text-[8px] font-mono text-slate-400">
                      <span className="truncate">@{tpl.creator_name}</span>
                      <span className="text-amber-600 font-bold">🔥 {tpl.uses_count || 0}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-[10px] text-slate-400 font-mono text-center pt-2">
            Pilih salah satu frame di atas untuk langsung masuk ke sesi foto dengan stiker & gaya yang sudah dirancang!
          </p>
        </div>
      )}

      {/* BACK BUTTON */}
      <button
        onClick={() => setStep("landing")}
        className="mt-2 flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase font-mono tracking-wider cursor-pointer"
      >
        <Undo2 size={11} /> Kembali
      </button>

      {/* CREATE TEMPLATE MODAL */}
      <CreateTemplateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={(newTpl) => {
          setCommunityTemplates((prev) => [newTpl, ...prev]);
          handleSelectCommunityTemplate(newTpl);
        }}
      />

      {/* PRO UPGRADE MODAL */}
      {proModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-slate-900 shadow-[6px_6px_0px_0px_rgba(245,158,11,1)] max-w-sm w-full p-6 text-center font-mono space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 bg-amber-400 border border-slate-900 flex items-center justify-center mx-auto shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-slate-950">
              <Crown size={24} />
            </div>

            <div className="space-y-1">
              <div className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-bold border border-amber-300 uppercase tracking-widest">
                Template Eksklusif
              </div>
              <h3 className="text-base font-bold uppercase text-slate-900 tracking-tight">
                {pendingProLayout?.name || "Koleksi Frame Pro"}
              </h3>
              <p className="text-[10px] text-slate-500 leading-relaxed pt-1">
                Template ini merupakan koleksi premium Posean Pro. Karena saat ini platform dalam tahap portofolio & demo, Anda dapat mengaktifkan akses Pro secara gratis!
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={handleUnlockProDemo}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles size={13} className="text-amber-400" />
                <span>Aktifkan Pro & Lanjutkan</span>
              </button>

              <button
                onClick={() => setProModalOpen(false)}
                className="w-full py-2 px-4 border border-slate-300 text-slate-600 hover:bg-slate-50 font-bold text-[10px] uppercase cursor-pointer"
              >
                Pilih Frame Gratis Lain
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
