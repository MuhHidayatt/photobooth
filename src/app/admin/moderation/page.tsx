"use client";

import React, { useState, useEffect } from "react";
import {
  Image as ImageIcon,
  Search,
  Trash2,
  ExternalLink,
  RefreshCw,
  Eye,
  X,
  Download,
  AlertTriangle,
  User,
  Calendar,
  Layers,
} from "lucide-react";
import {
  fetchAdminPhotobooths,
  deleteAdminPhotobooth,
} from "@/utils/adminHelpers";
import { AdminPhotoboothItem } from "@/types/admin";

export default function AdminModerationPage() {
  const [photos, setPhotos] = useState<AdminPhotoboothItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<AdminPhotoboothItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadPhotos = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminPhotobooths(search);
      setPhotos(data);
    } catch (err) {
      console.error("Failed to load photobooths:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPhotos();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadPhotos();
  };

  const handleDelete = async (photo: AdminPhotoboothItem) => {
    if (
      !confirm(
        `APAKAH ANDA YAKIN?\nFoto "${photo.caption || photo.id}" milik "${
          photo.user_name || photo.user_email
        }" akan dihapus permanen dari sistem.`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAdminPhotobooth(photo.id);
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      if (selectedPhoto?.id === photo.id) {
        setSelectedPhoto(null);
      }
    } catch (err) {
      alert("Gagal menghapus foto.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-300 p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-tight">
              Moderasi Galeri Publik
            </h1>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-300">
              {photos.length} Total Foto
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor semua strip photobooth yang disimpan user dan hapus konten yang melanggar
          </p>
        </div>

        <button
          onClick={loadPhotos}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:brightness-95 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          <span>Refresh Galeri</span>
        </button>
      </div>

      {/* Search Bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="bg-white border border-slate-300 p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3"
      >
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Cari berdasarkan caption, tema, atau email pemilik..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 text-xs focus:outline-none focus:border-slate-800"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-slate-900 text-white text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-800 cursor-pointer"
        >
          Cari
        </button>
      </form>

      {/* Grid of Photobooth Cards */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {photos.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-300 p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between group hover:border-slate-800 transition-all"
            >
              <div
                onClick={() => setSelectedPhoto(item)}
                className="aspect-[3/4] bg-slate-100 border border-slate-200 overflow-hidden relative cursor-pointer mb-2.5"
              >
                {item.jpg_url ? (
                  <img
                    src={item.jpg_url}
                    alt={item.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                    No Image
                  </div>
                )}
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <span className="px-2 py-1 bg-white text-slate-900 text-[10px] font-bold shadow flex items-center gap-1">
                    <Eye size={11} /> Inspeksi
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-900 truncate flex-1">
                    {item.caption || "Untitled Strip"}
                  </span>
                  <span className="text-[8.5px] px-1 py-0.2 bg-slate-100 border border-slate-300 uppercase">
                    {item.theme}
                  </span>
                </div>

                <div className="text-[9px] text-slate-500 truncate flex items-center gap-1">
                  <User size={10} />
                  <span>{item.user_name || item.user_email || "User"}</span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[8px] text-slate-400">
                    {new Date(item.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>

                  <button
                    onClick={() => handleDelete(item)}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Hapus foto dari sistem"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-slate-400 text-xs bg-white border border-dashed border-slate-300">
          Tidak ada foto photobooth yang ditemukan.
        </div>
      )}

      {/* Inspection Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-2xl w-full max-h-[90vh] flex flex-col font-mono animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ImageIcon size={16} className="text-slate-800" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Detail & Moderasi Strip Foto
                </h2>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Image Preview */}
              <div className="flex flex-col items-center justify-center bg-slate-100 p-3 border border-slate-200">
                <img
                  src={selectedPhoto.jpg_url}
                  alt={selectedPhoto.caption}
                  className="max-h-[380px] w-auto object-contain shadow-md"
                />
                {selectedPhoto.gif_url && (
                  <div className="mt-2 text-[9px] text-slate-500 flex items-center gap-1">
                    <span>Termasuk Loop Animasi GIF</span>
                  </div>
                )}
              </div>

              {/* Metadata Details */}
              <div className="flex flex-col justify-between space-y-4">
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                      Caption / Pesan
                    </span>
                    <div className="font-bold text-slate-900 text-sm mt-0.5">
                      {selectedPhoto.caption || "Tanpa Caption"}
                    </div>
                  </div>

                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                      Pemilik Akun
                    </span>
                    <div className="font-bold text-slate-800 mt-0.5">
                      {selectedPhoto.user_name || "Pengguna"}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {selectedPhoto.user_email}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="p-2 bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 block font-bold">Tema Strip:</span>
                      <span className="font-bold uppercase text-slate-800">
                        {selectedPhoto.theme}
                      </span>
                    </div>
                    <div className="p-2 bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 block font-bold">Total Frame:</span>
                      <span className="font-bold text-slate-800">
                        {selectedPhoto.frame_count} Frames
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                      Waktu Pembuatan
                    </span>
                    <div className="text-[10px] text-slate-600 mt-0.5">
                      {new Date(selectedPhoto.created_at).toLocaleString("id-ID")}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-slate-200 space-y-2">
                  <a
                    href={selectedPhoto.jpg_url}
                    download={`posean_${selectedPhoto.id}.jpg`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 px-3 border border-slate-800 bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Download size={13} />
                    <span>Download HD File</span>
                  </a>

                  <button
                    onClick={() => handleDelete(selectedPhoto)}
                    disabled={isDeleting}
                    className="w-full py-2 px-3 border border-red-600 bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]"
                  >
                    <Trash2 size={13} />
                    <span>Hapus Strip dari Sistem</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
