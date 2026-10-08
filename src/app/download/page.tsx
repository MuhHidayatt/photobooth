"use client";

import React, { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Download, Share2, Sparkles, Home, Check, AlertCircle } from "lucide-react";

function DownloadContent() {
  const searchParams = useSearchParams();
  const imageUrl = searchParams.get("url");
  const fileName = searchParams.get("name") || "posean-photobooth.jpg";
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = async () => {
    if (!imageUrl) return;
    setDownloading(true);
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch (e) {
      console.warn("Direct blob download failed, opening in new tab:", e);
      window.open(imageUrl, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!imageUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Posean Photobooth",
          text: "Lihat hasil foto photobooth saya di Posean! 📸✨",
          url: window.location.href,
        });
      } catch (err) {
        console.warn("Share failed:", err);
      }
    } else {
      window.open(
        `https://api.whatsapp.com/send?text=${encodeURIComponent(
          "Lihat hasil foto photobooth saya di Posean! " + window.location.href
        )}`,
        "_blank"
      );
    }
  };

  if (!imageUrl) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex flex-col items-center justify-center p-4 font-mono text-center">
        <div className="bg-white border-2 border-slate-900 p-8 max-w-sm w-full shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center gap-4">
          <div className="p-3 bg-red-100 border border-slate-900 text-red-600">
            <AlertCircle size={24} />
          </div>
          <h1 className="text-sm font-bold uppercase tracking-tight text-slate-900">
            Foto Tidak Ditemukan
          </h1>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Link ini tidak menyertakan foto yang valid atau sudah kedaluwarsa.
          </p>
          <Link
            href="/"
            className="w-full py-2.5 px-4 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider border border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-800 flex items-center justify-center gap-2"
          >
            <Home size={14} />
            <span>Mulai Foto Baru</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-between p-4 sm:p-6 font-mono selection:bg-[#FFE66D]">
      {/* Top Header */}
      <header className="w-full max-w-md flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4 select-none">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-7 h-7 bg-[#FFE66D] border border-slate-900 flex items-center justify-center text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            📸
          </span>
          <span className="text-sm font-black uppercase tracking-wider text-slate-900">
            POSEAN
          </span>
        </Link>
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 px-2 py-1 border border-slate-300">
          Mobile Download
        </span>
      </header>

      {/* Main Preview Card */}
      <main className="w-full max-w-md flex flex-col items-center gap-5 my-auto">
        <div className="text-center space-y-1">
          <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900">
            Foto Kamu Siap! 🎉
          </h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">
            Simpan ke galeri smartphone atau bagikan ke teman
          </p>
        </div>

        {/* Photobooth Strip Preview */}
        <div className="w-full max-w-[280px] sm:max-w-[320px] bg-white border-2 border-slate-900 p-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
          <img
            src={imageUrl}
            alt="Posean Photobooth Result"
            className="w-full h-auto max-h-[58vh] object-contain border border-slate-200"
          />
        </div>

        {/* Action Controls */}
        <div className="w-full max-w-sm flex flex-col gap-2.5">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full py-3.5 px-4 bg-[#25D366] text-slate-950 font-black text-xs uppercase tracking-wider border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:brightness-95 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            {downloaded ? (
              <>
                <Check size={16} className="text-slate-950" />
                <span>Foto Berhasil Diunduh!</span>
              </>
            ) : downloading ? (
              <span>Mengunduh Foto HD...</span>
            ) : (
              <>
                <Download size={16} />
                <span>Simpan Gambar ke HP (HD)</span>
              </>
            )}
          </button>

          <button
            onClick={handleShare}
            className="w-full py-3 px-4 bg-[#FFE66D] text-slate-900 font-bold text-xs uppercase tracking-wider border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-[#ffdf47] active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Share2 size={15} />
            <span>Bagikan ke Teman</span>
          </button>

          <Link
            href="/"
            className="w-full py-2.5 px-4 bg-white text-slate-700 font-bold text-[10px] uppercase tracking-wider border border-slate-300 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors text-center"
          >
            <Sparkles size={12} className="text-amber-500" />
            <span>Coba Photobooth Posean Sendiri</span>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md text-center pt-6 pb-2 text-[8px] text-slate-400 select-none">
        POSEAN PHOTOBOOTH • CAPTURE FUN, KEEP MEMORIES
      </footer>
    </div>
  );
}

export default function DownloadPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center font-mono text-xs text-slate-400">
          Loading photo...
        </div>
      }
    >
      <DownloadContent />
    </Suspense>
  );
}
