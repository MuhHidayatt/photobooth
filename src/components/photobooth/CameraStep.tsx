"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Camera, RotateCw, AlertCircle } from "lucide-react";
import { usePhotoboothStore } from "@/store/usePhotoboothStore";
import { audio } from "@/utils/audio";
import { processCapturedPhoto, generateRandomDoodles } from "@/utils/photoboothHelpers";

export default function CameraStep() {
  const {
    setStep,
    selectedLayout,
    countdownTime,
    setCountdownTime,
    capturedPhotos,
    setCapturedPhotos,
    addCapturedPhoto,
    singleRetakeIndex,
    setSingleRetakeIndex,
    setActivePhotoEffects,
    setStickers,
    stickers,
    frameImageUrl,
    audioMuted,
  } = usePhotoboothStore();

  const [cameraAccess, setCameraAccess] = useState<boolean | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [flashActive, setFlashActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const videoRef = useRef<HTMLVideoElement>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const isStartingCameraRef = useRef<boolean>(false);

  // Load saved camera preference on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("photobooth_facingMode");
      if (stored === "user" || stored === "environment") {
        setFacingMode(stored);
      }
    }
  }, []);

  // Sound triggers
  const playSound = (type: "tick" | "shutter") => {
    if (audioMuted) return;
    if (type === "tick") audio.playTick();
    if (type === "shutter") audio.playShutter();
  };

  const stopCamera = () => {
    console.log("[Camera] Stopping camera stream...");
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      activeStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async (currentFacingMode: "user" | "environment") => {
    if (isStartingCameraRef.current) return;
    isStartingCameraRef.current = true;

    try {
      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: currentFacingMode,
        },
        audio: false,
      });

      activeStreamRef.current = stream;
      setCameraAccess(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error("[Camera] Error starting camera:", err);
      setCameraAccess(false);
      stopCamera();
    } finally {
      isStartingCameraRef.current = false;
    }
  };

  // Safe Camera Lifecycle
  useEffect(() => {
    startCamera(facingMode);
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const getScreenshot = () => {
    if (!videoRef.current) return null;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", 1.0);
    }
    return null;
  };

  const startCameraSession = async () => {
    if (isCapturing) return;
    setIsCapturing(true);

    const isSingleRetake = singleRetakeIndex !== null;
    const targetFrames = isSingleRetake ? 1 : selectedLayout.frames;
    const startIndex = isSingleRetake ? singleRetakeIndex : 0;

    if (!isSingleRetake) {
      setCapturedPhotos([]);
      setActivePhotoEffects([]);
    }

    for (let i = 0; i < targetFrames; i++) {
      const activeIndex = isSingleRetake ? startIndex : i;
      setCurrentFrameIndex(activeIndex);

      for (let sec = countdownTime; sec > 0; sec--) {
        setCountdown(sec);
        playSound("tick");
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      setCountdown(0);
      setFlashActive(true);
      playSound("shutter");

      await new Promise((resolve) => setTimeout(resolve, 100));
      const snapshot = getScreenshot();
      setFlashActive(false);

      if (snapshot) {
        const processed = await processCapturedPhoto(snapshot, facingMode);
        addCapturedPhoto(processed, activeIndex);
      }

      if (!isSingleRetake && i < targetFrames - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }

    setIsCapturing(false);
    setSingleRetakeIndex(null);

    // Generate random stickers for initial design only if no custom graphic frame is active and no existing stickers
    if (!frameImageUrl && (!stickers || stickers.length === 0)) {
      const randomStickers = generateRandomDoodles(selectedLayout.type);
      setStickers(randomStickers);
    }

    setStep("editor");
  };

  return (
    <motion.div
      key="camera"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-md lg:max-w-4xl flex flex-col lg:grid lg:grid-cols-12 lg:gap-8 lg:items-center gap-4"
    >
      <div className="w-full lg:col-span-7 aspect-[4/3] border border-slate-800 bg-black rounded-none overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center relative">
        {cameraAccess === false ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center gap-3 bg-slate-950 text-zinc-300">
            <AlertCircle size={32} className="text-[#FF6B6B]" />
            <div className="space-y-1">
              <p className="font-bold text-white font-mono uppercase text-xs">CAMERA NOT ALLOWED</p>
              <p className="text-[10px] text-zinc-400 max-w-[200px]">Please enable camera access in your browser.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setCameraAccess(null);
                  startCamera(facingMode);
                }}
                className="py-1.5 px-3 bg-white border border-slate-800 rounded-none text-[10px] font-bold text-slate-800 font-mono hover:bg-slate-50 transition-colors cursor-pointer"
              >
                RETRY
              </button>
              <button
                onClick={() => {
                  setSingleRetakeIndex(null);
                  setStep("layout");
                }}
                className="py-1.5 px-3 bg-slate-800 border border-slate-700 rounded-none text-[10px] font-bold text-white font-mono hover:bg-slate-700 transition-colors cursor-pointer"
              >
                GANTI LAYOUT
              </button>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover object-center ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
            />

            {flashActive && <div className="absolute inset-0 flash-effect z-40" />}

            {countdown > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/45 z-30 select-none">
                <motion.div
                  key={countdown}
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: 1.2, opacity: 1 }}
                  exit={{ scale: 1.8, opacity: 0 }}
                  className="text-7xl font-bold text-[#FFE66D] font-mono"
                >
                  {countdown}
                </motion.div>
              </div>
            )}

            {isCapturing && countdown === 0 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900 border border-white text-white font-mono font-bold rounded-none text-[9px] tracking-widest z-30 select-none uppercase">
                SMILE! 📸
              </div>
            )}
            {/* Quick camera flip button right on viewfinder for mobile */}
            <button
              onClick={() => {
                const nextMode = facingMode === "user" ? "environment" : "user";
                setFacingMode(nextMode);
                if (typeof window !== "undefined") {
                  sessionStorage.setItem("photobooth_facingMode", nextMode);
                }
              }}
              className="absolute top-3 right-3 z-30 p-2 sm:px-2.5 sm:py-1.5 bg-black/60 hover:bg-black/80 text-white border border-white/40 shadow-sm transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 font-mono text-[10px]"
              title="Ganti kamera depan/belakang"
            >
              <RotateCw size={14} />
              <span className="hidden sm:inline">{facingMode === "user" ? "Kamera Belakang" : "Kamera Depan"}</span>
            </button>
          </>
        )}
      </div>

      <div className="w-full lg:col-span-5 flex flex-col gap-4 items-center lg:items-stretch">
        {!isCapturing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 w-full">
            <div className="flex items-center justify-between w-full bg-white border border-slate-800 px-3 py-2.5 rounded-none font-mono text-[10px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-20 select-none">
              <span className="font-bold text-slate-600">COUNTDOWN:</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setCountdownTime(3)}
                  className={`px-3 py-1 rounded-none font-bold transition-all cursor-pointer ${
                    countdownTime === 3 ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  3 detik
                </button>
                <button
                  onClick={() => setCountdownTime(5)}
                  className={`px-3 py-1 rounded-none font-bold transition-all cursor-pointer ${
                    countdownTime === 5 ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  5 detik
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between w-full bg-white border border-slate-800 px-3 py-2.5 rounded-none font-mono text-[10px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-20 select-none">
              <span className="font-bold text-slate-600">KAMERA:</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => {
                    setFacingMode("user");
                    if (typeof window !== "undefined") {
                      sessionStorage.setItem("photobooth_facingMode", "user");
                    }
                  }}
                  className={`px-2.5 py-1 rounded-none font-bold transition-all cursor-pointer ${
                    facingMode === "user" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Depan
                </button>
                <button
                  onClick={() => {
                    setFacingMode("environment");
                    if (typeof window !== "undefined") {
                      sessionStorage.setItem("photobooth_facingMode", "environment");
                    }
                  }}
                  className={`px-2.5 py-1 rounded-none font-bold transition-all cursor-pointer ${
                    facingMode === "environment" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Belakang
                </button>
              </div>
            </div>
          </div>
        )}

        {isCapturing && (
          <div className="flex flex-col items-center lg:items-start gap-2 select-none bg-white border border-slate-200 p-3 w-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-mono">
            <span className="text-[9px] font-bold uppercase text-slate-500">
              {singleRetakeIndex !== null
                ? `Retaking #${singleRetakeIndex + 1}`
                : `Capturing ${currentFrameIndex + 1} of ${selectedLayout.frames}`}
            </span>
            <div className="flex gap-1.5">
              {Array.from({ length: selectedLayout.frames }).map((_, fIdx) => (
                <div
                  key={fIdx}
                  className={`w-3.5 h-3.5 rounded-none border border-slate-800 transition-all ${
                    fIdx < capturedPhotos.length
                      ? "bg-slate-800 scale-105"
                      : fIdx === currentFrameIndex
                        ? "bg-[#FFE66D] animate-ping"
                        : "bg-slate-100"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        <div className="w-full flex flex-col gap-3">
          {!isCapturing ? (
            <>
              <button
                onClick={startCameraSession}
                disabled={cameraAccess === false}
                className="w-full py-3.5 px-5 border border-slate-800 bg-slate-900 text-white font-mono text-xs font-bold rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:brightness-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Camera size={15} />
                {singleRetakeIndex !== null ? "Retake Frame" : "Start Capture"}
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSingleRetakeIndex(null);
                    setStep(capturedPhotos.length > 0 ? "editor" : "layout");
                  }}
                  className="flex-1 py-2.5 px-4 border border-slate-800 bg-white text-slate-800 font-mono text-[10px] font-bold rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer flex items-center justify-center"
                >
                  Back
                </button>

                <button
                  onClick={() => {
                    const newMode = facingMode === "user" ? "environment" : "user";
                    setFacingMode(newMode);
                    if (typeof window !== "undefined") {
                      sessionStorage.setItem("photobooth_facingMode", newMode);
                    }
                  }}
                  title="Switch Camera"
                  className="py-2.5 px-3 border border-slate-800 bg-white text-slate-800 rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer flex items-center justify-center"
                >
                  <RotateCw size={13} />
                </button>
              </div>
            </>
          ) : (
            <div className="w-full py-3.5 px-5 border border-dashed border-slate-350 text-[10px] font-mono text-slate-400 bg-slate-50/50 rounded-none animate-pulse select-none uppercase tracking-wide text-center">
              ⚡ Capturing in progress...
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
