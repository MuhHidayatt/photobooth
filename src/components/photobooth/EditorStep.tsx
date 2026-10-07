"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toJpeg } from "html-to-image";
import gifshot from "gifshot";
import {
  Sparkles,
  Smile as SmileIcon,
  Type,
  Image as ImageIcon,
  Trash2,
  RotateCw,
  CheckCircle,
  X,
  Layers,
  Sliders,
} from "lucide-react";
import { STICKERS } from "@/components/StickerAssets";
import {
  usePhotoboothStore,
  THEMES,
  FILTERS,
  ActiveSticker,
} from "@/store/usePhotoboothStore";
import { generateRandomDoodles, getFilteredPhotoFrames } from "@/utils/photoboothHelpers";

interface EditorStepProps {
  onExportsCompleted: (jpgUrl: string, gifUrl: string | null) => void;
}

export default function EditorStep({ onExportsCompleted }: EditorStepProps) {
  const {
    setStep,
    selectedLayout,
    capturedPhotos,
    setSingleRetakeIndex,
    activePhotoEffects,
    globalFilter,
    selectedFilterTarget,
    setSelectedFilterTarget,
    applyFilter,
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
    setExportJpgUrl,
    setExportGifUrl,
    setExportVideoUrl,
    setIsGeneratingJpg,
    setIsGeneratingGif,
    resetStore,
  } = usePhotoboothStore();

  const [editorTab, setEditorTab] = useState<"theme" | "filter" | "sticker" | "caption">("theme");
  const [previewScale, setPreviewScale] = useState(1);

  const editorStripRef = useRef<HTMLDivElement>(null);
  const dragContainerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; stickerX: number; stickerY: number } | null>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  // Dynamic scaling for strip/grid preview
  useEffect(() => {
    const handleResize = () => {
      if (!rightPanelRef.current) return;
      const containerHeight = rightPanelRef.current.clientHeight;
      const containerWidth = rightPanelRef.current.clientWidth;
      if (!containerHeight) return;

      const isGrid = selectedLayout.type === "grid";
      const naturalHeight = isGrid
        ? 440
        : selectedLayout.frames === 4
          ? 980
          : selectedLayout.frames === 3
            ? 760
            : 545;
      const naturalWidth = isGrid ? 380 : 300;

      const targetHeight = containerHeight - 32;
      const targetWidth = containerWidth ? containerWidth - 32 : naturalWidth;
      const scaleH = targetHeight / naturalHeight;
      const scaleW = targetWidth / naturalWidth;
      const scale = Math.min(1, scaleH, scaleW);
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
  }, [selectedLayout.frames, selectedLayout.type]);

  // Clean stickers when layout changes
  useEffect(() => {
    setStickers([]);
    setSelectedStickerId(null);
  }, [selectedLayout, setStickers, setSelectedStickerId]);

  // Sticker dragging handler
  const handleStickerPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    sticker: ActiveSticker
  ) => {
    e.stopPropagation();
    setSelectedStickerId(sticker.id);

    if (!editorStripRef.current) return;

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
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

  const handleRandomizeDoodles = () => {
    const newStickers = generateRandomDoodles(selectedLayout.type);
    setStickers(newStickers);
  };

  const triggerSingleRetake = (index: number) => {
    setSingleRetakeIndex(index);
    setStep("camera");
  };

  // Compile HD Exports (JPG & GIF)
  const compileHdExports = async () => {
    setSelectedStickerId(null);
    setExportVideoUrl(null);
    setIsGeneratingJpg(true);
    setIsGeneratingGif(true);

    let finalJpgUrl = "";

    // Save current scale and temporarily reset it to 1 for clean, un-scaled JPG export
    const originalScale = previewScale;
    setPreviewScale(1);

    await new Promise((resolve) => setTimeout(resolve, 200));

    // 1. Generate high-res JPG
    try {
      if (editorStripRef.current) {
        const jpgDataUrl = await toJpeg(editorStripRef.current, {
          quality: 1.0,
          pixelRatio: 4, // 4x is high-resolution and very crisp
          backgroundColor: selectedTheme.bg,
        });
        finalJpgUrl = jpgDataUrl;
        setExportJpgUrl(jpgDataUrl);
      }
    } catch (e) {
      console.error("JPEG generation failed:", e);
    } finally {
      setIsGeneratingJpg(false);
      setPreviewScale(originalScale);
    }

    // 2. Generate HD GIF from captured photos
    try {
      if (capturedPhotos.length > 0) {
        const intervalVal = 0.1;
        const processedFrames = await getFilteredPhotoFrames(
          capturedPhotos,
          activePhotoEffects,
          globalFilter
        );

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

          gifshot.createGIF(
            {
              images: processedFrames,
              gifWidth: gifW,
              gifHeight: gifH,
              interval: intervalVal,
              numFrames: processedFrames.length,
              frameDuration: intervalVal * 100,
              numWorkers: 2,
            },
            (obj) => {
              let finalGif = null;
              if (!obj.error) {
                setExportGifUrl(obj.image);
                finalGif = obj.image;
              } else {
                console.error("Gifshot failed:", obj.errorMsg);
              }
              setIsGeneratingGif(false);
              onExportsCompleted(finalJpgUrl, finalGif);
            }
          );
        };

        img.onerror = () => {
          gifshot.createGIF(
            {
              images: processedFrames,
              gifWidth: 640,
              gifHeight: 480,
              interval: intervalVal,
              numFrames: processedFrames.length,
              frameDuration: intervalVal * 100,
              numWorkers: 2,
            },
            (obj) => {
              let finalGif = null;
              if (!obj.error) {
                setExportGifUrl(obj.image);
                finalGif = obj.image;
              }
              setIsGeneratingGif(false);
              onExportsCompleted(finalJpgUrl, finalGif);
            }
          );
        };
        img.src = processedFrames[0] || capturedPhotos[0];
      } else {
        setIsGeneratingGif(false);
        onExportsCompleted(finalJpgUrl, null);
      }
    } catch (e) {
      console.error("GIF export failed:", e);
      setIsGeneratingGif(false);
      onExportsCompleted(finalJpgUrl, null);
    }
  };

  // Render photo grid (supports vertical strip and 2x2 grid)
  const renderStripPhotoGrid = () => {
    const isGrid = selectedLayout.type === "grid";
    return (
      <div
        className={`w-full flex-1 select-none ${
          isGrid
            ? "grid grid-cols-2 gap-[10px] items-center"
            : "flex flex-col gap-[14px] justify-between items-center"
        }`}
      >
        {Array.from({ length: selectedLayout.frames }).map((_, index) => {
          const photo = capturedPhotos[index];
          const textCol = selectedTheme.text;
          const effect = activePhotoEffects[index] || { filter: globalFilter || "none" };
          const activeFilterDef = FILTERS.find((f) => f.id === effect.filter);
          const filterClass = activeFilterDef ? activeFilterDef.cssClass : "filter-none";
          const isFilterActiveTarget =
            editorTab === "filter" && selectedFilterTarget === index;

          return (
            <div
              key={index}
              onClick={() => {
                if (editorTab === "filter") {
                  setSelectedFilterTarget(index);
                }
              }}
              className={`relative w-full ${
                isGrid ? "aspect-[4/3]" : "flex-1 aspect-[4/3]"
              } overflow-hidden flex items-center justify-center rounded-none transition-all group ${
                isFilterActiveTarget
                  ? "ring-2 ring-[#F6A04D] ring-offset-2 cursor-pointer scale-[1.01]"
                  : editorTab === "filter"
                    ? "cursor-pointer hover:opacity-95"
                    : ""
              }`}
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
                    className={`w-full h-full object-cover object-center transition-all duration-150 ${filterClass}`}
                  />
                  <div className="absolute inset-0 pointer-events-none opacity-[0.02] mix-blend-overlay bg-noise" />

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerSingleRetake(index);
                      }}
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

                  {/* Active Filter Pill Badge */}
                  {effect.filter && effect.filter !== "none" && (
                    <span
                      className="absolute bottom-2 left-2 text-[7.5px] font-mono font-bold px-1.5 py-0.5 rounded-none border select-none opacity-90 z-20 uppercase shadow-xs flex items-center gap-1"
                      style={{
                        backgroundColor: selectedTheme.bg,
                        color: selectedTheme.text,
                        borderColor: textCol,
                      }}
                    >
                      <Sparkles size={8} className="text-[#FFE66D]" />
                      <span>{activeFilterDef?.name || "Filtered"}</span>
                    </span>
                  )}
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
              <button
                onClick={() => deleteSticker(selectedStickerId)}
                className="text-red-500 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
              >
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
          <div className="grid grid-cols-4 border-b border-slate-800 bg-slate-50 select-none w-full">
            <button
              onClick={() => setEditorTab("theme")}
              className={`w-full flex items-center justify-center h-[54px] px-2 gap-1.5 font-mono text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                editorTab === "theme" ? "shadow-none border-none" : "text-slate-600 hover:bg-slate-100"
              }`}
              style={editorTab === "theme" ? { backgroundColor: selectedTheme.accent, color: selectedTheme.text } : {}}
            >
              <Layers size={16} className="flex-shrink-0" />
              <span className="hidden sm:inline">Themes</span>
              <span className="sm:hidden">Theme</span>
            </button>
            <button
              onClick={() => setEditorTab("filter")}
              className={`w-full flex items-center justify-center h-[54px] px-2 gap-1.5 font-mono text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border-x border-slate-200 cursor-pointer ${
                editorTab === "filter" ? "shadow-none border-none" : "text-slate-600 hover:bg-slate-100"
              }`}
              style={editorTab === "filter" ? { backgroundColor: selectedTheme.accent, color: selectedTheme.text } : {}}
            >
              <Sliders size={16} className="flex-shrink-0" />
              <span className="hidden sm:inline">Filters</span>
              <span className="sm:hidden">Filter</span>
            </button>
            <button
              onClick={() => setEditorTab("sticker")}
              className={`w-full flex items-center justify-center h-[54px] px-2 gap-1.5 font-mono text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border-r border-slate-200 cursor-pointer ${
                editorTab === "sticker" ? "shadow-none border-none" : "text-slate-600 hover:bg-slate-100"
              }`}
              style={editorTab === "sticker" ? { backgroundColor: selectedTheme.accent, color: selectedTheme.text } : {}}
            >
              <SmileIcon size={16} className="flex-shrink-0" />
              <span className="hidden sm:inline">Doodles</span>
              <span className="sm:hidden">Doodle</span>
            </button>
            <button
              onClick={() => setEditorTab("caption")}
              className={`w-full flex items-center justify-center h-[54px] px-2 gap-1.5 font-mono text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                editorTab === "caption" ? "shadow-none border-none" : "text-slate-600 hover:bg-slate-100"
              }`}
              style={editorTab === "caption" ? { backgroundColor: selectedTheme.accent, color: selectedTheme.text } : {}}
            >
              <Type size={16} className="flex-shrink-0" />
              <span className="hidden sm:inline">Caption</span>
              <span className="sm:hidden">Text</span>
            </button>
          </div>

          <div className="p-4 max-h-[220px] lg:max-h-[340px] overflow-y-auto bg-slate-50/40">
            {/* THEMES TAB */}
            {editorTab === "theme" && (
              <div className="grid grid-cols-2 gap-2 pb-1 select-none">
                {THEMES.map((thm) => (
                  <button
                    key={thm.id}
                    onClick={() => setSelectedTheme(thm)}
                    className={`flex items-center gap-2 px-3 py-2.5 border rounded-none transition-all cursor-pointer ${
                      selectedTheme.id === thm.id
                        ? "border-slate-900 bg-slate-900 text-white shadow-inner"
                        : "border-slate-200 bg-white hover:bg-slate-50 shadow-sm"
                    }`}
                  >
                    <span
                      className="inline-block w-5 h-5 border border-slate-200 rounded-none flex-shrink-0"
                      style={{ backgroundColor: thm.bg }}
                    />
                    <span
                      className={`flex-1 text-left text-[11px] font-mono font-bold ${
                        selectedTheme.id === thm.id ? "text-white" : "text-slate-700"
                      }`}
                    >
                      {thm.name}
                    </span>
                    {selectedTheme.id === thm.id && (
                      <CheckCircle size={14} className="text-white flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* FILTERS TAB */}
            {editorTab === "filter" && (
              <div className="space-y-3">
                <div className="flex flex-col gap-1.5 border-b border-slate-200 pb-2.5">
                  <div className="flex items-center justify-between font-mono text-[8px] lg:text-[9px] font-bold text-slate-500 uppercase select-none">
                    <span>APPLY FILTER TO:</span>
                    <span className="text-[8px] text-amber-600 font-bold">
                      {selectedFilterTarget === "all" ? "⚡ All Frames (Batch)" : `🎯 Frame #${selectedFilterTarget + 1} Only`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    <button
                      onClick={() => setSelectedFilterTarget("all")}
                      className={`px-2.5 py-1 text-[9px] font-mono font-bold uppercase transition-all whitespace-nowrap cursor-pointer border ${
                        selectedFilterTarget === "all"
                          ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      ✨ All Frames
                    </button>
                    {Array.from({ length: selectedLayout.frames }).map((_, fIdx) => (
                      <button
                        key={fIdx}
                        onClick={() => setSelectedFilterTarget(fIdx)}
                        className={`px-2 py-1 text-[9px] font-mono font-bold uppercase transition-all whitespace-nowrap cursor-pointer border ${
                          selectedFilterTarget === fIdx
                            ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        Frame #{fIdx + 1}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pb-1 select-none">
                  {FILTERS.map((filter) => {
                    const isCurrentActive =
                      selectedFilterTarget === "all"
                        ? globalFilter === filter.id
                        : (activePhotoEffects[selectedFilterTarget]?.filter || globalFilter || "none") === filter.id;

                    const previewPhoto =
                      selectedFilterTarget === "all"
                        ? capturedPhotos[0]
                        : capturedPhotos[selectedFilterTarget] || capturedPhotos[0];

                    return (
                      <button
                        key={filter.id}
                        onClick={() => applyFilter(filter.id)}
                        className={`flex items-center gap-2.5 p-2 border transition-all cursor-pointer relative text-left group rounded-none ${
                          isCurrentActive
                            ? "border-slate-900 bg-slate-900 text-white shadow-inner ring-1 ring-slate-900"
                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-800 shadow-sm"
                        }`}
                      >
                        <div className="relative w-10 h-10 border border-slate-300 bg-slate-100 overflow-hidden flex-shrink-0">
                          {previewPhoto ? (
                            <img
                              src={previewPhoto}
                              alt={filter.name}
                              className={`w-full h-full object-cover ${filter.cssClass}`}
                            />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center text-[10px] font-bold"
                              style={{ backgroundColor: filter.accentColor, color: "#fff" }}
                            >
                              {filter.name[0]}
                            </div>
                          )}
                          {isCurrentActive && (
                            <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                              <CheckCircle size={14} className="text-[#FFE66D]" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <span
                            className={`text-[11px] font-mono font-bold truncate ${
                              isCurrentActive ? "text-white" : "text-slate-800"
                            }`}
                          >
                            {filter.name}
                          </span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span
                              className={`text-[7.5px] font-mono uppercase px-1 py-0.2 border ${
                                isCurrentActive
                                  ? "border-white/30 text-white/90 bg-white/10"
                                  : "border-slate-300 text-slate-500 bg-slate-100"
                              }`}
                            >
                              {filter.badge}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
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
                        className={`w-5 h-5 border border-black/15 transition-transform rounded-none cursor-pointer ${
                          stickerColor === col ? "scale-110 ring-1 ring-slate-800" : ""
                        }`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                  <button
                    onClick={handleRandomizeDoodles}
                    className="px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-300 hover:bg-slate-200 font-bold tracking-tight text-[8px] lg:text-[9px] flex items-center gap-1 active:scale-95 cursor-pointer"
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

            {/* CAPTION TAB */}
            {editorTab === "caption" && (
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="cap-inp"
                  className="text-[8px] lg:text-[10px] font-mono font-bold text-slate-400 uppercase select-none"
                >
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
            width: selectedLayout.type === "grid" ? "380px" : "300px",
            height:
              selectedLayout.type === "grid"
                ? "440px"
                : selectedLayout.frames === 4
                  ? "980px"
                  : selectedLayout.frames === 3
                    ? "760px"
                    : "545px",
          }}
        >
          <div
            ref={editorStripRef}
            className="p-[14px] shadow-2xl flex flex-col gap-[10px] relative rounded-none transition-all duration-200"
            style={{
              width: selectedLayout.type === "grid" ? "380px" : "300px",
              backgroundColor: selectedTheme.bg,
              color: selectedTheme.text,
              border: `1.5px solid ${selectedTheme.text}`,
              height:
                selectedLayout.type === "grid"
                  ? "440px"
                  : selectedLayout.frames === 4
                    ? "980px"
                    : selectedLayout.frames === 3
                      ? "760px"
                      : "545px",
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
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
                    className={`absolute w-10 h-10 cursor-move group select-none ${
                      isSelected ? "border border-dashed border-sky-500 z-50 ring-1 ring-sky-500/20" : "z-30"
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
                        className="absolute -top-3.5 -right-3.5 p-0.5 rounded-none bg-red-500 text-white border border-slate-800 hover:bg-red-600 transition-colors pointer-events-auto shadow-sm cursor-pointer"
                      >
                        <X size={9} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* FOOTER AREA */}
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
                {new Date().toISOString().split("T")[0].replace(/-/g, ".")}
              </span>
            </div>
            <div className="absolute inset-0 pointer-events-none opacity-[0.02] mix-blend-overlay bg-noise" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
