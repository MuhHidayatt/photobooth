"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Download, 
  Trash2, 
  Heart, 
  Sparkles, 
  Calendar, 
  Palette, 
  FileImage, 
  Film,
  Camera,
  Loader
} from "lucide-react";
import { PhotoboothRecord, toggleFavorite, deletePhotobooth } from "@/utils/supabaseHelpers";
import { useAuthStore } from "@/store/useAuthStore";

interface GalleryGridProps {
  initialItems: PhotoboothRecord[];
  emptyMessage?: string;
  favoritesOnly?: boolean;
}

export default function GalleryGrid({ 
  initialItems, 
  emptyMessage = "No photobooths yet.", 
  favoritesOnly = false 
}: GalleryGridProps) {
  const { user } = useAuthStore();
  const [items, setItems] = useState<PhotoboothRecord[]>(initialItems);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleFavorite = async (id: string, currentState: boolean) => {
    if (!user) return;
    setLoadingId(id);
    try {
      const newState = await toggleFavorite(id, user.id, currentState);
      
      if (favoritesOnly && !newState) {
        setItems(prev => prev.filter(item => item.id !== id));
      } else {
        setItems(prev => prev.map(item => item.id === id ? { ...item, is_favorite: newState } : item));
      }
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this photobooth? This action cannot be undone.")) return;

    setLoadingId(id);
    try {
      await deletePhotobooth(id, user.id);
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error("Failed to delete photobooth:", err);
    } finally {
      setLoadingId(null);
    }
  };

  const triggerDownload = (url: string, filename: string) => {
    // If it's a data URL, download directly. If it's a Supabase storage URL, we can fetch or open/download.
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center font-mono">
        <div className="w-16 h-16 bg-slate-100 border border-slate-350 flex items-center justify-center text-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6 rounded-none select-none">
          📸
        </div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-1">
          {emptyMessage}
        </h3>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest leading-relaxed mb-8 max-w-xs">
          Start creating memories with Posean.
        </p>
        <Link
          href="/"
          className="flex items-center gap-1.5 px-6 py-3 border border-slate-800 bg-[#FFE66D] hover:brightness-95 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
        >
          <Camera size={13} />
          <span>Create Photobooth</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 font-mono">
      {items.map((item) => {
        const formattedDate = new Date(item.created_at).toLocaleDateString("id-ID", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });

        return (
          <div 
            key={item.id}
            className="border border-slate-800 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col relative overflow-hidden group hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            {/* Gallery Thumbnail Preview */}
            <div className="aspect-[3/4] relative overflow-hidden bg-slate-50 border-b border-slate-200 flex items-center justify-center p-4">
              <img 
                src={item.jpg_url} 
                alt="Photobooth Strip" 
                className="h-full w-auto object-contain shadow-md max-h-full max-w-full"
              />
              
              {/* Badges overlay */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10 select-none">
                <span className="flex items-center gap-1 px-1.5 py-0.5 border border-slate-850 bg-white text-slate-800 text-[8px] font-bold uppercase tracking-wider">
                  <FileImage size={9} />
                  <span>JPG</span>
                </span>
                {item.gif_url && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 border border-slate-850 bg-[#FFE66D] text-slate-950 text-[8px] font-bold uppercase tracking-wider">
                    <Film size={9} />
                    <span>GIF</span>
                  </span>
                )}
              </div>
            </div>

            {/* Creation info details */}
            <div className="p-4 flex-1 flex flex-col justify-between gap-3 bg-[#FCF8F2]/30">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase">
                  <Calendar size={10} />
                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-bold uppercase">
                  <Palette size={10} />
                  <span>Theme: {item.theme}</span>
                </div>
                {item.caption && (
                  <p className="text-[10px] text-slate-700 font-bold italic line-clamp-1 border-l-2 border-[#FFE66D] pl-1.5 mt-1">
                    "{item.caption}"
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
                <button
                  onClick={() => triggerDownload(item.jpg_url, `posean-${item.id}.jpg`)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 border border-slate-800 bg-white text-slate-800 text-[9px] font-bold uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
                  title="Download JPG Strip"
                >
                  <Download size={10} />
                  <span>Strip</span>
                </button>

                {item.gif_url && (
                  <button
                    onClick={() => triggerDownload(item.gif_url, `posean-${item.id}.gif`)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 border border-slate-800 bg-[#FFE66D] text-slate-950 text-[9px] font-bold uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
                    title="Download GIF Animation"
                  >
                    <Download size={10} />
                    <span>GIF</span>
                  </button>
                )}

                <button
                  onClick={() => handleFavorite(item.id, item.is_favorite)}
                  disabled={loadingId === item.id}
                  className={`p-1.5 border border-slate-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer ${
                    item.is_favorite 
                      ? "bg-red-50 text-red-500 hover:bg-red-100" 
                      : "bg-white text-slate-400 hover:text-slate-600"
                  }`}
                  title={item.is_favorite ? "Remove from Favorites" : "Add to Favorites"}
                >
                  <Heart size={12} fill={item.is_favorite ? "currentColor" : "none"} />
                </button>

                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={loadingId === item.id}
                  className="p-1.5 border border-slate-800 bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
                  title="Delete Photobooth"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
            
            {/* Loading Cover Spinner */}
            {loadingId === item.id && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-20">
                <Loader size={18} className="animate-spin text-slate-800" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
