"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import gifshot from "gifshot";
import {
  Download,
  Share2,
  RefreshCw,
  Home,
  CheckCircle,
  Undo2,
  Video,
  Film,
  FileImage,
  Sparkles,
  QrCode,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import QRCode from "qrcode";
import { usePhotoboothStore } from "@/store/usePhotoboothStore";
import { useAuthStore } from "@/store/useAuthStore";
import { compileStoryVideoMp4 } from "@/utils/videoExporter";
import { getFilteredPhotoFrames } from "@/utils/photoboothHelpers";
import { uploadBase64ToStorage } from "@/utils/supabaseHelpers";

export default function ExportStep() {
  const {
    setStep,
    selectedLayout,
    capturedPhotos,
    selectedTheme,
    caption,
    exportJpgUrl,
    cloudImageUrl,
    setCloudImageUrl,
    exportGifUrl,
    setExportGifUrl,
    exportVideoUrl,
    setExportVideoUrl,
    isGeneratingJpg,
    isGeneratingGif,
    setIsGeneratingGif,
    isGeneratingVideo,
    setIsGeneratingVideo,
    activePhotoEffects,
    globalFilter,
    resetStore,
  } = usePhotoboothStore();

  const [exportFormat, setExportFormat] = useState<"jpg" | "gif" | "mp4">("jpg");
  const [gifSpeed, setGifSpeed] = useState<"slow" | "normal" | "fast">("normal");
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [qrTargetUrl, setQrTargetUrl] = useState<string>("");
  const [isGeneratingQr, setIsGeneratingQr] = useState<boolean>(false);
  const [qrCopied, setQrCopied] = useState<boolean>(false);

  const speedMap = {
    slow: 0.15,
    normal: 0.1,
    fast: 0.05,
  };

  // Regenerate GIF with custom speed
  const handleGifSpeedChange = async (speed: "slow" | "normal" | "fast") => {
    setGifSpeed(speed);
    setIsGeneratingGif(true);

    try {
      const intervalVal = speedMap[speed];
      const processedFrames = await getFilteredPhotoFrames(
        capturedPhotos,
        activePhotoEffects,
        globalFilter
      );

      if (processedFrames.length === 0) {
        setIsGeneratingGif(false);
        return;
      }

      const createGif = (width: number, height: number) => {
        gifshot.createGIF(
          {
            images: processedFrames,
            gifWidth: width,
            gifHeight: height,
            interval: intervalVal,
            numFrames: processedFrames.length,
            frameDuration: intervalVal * 100,
            numWorkers: 2,
          },
          (obj) => {
            if (!obj.error && obj.image) {
              setExportGifUrl(obj.image);
            } else {
              console.error("Gifshot failed:", obj.errorMsg);
            }
            setIsGeneratingGif(false);
          }
        );
      };

      const img = new Image();
      img.onload = () => {
        const maxDim = 640;
        let gifW = img.naturalWidth || 640;
        let gifH = img.naturalHeight || 480;
        if (gifW > maxDim || gifH > maxDim) {
          if (gifW > gifH) {
            gifH = Math.round((gifH * maxDim) / gifW);
            gifW = maxDim;
          } else {
            gifW = Math.round((gifW * maxDim) / gifH);
            gifH = maxDim;
          }
        }
        createGif(gifW, gifH);
      };

      img.onerror = () => {
        createGif(640, 480);
      };

      img.src = processedFrames[0] || capturedPhotos[0];
    } catch (error) {
      console.error("GIF export failed:", error);
      setIsGeneratingGif(false);
    }
  };

  // Generate vertical MP4 video for Instagram Reels / Stories / TikTok
  const generateVideoMp4 = async (jpgUrlOverride?: string) => {
    const jpgSrc = jpgUrlOverride || exportJpgUrl;
    if (!jpgSrc || capturedPhotos.length === 0 || isGeneratingVideo) return;

    setIsGeneratingVideo(true);
    try {
      const processedFrames = await getFilteredPhotoFrames(
        capturedPhotos,
        activePhotoEffects,
        globalFilter
      );

      const videoBlobUrl = await compileStoryVideoMp4({
        photos: processedFrames,
        stripImageUrl: jpgSrc,
        themeBg: selectedTheme.bg,
        themeText: selectedTheme.text,
        caption: caption.trim() || undefined,
        isGrid: selectedLayout.type === "grid",
      });

      setExportVideoUrl(videoBlobUrl);
    } catch (err) {
      console.error("Video compilation failed:", err);
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleSelectVideoFormat = () => {
    setExportFormat("mp4");
    if (!exportVideoUrl && !isGeneratingVideo && exportJpgUrl) {
      generateVideoMp4(exportJpgUrl);
    }
  };

  // Download helper
  const handleDownload = (url: string | null, defaultFilename: string) => {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = defaultFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Native share with dynamic MP4 / GIF / JPG file attachment
  const handleNativeShare = async () => {
    const targetUrl =
      exportFormat === "mp4" ? exportVideoUrl : exportFormat === "gif" ? exportGifUrl : exportJpgUrl;
    const filename =
      exportFormat === "mp4"
        ? "posean-reels-story.mp4"
        : exportFormat === "gif"
          ? "posean-loop.gif"
          : "posean-hd-strip.jpg";
    const mimeType =
      exportFormat === "mp4" ? "video/mp4" : exportFormat === "gif" ? "image/gif" : "image/jpeg";

    if (navigator.share && targetUrl) {
      try {
        const response = await fetch(targetUrl);
        const blob = await response.blob();
        const file = new File([blob], filename, { type: mimeType });
        if (navigator.canShare && !navigator.canShare({ files: [file] })) {
          setShowShareModal(true);
          return;
        }
        await navigator.share({
          files: [file],
          title: "Posean Photobooth",
          text: "Capture Fun, Keep Memories! 📸",
        });
      } catch (err) {
        console.warn("Share failed:", err);
        setShowShareModal(true);
      }
    } else {
      setShowShareModal(true);
    }
  };

  // Open QR modal and generate QR Code for mobile scanning
  const handleOpenQrModal = async () => {
    setShowQrModal(true);
    setIsGeneratingQr(true);
    setQrCopied(false);

    try {
      let directImageUrl = cloudImageUrl || (exportJpgUrl?.startsWith("http") ? exportJpgUrl : "");

      // If user is authenticated and directImageUrl is not yet available, try quick upload to storage
      if (!directImageUrl && exportJpgUrl) {
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          try {
            const uploaded = await uploadBase64ToStorage(currentUser.id, exportJpgUrl, "jpg");
            if (uploaded && uploaded.startsWith("http")) {
              directImageUrl = uploaded;
              setCloudImageUrl(uploaded);
            }
          } catch (e) {
            console.warn("Auto storage upload for QR failed:", e);
          }
        }
      }

      // If we have a direct image URL (from Supabase Storage)
      let fullScanUrl = window.location.origin;
      if (directImageUrl && directImageUrl.startsWith("http")) {
        fullScanUrl = `${window.location.origin}/download?url=${encodeURIComponent(directImageUrl)}`;
      } else {
        fullScanUrl = `${window.location.origin}/`;
      }

      setQrTargetUrl(fullScanUrl);
      const qrData = await QRCode.toDataURL(fullScanUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: "#0F172A",
          light: "#FFFFFF",
        },
      });
      setQrDataUrl(qrData);
    } catch (err) {
      console.error("QR Code generation failed:", err);
    } finally {
      setIsGeneratingQr(false);
    }
  };

  const handleCopyQrLink = () => {
    if (qrTargetUrl) {
      navigator.clipboard.writeText(qrTargetUrl);
      setQrCopied(true);
      setTimeout(() => setQrCopied(false), 2500);
    }
  };

  return (
    <>
      <motion.div
        key="export"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="w-full lg:max-w-none lg:grid lg:grid-cols-[45%_55%] lg:gap-8 lg:items-stretch flex flex-col items-center gap-5 lg:h-[calc(100vh-170px)] lg:min-h-[500px]"
      >
        <div className="w-full lg:col-span-1 order-2 lg:order-1 flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-190px)] lg:overflow-y-auto lg:pr-2 mx-auto">
          <div className="hidden lg:block text-left space-y-1 select-none mb-1">
            <span className="text-[9px] font-bold text-slate-400 tracking-[0.3em] uppercase font-mono">EXPORT</span>
            <h2 className="text-lg font-bold text-slate-800 font-mono uppercase tracking-tight">Download & Share</h2>
          </div>
          <div className="block lg:hidden text-center space-y-1 select-none">
            <h2 className="text-sm font-bold text-slate-400 tracking-[0.3em] font-mono uppercase">EXPORT</h2>
          </div>

          <div className="flex flex-col gap-2 select-none w-full">
            <span className="text-[9px] font-bold text-slate-400 font-mono tracking-widest uppercase text-left">FORMAT</span>
            <div className="grid grid-cols-3 gap-2 w-full">
              {/* JPG OPTION */}
              <button
                onClick={() => setExportFormat("jpg")}
                className={`flex flex-col items-center justify-center p-2.5 border transition-all cursor-pointer rounded-none text-center ${
                  exportFormat === "jpg"
                    ? "border-slate-900 bg-slate-900 text-white shadow-none"
                    : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]"
                }`}
              >
                <FileImage size={14} className="mb-1" />
                <span className="text-[9px] font-bold font-mono uppercase tracking-wider">
                  {selectedLayout.type === "grid" ? "GRID JPG" : "STRIP JPG"}
                </span>
                <span className="text-[7px] opacity-75 font-mono mt-0.5">High-res 4K</span>
              </button>

              {/* GIF OPTION */}
              <button
                onClick={() => setExportFormat("gif")}
                className={`flex flex-col items-center justify-center p-2.5 border transition-all cursor-pointer rounded-none text-center ${
                  exportFormat === "gif"
                    ? "border-slate-900 bg-slate-900 text-white shadow-none"
                    : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]"
                }`}
              >
                <Film size={14} className="mb-1" />
                <span className="text-[9px] font-bold font-mono uppercase tracking-wider">LOOP GIF</span>
                <span className="text-[7px] opacity-75 font-mono mt-0.5">Boomerang</span>
              </button>

              {/* MP4 VIDEO OPTION */}
              <button
                onClick={handleSelectVideoFormat}
                className={`flex flex-col items-center justify-center p-2.5 border transition-all cursor-pointer rounded-none text-center relative ${
                  exportFormat === "mp4"
                    ? "border-slate-900 bg-gradient-to-br from-purple-700 to-pink-600 text-white shadow-none"
                    : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]"
                }`}
              >
                <span className="absolute -top-1.5 -right-1 bg-amber-400 text-slate-900 text-[6.5px] font-black font-mono px-1 border border-slate-900 uppercase">
                  9:16
                </span>
                <Video size={14} className="mb-1" />
                <span className="text-[9px] font-bold font-mono uppercase tracking-wider">VIDEO MP4</span>
                <span className="text-[7px] opacity-75 font-mono mt-0.5">Reels / TikTok</span>
              </button>
            </div>
          </div>

          {/* GIF SPEED CONTROLS */}
          {exportFormat === "gif" && (
            <div className="w-full flex flex-col gap-2.5 select-none animate-in fade-in slide-in-from-bottom-2 duration-200">
              <span className="text-[9px] font-bold text-slate-400 font-mono tracking-widest uppercase text-left">GIF SPEED</span>
              <div className="grid grid-cols-3 gap-2">
                {(["slow", "normal", "fast"] as const).map((speed) => {
                  const isActive = gifSpeed === speed;
                  const label = speed === "slow" ? "Slow" : speed === "normal" ? "Normal" : "Fast";
                  const desc = speed === "slow" ? "Relaxed" : speed === "normal" ? "Recommended" : "Quick";
                  return (
                    <button
                      key={speed}
                      onClick={() => handleGifSpeedChange(speed)}
                      disabled={isGeneratingGif}
                      className={`flex flex-col items-center justify-center py-2.5 px-2 border transition-all rounded-none min-h-[44px] cursor-pointer ${
                        isActive
                          ? "border-slate-900 text-white shadow-none"
                          : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]"
                      }`}
                      style={isActive ? { backgroundColor: selectedTheme.accent || "#7C8F63" } : {}}
                    >
                      <div className="flex items-center gap-1">
                        {isActive && <CheckCircle size={10} className="text-white" />}
                        <span className="text-[10px] font-extrabold font-mono uppercase tracking-tight">{label}</span>
                      </div>
                      <span className="text-[7.5px] font-mono opacity-85 mt-0.5 whitespace-nowrap">{desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIDEO MP4 INFORMATION CALLOUT */}
          {exportFormat === "mp4" && (
            <div className="w-full flex flex-col gap-2 p-3 bg-purple-50/70 border border-purple-200 select-none animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                <span className="text-[10px] font-mono font-bold text-purple-900 uppercase tracking-tight">
                  Instagram Reels & TikTok Ready
                </span>
              </div>
              <p className="text-[8.5px] font-mono text-purple-700 leading-relaxed">
                Resolusi 9:16 vertikal HD dengan animasi flash cut & showcase frame {selectedLayout.name}. Pas diunggah langsung ke Story, Reels, atau TikTok!
              </p>
              {!exportVideoUrl && !isGeneratingVideo && (
                <button
                  onClick={() => generateVideoMp4()}
                  className="mt-1 py-2 px-3 bg-purple-600 text-white font-mono text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-purple-700 active:scale-95 cursor-pointer shadow-xs"
                >
                  <Sparkles size={11} className="text-amber-300" /> Generate Video Now
                </button>
              )}
            </div>
          )}

          <div className="w-full flex flex-col gap-3">
            {exportFormat === "jpg" ? (
              <button
                onClick={() =>
                  handleDownload(
                    exportJpgUrl,
                    selectedLayout.type === "grid" ? "posean-grid-2x2.jpg" : "posean-hd-strip.jpg"
                  )
                }
                disabled={isGeneratingJpg || !exportJpgUrl}
                className="w-full py-3.5 border border-slate-800 bg-[#FF6B6B] text-white font-mono text-xs font-black uppercase tracking-wider rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 hover:brightness-95 disabled:opacity-50 cursor-pointer"
              >
                <Download size={14} /> Download {selectedLayout.type === "grid" ? "Grid 2x2 JPG" : "Strip JPG"}
              </button>
            ) : exportFormat === "gif" ? (
              <button
                onClick={() => handleDownload(exportGifUrl, "posean-loop.gif")}
                disabled={isGeneratingGif || !exportGifUrl}
                className="w-full py-3.5 border border-slate-800 bg-[#4ECDC4] text-slate-800 font-mono text-xs font-black uppercase tracking-wider rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 hover:brightness-95 disabled:opacity-50 cursor-pointer"
              >
                <Download size={14} /> Download GIF
              </button>
            ) : (
              <button
                onClick={() => {
                  if (!exportVideoUrl && !isGeneratingVideo) {
                    generateVideoMp4();
                  } else {
                    handleDownload(exportVideoUrl, "posean-reels-story.mp4");
                  }
                }}
                disabled={isGeneratingVideo}
                className="w-full py-3.5 border border-slate-800 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 text-white font-mono text-xs font-black uppercase tracking-wider rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 hover:brightness-95 disabled:opacity-50 cursor-pointer"
              >
                {isGeneratingVideo ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Compiling 9:16 MP4...
                  </>
                ) : (
                  <>
                    <Download size={14} /> Download MP4 Video
                  </>
                )}
              </button>
            )}

            <button
              onClick={handleNativeShare}
              className="w-full py-3 border border-slate-800 bg-[#FFE66D] text-slate-900 font-mono text-[10px] font-bold uppercase rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-1.5 hover:scale-[1.01] transition-transform cursor-pointer"
            >
              <Share2 size={13} /> Share {exportFormat.toUpperCase()}
            </button>

            <button
              onClick={handleOpenQrModal}
              className="w-full py-3 border border-slate-800 bg-[#4ECDC4] text-slate-950 font-mono text-[10px] font-black uppercase rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-1.5 hover:scale-[1.01] transition-transform cursor-pointer"
            >
              <QrCode size={13} />
              <span>Scan QR ke HP</span>
              <span className="text-[7.5px] bg-slate-900 text-white px-1.5 py-0.2 font-mono">
                INSTANT
              </span>
            </button>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("editor")}
                className="flex-1 py-2.5 px-4 border border-slate-800 bg-white text-slate-800 font-mono text-[10px] font-bold rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-50 flex items-center justify-center gap-1 cursor-pointer"
              >
                <Undo2 size={12} /> Edit
              </button>
              <button
                onClick={() => {
                  resetStore();
                  setStep("landing");
                }}
                className="flex-1 py-2.5 px-4 border border-slate-800 bg-white text-slate-800 font-mono text-[10px] font-bold rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-50 flex items-center justify-center gap-1 cursor-pointer"
              >
                <Home size={12} /> New
              </button>
            </div>
          </div>
        </div>

        <div className="w-full lg:col-span-1 order-1 lg:order-2 flex flex-col items-center justify-center bg-slate-50 lg:border lg:border-slate-200 lg:p-6 rounded-none relative lg:h-full lg:overflow-hidden min-h-[380px]">
          {/* Badge above preview panel in Export Page */}
          {exportFormat === "gif" && (
            <div className="absolute top-2 lg:top-4 left-1/2 transform -translate-x-1/2 z-30 select-none animate-bounce">
              <span className="bg-[#FFE66D] border border-slate-800 text-slate-800 font-mono text-[9px] font-black px-2.5 py-1 uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                ⚡ LIVE GIF PREVIEW
              </span>
            </div>
          )}

          {exportFormat === "mp4" && (
            <div className="absolute top-2 lg:top-4 left-1/2 transform -translate-x-1/2 z-30 select-none animate-bounce">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 border border-slate-800 text-white font-mono text-[9px] font-black px-2.5 py-1 uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                🎬 9:16 REELS & STORY PREVIEW
              </span>
            </div>
          )}

          <div className="w-full max-w-[336px] lg:max-w-none lg:w-auto border border-slate-300 bg-slate-100 rounded-none overflow-hidden shadow-xl p-2.5 relative flex flex-col items-center justify-center lg:max-h-[calc(100vh-260px)]">
            {exportFormat === "jpg" ? (
              <div className="w-full lg:w-auto lg:h-auto flex items-center justify-center">
                {isGeneratingJpg ? (
                  <div className="w-full lg:w-[250px] min-h-[350px] flex flex-col items-center justify-center gap-2 bg-white border border-slate-200 text-zinc-400 font-mono text-[9px] text-center p-1 select-none">
                    <RefreshCw size={20} className="animate-spin text-slate-800" />
                    <span>GENERATING JPG...</span>
                  </div>
                ) : (
                  exportJpgUrl && (
                    <img
                      src={exportJpgUrl}
                      alt="Final Strip"
                      className="w-full h-auto lg:w-auto lg:h-auto lg:max-h-[calc(100vh-285px)] block rounded-none border border-slate-200 animate-in fade-in duration-200 object-contain"
                    />
                  )
                )}
              </div>
            ) : exportFormat === "gif" ? (
              <div className="w-full lg:w-auto lg:h-auto flex items-center justify-center">
                {isGeneratingGif ? (
                  <div className="w-full lg:w-[250px] min-h-[350px] flex flex-col items-center justify-center gap-2 bg-white border border-slate-200 text-zinc-400 font-mono text-[9px] text-center p-1 select-none">
                    <RefreshCw size={20} className="animate-spin text-slate-800" />
                    <span>GENERATING GIF...</span>
                  </div>
                ) : (
                  exportGifUrl && (
                    <img
                      src={exportGifUrl}
                      alt="Animated GIF"
                      className="w-full h-auto lg:w-auto lg:h-auto lg:max-h-[calc(100vh-285px)] block rounded-none border border-slate-200 animate-in fade-in duration-200 object-contain"
                    />
                  )
                )}
              </div>
            ) : (
              /* MP4 PREVIEW */
              <div className="w-full lg:w-auto lg:h-auto flex items-center justify-center">
                {isGeneratingVideo ? (
                  <div className="w-full lg:w-[260px] min-h-[380px] flex flex-col items-center justify-center gap-2.5 bg-white border border-slate-200 text-slate-700 font-mono text-[9px] text-center p-4 select-none">
                    <RefreshCw size={24} className="animate-spin text-purple-600" />
                    <span className="font-bold tracking-wider text-slate-800">COMPILING 9:16 VIDEO...</span>
                    <span className="text-[8px] text-slate-400">Rendering frame cuts and motion loop</span>
                  </div>
                ) : exportVideoUrl ? (
                  <div className="w-full max-w-[270px] lg:max-w-[280px] aspect-[9/16] bg-black border border-slate-300 shadow-md relative overflow-hidden flex items-center justify-center">
                    <video
                      src={exportVideoUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      controls
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-full lg:w-[260px] min-h-[350px] flex flex-col items-center justify-center gap-3 bg-white border border-slate-200 text-zinc-400 font-mono text-[9px] text-center p-4 select-none">
                    <Video size={32} className="text-purple-400 opacity-60" />
                    <span className="font-bold text-slate-700">READY TO GENERATE MP4</span>
                    <span className="text-[8px] text-slate-400">Vertical HD (Reels / TikTok format)</span>
                    <button
                      onClick={() => generateVideoMp4()}
                      className="py-2 px-3 bg-purple-600 text-white font-mono text-[9px] font-bold uppercase rounded-none hover:bg-purple-700 cursor-pointer shadow-sm"
                    >
                      Render Video (MP4)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-white border border-slate-800 rounded-none p-5 flex flex-col items-center gap-4 text-center relative shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-in fade-in zoom-in duration-150">
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-3 right-3 text-[10px] font-black font-mono text-slate-800 hover:underline cursor-pointer"
            >
              ✕
            </button>
            <div className="w-10 h-10 rounded-none bg-[#FFE66D] border border-slate-800 flex items-center justify-center text-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              📢
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-tight">Share Memory</h3>
              <p className="text-[10px] text-slate-400">Send your creation to friends!</p>
            </div>
            <div className="w-full flex flex-col gap-2 mt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Link copied!");
                  setShowShareModal(false);
                }}
                className="w-full py-2 bg-white border border-slate-800 font-mono text-[10px] font-bold rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-50 cursor-pointer"
              >
                Copy Link
              </button>
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  "Check out Posean Photobooth! " + window.location.href
                )}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => setShowShareModal(false)}
                className="w-full py-2 bg-[#25D366] border border-slate-800 text-white font-mono text-[10px] font-bold rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:brightness-95 flex items-center justify-center gap-1.5"
              >
                WhatsApp
              </a>
              <button
                onClick={() => {
                  alert("Download file and post to Instagram Story / Reels!");
                  setShowShareModal(false);
                }}
                className="w-full py-2 bg-[#E1306C] border border-slate-800 text-white font-mono text-[10px] font-bold rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:brightness-95 cursor-pointer"
              >
                Instagram Story
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal for Mobile Scanning */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white border-2 border-slate-900 rounded-none p-5 sm:p-6 flex flex-col items-center gap-4 text-center relative shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-3 right-3 text-xs font-black font-mono text-slate-800 hover:bg-slate-100 p-1 cursor-pointer"
            >
              ✕
            </button>

            {/* Header Badge */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-none bg-[#4ECDC4] border border-slate-900 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <QrCode size={18} className="text-slate-900" />
              </div>
              <div className="text-left font-mono">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                  Scan QR ke Smartphone
                </h3>
                <span className="text-[9px] text-teal-700 font-bold">
                  ⚡ Unduh Langsung di HP Kamu
                </span>
              </div>
            </div>

            {/* QR Code Display Container */}
            <div className="p-3 bg-white border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center min-w-[210px] min-h-[210px]">
              {isGeneratingQr ? (
                <div className="flex flex-col items-center gap-2 text-slate-500 font-mono text-[10px]">
                  <RefreshCw size={24} className="animate-spin text-slate-800" />
                  <span>Membuat Kode QR...</span>
                </div>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Code Photobooth"
                  className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                />
              ) : (
                <div className="text-red-500 text-[10px] font-mono">
                  Gagal memuat QR Code.
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="space-y-1 font-mono text-left w-full bg-slate-50 border border-slate-200 p-2.5">
              <p className="text-[10px] font-bold text-slate-800">
                Cara Mengunduh ke Ponsel:
              </p>
              <ol className="text-[8.5px] text-slate-600 list-decimal list-inside space-y-0.5">
                <li>Buka aplikasi <strong>Kamera</strong> di HP (iPhone / Android)</li>
                <li>Arahkan kamera ke kode QR di atas</li>
                <li>Ketuk notifikasi / link yang muncul untuk simpan foto!</li>
              </ol>
            </div>

            {/* Action Buttons */}
            <div className="w-full flex flex-col gap-2 font-mono">
              <button
                onClick={handleCopyQrLink}
                className="w-full py-2.5 px-3 bg-white border border-slate-900 text-slate-900 font-bold text-[10px] uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-50 active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {qrCopied ? (
                  <>
                    <Check size={12} className="text-emerald-600" />
                    <span>Link Download Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Salin Link Download</span>
                  </>
                )}
              </button>

              {qrTargetUrl && (
                <a
                  href={qrTargetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-1.5 text-slate-600 hover:text-slate-900 text-[9px] uppercase tracking-wider flex items-center justify-center gap-1"
                >
                  <ExternalLink size={11} />
                  <span>Buka di Tab Baru</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
