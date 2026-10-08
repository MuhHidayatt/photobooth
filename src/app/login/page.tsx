"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { Mail, Lock, User, RefreshCw, AlertCircle, CheckCircle, ArrowLeft, Sparkles } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/frames";

  const {
    user,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    isConfigured,
  } = useAuthStore();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // If already logged in, redirect automatically
  useEffect(() => {
    if (user) {
      router.push(redirectUrl);
    }
  }, [user, redirectUrl, router]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || "Gagal login dengan Google.");
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === "signin") {
        await signInWithEmail(email, password);
        router.push(redirectUrl);
      } else {
        if (password !== confirmPassword) {
          throw new Error("Password dan konfirmasi password tidak cocok.");
        }
        if (password.length < 6) {
          throw new Error("Password minimal harus 6 karakter.");
        }
        await signUpWithEmail(email, password, displayName);
        setSuccessMsg("Akun berhasil dibuat! Mengalihkan...");
        setTimeout(() => {
          router.push(redirectUrl);
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || "Autentikasi gagal. Silakan periksa kembali data Anda.");
    } finally {
      setLoading(false);
    }
  };

  const reason = searchParams.get("reason");

  const getReasonBadge = () => {
    if (reason === "create") return "🎨 Eits, mau bikin frame ya?";
    if (reason === "use") return "📸 Eits, naksir frame ini ya?";
    if (reason === "share") return "✨ Eits, desainmu kece banget!";
    return "✨ Eits, login dulu yaa!";
  };

  const getReasonHeading = () => {
    if (mode === "signup") return "Gabung Geng Posean!";
    if (reason === "create") return "Bikin Frame Kerenmu!";
    if (reason === "use") return "Pasang Frame ke Fotomu!";
    if (reason === "share") return "Daftarin Frame Kreasimu!";
    return "Tahan Dulu Pose-nya!";
  };

  const getReasonSub = () => {
    if (mode === "signup") {
      return "Bikin akun cuma semenit kok, biar semua jepretan & frame estetikmu tersimpan rapi!";
    }
    if (reason === "create") {
      return "Masuk akun dulu yuk, biar karya frame estetikmu bisa dipamerin & dipakai teman-teman.";
    }
    if (reason === "use") {
      return "Masuk akun dulu sebentar yuk, biar frame ini langsung nempel di strip fotomu!";
    }
    if (reason === "share") {
      return "Login dulu yaa, biar namamu resmi tercatat sebagai kreator frame ini di komunitas.";
    }
    return "Masuk akun dulu sebentar yuk, cuma beberapa detik kok biar semua memorimu aman!";
  };

  return (
    <div className="w-full max-w-md bg-[#FCF8F2] border border-slate-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 sm:p-8 relative font-mono">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-900 uppercase mb-4 transition-colors"
      >
        <ArrowLeft size={12} />
        <span>Kembali ke Beranda</span>
      </Link>

      {/* Header title */}
      <div className="mb-6 text-center">
        <div className="inline-block px-3 py-1 bg-[#FFE66D] border border-slate-900 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-2">
          {getReasonBadge()}
        </div>
        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900">
          {getReasonHeading()}
        </h1>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          {getReasonSub()}
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs flex items-start gap-2">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs flex items-start gap-2">
          <CheckCircle size={14} className="flex-shrink-0 mt-0.5" />
          <span className="leading-relaxed">{successMsg}</span>
        </div>
      )}

      {/* Google Sign In */}
      <div className="mb-5">
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2.5 py-3 px-4 border border-slate-900 bg-white hover:bg-slate-50 font-bold text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
        >
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
          <span>Lanjutkan dengan Google</span>
        </button>
      </div>

      {/* Divider */}
      <div className="relative mb-5 text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-300"></div>
        </div>
        <span className="relative bg-[#FCF8F2] px-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          Atau via Email
        </span>
      </div>

      {/* Form */}
      <form onSubmit={handleEmailAuth} className="space-y-3.5">
        {mode === "signup" && (
          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
              Nama Lengkap / Username
            </label>
            <div className="relative">
              <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Nama Anda"
                required
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-900 rounded-none focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
            Alamat Email
          </label>
          <div className="relative">
            <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              required
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-900 rounded-none focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
            Password
          </label>
          <div className="relative">
            <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              required
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-900 rounded-none focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>
        </div>

        {mode === "signup" && (
          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
              Konfirmasi Password
            </label>
            <div className="relative">
              <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password"
                required
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-900 rounded-none focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 px-4 border border-slate-900 bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <>
              <RefreshCw size={13} className="animate-spin text-[#FFE66D]" />
              <span>Memproses...</span>
            </>
          ) : (
            <span>{mode === "signin" ? "Masuk Sekarang" : "Daftar Akun"}</span>
          )}
        </button>
      </form>

      {/* Switch mode */}
      <div className="mt-6 pt-4 border-t border-slate-300 text-center">
        {mode === "signin" ? (
          <p className="text-[10px] text-slate-600">
            Belum punya akun?{" "}
            <button
              onClick={() => {
                setMode("signup");
                setError(null);
                setSuccessMsg(null);
              }}
              className="font-bold text-slate-900 underline hover:text-amber-600 cursor-pointer"
            >
              Daftar di sini
            </button>
          </p>
        ) : (
          <p className="text-[10px] text-slate-600">
            Sudah memiliki akun?{" "}
            <button
              onClick={() => {
                setMode("signin");
                setError(null);
                setSuccessMsg(null);
              }}
              className="font-bold text-slate-900 underline hover:text-amber-600 cursor-pointer"
            >
              Masuk di sini
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 min-h-[75vh]">
      <Suspense
        fallback={
          <div className="font-mono text-xs text-slate-400 uppercase">
            Memuat halaman login...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
