"use client";

import React from "react";

export default function Footer() {
  return (
    <footer className="w-full py-6 border-t border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center select-none gap-1 font-mono">
      <span className="text-[10px] font-bold tracking-[0.25em] text-slate-500 uppercase">
        GOOD MOMENTS
      </span>
      <div
        className="flex flex-col items-center text-slate-400 leading-normal"
        style={{ fontSize: "11px", letterSpacing: "1px", opacity: 0.75 }}
      >
        <span>Posean © 2026</span>
        <span>Developed by Hidayat06</span>
      </div>
    </footer>
  );
}
