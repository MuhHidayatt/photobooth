"use client";

import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { usePhotoboothStore } from "@/store/usePhotoboothStore";
import { useAuthStore } from "@/store/useAuthStore";
import { savePhotobooth } from "@/utils/supabaseHelpers";

// Modular Sub-Components
import LandingStep from "./photobooth/LandingStep";
import LayoutStep from "./photobooth/LayoutStep";
import CameraStep from "./photobooth/CameraStep";
import EditorStep from "./photobooth/EditorStep";
import ExportStep from "./photobooth/ExportStep";

export default function Photobooth() {
  const {
    step,
    setStep,
    selectedTheme,
    selectedLayout,
    caption,
    setCloudImageUrl,
  } = usePhotoboothStore();

  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center w-full min-h-[60vh] font-mono text-xs text-slate-400">
        <RefreshCw size={24} className="animate-spin text-slate-800 mb-2" />
        <span className="uppercase tracking-widest">Memuat Sesi Photobooth...</span>
      </div>
    );
  }

  const handleExportsCompleted = (jpgUrlVal: string, gifUrlVal: string | null) => {
    // Navigate immediately to export step without blocking modals
    setStep("export");

    const currentUser = useAuthStore.getState().user;
    if (currentUser) {
      savePhotobooth(
        currentUser.id,
        selectedTheme.id,
        caption,
        selectedLayout.frames,
        jpgUrlVal,
        gifUrlVal
      )
        .then((saved) => {
          if (saved?.jpg_url) {
            setCloudImageUrl(saved.jpg_url);
          }
        })
        .catch((err) => {
          console.error("Auto save failed:", err);
        });
    }
  };

  return (
    <div className="flex-1 flex flex-col w-full relative bg-[#F9F9F9]">
      <main className="flex-1 flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative z-10">
        <div className="flex-1 flex flex-col justify-center items-center w-full px-1 sm:px-2 lg:px-4">
          <AnimatePresence mode="wait">
            {step === "landing" && <LandingStep key="landing" />}
            {step === "layout" && <LayoutStep key="layout" />}
            {step === "camera" && <CameraStep key="camera" />}
            {step === "editor" && (
              <EditorStep key="editor" onExportsCompleted={handleExportsCompleted} />
            )}
            {step === "export" && <ExportStep key="export" />}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}