"use client";

import React from "react";
import { motion } from "framer-motion";
import { Undo2 } from "lucide-react";
import { usePhotoboothStore, LAYOUTS } from "@/store/usePhotoboothStore";

export default function LayoutStep() {
  const { selectedLayout, setSelectedLayout, setStep } = usePhotoboothStore();

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
          CHOOSE FORMAT
        </span>
        <h2 className="text-lg lg:text-2xl font-bold text-slate-800 uppercase font-mono tracking-tight">
          Select Strip Format
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4 w-full max-w-sm sm:max-w-2xl lg:max-w-3xl mt-1 select-none">
        {LAYOUTS.map((layout) => {
          const isSelected = selectedLayout.id === layout.id;
          return (
            <button
              key={layout.id}
              onClick={() => {
                setSelectedLayout(layout);
                setStep("camera");
              }}
              className={`flex flex-col items-center p-3 sm:p-4 lg:p-5 rounded-none border transition-all cursor-pointer justify-between relative ${
                isSelected
                  ? "border-slate-900 bg-slate-900/5 scale-98 shadow-none"
                  : "border-slate-350 bg-white hover:bg-slate-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              }`}
              style={isSelected ? { borderWidth: "3px" } : {}}
            >
              {layout.badge && (
                <span className="absolute -top-2 px-1.5 py-0.5 bg-amber-300 text-slate-900 border border-slate-900 text-[7px] font-black font-mono uppercase tracking-wider">
                  {layout.badge}
                </span>
              )}

              {layout.type === "grid" ? (
                <div className="w-16 h-20 sm:w-16 sm:h-24 lg:w-20 lg:h-28 border border-slate-800 bg-slate-50 p-1.5 grid grid-cols-2 gap-1 rounded-none mb-2.5">
                  {Array.from({ length: 4 }).map((_, fIdx) => (
                    <div
                      key={fIdx}
                      className="w-full h-full border border-slate-300 bg-zinc-200 rounded-none aspect-[4/3]"
                    />
                  ))}
                </div>
              ) : (
                <div className="w-10 h-20 sm:w-12 sm:h-24 lg:w-14 lg:h-28 border border-slate-800 bg-slate-50 p-1 flex flex-col gap-1 rounded-none mb-2.5">
                  {Array.from({ length: layout.frames }).map((_, fIdx) => (
                    <div
                      key={fIdx}
                      className="w-full flex-1 border border-slate-300 bg-zinc-200 rounded-none"
                    />
                  ))}
                </div>
              )}

              <div className="text-center">
                <span className="text-[10px] sm:text-xs font-black text-slate-900 font-mono uppercase tracking-tight block">
                  {layout.name}
                </span>
                <span className="text-[8px] text-slate-400 font-mono">
                  {layout.frames} Snaps
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
        <Undo2 size={11} /> Back
      </button>
    </motion.div>
  );
}
