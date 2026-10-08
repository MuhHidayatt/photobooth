"use client";

import React from "react";
import { Sparkles, Trash2, CheckCircle, Share2, Heart } from "lucide-react";
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
  const isGrid = template.type === "grid";

  return (
    <div className="bg-[#FCF8F2] border border-slate-800 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between overflow-hidden group transition-all hover:translate-y-[-2px] hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,1)]">
      
      {/* CARD HEADER: Creator & Badges */}
      <div className="p-3.5 border-b border-slate-200 bg-white/70 flex items-center justify-between gap-2 select-none">
        <div className="flex items-center gap-2 min-w-0">
          <img
            src={template.creator_avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${template.creator_name}`}
            alt={template.creator_name}
            className="w-6 h-6 border border-slate-300 bg-slate-100 object-cover flex-shrink-0"
          />
          <div className="min-w-0">
            <span className="text-[10px] font-mono font-bold text-slate-800 truncate block">
              @{template.creator_name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[9px] font-mono font-bold px-2 py-0.5 border border-slate-800 bg-[#FFE66D] text-slate-900 uppercase">
            {isGrid ? "Grid 2x2" : `${template.frames} Strip`}
          </span>
          {template.image_url && (
            <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 border border-slate-800 bg-sky-100 text-sky-950 uppercase" title="Frame diunggah dari desain sendiri">
              PNG/Canva
            </span>
          )}
          {canDelete && onDeleteTemplate && (
            <button
              onClick={() => onDeleteTemplate(template.id)}
              className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
              title="Hapus template"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* STRIP PREVIEW CONTAINER */}
      <div className="p-5 flex items-center justify-center bg-slate-100/60 min-h-[280px]">
        <div
          className={`relative border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)] p-2.5 flex flex-col transition-transform group-hover:scale-[1.02] duration-200 select-none overflow-hidden ${
            isGrid ? "w-[170px] h-[210px]" : "w-[130px] min-h-[250px]"
          }`}
          style={{
            backgroundColor:
              template.frame_mode === "background" && template.image_url
                ? "transparent"
                : template.bg_color,
            color: template.text_color,
          }}
        >
          {/* If Background custom image */}
          {template.frame_mode === "background" && template.image_url && (
            <img
              src={template.image_url}
              alt="Frame Background"
              className="absolute inset-0 w-full h-full object-fill pointer-events-none z-0"
            />
          )}

          {/* Mock photo slots */}
          <div
            className={`w-full flex-1 gap-1.5 relative z-10 ${
              isGrid
                ? "grid grid-cols-2 grid-rows-2 h-[140px]"
                : `flex flex-col`
            }`}
          >
            {Array.from({ length: template.frames }).map((_, idx) => (
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
            {template.stickers &&
              template.stickers.map((st) => {
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
                    {stDef?.render(template.text_color)}
                  </div>
                );
              })}
          </div>

          {/* If Overlay custom image (Canva cutout) */}
          {template.frame_mode !== "background" && template.image_url && (
            <img
              src={template.image_url}
              alt="Frame Overlay"
              className="absolute inset-0 w-full h-full object-fill pointer-events-none z-20"
            />
          )}

          {/* Strip Footer / Caption */}
          {template.caption && (
            <div className="pt-2 pb-0.5 text-center relative z-10 mt-auto">
              <p
                className="text-[8px] font-mono font-bold uppercase tracking-wider truncate max-w-full px-1"
                style={{ color: template.text_color }}
              >
                {template.caption}
              </p>
              <p
                className="text-[6px] font-mono uppercase tracking-[0.2em] opacity-60 mt-0.5"
                style={{ color: template.text_color }}
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
            {template.name}
          </h3>
          <p className="font-mono text-[10px] text-slate-500 line-clamp-1 mt-0.5">
            {template.description || "Frame karya komunitas Posean."}
          </p>
        </div>

        {/* Tags / Filter suggestion */}
        <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
          <span>🔥 {template.uses_count || 0} dipakai</span>
          {template.default_filter && template.default_filter !== "none" && (
            <span className="text-amber-600 font-bold uppercase">
              ✦ {template.default_filter} filter
            </span>
          )}
        </div>

        {/* USE BUTTON */}
        <button
          onClick={() => onUseTemplate(template)}
          className="w-full py-2.5 px-3 border border-slate-900 bg-[#FFE66D] hover:bg-[#ffde43] text-slate-950 font-mono text-xs font-bold uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Sparkles size={13} className="text-slate-900" />
          <span>Gunakan Frame</span>
        </button>
      </div>
    </div>
  );
}
