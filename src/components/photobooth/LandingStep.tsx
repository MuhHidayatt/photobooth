"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { usePhotoboothStore } from "@/store/usePhotoboothStore";

export default function LandingStep() {
  const { setStep } = usePhotoboothStore();

  return (
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
  );
}
