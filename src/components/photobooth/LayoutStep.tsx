"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Undo2, Crown, Sparkles, X, CheckCircle, RefreshCw } from "lucide-react";
import {
  usePhotoboothStore,
  LAYOUTS,
  LayoutOption,
} from "@/store/usePhotoboothStore";
import { useAuthStore } from "@/store/useAuthStore";
import { fetchCmsFrames } from "@/utils/adminHelpers";

export default function LayoutStep() {
  const {
    selectedLayout,
    setSelectedLayout,
    setSelectedTheme,
    setStep,
  } = usePhotoboothStore();
  const { profile, setIsPro } = useAuthStore();

  const [allLayouts, setAllLayouts] = useState<LayoutOption[]>(LAYOUTS);
  const [loading, setLoading] = useState(true);
  const [proModalOpen, setProModalOpen] = useState(false);
  const [pendingProLayout, setPendingProLayout] = useState<LayoutOption | null>(
    null
  );

  useEffect(() => {
    async function loadCmsFrames() {
      setLoading(true);
      try {
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

          // Merge default layouts and CMS custom layouts (avoiding duplicates by id)
          const existingIds = new Set(LAYOUTS.map((l) => String(l.id)));
          const uniqueCms = mappedCms.filter((c) => !existingIds.has(String(c.id)));
          setAllLayouts([...LAYOUTS, ...uniqueCms]);
        }
      } catch (err) {
        console.error("Failed to load CMS frames:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCmsFrames();
  }, []);

  const handleSelectLayout = (layout: LayoutOption) => {
    const isUserPro = profile?.is_pro || profile?.role === "admin";

    // If layout is PRO and user doesn't have pro status, trigger pro modal
    if (layout.is_pro && !isUserPro) {
      setPendingProLayout(layout);
      setProModalOpen(true);
      return;
    }

    applyLayout(layout);
  };

  const applyLayout = (layout: LayoutOption) => {
    setSelectedLayout(layout);

    // If CMS frame has custom color scheme, automatically set custom theme
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
      <div className="w-full text-center space-y-1 select-none">
        <span className="text-[8px] lg:text-[10px] font-bold text-slate-400 tracking-[0.3em] uppercase font-mono">
          CHOOSE FORMAT & TEMPLATE
        </span>
        <h2 className="text-lg lg:text-2xl font-bold text-slate-800 uppercase font-mono tracking-tight">
          Pilih Format Photobooth
        </h2>
        <p className="text-[10px] text-slate-400 font-mono">
          Template klasik dan koleksi frame terbaru dari CMS Studio
        </p>
      </div>

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

      <button
        onClick={() => setStep("landing")}
        className="mt-4 flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase font-mono tracking-wider cursor-pointer"
      >
        <Undo2 size={11} /> Kembali
      </button>

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
