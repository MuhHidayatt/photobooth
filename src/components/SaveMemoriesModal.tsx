"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Sparkles, Mail, X } from "lucide-react";
import AuthModal from "./AuthModal";

interface SaveMemoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSkip: () => void;
  onSuccessLogin: () => void;
}

export default function SaveMemoriesModal({
  isOpen,
  onClose,
  onSkip,
  onSuccessLogin,
}: SaveMemoriesModalProps) {
  const { signInWithGoogle } = useAuthStore();
  const [authOpen, setAuthOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      onSuccessLogin();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = () => {
    setAuthOpen(true);
  };

  const handleAuthClose = () => {
    setAuthOpen(false);
    // If the user successfully logged in, the auth state will update and we can triggers onSuccessLogin
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none font-mono">
        <div className="w-full max-w-sm bg-[#FCF8F2] border border-slate-800 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative flex flex-col p-6 animate-in fade-in zoom-in-95 duration-150 rounded-none text-center">
          
          <button
            onClick={onSkip}
            className="absolute top-3 right-3 p-1 hover:bg-slate-100 border border-slate-200 hover:border-slate-850 rounded-none cursor-pointer"
          >
            <X size={13} />
          </button>

          <div className="mx-auto w-12 h-12 bg-[#FFE66D] border border-slate-800 flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mb-4 text-lg">
            💾
          </div>

          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Save your memories?
          </h3>
          
          <p className="text-[11px] text-slate-400 leading-relaxed uppercase tracking-wider mt-2 mb-6">
            Sign in to store your photobooths and GIFs in your personal account.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 border border-slate-800 bg-white hover:bg-slate-50 font-bold text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer text-slate-850"
            >
              {/* Google G Logo SVG */}
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <button
              onClick={handleEmail}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 border border-slate-800 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
            >
              <Mail size={13} />
              <span>Continue with Email</span>
            </button>

            <button
              onClick={onSkip}
              className="w-full py-2 bg-transparent text-slate-400 hover:text-slate-600 font-bold text-[10px] uppercase tracking-widest cursor-pointer"
            >
              Skip & Continue as Guest
            </button>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={authOpen}
        onClose={() => {
          handleAuthClose();
          // Check if session became active
          if (useAuthStore.getState().user) {
            onSuccessLogin();
            onClose();
          }
        }}
      />
    </>
  );
}
