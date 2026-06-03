"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { usePhotoboothStore } from "@/store/usePhotoboothStore";
import { 
  Volume2, 
  VolumeX, 
  User, 
  FolderHeart, 
  LogOut, 
  Menu, 
  X, 
  Camera,
  Layers,
  Heart,
  Settings,
  Sparkles
} from "lucide-react";
import AuthModal from "./AuthModal";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, signOut, initialize } = useAuthStore();
  const { audioMuted, setAudioMuted, setStep } = usePhotoboothStore();
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      setDropdownOpen(false);
      setMobileMenuOpen(false);
      router.push("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleStartPhotobooth = () => {
    setStep("layout");
    setMobileMenuOpen(false);
    if (pathname !== "/") {
      router.push("/");
    }
  };

  return (
    <>
      <header className="w-full bg-[#FCF8F2] border-b border-slate-200 sticky top-0 z-40 select-none">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo / Branding */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-slate-900 border border-slate-800 text-white font-mono font-bold px-3 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-sm tracking-widest uppercase transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5 group-hover:shadow-none">
              ✨ POSEAN
            </div>
            <span className="hidden sm:inline-block text-[9px] font-mono tracking-[0.2em] text-slate-400 uppercase font-semibold">
              Good Moments
            </span>
          </Link>

          {/* Right Navigation Controls */}
          <div className="flex items-center gap-3">
            
            {/* Start Photobooth shortcut */}
            <button
              onClick={handleStartPhotobooth}
              className="hidden md:flex items-center gap-1.5 px-4 py-2 border border-slate-800 bg-[#FFE66D] hover:brightness-95 text-slate-950 font-mono text-xs font-bold rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
            >
              <Camera size={13} />
              <span>Start Photobooth</span>
            </button>

            {/* Mute toggle button */}
            <button
              onClick={() => setAudioMuted(!audioMuted)}
              className="p-2 border border-slate-800 bg-white hover:bg-slate-50 transition-colors focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
              title={audioMuted ? "Unmute Sound" : "Mute Sound"}
            >
              {audioMuted ? <VolumeX size={15} className="text-slate-800" /> : <Volume2 size={15} className="text-slate-800" />}
            </button>

            {/* User Profile dropdown or Login */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1.5 p-1 border border-slate-800 bg-white hover:bg-slate-50 focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer rounded-none overflow-hidden"
                >
                  <img
                    src={profile?.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${profile?.display_name || 'user'}`}
                    alt="Avatar"
                    className="w-6 h-6 border border-slate-200 bg-slate-100 object-cover"
                  />
                  <span className="hidden sm:inline-block max-w-[100px] truncate text-[10px] font-mono font-bold text-slate-800 pl-1">
                    {profile?.display_name || "Account"}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none z-50 font-mono text-xs overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                      <p className="font-bold text-slate-800 truncate">{profile?.display_name}</p>
                      <p className="text-[9px] text-slate-400 truncate mt-0.5">{profile?.email}</p>
                    </div>
                    
                    <Link
                      href="/my-photobooths"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      <Layers size={13} />
                      <span>My Photobooths</span>
                    </Link>

                    <Link
                      href="/favorites"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      <Heart size={13} />
                      <span>My Favorites</span>
                    </Link>

                    <Link
                      href="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      <User size={13} />
                      <span>My Profile</span>
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2 px-4 py-2.5 border-t border-slate-100 text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <LogOut size={13} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-800 bg-slate-950 text-white font-mono text-xs font-bold rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:brightness-95 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
              >
                <User size={13} />
                <span>Login</span>
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 border border-slate-800 bg-white hover:bg-slate-50 md:hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
            >
              {mobileMenuOpen ? <X size={15} /> : <Menu size={15} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-[#FCF8F2] px-4 pt-2 pb-4 space-y-2.5 font-mono text-xs animate-in slide-in-from-top duration-200">
            <button
              onClick={handleStartPhotobooth}
              className="w-full flex items-center justify-center gap-2 py-3 border border-slate-800 bg-[#FFE66D] text-slate-950 font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
            >
              <Camera size={14} />
              <span>START PHOTOBOOTH</span>
            </button>

            {user && (
              <div className="space-y-1 pt-2 border-t border-slate-200/60">
                <p className="text-[10px] text-slate-400 font-bold px-2 py-1">MENU</p>
                <Link
                  href="/my-photobooths"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-100/60 rounded-none"
                >
                  <Layers size={14} />
                  <span>My Photobooths</span>
                </Link>
                <Link
                  href="/favorites"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-100/60 rounded-none"
                >
                  <Heart size={14} />
                  <span>My Favorites</span>
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-100/60 rounded-none"
                >
                  <User size={14} />
                  <span>My Profile</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-red-500 hover:bg-red-50 rounded-none cursor-pointer mt-1"
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Auth Modal Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
