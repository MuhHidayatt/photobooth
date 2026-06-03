"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Mail, Lock, User, RefreshCw, X, AlertCircle, CheckCircle } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = "signin" | "signup" | "reset";

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, isConfigured } = useAuthStore();
  
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      setError(err.message || "Google Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (mode === "signin") {
        await signInWithEmail(email, password);
        onClose();
      } else if (mode === "signup") {
        if (!displayName.trim()) {
          throw new Error("Display Name is required.");
        }
        await signUpWithEmail(email, password, displayName);
        setSuccessMsg("Account created! Logging you in...");
        setTimeout(() => {
          onClose();
        }, 1500);
      } else if (mode === "reset") {
        if (!isConfigured) {
          throw new Error("Password reset is not supported in local demo mode.");
        }
        // Supabase Reset password
        const { error: resetError } = await fetch("/api/auth/reset-password", {
          method: "POST",
          body: JSON.stringify({ email }),
        }).then(res => res.json()).catch(() => ({ error: { message: "Failed to send reset link." } }));

        if (resetError) throw new Error(resetError.message);
        
        setSuccessMsg("Reset email sent! Please check your inbox.");
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none font-mono">
      <div className="w-full max-w-md bg-[#FCF8F2] border border-slate-800 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative flex flex-col p-6 animate-in fade-in zoom-in-95 duration-150 rounded-none">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-slate-100 border border-slate-300 hover:border-slate-800 rounded-none transition-all cursor-pointer"
        >
          <X size={15} />
        </button>

        {/* Header title */}
        <div className="mb-6 mt-2 text-center">
          <h2 className="text-xl font-bold uppercase tracking-wider text-slate-800">
            {mode === "signin" && "WELCOME BACK"}
            {mode === "signup" && "CREATE ACCOUNT"}
            {mode === "reset" && "RESET PASSWORD"}
          </h2>
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">
            {isConfigured ? "✨ SECURED BY SUPABASE" : "⚡ RUNNING IN LOCAL DEMO MODE"}
          </p>
        </div>

        {/* Auth Error/Success Alerts */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs flex items-start gap-2 animate-in fade-in duration-150 rounded-none">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs flex items-start gap-2 animate-in fade-in duration-150 rounded-none">
            <CheckCircle size={14} className="flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMsg}</span>
          </div>
        )}

        {/* Social Authentication */}
        {mode !== "reset" && (
          <div className="mb-5 flex flex-col gap-2">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 border border-slate-800 bg-white hover:bg-slate-50 font-bold text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
            >
              {/* Google G Logo SVG */}
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
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
            <div className="flex items-center justify-center my-2 select-none">
              <div className="h-[1px] bg-slate-200 flex-1" />
              <span className="text-[9px] text-slate-400 font-bold px-3">OR USE EMAIL</span>
              <div className="h-[1px] bg-slate-200 flex-1" />
            </div>
          </div>
        )}

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {mode === "signup" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-slate-500 uppercase">DISPLAY NAME</label>
              <div className="relative">
                <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Hidayat06"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 focus:border-slate-800 bg-white text-xs text-slate-800 focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-bold text-slate-500 uppercase">EMAIL ADDRESS</label>
            <div className="relative">
              <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 focus:border-slate-800 bg-white text-xs text-slate-800 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {mode !== "reset" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-slate-500 uppercase">PASSWORD</label>
              <div className="relative">
                <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 focus:border-slate-800 bg-white text-xs text-slate-800 focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {/* Action button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-1.5 py-3 border border-slate-800 bg-slate-900 hover:brightness-95 text-white font-bold text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
          >
            {loading ? (
              <RefreshCw size={13} className="animate-spin" />
            ) : (
              <span>
                {mode === "signin" && "Continue with Email"}
                {mode === "signup" && "Sign Up"}
                {mode === "reset" && "Send Reset Link"}
              </span>
            )}
          </button>
        </form>

        {/* Footer toggles */}
        <div className="mt-6 flex flex-col items-center gap-2.5 text-[10px] text-slate-400 border-t border-slate-200/60 pt-4">
          {mode === "signin" && (
            <>
              <p>
                Don't have an account?{" "}
                <button
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-slate-700 font-bold hover:underline"
                >
                  Sign Up
                </button>
              </p>
              <button
                onClick={() => {
                  setMode("reset");
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="text-slate-500 hover:underline"
              >
                Forgot Password?
              </button>
            </>
          )}

          {mode === "signup" && (
            <p>
              Already have an account?{" "}
              <button
                onClick={() => {
                  setMode("signin");
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="text-slate-700 font-bold hover:underline"
              >
                Sign In
              </button>
            </p>
          )}

          {mode === "reset" && (
            <button
              onClick={() => {
                setMode("signin");
                setError(null);
                setSuccessMsg(null);
              }}
              className="text-slate-700 font-bold hover:underline"
            >
              Back to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
