"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { fetchPhotobooths } from "@/utils/supabaseHelpers";
import { 
  User, 
  Mail, 
  Calendar, 
  Camera, 
  Film, 
  Heart, 
  RefreshCw, 
  Check, 
  Shuffle,
  LogIn
} from "lucide-react";
import AuthModal from "@/components/AuthModal";

export default function ProfilePage() {
  const { user, profile, loading, updateProfile, initialize } = useAuthStore();
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  
  const [stats, setStats] = useState({
    totalPhotobooths: 0,
    totalGifs: 0,
    totalFavorites: 0,
  });
  
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Sync profile details when loaded
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setAvatarUrl(profile.avatar_url || "");
      
      // Load user statistics
      fetchPhotobooths(profile.id)
        .then((data) => {
          setStats({
            totalPhotobooths: data.length,
            totalGifs: data.filter((item) => item.gif_url).length,
            totalFavorites: data.filter((item) => item.is_favorite).length,
          });
        })
        .catch((err) => {
          console.error("Failed to load statistics:", err);
        });
    }
  }, [profile]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError("Display Name cannot be empty.");
      return;
    }
    setUpdating(true);
    setError(null);
    setSuccess(false);

    try {
      await updateProfile(displayName.trim(), avatarUrl.trim());
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err: any) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setUpdating(false);
    }
  };

  const handleRandomizeAvatar = () => {
    const seeds = ["Aero", "Felix", "Buster", "Luna", "Pixel", "Chico", "Milo", "Kiki", "Shadow", "Pippin"];
    const randomSeed = seeds[Math.floor(Math.random() * seeds.length)] + "_" + Math.floor(Math.random() * 1000);
    setAvatarUrl(`https://api.dicebear.com/7.x/pixel-art/svg?seed=${randomSeed}`);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] font-mono text-xs select-none">
        <RefreshCw size={24} className="animate-spin text-slate-800 mb-2" />
        <span className="text-slate-400 uppercase tracking-widest">Loading Profile...</span>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] py-12 px-4 text-center font-mono max-w-md mx-auto">
        <div className="w-14 h-14 bg-slate-100 border border-slate-350 flex items-center justify-center text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-5 rounded-none select-none">
          🔒
        </div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-1">
          Access Restricted
        </h2>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest leading-relaxed mb-8">
          Sign in to view and manage your profile settings.
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

  const joinDate = new Date(profile.created_at || new Date()).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 md:py-12 font-mono text-slate-800">
      
      {/* Header Profile Title */}
      <div className="flex items-center gap-2 mb-8 border-b border-slate-200 pb-4 select-none">
        <div className="p-1.5 bg-[#FFE66D] border border-slate-800 text-slate-950 font-bold text-xs rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <User size={14} />
        </div>
        <div>
          <h1 className="text-sm font-bold uppercase tracking-widest text-slate-800">
            User Profile
          </h1>
          <p className="text-[9px] text-slate-400 uppercase tracking-wider mt-0.5">
            Manage your credentials and settings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Card Info & Statistics */}
        <div className="md:col-span-1 space-y-6">
          
          {/* Card Info Profile */}
          <div className="border border-slate-800 bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center text-center">
            <div className="relative w-20 h-20 border border-slate-800 overflow-hidden mb-4 rounded-none bg-slate-50 select-none">
              <img
                src={avatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${displayName}`}
                alt="Profile Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="font-bold text-sm uppercase tracking-wide text-slate-800 truncate w-full">{displayName}</h3>
            <p className="text-[9px] text-slate-450 truncate w-full mt-0.5">{profile.email}</p>
            
            <div className="flex items-center gap-1 text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-4">
              <Calendar size={10} />
              <span>Joined {joinDate}</span>
            </div>
          </div>

          {/* Statistics Grid Panel */}
          <div className="border border-slate-800 bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-550 border-b border-slate-100 pb-2 select-none">
              MEMORIES STATISTICS
            </h4>
            
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between font-bold">
                <div className="flex items-center gap-2 text-slate-650">
                  <Camera size={13} className="text-slate-800" />
                  <span>Total Strips</span>
                </div>
                <span className="bg-slate-100 px-2 py-0.5 border border-slate-800 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                  {stats.totalPhotobooths}
                </span>
              </div>

              <div className="flex items-center justify-between font-bold">
                <div className="flex items-center gap-2 text-slate-650">
                  <Film size={13} className="text-slate-800" />
                  <span>Total GIFs</span>
                </div>
                <span className="bg-[#FFE66D] px-2 py-0.5 border border-slate-800 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                  {stats.totalGifs}
                </span>
              </div>

              <div className="flex items-center justify-between font-bold">
                <div className="flex items-center gap-2 text-slate-650">
                  <Heart size={13} className="text-red-500 fill-red-500" />
                  <span>Favorites</span>
                </div>
                <span className="bg-red-50 text-red-650 px-2 py-0.5 border border-slate-800 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                  {stats.totalFavorites}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Settings Form */}
        <div className="md:col-span-2">
          <div className="border border-slate-800 bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-full">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-550 border-b border-slate-150 pb-3 mb-6 select-none">
              EDIT PROFILE DETAILS
            </h3>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-none">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-250 text-emerald-700 text-xs flex items-center gap-1.5 rounded-none animate-in fade-in duration-200">
                <Check size={14} />
                <span>Profile updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                  DISPLAY NAME
                </label>
                <div className="relative">
                  <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Enter display name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-350 focus:border-slate-800 bg-white text-xs text-slate-800 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                  EMAIL ADDRESS (READ-ONLY)
                </label>
                <div className="relative">
                  <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input
                    type="email"
                    disabled
                    value={profile.email}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 bg-slate-50 text-slate-400 text-xs cursor-not-allowed focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between">
                  <span>AVATAR IMAGE URL</span>
                  <button
                    type="button"
                    onClick={handleRandomizeAvatar}
                    className="text-[9px] text-slate-800 hover:underline flex items-center gap-1 font-bold"
                  >
                    <Shuffle size={10} />
                    <span>Randomize Pixel Art</span>
                  </button>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    placeholder="https://example.com/avatar.png"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-350 focus:border-slate-800 bg-white text-xs text-slate-800 focus:outline-none transition-colors"
                  />
                </div>
                <p className="text-[9px] text-slate-400 uppercase tracking-wider leading-relaxed mt-0.5">
                  Paste a link to any image, or randomize a unique retro pixel-art avatar above.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 mt-6">
                <button
                  type="submit"
                  disabled={updating}
                  className="flex items-center gap-1.5 px-5 py-3 border border-slate-800 bg-slate-900 hover:brightness-95 text-white font-bold text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                >
                  {updating ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    <span>Save Profile Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
