import React, { useState, useEffect } from "react";
import { Sparkles, Trash2 } from "lucide-react";
import { CommunityFrameTemplate } from "@/types/template";
import { STICKERS } from "@/components/StickerAssets";

interface TemplateCardProps {
  template: CommunityFrameTemplate;
  onUseTemplate: (template: CommunityFrameTemplate) => void;
  onDeleteTemplate?: (templateId: string) => void;
  canDelete?: boolean;
}

export default function TemplateCard({
  template,
  onUseTemplate,
  onDeleteTemplate,
  canDelete = false,
}: TemplateCardProps) {
  const [currentTemplate, setCurrentTemplate] = useState<CommunityFrameTemplate>(template);
  const [isTrimming, setIsTrimming] = useState(false);

  useEffect(() => {
    setCurrentTemplate(template);
  }, [template]);

  const isGrid = currentTemplate.type === "grid";

  // Check if frame has Canva margins (aspect ratio > 0.45 for strips, or slots width < 70)
  const hasCanvaMargins = Boolean(
    currentTemplate.image_url &&
    !isGrid &&
    ((currentTemplate.custom_slots && currentTemplate.custom_slots[0]?.width < 70) ||
      (currentTemplate.frame_aspect_ratio && currentTemplate.frame_aspect_ratio > 0.45))
  );

  // Directly & automatically make it FULL on mount or load without manual click!
  useEffect(() => {
    let isCancelled = false;

    async function autoMakeFull() {
      if (!currentTemplate.image_url || isGrid || currentTemplate.image_url.startsWith("/frames/")) return;
      const needsTrim =
        (currentTemplate.custom_slots && currentTemplate.custom_slots[0]?.width < 70) ||
        (currentTemplate.frame_aspect_ratio && currentTemplate.frame_aspect_ratio > 0.45);

      if (!needsTrim) return;

      setIsTrimming(true);
      try {
        const { detectFrameSlots } = await import("@/utils/frameDetector");
        const { updateCommunityTemplate } = await import("@/utils/templateHelpers");

        const detection = await detectFrameSlots(
          currentTemplate.image_url,
          currentTemplate.frames,
          false,
          { autoTrim: true, extraZoom: 1.05 }
        );

        if (!isCancelled && detection.wasTrimmed && detection.trimmedImageUrl) {
          const updated: CommunityFrameTemplate = {
            ...currentTemplate,
            image_url: detection.trimmedImageUrl,
            custom_slots: detection.slots,
            frame_aspect_ratio: detection.imageAspectRatio,
          };
          await updateCommunityTemplate(updated);
          setCurrentTemplate(updated);
        }
      } catch (err) {
        console.error("Auto make full error:", err);
      } finally {
        if (!isCancelled) setIsTrimming(false);
      }
    }

    autoMakeFull();

    return () => {
      isCancelled = true;
    };
  }, [currentTemplate.image_url, currentTemplate.frame_aspect_ratio, currentTemplate.frames, currentTemplate.custom_slots, isGrid]);

  return (
    <div className="bg-[#FCF8F2] border border-slate-800 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between overflow-hidden group transition-all hover:translate-y-[-2px] hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,1)]">
      
      {/* CARD HEADER: Creator & Badges */}
      <div className="p-3.5 border-b border-slate-200 bg-white/70 flex items-center justify-between gap-2 select-none">
        <div className="flex items-center gap-2 min-w-0">
          <img
            src={currentTemplate.creator_avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${currentTemplate.creator_name}`}
            alt={currentTemplate.creator_name}
            className="w-6 h-6 border border-slate-300 bg-slate-100 object-cover flex-shrink-0"
          />
          <div className="min-w-0">
            <span className="text-[10px] font-mono font-bold text-slate-800 truncate block">
              @{currentTemplate.creator_name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
          {currentTemplate.creator_name === "Posean Official" ? (
            <span className="text-[8px] font-mono font-black px-2 py-0.5 border border-slate-900 bg-amber-400 text-slate-950 uppercase flex items-center gap-1 shadow-xs">
              <Sparkles size={9} />
              <span>OFFICIAL</span>
            </span>
          ) : (
            <span className="text-[9px] font-mono font-bold px-2 py-0.5 border border-slate-800 bg-[#FFE66D] text-slate-900 uppercase">
              {isGrid ? "Grid" : "Strip"}
            </span>
          )}
          <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 border border-slate-700 bg-white text-slate-800 uppercase">
            {currentTemplate.frames} Foto
          </span>
          {currentTemplate.image_url && currentTemplate.creator_name !== "Posean Official" && (
            <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 border border-slate-800 bg-sky-100 text-sky-950 uppercase" title="Frame diunggah dari desain sendiri">
              PNG/Canva
            </span>
          )}
          {currentTemplate.image_url && !hasCanvaMargins && !isTrimming && (
            <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 border border-emerald-800 bg-emerald-100 text-emerald-950 uppercase">
              ✦ FULL
            </span>
          )}
          {isTrimming && (
            <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 border border-amber-800 bg-amber-100 text-amber-950 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />
              <span>Membuat Full...</span>
            </span>
          )}
          {canDelete && onDeleteTemplate && (
            <button
              onClick={() => onDeleteTemplate(currentTemplate.id)}
              className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
              title="Hapus template"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* STRIP PREVIEW CONTAINER */}
      <div className="p-5 flex flex-col items-center justify-center bg-slate-100/60 min-h-[280px]">
        <div
          className={`relative border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)] flex flex-col transition-transform group-hover:scale-[1.02] duration-200 select-none overflow-hidden ${
            currentTemplate.frame_aspect_ratio
              ? "w-[130px]"
              : isGrid
                ? "w-[170px] h-[210px] p-2.5"
                : "w-[130px] min-h-[250px] p-2.5"
          }`}
          style={{
            aspectRatio: currentTemplate.frame_aspect_ratio ? `${currentTemplate.frame_aspect_ratio}` : undefined,
            padding: currentTemplate.custom_slots && currentTemplate.custom_slots.length > 0 ? 0 : undefined,
            backgroundColor:
              currentTemplate.frame_mode === "background" && currentTemplate.image_url
                ? "transparent"
                : currentTemplate.bg_color,
            color: currentTemplate.text_color,
          }}
        >
          {/* If Background custom image */}
          {currentTemplate.frame_mode === "background" && currentTemplate.image_url && (
            <img
              src={currentTemplate.image_url}
              alt="Frame Background"
              className="absolute inset-0 w-full h-full object-fill pointer-events-none z-0"
            />
          )}

          {/* Photo slots: custom calibrated slots OR default mock slots */}
          {currentTemplate.custom_slots && currentTemplate.custom_slots.length > 0 ? (
            <div className="absolute inset-0 w-full h-full pointer-events-none z-10">
              {currentTemplate.custom_slots.map((slot, idx) => (
                <div
                  key={idx}
                  className="absolute bg-black/10 border border-black/15 flex items-center justify-center overflow-hidden"
                  style={{
                    left: `${slot.x}%`,
                    top: `${slot.y}%`,
                    width: `${slot.width}%`,
                    height: `${slot.height}%`,
                    borderRadius: slot.borderRadius ? `${slot.borderRadius}px` : undefined,
                  }}
                >
                  <span className="text-[8px] font-mono opacity-40 font-bold tracking-widest uppercase">
                    #{idx + 1}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div
              className={`w-full flex-1 gap-1.5 relative z-10 ${
                isGrid
                  ? "grid grid-cols-2 grid-rows-2 h-[140px]"
                  : `flex flex-col`
              }`}
            >
              {Array.from({ length: currentTemplate.frames }).map((_, idx) => (
                <div
                  key={idx}
                  className="w-full flex-1 bg-black/10 border border-black/15 flex items-center justify-center overflow-hidden min-h-[42px] relative"
                >
                  <span className="text-[8px] font-mono opacity-40 font-bold tracking-widest uppercase">
                    #{idx + 1}
                  </span>
                </div>
              ))}

              {/* Pre-positioned Stickers */}
              {currentTemplate.stickers &&
                currentTemplate.stickers.map((st) => {
                  const stDef = STICKERS.find((s) => s.id === st.type);
                  return (
                    <div
                      key={st.id}
                      className="absolute w-6 h-6 pointer-events-none select-none z-30"
                      style={{
                        left: `${st.x}%`,
                        top: `${st.y}%`,
                        transform: `translate(-50%, -50%) scale(${st.scale || 1}) rotate(${st.rotation || 0}deg)`,
                      }}
                    >
                      {stDef?.render(currentTemplate.text_color)}
                    </div>
                  );
                })}
            </div>
          )}

          {/* If Overlay custom image (Canva cutout) */}
          {currentTemplate.frame_mode !== "background" && currentTemplate.image_url && (
            <img
              src={currentTemplate.image_url}
              alt="Frame Overlay"
              className="absolute inset-0 w-full h-full object-fill pointer-events-none z-20"
            />
          )}


          {/* Strip Footer / Caption */}
          {currentTemplate.caption && (!currentTemplate.image_url || !currentTemplate.image_url.startsWith("/frames/")) && (
            <div className="pt-2 pb-0.5 text-center relative z-10 mt-auto">
              <p
                className="text-[8px] font-mono font-bold uppercase tracking-wider truncate max-w-full px-1"
                style={{ color: currentTemplate.text_color }}
              >
                {currentTemplate.caption}
              </p>
              <p
                className="text-[6px] font-mono uppercase tracking-[0.2em] opacity-60 mt-0.5"
                style={{ color: currentTemplate.text_color }}
              >
                GOOD MOMENTS
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CARD BODY: Info & Action */}
      <div className="p-4 bg-white flex flex-col gap-3 border-t border-slate-200">
        <div>
          <h3 className="font-mono font-bold text-sm text-slate-900 truncate">
            {currentTemplate.name}
          </h3>
          <p className="font-mono text-[10px] text-slate-500 line-clamp-1 mt-0.5">
            {currentTemplate.description || "Frame karya komunitas Posean."}
          </p>
        </div>

        {/* Tags / Filter suggestion */}
        <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
          <span>🔥 {currentTemplate.uses_count || 0} dipakai</span>
          {currentTemplate.default_filter && currentTemplate.default_filter !== "none" && (
            <span className="text-amber-600 font-bold uppercase">
              ✦ {currentTemplate.default_filter} filter
            </span>
          )}
        </div>

        {/* Use Action Button */}
        <button
          onClick={() => onUseTemplate(currentTemplate)}
          className="w-full py-2.5 px-4 bg-[#FFE66D] hover:bg-[#FFD93D] text-slate-950 font-mono font-bold text-xs uppercase tracking-wider border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <Sparkles size={13} className="text-slate-900" />
          <span>GUNAKAN FRAME</span>
        </button>
      </div>
    </div>
  );
}
