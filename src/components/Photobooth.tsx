"use client";

import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { usePhotoboothStore } from "@/store/usePhotoboothStore";
import { useAuthStore } from "@/store/useAuthStore";
import { savePhotobooth } from "@/utils/supabaseHelpers";
import SaveMemoriesModal from "./SaveMemoriesModal";

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
    isGeneratingJpg,
    isGeneratingGif,
    isGeneratingVideo,
  } = usePhotoboothStore();

  const { user } = useAuthStore();
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [pendingJpg, setPendingJpg] = useState<string | null>(null);
  const [pendingGif, setPendingGif] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleExportsCompleted = async (jpgUrlVal: string, gifUrlVal: string | null) => {
    const currentUser = useAuthStore.getState().user;
    if (currentUser) {
      setIsSaving(true);
      try {
        await savePhotobooth(
          currentUser.id,
          selectedTheme.id,
          caption,
          selectedLayout.frames,
          jpgUrlVal,
          gifUrlVal
        );
      } catch (err) {
        console.error("Auto save failed:", err);
      } finally {
        setIsSaving(false);
      }
      setStep("export");
    } else {
      setPendingJpg(jpgUrlVal);
      setPendingGif(gifUrlVal);
      setSaveModalOpen(true);
    }
  };

  const handleSkipSave = () => {
    setSaveModalOpen(false);
    setStep("export");
  };

  const handleSuccessLogin = async () => {
    const currentUser = useAuthStore.getState().user;
    if (currentUser && pendingJpg) {
      setIsSaving(true);
      try {
        await savePhotobooth(
          currentUser.id,
          selectedTheme.id,
          caption,
          selectedLayout.frames,
          pendingJpg,
          pendingGif
        );
      } catch (err) {
        console.error("Failed to save photobooth after login:", err);
      } finally {
        setIsSaving(false);
      }
    }
    setStep("export");
    setSaveModalOpen(false);
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

      {/* Full-screen compile overlay */}
      {(isGeneratingJpg || isGeneratingGif || isGeneratingVideo) && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 select-none">
          <div className="bg-white border border-slate-800 p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center gap-4 text-center max-w-sm mx-4 animate-in fade-in zoom-in-95 duration-150">
            <RefreshCw size={36} className="animate-spin text-slate-800" />
            <div className="space-y-1.5 font-mono">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                {isGeneratingVideo ? "Compiling 9:16 Video" : "Compiling HD Exports"}
              </h3>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest leading-relaxed">
                {isGeneratingVideo
                  ? "Rendering flash cuts & Instagram/TikTok story motion..."
                  : "Capturing layout details and compiling animation loop..."}
              </p>
            </div>
            <div className="w-48 bg-slate-100 h-1.5 border border-slate-800 overflow-hidden relative">
              <div className="absolute inset-y-0 bg-slate-850 animate-pulse w-full" />
            </div>
          </div>
        </div>
      )}

      {/* Cloud Saving Loader Overlay */}
      {isSaving && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 select-none">
          <div className="bg-white border border-slate-800 p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center gap-4 text-center max-w-sm mx-4 animate-in fade-in zoom-in-95 duration-150 font-mono">
            <RefreshCw size={36} className="animate-spin text-slate-800" />
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Saving to Cloud</h3>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest leading-relaxed">
                Uploading high-res strip and animation loop to your profile...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Guest Mode Save Prompt Modal */}
      <SaveMemoriesModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        onSkip={handleSkipSave}
        onSuccessLogin={handleSuccessLogin}
      />
    </div>
  );
}