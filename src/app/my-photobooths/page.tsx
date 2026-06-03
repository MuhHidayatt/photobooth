"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { fetchPhotobooths, PhotoboothRecord } from "@/utils/supabaseHelpers";
import GalleryGrid from "@/components/GalleryGrid";
import { Layers, RefreshCw, LogIn } from "lucide-react";
import AuthModal from "@/components/AuthModal";

export default function MyPhotoboothsPage() {
  const { user, loading, initialize } = useAuthStore();
  const [items, setItems] = useState<PhotoboothRecord[]>([]);
  const [fetching, setFetching] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!loading && user) {
      setFetching(true);
      fetchPhotobooths(user.id)
        .then((data) => {
          setItems(data);
        })
        .catch((err) => {
          console.error("Failed to load creations:", err);
        })
        .finally(() => {
          setFetching(false);
        });
    } else if (!loading && !user) {
      setFetching(false);
    }
  }, [user, loading]);

  if (loading || (fetching && user)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] font-mono text-xs select-none">
        <RefreshCw size={24} className="animate-spin text-slate-800 mb-2" />
        <span className="text-slate-400 uppercase tracking-widest">Loading creations...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] py-12 px-4 text-center font-mono max-w-md mx-auto">
        <div className="w-14 h-14 bg-slate-100 border border-slate-350 flex items-center justify-center text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-5 rounded-none select-none">
          🔒
        </div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-1">
          Access Restricted
        </h2>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest leading-relaxed mb-8">
          Sign in to access your personal gallery and history.
        </p>
        <button
          onClick={() => setAuthOpen(true)}
          className="flex items-center gap-1.5 px-6 py-3 border border-slate-800 bg-slate-950 text-white font-bold text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
        >
          <LogIn size={13} />
          <span>Login to Account</span>
        </button>
        <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 md:py-12 flex flex-col">
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-4 select-none">
        <div className="p-1.5 bg-[#FFE66D] border border-slate-800 text-slate-950 font-bold text-xs rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <Layers size={14} />
        </div>
        <div>
          <h1 className="text-sm font-bold uppercase font-mono tracking-widest text-slate-800">
            My Saved Photobooths
          </h1>
          <p className="text-[9px] text-slate-400 font-mono uppercase tracking-wider mt-0.5">
            Your collection of moments and strips ({items.length})
          </p>
        </div>
      </div>

      <div className="flex-1">
        <GalleryGrid 
          initialItems={items} 
          emptyMessage="No photobooths saved yet."
        />
      </div>
    </div>
  );
}
