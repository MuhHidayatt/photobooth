"use client";

import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import { motion, AnimatePresence } from "framer-motion";
import { toJpeg } from "html-to-image";
import gifshot from "gifshot";
import {
  Camera,
  Download,
  RotateCw,
  Sparkles,
  Smile as SmileIcon,
  Type,
  Image as ImageIcon,
  Trash2,
  Share2,
  RefreshCw,
  Home,
  CheckCircle,
  AlertCircle,
  Undo2,
  Volume2,
  VolumeX,
  X,
  Layers,
  ArrowRight,
} from "lucide-react";
import { STICKERS } from "./StickerAssets";
import { audio } from "@/utils/audio";
import { usePhotoboothStore, THEMES, LAYOUTS, ActiveSticker } from "@/store/usePhotoboothStore";

export default function Photobooth() {
  // Pull state and actions from Zustand store
  const {
    step,
    setStep,
    selectedLayout,
    setSelectedLayout,
    countdownTime,
    setCountdownTime,
    capturedPhotos,
    setCapturedPhotos,
    addCapturedPhoto,
    singleRetakeIndex,
    setSingleRetakeIndex,
    activePhotoEffects,
    setActivePhotoEffects,
    selectedTheme,
    setSelectedTheme,
    caption,
    setCaption,
    stickers,
    setStickers,
    addSticker,
    deleteSticker,
    updateSticker,
    selectedStickerId,
    setSelectedStickerId,
    stickerColor,
    setStickerColor,
    exportJpgUrl,
    setExportJpgUrl,
    exportGifUrl,
    setExportGifUrl,
    isGeneratingJpg,
    setIsGeneratingJpg,
    isGeneratingGif,
    setIsGeneratingGif,
    gifInterval,
    audioMuted,
    setAudioMuted,
    resetStore,
  } = usePhotoboothStore();

  // Component local states
  const [cameraAccess, setCameraAccess] = useState<boolean | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [flashActive, setFlashActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [editorTab, setEditorTab] = useState<"theme" | "sticker" | "caption">("theme");
  const [exportFormat, setExportFormat] = useState<"jpg" | "gif">("jpg");
  const [gifSpeed, setGifSpeed] = useState<"slow" | "normal" | "fast">("normal");
  const [gifFrames, setGifFrames] = useState<string[]>([]);

  const speedMap = {
    slow: 0.3,
    normal: 0.2,
    fast: 0.1
  };

  // References
  const webcamRef = useRef<Webcam>(null);
  const editorStripRef = useRef<HTMLDivElement>(null);
  const dragContainerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; stickerX: number; stickerY: number } | null>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);

  // Dynamic scaling for strip preview
  useEffect(() => {
    if (step !== "editor") return;

    const handleResize = () => {
      if (!rightPanelRef.current) return;
      const containerHeight = rightPanelRef.current.clientHeight;
      if (!containerHeight) return;

      const naturalHeight =
        selectedLayout.frames === 4
          ? 980
          : selectedLayout.frames === 3
            ? 760
            : 545;

      const targetHeight = containerHeight - 32;
      const scale = Math.min(1, targetHeight / naturalHeight);
      setPreviewScale(scale > 0.1 ? scale : 0.1);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    const timer = setTimeout(handleResize, 100);
    const timer2 = setTimeout(handleResize, 500);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, [step, selectedLayout.frames]);



  // Sound triggers
  const playSound = (type: "tick" | "shutter") => {
    if (audioMuted) return;
    if (type === "tick") audio.playTick();
    if (type === "shutter") audio.playShutter();
  };

  // Check and request camera permission
  useEffect(() => {
    if (step === "camera") {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then(() => setCameraAccess(true))
        .catch((err) => {
          console.error("Camera access denied or unavailable:", err);
          setCameraAccess(false);
        });
    }
  }, [step]);

  // Clean stickers when layout changes
  useEffect(() => {
    setStickers([]);
    setSelectedStickerId(null);
  }, [selectedLayout, setStickers, setSelectedStickerId]);

  // Automatic Doodle Placement Generator
  const generateRandomDoodles = () => {
    const doodleTypes = ["smiley", "star", "cloud", "heart", "sparkles", "flower", "camera", "music"];
    const maxSafeY = 85;

    const positions = [
      { x: 6, y: 5 }, { x: 94, y: 5 }, { x: 6, y: 22 }, { x: 94, y: 22 },
      { x: 6, y: 44 }, { x: 94, y: 44 }, { x: 6, y: 62 }, { x: 94, y: 62 },
      { x: 6, y: 72 }, { x: 94, y: 72 },
    ].filter((pos) => pos.y < maxSafeY - 4);

    const shuffled = [...positions].sort(() => 0.5 - Math.random());
    const count = Math.floor(Math.random() * 4) + 3;
    const selectedPositions = shuffled.slice(0, count);

    const randomStickers: ActiveSticker[] = selectedPositions.map((pos, idx) => {
      const type = doodleTypes[Math.floor(Math.random() * doodleTypes.length)];
      return {
        id: `auto_sticker_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
        type,
        x: pos.x,
        y: pos.y,
        scale: 0.85 + Math.random() * 0.3,
        rotation: (Math.random() - 0.5) * 45,
      };
    });

    setStickers(randomStickers);
  };

  // Capture session
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
      const snapshot = webcamRef.current?.getScreenshot();
      setFlashActive(false);

      if (snapshot) {
        addCapturedPhoto(snapshot, activeIndex);
      }

      if (!isSingleRetake && i < targetFrames - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }

    setIsCapturing(false);
    setSingleRetakeIndex(null);
    generateRandomDoodles();
    setStep("editor");
  };

  // Drag-and-drop sticker handling
  const handleStickerPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    sticker: ActiveSticker
  ) => {
    e.stopPropagation();
    setSelectedStickerId(sticker.id);

    const clientX = e.clientX;
    const clientY = e.clientY;

    dragStartRef.current = {
      x: clientX,
      y: clientY,
      stickerX: sticker.x,
      stickerY: sticker.y,
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!dragStartRef.current || !editorStripRef.current) return;

      const container = editorStripRef.current.getBoundingClientRect();
      const deltaX = moveEvent.clientX - dragStartRef.current.x;
      const deltaY = moveEvent.clientY - dragStartRef.current.y;

      const pctX = (deltaX / container.width) * 100;
      const pctY = (deltaY / container.height) * 100;

      const maxSafeY = 85;
      const newX = Math.max(1, Math.min(99, dragStartRef.current.stickerX + pctX));
      const newY = Math.max(1, Math.min(maxSafeY - 4, dragStartRef.current.stickerY + pctY));

      updateSticker(sticker.id, { x: newX, y: newY });
    };

    const handlePointerUp = () => {
      dragStartRef.current = null;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  // Helper to flip image horizontally (to make GIF unmirrored)
  const flipImageHorizontally = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/jpeg", 0.95));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  // Compile HD Exports
  const compileHdExports = async () => {
    setSelectedStickerId(null);
    setIsGeneratingJpg(true);
    setIsGeneratingGif(true);

    await new Promise((resolve) => setTimeout(resolve, 150));

    // 1. Generate high-res JPG
    try {
      if (editorStripRef.current) {
        const jpgDataUrl = await toJpeg(editorStripRef.current, {
          quality: 1.0,
          pixelRatio: 5,
          backgroundColor: selectedTheme.bg,
        });
        setExportJpgUrl(jpgDataUrl);
      }
    } catch (e) {
      console.error("JPEG generation failed:", e);
    } finally {
      setIsGeneratingJpg(false);
    }

    // 2. Generate HD GIF from original captured photos (as a pure slideshow, unmirrored)
    try {
      if (capturedPhotos.length > 0) {
        const intervalVal = speedMap[gifSpeed];

        // Flip photos horizontally so they are not mirrored!
        const processedPhotos = await Promise.all(
          capturedPhotos.map((photo) => flipImageHorizontally(photo))
        );
        setGifFrames(processedPhotos);

        // Measure natural dimensions from the first captured photo to keep 100% original aspect ratio
        const img = new Image();
        img.onload = () => {
          const originalW = img.naturalWidth || 640;
          const originalH = img.naturalHeight || 480;

          gifshot.createGIF(
            {
              images: processedPhotos,
              gifWidth: originalW,
              gifHeight: originalH,
              interval: intervalVal,
              numFrames: processedPhotos.length,
              frameDuration: intervalVal * 100, // Perbaikan: interval * 100 untuk centiseconds
              numWorkers: 2,
            },
            (obj) => {
              if (!obj.error) {
                setExportGifUrl(obj.image);
              } else {
                console.error("Gifshot failed:", obj.errorMsg);
              }
              setIsGeneratingGif(false);
              setStep("export");
            }
          );
        };
        img.onerror = () => {
          // Fallback to standard 640x480 if natural dimensions fail to read
          gifshot.createGIF(
            {
              images: processedPhotos,
              gifWidth: 640,
              gifHeight: 480,
              interval: intervalVal,
              numFrames: processedPhotos.length,
              frameDuration: intervalVal * 100,
              numWorkers: 2,
            },
            (obj) => {
              if (!obj.error) {
                setExportGifUrl(obj.image);
              } else {
                console.error("Gifshot failed:", obj.errorMsg);
              }
              setIsGeneratingGif(false);
              setStep("export");
            }
          );
        };
        img.src = processedPhotos[0];
      } else {
        setIsGeneratingGif(false);
        setStep("export");
      }
    } catch (e) {
      console.error("GIF export failed:", e);
      setIsGeneratingGif(false);
      setStep("export");
    }
  };

  // Regenerate GIF with new speed
  const handleGifSpeedChange = async (speed: "slow" | "normal" | "fast") => {
    setGifSpeed(speed);
    setIsGeneratingGif(true);

    try {
      const intervalVal = speedMap[speed];

      if (gifFrames.length === 0) {
        setIsGeneratingGif(false);
        return;
      }

      // Fungsi untuk membuat GIF
      const createGif = (width: number, height: number) => {
        gifshot.createGIF(
          {
            images: gifFrames,
            gifWidth: width,
            gifHeight: height,
            interval: intervalVal,
            numFrames: gifFrames.length,
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

      // Ambil dimensi dari gambar pertama
      const img = new Image();
      img.onload = () => {
        const originalW = img.naturalWidth || 640;
        const originalH = img.naturalHeight || 480;
        createGif(originalW, originalH);
      };

      img.onerror = () => {
        // Fallback ke ukuran default
        createGif(640, 480);
      };

      img.src = gifFrames[0];

    } catch (error) {
      console.error("GIF export failed:", error);
      setIsGeneratingGif(false);
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

  // Native share
  const handleNativeShare = async () => {
    if (navigator.share && exportJpgUrl) {
      try {
        const response = await fetch(exportJpgUrl);
        const blob = await response.blob();
        const file = new File([blob], "good-moments-photobooth.jpg", { type: "image/jpeg" });
        await navigator.share({
          files: [file],
          title: "Good Moments Photobooth",
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

  // Single retake
  const triggerSingleRetake = (index: number) => {
    setSingleRetakeIndex(index);
    setStep("camera");
  };

  // Render photo grid
  const renderStripPhotoGrid = () => {
    return (
      <div className="w-full flex-1 flex flex-col gap-[14px] justify-between items-center select-none">
        {Array.from({ length: selectedLayout.frames }).map((_, index) => {
          const photo = capturedPhotos[index];
          const textCol = selectedTheme.text;

          return (
            <div
              key={index}
              className="relative w-full flex-1 aspect-[4/3] overflow-hidden flex items-center justify-center rounded-none transition-transform group"
              style={{
                backgroundColor: selectedTheme.id === "midnight" ? "#121212" : "#FFFFFF",
                border: `1.5px solid ${textCol}`,
              }}
            >
              {photo ? (
                <>
                  <img
                    src={photo}
                    alt={`Snap ${index + 1}`}
                    className="w-full h-full object-contain object-center scale-x-[-1] transition-all duration-150"
                  />
                  <div className="absolute inset-0 pointer-events-none opacity-[0.02] mix-blend-overlay bg-noise" />

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
                    <button
                      onClick={() => triggerSingleRetake(index)}
                      className="py-1 px-2.5 bg-white text-slate-800 rounded-none font-mono text-[9px] font-bold border border-slate-800 flex items-center gap-1 active:scale-95 shadow cursor-pointer"
                    >
                      <RotateCw size={9} />
                      Retake #{index + 1}
                    </button>
                  </div>

                  <span
                    className="absolute top-2 right-2 text-[8px] font-mono px-1.5 py-0.5 rounded-none border select-none opacity-85 z-20"
                    style={{
                      backgroundColor: selectedTheme.bg,
                      color: selectedTheme.text,
                      borderColor: textCol,
                    }}
                  >
                    {index + 1}
                  </span>
                </>
              ) : (
                <div
                  className="font-mono text-[9px] flex flex-col items-center gap-1 select-none"
                  style={{ color: `${selectedTheme.text}60` }}
                >
                  <ImageIcon size={16} className="stroke-1 animate-pulse" />
                  <span>FRAME {index + 1}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex-1 w-full max-w-[1400px] mx-auto flex flex-col bg-[#F9F9F9] relative min-h-screen border-x border-slate-200/60 shadow-2xl overflow-hidden font-sans">

      {/* Global Mute Button */}
      <div className="absolute top-4 right-4 z-40">
        <button
          onClick={() => setAudioMuted(!audioMuted)}
          className="p-2 rounded-none border border-slate-800 bg-white hover:bg-slate-50 transition-colors focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer"
          title={audioMuted ? "Unmute Sound" : "Mute Sound"}
        >
          {audioMuted ? <VolumeX size={15} className="text-slate-800" /> : <Volume2 size={15} className="text-slate-800" />}
        </button>
      </div>

      <main className="flex-1 flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative z-10">

        {/* Header */}
        <header className="py-3 lg:py-5 flex flex-col items-center justify-center border-b border-slate-200/65 w-full mb-5 lg:mb-8">
          <motion.div
            initial={{ y: -5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex flex-col items-center text-center gap-0.5 select-none"
          >
            <h1 className="text-xl lg:text-3xl font-bold tracking-[0.1em] text-slate-800 font-mono uppercase bg-white border border-slate-800 px-3.5 py-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              ✨ Good Moments
            </h1>
            <p className="text-[8px] lg:text-[10px] uppercase tracking-[0.3em] text-slate-400 font-mono mt-1.5 font-semibold">
              Pose Dulu Cerita Nanti.
            </p>
          </motion.div>
        </header>

        {/* Step Controller */}
        <div className="flex-1 flex flex-col justify-center items-center w-full px-1 sm:px-2 lg:px-4">
          <AnimatePresence mode="wait">

              {/* STEP 1: LANDING */}
              {step === "landing" && (
                <motion.div
                  key="landing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full max-w-6xl mx-auto px-4 py-8 lg:py-12"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 lg:gap-12">
                    
                    {/* LEFT SIDE - Logo */}
                    <div className="flex-1 flex justify-center lg:justify-start">
                      <div className="relative w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96">
                        <img
                          src="/logo-depan.png"
                          alt="Posean Logo"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>

                    {/* RIGHT SIDE - Content */}
                    <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left space-y-5">
                      
                      {/* Tagline atas */}
                      <div className="space-y-1">
                        <p className="text-xs lg:text-sm text-[#F6A04D] font-mono tracking-wider font-semibold">
                          POSEAN
                        </p>
                        <p className="text-sm lg:text-base text-slate-500 font-mono italic">
                          Pose Dulu, Cerita Nanti.
                        </p>
                      </div>

                      {/* Title */}
                      <div className="space-y-2">
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 leading-tight font-mono tracking-tight uppercase">
                          Premium Print Strip
                        </h2>
                        <p className="text-xs lg:text-sm text-slate-500 max-w-md leading-relaxed">
                          Create Life4Cuts / Photoism-style HD strips instantly. 
                          Zero compression, full quality.
                        </p>
                      </div>

                      {/* Button */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setStep("layout")}
                        className="px-8 py-3.5 rounded-full bg-slate-900 text-white text-sm font-bold uppercase tracking-wider font-mono shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center gap-2"
                      >
                        <Sparkles size={16} className="text-[#FFE66D]" />
                        <span>Start Photo Strip</span>
                        <ArrowRight size={16} />
                      </motion.button>

                      {/* Footer text */}
                      <p className="text-[9px] lg:text-[10px] text-slate-400 font-mono tracking-wide pt-2">
                        SECURE & CLIENT-SIDE • ZERO COMPRESSION
                      </p>
                    </div>
                  </div>
                  
                  {/* Bottom watermark */}
                  <div className="text-center mt-12 pt-6 border-t border-slate-200">
                    <p className="text-[10px] lg:text-xs text-slate-400 font-mono tracking-wide">
                      GOOD MOMENTS PHOTOBOOTH
                    </p>
                  </div>
                </motion.div>
              )}

            {/* STEP 2: LAYOUT SELECTION */}
            {step === "layout" && (
              <motion.div
                key="layout"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full flex flex-col items-center gap-6"
              >
                <div className="w-full text-center space-y-1 select-none">
                  <span className="text-[8px] lg:text-[10px] font-bold text-slate-400 tracking-[0.3em] uppercase font-mono">
                    CHOOSE FORMAT
                  </span>
                  <h2 className="text-lg lg:text-2xl font-bold text-slate-800 uppercase font-mono tracking-tight">
                    Select Strip Format
                  </h2>
                </div>

                <div className="grid grid-cols-3 gap-4 lg:gap-6 w-full max-w-sm lg:max-w-2xl mt-1 select-none">
                  {LAYOUTS.map((layout) => {
                    const isSelected = selectedLayout.id === layout.id;
                    return (
                      <button
                        key={layout.id}
                        onClick={() => {
                          setSelectedLayout(layout);
                          setStep("camera");
                        }}
                        className={`flex flex-col items-center p-4 lg:p-6 rounded-none border transition-all cursor-pointer justify-between ${isSelected
                            ? "border-slate-900 bg-slate-900/5 scale-98 shadow-none"
                            : "border-slate-350 bg-white hover:bg-slate-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                          }`}
                        style={isSelected ? { borderWidth: "3px" } : {}}
                      >
                        <div className="w-10 h-20 lg:w-16 lg:h-32 border border-slate-855 bg-slate-50 p-1 flex flex-col gap-1 rounded-none mb-3">
                          {Array.from({ length: layout.frames }).map((_, fIdx) => (
                            <div key={fIdx} className="w-full flex-1 border border-slate-200 bg-zinc-100 rounded-none" />
                          ))}
                        </div>
                        <span className="text-[10px] lg:text-xs font-black text-slate-900 font-mono uppercase tracking-tight">
                          {layout.frames} Frames
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setStep("landing")}
                  className="mt-4 flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase font-mono tracking-wider"
                >
                  <Undo2 size={11} /> Back
                </button>
              </motion.div>
            )}

            {/* STEP 3: CAMERA */}
            {step === "camera" && (
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
                      <button
                        onClick={() => {
                          setCameraAccess(null);
                          navigator.mediaDevices.getUserMedia({ video: true }).then(() => setCameraAccess(true)).catch(() => setCameraAccess(false));
                        }}
                        className="py-1.5 px-4 bg-white border border-slate-855 rounded-none text-[10px] font-bold text-slate-800 font-mono hover:bg-slate-50 transition-colors"
                      >
                        RETRY
                      </button>
                    </div>
                  ) : (
                    <>
                      <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        screenshotQuality={1.0}
                        videoConstraints={{
                          width: { ideal: 1920 },
                          height: { ideal: 1080 },
                          facingMode: facingMode,
                        }}
                        className="w-full h-full object-contain object-center scale-x-[-1]"
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
                    </>
                  )}
                </div>

                <div className="w-full lg:col-span-5 flex flex-col gap-4 items-center lg:items-stretch">
                  {!isCapturing && (
                    <div className="flex items-center justify-between w-full bg-white border border-slate-800 px-3 py-2.5 rounded-none font-mono text-[10px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-20 select-none">
                      <span className="font-bold text-slate-600">COUNTDOWN:</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCountdownTime(3)}
                          className={`px-2 py-0.5 rounded-none font-bold transition-all ${countdownTime === 3 ? "bg-slate-800 text-white" : "text-slate-400"
                            }`}
                        >
                          3s
                        </button>
                        <button
                          onClick={() => setCountdownTime(5)}
                          className={`px-2 py-0.5 rounded-none font-bold transition-all ${countdownTime === 5 ? "bg-slate-800 text-white" : "text-slate-400"
                            }`}
                        >
                          5s
                        </button>
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
                            className={`w-3.5 h-3.5 rounded-none border border-slate-800 transition-all ${fIdx < capturedPhotos.length
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
                            onClick={() => setFacingMode(facingMode === "user" ? "environment" : "user")}
                            title="Switch Camera"
                            className="py-2.5 px-3 border border-slate-800 bg-white text-slate-850 rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer flex items-center justify-center"
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
            )}

            {/* STEP 4: EDITOR */}
            {step === "editor" && (
              <motion.div
                key="editor"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full lg:max-w-none lg:grid lg:grid-cols-[45%_55%] lg:gap-8 lg:items-stretch flex flex-col items-center gap-4 py-2 lg:h-[calc(100vh-170px)] lg:min-h-[500px]"
              >
                {/* Left Controls */}
                <div className="w-full lg:col-span-1 order-2 lg:order-1 flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-190px)] lg:overflow-y-auto lg:pr-2">
                  <div className="hidden lg:block text-left space-y-1 select-none mb-1">
                    <span className="text-[9px] font-bold text-slate-400 tracking-[0.3em] uppercase font-mono">
                      DESIGN PANEL
                    </span>
                    <h2 className="text-lg font-bold text-slate-805 font-mono uppercase tracking-tight">Customize Strip</h2>
                  </div>



                  {/* Sticker Controls */}
                  {selectedStickerId && (
                    <div className="w-full bg-white border border-slate-800 rounded-none p-3.5 flex flex-col gap-2.5 font-mono text-[10px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-in fade-in duration-200">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-1 select-none">
                        <span className="font-bold text-slate-850 uppercase">Edit Doodle:</span>
                        <button onClick={() => deleteSticker(selectedStickerId)} className="text-red-500 font-bold hover:underline flex items-center gap-0.5">
                          <Trash2 size={10} /> Delete
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-14 text-slate-400">Scale:</span>
                        <input
                          type="range"
                          min="0.5"
                          max="2.0"
                          step="0.1"
                          value={stickers.find((s) => s.id === selectedStickerId)?.scale || 1.0}
                          onChange={(e) => updateSticker(selectedStickerId, { scale: parseFloat(e.target.value) })}
                          className="flex-1 accent-slate-850 h-1 bg-slate-100 rounded-none appearance-none cursor-pointer"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-14 text-slate-400">Rotate:</span>
                        <input
                          type="range"
                          min="-180"
                          max="180"
                          step="5"
                          value={stickers.find((s) => s.id === selectedStickerId)?.rotation || 0}
                          onChange={(e) => updateSticker(selectedStickerId, { rotation: parseInt(e.target.value) })}
                          className="flex-1 accent-slate-850 h-1 bg-slate-100 rounded-none appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                  )}

                  {/* Tabs Panel */}
                  <div className="w-full bg-white border border-slate-800 rounded-none overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col">
                    <div className="grid grid-cols-3 border-b border-slate-800 bg-slate-50 select-none w-full">
                      <button
                        onClick={() => setEditorTab("theme")}
                        className={`w-full flex items-center justify-center h-[60px] px-5 gap-2 font-mono text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${editorTab === "theme" ? "shadow-none border-none" : "text-slate-600 hover:bg-slate-100"
                          }`}
                        style={editorTab === "theme" ? { backgroundColor: selectedTheme.accent, color: selectedTheme.text } : {}}
                      >
                        <Layers size={18} className="flex-shrink-0" />
                        <span>Themes</span>
                      </button>
                      <button
                        onClick={() => setEditorTab("sticker")}
                        className={`w-full flex items-center justify-center h-[60px] px-5 gap-2 font-mono text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border-x border-slate-200 ${editorTab === "sticker" ? "shadow-none border-none" : "text-slate-600 hover:bg-slate-100"
                          }`}
                        style={editorTab === "sticker" ? { backgroundColor: selectedTheme.accent, color: selectedTheme.text } : {}}
                      >
                        <SmileIcon size={18} className="flex-shrink-0" />
                        <span>Doodles</span>
                      </button>
                      <button
                        onClick={() => setEditorTab("caption")}
                        className={`w-full flex items-center justify-center h-[60px] px-5 gap-2 font-mono text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${editorTab === "caption" ? "shadow-none border-none" : "text-slate-600 hover:bg-slate-100"
                          }`}
                        style={editorTab === "caption" ? { backgroundColor: selectedTheme.accent, color: selectedTheme.text } : {}}
                      >
                        <Type size={18} className="flex-shrink-0" />
                        <span>Caption</span>
                      </button>
                    </div>

                    <div className="p-4 max-h-[140px] lg:max-h-[300px] overflow-y-auto bg-slate-50/40">
                      {/* THEMES TAB - IMPROVED LAYOUT */}
                      {editorTab === "theme" && (
                        <div className="grid grid-cols-2 gap-2 pb-1 select-none">
                          {THEMES.map((thm) => (
                            <button
                              key={thm.id}
                              onClick={() => setSelectedTheme(thm)}
                              className={`flex items-center gap-2 px-3 py-2.5 border rounded-none transition-all cursor-pointer ${selectedTheme.id === thm.id
                                  ? "border-slate-900 bg-slate-900 text-white shadow-inner"
                                  : "border-slate-200 bg-white hover:bg-slate-50 shadow-sm"
                                }`}
                            >
                              <span
                                className="inline-block w-5 h-5 border border-slate-200 rounded-none flex-shrink-0"
                                style={{ backgroundColor: thm.bg }}
                              />
                              <span className={`flex-1 text-left text-[11px] font-mono font-bold ${selectedTheme.id === thm.id ? "text-white" : "text-slate-700"
                                }`}>
                                {thm.name}
                              </span>
                              {selectedTheme.id === thm.id && (
                                <CheckCircle size={14} className="text-white flex-shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* STICKERS TAB */}
                      {editorTab === "sticker" && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between mb-1 font-mono text-[8px] lg:text-[10px] font-bold text-slate-400 select-none flex-wrap gap-2">
                            <div className="flex items-center gap-1.5">
                              <span>DOODLE COLOR:</span>
                              {["#1E293B", "#FF6B6B", "#4ECDC4", "#AA00FF", "#3E3730", "#2B3B28"].map((col) => (
                                <button
                                  key={col}
                                  onClick={() => setStickerColor(col)}
                                  className={`w-5 h-5 border border-black/15 transition-transform rounded-none ${stickerColor === col ? "scale-110 ring-1 ring-slate-800" : ""
                                    }`}
                                  style={{ backgroundColor: col }}
                                />
                              ))}
                            </div>
                            <button
                              onClick={generateRandomDoodles}
                              className="px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-300 hover:bg-slate-200 font-bold tracking-tight text-[8px] lg:text-[9px] flex items-center gap-1 active:scale-95"
                            >
                              ✨ Randomize
                            </button>
                          </div>
                          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 pb-1">
                            {STICKERS.map((st) => (
                              <button
                                key={st.id}
                                onClick={() => addSticker(st.id)}
                                className="aspect-square p-2 border border-slate-300 bg-white rounded-none hover:bg-slate-100 active:scale-95 transition-transform flex items-center justify-center cursor-pointer"
                                title={`Add ${st.name}`}
                              >
                                <div className="w-full h-full max-w-[28px] max-h-[28px]">
                                  {st.render(stickerColor)}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* CAPTION TAB - IMPROVED LAYOUT */}
                      {editorTab === "caption" && (
                        <div className="flex flex-col gap-2">
                          <label htmlFor="cap-inp" className="text-[8px] lg:text-[10px] font-mono font-bold text-slate-400 uppercase select-none">
                            FOOTER MESSAGE
                          </label>
                          <input
                            id="cap-inp"
                            type="text"
                            maxLength={30}
                            placeholder="e.g. BEST MOMENTS 2026"
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            className="w-full py-2 px-3 border border-slate-300 bg-white rounded-none font-mono text-[11px] lg:text-xs text-slate-800 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                          />
                          <div className="flex justify-between items-center text-[8px] font-mono text-slate-400">
                            <span>Max 30 characters</span>
                            <span className={`font-bold ${caption.length === 30 ? "text-amber-600" : "text-slate-400"}`}>
                              {caption.length}/30
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="w-full flex gap-3 mt-1 justify-center">
                    <button
                      onClick={() => {
                        if (confirm("Restart photoshoot? All current photos will be deleted.")) {
                          resetStore();
                          setStep("camera");
                        }
                      }}
                      className="py-3 px-4 border border-slate-800 bg-white text-slate-800 font-mono text-[10px] font-bold rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-50 active:translate-y-0.5 cursor-pointer"
                    >
                      Retake All
                    </button>
                    <button
                      onClick={compileHdExports}
                      className="flex-1 py-3 px-5 border border-slate-800 bg-slate-900 text-white font-mono text-[10px] font-bold rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:brightness-95 transition-transform flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles size={12} className="text-[#FFE66D]" />
                      <span>Export HD Strip</span>
                    </button>
                  </div>
                </div>

                {/* Right Preview */}
                <div
                  ref={rightPanelRef}
                  className="w-full lg:col-span-1 order-1 lg:order-2 flex flex-col items-center justify-center bg-slate-50 lg:border lg:border-slate-200 lg:p-6 rounded-none relative lg:h-full lg:overflow-hidden min-h-[380px]"
                >
                  <div className="block lg:hidden text-center space-y-1 select-none mb-3">
                    <span className="text-[8px] font-bold text-slate-400 tracking-[0.3em] uppercase font-mono">PREVIEW</span>
                    <h2 className="text-lg font-bold text-slate-800 font-mono uppercase tracking-tight">Your Strip</h2>
                  </div>

                  <div
                    className="relative flex items-center justify-center select-none animate-in fade-in duration-200"
                    style={{
                      transform: `scale(${previewScale})`,
                      transformOrigin: "center center",
                      transition: "transform 0.15s ease-out",
                      width: "300px",
                      height: selectedLayout.frames === 4 ? "980px" : selectedLayout.frames === 3 ? "760px" : "545px",
                    }}
                  >
                    <div
                      ref={editorStripRef}
                      className="w-[300px] p-[14px] shadow-2xl flex flex-col gap-[10px] relative rounded-none transition-all duration-200"
                      style={{
                        backgroundColor: selectedTheme.bg,
                        color: selectedTheme.text,
                        border: `1.5px solid ${selectedTheme.text}`,
                        height: "100%",
                      }}
                    >
                      <div className="relative z-10 w-full flex-1 flex flex-col" ref={dragContainerRef}>
                        {renderStripPhotoGrid()}

                        {stickers.map((sticker) => {
                          const stDef = STICKERS.find((s) => s.id === sticker.type);
                          const isSelected = selectedStickerId === sticker.id;

                          return (
                            <div
                              key={sticker.id}
                              onPointerDown={(e) => handleStickerPointerDown(e, sticker)}
                              className={`absolute w-10 h-10 cursor-move group select-none ${isSelected ? "border border-dashed border-sky-500 z-50 ring-1 ring-sky-500/20" : "z-30"
                                }`}
                              style={{
                                left: `${sticker.x}%`,
                                top: `${sticker.y}%`,
                                transform: `translate(-50%, -50%) scale(${sticker.scale}) rotate(${sticker.rotation}deg)`,
                              }}
                            >
                              {stDef?.render(stickerColor)}
                              {isSelected && (
                                <button
                                  onPointerDown={(e) => e.stopPropagation()}
                                  onClick={() => deleteSticker(sticker.id)}
                                  className="absolute -top-3.5 -right-3.5 p-0.5 rounded-none bg-red-500 text-white border border-slate-800 hover:bg-red-600 transition-colors pointer-events-auto shadow-sm"
                                >
                                  <X size={9} />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* FOOTER AREA WITH IMPROVED SPACING */}
                      <div
                        className="flex flex-col items-center justify-center gap-1.5 pt-4 pb-2 mt-auto min-h-[85px] relative z-10 select-none"
                        style={{ boxSizing: "border-box" }}
                      >
                        <span
                          className="text-[10px] font-mono tracking-[0.25em] font-extrabold uppercase leading-none text-center"
                          style={{ color: selectedTheme.text }}
                        >
                          ✨ GOOD MOMENTS
                        </span>
                        {caption.trim() !== "" && (
                          <p
                            className="text-[9px] font-mono tracking-wider opacity-85 uppercase leading-none max-w-[200px] break-words text-center"
                            style={{ color: selectedTheme.text }}
                          >
                            {caption}
                          </p>
                        )}
                        <span
                          className="text-[7.5px] font-mono opacity-65 tracking-widest uppercase leading-none text-center"
                          style={{ color: selectedTheme.text }}
                        >
                          {new Date().toISOString().split('T')[0].replace(/-/g, '.')}
                        </span>
                      </div>
                      <div className="absolute inset-0 pointer-events-none opacity-[0.02] mix-blend-overlay bg-noise" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 5: EXPORT */}
            {step === "export" && (
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
                    <div className="grid grid-cols-2 gap-3 w-full">
                      <button
                        onClick={() => setExportFormat("jpg")}
                        className={`flex flex-col items-center justify-center p-3 border transition-all cursor-pointer rounded-none text-center ${exportFormat === "jpg"
                            ? "border-slate-900 bg-slate-900 text-white shadow-none"
                            : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]"
                          }`}
                      >
                        <span className="text-[10px] font-bold font-mono uppercase tracking-wider">PHOTO STRIP</span>
                        <span className="text-[7.5px] opacity-75 font-mono mt-0.5">High-res JPG</span>
                      </button>
                      <button
                        onClick={() => setExportFormat("gif")}
                        className={`flex flex-col items-center justify-center p-3 border transition-all cursor-pointer rounded-none text-center ${exportFormat === "gif"
                            ? "border-slate-900 bg-slate-900 text-white shadow-none"
                            : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]"
                          }`}
                      >
                        <span className="text-[10px] font-bold font-mono uppercase tracking-wider">ANIMATED GIF</span>
                        <span className="text-[7.5px] opacity-75 font-mono mt-0.5">Looping reel</span>
                      </button>
                    </div>
                  </div>

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
                              className={`flex flex-col items-center justify-center py-2.5 px-2 border transition-all rounded-none min-h-[44px] cursor-pointer ${isActive
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

                  <div className="w-full flex flex-col gap-3">
                    {exportFormat === "jpg" ? (
                      <button
                        onClick={() => handleDownload(exportJpgUrl, "good-moments-hd-strip.jpg")}
                        disabled={isGeneratingJpg || !exportJpgUrl}
                        className="w-full py-3.5 border border-slate-800 bg-[#FF6B6B] text-white font-mono text-xs font-black uppercase tracking-wider rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 hover:brightness-95 disabled:opacity-50 cursor-pointer"
                      >
                        <Download size={14} /> Download JPG
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDownload(exportGifUrl, "good-moments-loop.gif")}
                        disabled={isGeneratingGif || !exportGifUrl}
                        className="w-full py-3.5 border border-slate-800 bg-[#4ECDC4] text-slate-800 font-mono text-xs font-black uppercase tracking-wider rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 hover:brightness-95 disabled:opacity-50 cursor-pointer"
                      >
                        <Download size={14} /> Download GIF
                      </button>
                    )}

                    <button
                      onClick={handleNativeShare}
                      className="w-full py-3 border border-slate-800 bg-[#FFE66D] text-slate-900 font-mono text-[10px] font-bold uppercase rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-1.5 hover:scale-[1.01] transition-transform cursor-pointer"
                    >
                      <Share2 size={13} /> Share
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
                            <img src={exportJpgUrl} alt="Final Strip" className="w-full h-auto lg:w-auto lg:h-auto lg:max-h-[calc(100vh-285px)] block rounded-none border border-slate-200 animate-in fade-in duration-200 object-contain" />
                          )
                        )}
                      </div>
                    ) : (
                      <div className="w-full lg:w-auto lg:h-auto flex items-center justify-center">
                        {isGeneratingGif ? (
                          <div className="w-full lg:w-[250px] min-h-[350px] flex flex-col items-center justify-center gap-2 bg-white border border-slate-200 text-zinc-400 font-mono text-[9px] text-center p-1 select-none">
                            <RefreshCw size={20} className="animate-spin text-slate-800" />
                            <span>GENERATING GIF...</span>
                          </div>
                        ) : (
                          exportGifUrl && (
                            <img src={exportGifUrl} alt="Animated GIF" className="w-full h-auto lg:w-auto lg:h-auto lg:max-h-[calc(100vh-285px)] block rounded-none border border-slate-200 animate-in fade-in duration-200 object-contain" />
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="py-3 mt-8 border-t border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center select-none">
        <span className="text-[8px] font-mono font-bold tracking-[0.25em] text-slate-400 uppercase">
          ✨ GOOD MOMENTS PHOTOBOOTH ✨
        </span>
      </footer>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-white border border-slate-800 rounded-none p-5 flex flex-col items-center gap-4 text-center relative shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-in fade-in zoom-in duration-150">
            <button onClick={() => setShowShareModal(false)} className="absolute top-3 right-3 text-[10px] font-black font-mono text-slate-800 hover:underline">✕</button>
            <div className="w-10 h-10 rounded-none bg-[#FFE66D] border border-slate-800 flex items-center justify-center text-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">📢</div>
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
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent("Check out Good Moments Photobooth! " + window.location.href)}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => setShowShareModal(false)}
                className="w-full py-2 bg-[#25D366] border border-slate-800 text-white font-mono text-[10px] font-bold rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:brightness-95 flex items-center justify-center gap-1.5"
              >
                WhatsApp
              </a>
              <button
                onClick={() => {
                  alert("Download JPG and post to Instagram Story!");
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

      {/* Premium full-screen compile overlay */}
      {(isGeneratingJpg || isGeneratingGif) && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 select-none">
          <div className="bg-white border border-slate-800 p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center gap-4 text-center max-w-sm mx-4 animate-in fade-in zoom-in-95 duration-150">
            <RefreshCw size={36} className="animate-spin text-slate-800" />
            <div className="space-y-1.5 font-mono">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Compiling HD Exports</h3>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest leading-relaxed">
                Capturing layout details and compiling animation loop...
              </p>
            </div>
            <div className="w-48 bg-slate-100 h-1.5 border border-slate-800 overflow-hidden relative">
              <div className="absolute inset-y-0 bg-slate-850 animate-pulse w-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}