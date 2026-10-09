# 📸 POSEAN — Premium Online Photobooth

> **"Pose Dulu, Cerita Nanti."**
> Aplikasi photobooth online premium bertema playful, minimal, dan retro-modern yang dirancang untuk menghasilkan strip foto berkualitas HD ala Life4Cuts / Photoism langsung dari browser Anda.

---

## ✨ Fitur Unggulan (Key Features)

### 1. Tata Letak Responsif Desktop & Mobile (Responsive Optimization)
*   **Desktop Experience (1024px+):** Layout dua kolom workspace premium (40% panel pengaturan & kustomisasi, 60% pratinjau strip foto interaktif penuh tanpa scrolling berlebih).
*   **Mobile & Tablet View:** Tampilan ringkas, ramah sentuhan, dan navigasi bottom bar yang fluid.

### 2. Sistem Animasi GIF Murni (Pure Slideshow GIF Engine)
*   **Slideshow Format:** Menghasilkan ekspor GIF murni yang berputar melingkar (looping) hanya dari foto mentah hasil jepretan Anda, **tanpa border, watermark, branding, ataupun stiker/doodle**.
*   **Unmirrored Output (Tidak Mirror):** Dilengkapi dengan konversi canvas otomatis (`flipImageHorizontally`) untuk menjamin semua teks dan pose di dalam hasil unduhan GIF **terbaca normal (tidak terbalik / mirror)**.
*   **Original Aspect Ratio:** Dimensi file GIF secara dinamis membaca ukuran asli resolusi kamera Anda (tanpa pemotongan/cropping atau distorsi gambar).
*   **Speed Selector:** Pilihan kecepatan putar GIF instan:
    *   **Slow:** Interval 0.3s (300ms)
    *   **Normal:** Interval 0.2s (200ms)
    *   **Fast:** Interval 0.1s (100ms)

### 3. Kustomisasi Strip Foto Lengkap (Rich Customization Panel)
*   **Themes & Borders:** Beragam pilihan warna latar belakang retro-minimalis dengan border kontras tinggi.
*   **Interactive Stickers & Doodles:** Stiker lucu yang dapat digeser (drag), diputar (rotate), diperbesar/perkecil (resize), dan dihapus secara interaktif langsung di atas strip foto.
*   **Custom Captions:** Tambahkan teks penutup kustom di bagian bawah strip lengkap dengan penanggalan otomatis.

### 4. WYSIWYG Export Page
*   **Format Selector:** Pilih format unduhan dengan pratinjau instan yang akurat:
    *   **PHOTO STRIP:** Menampilkan strip foto lengkap beresolusi tinggi (format JPG).
    *   **ANIMATED GIF:** Menampilkan slideshow animasi murni dari jepretan Anda (format GIF).
*   **Zero Compression:** Proses ekspor berkualitas tinggi untuk cetakan fisik maupun konsumsi media sosial.

---

## 🛠️ Teknologi & Pustaka (Tech Stack)

*   **Framework:** [Next.js 15+](https://nextjs.org/) (dengan App Router & struktur modular)
*   **Library UI & Animasi:** React, Tailwind CSS (untuk utilities dasar), [Framer Motion](https://www.framer.com/motion/) (untuk transisi antar halaman dan interaksi stiker)
*   **State Management:** [Zustand](https://github.com/pmndrs/zustand) (mengelola alur jepretan kamera secara global)
*   **Media Processing:** 
    *   [html-to-image](https://github.com/bubkoo/html-to-image) (untuk render strip JPG resolusi 5x piksel rasio super tajam)
    *   [gifshot](https://github.com/yahoo/gifshot) (engine client-side untuk merangkai slideshow GIF cepat)
*   **Audio FX:** Integrasi efek suara countdown *tick-tick* dan jepretan kamera mekanis (*shutter sound*).

---

## 📂 Struktur Folder Proyek (Folder Directory)

```bash
├── public/                 # Aset gambar statis, favicon, & PWA manifest
│   ├── logo.png            # Logo utama POSEAN (kuning playful)
│   └── logo-depan.png      # Logo landing page beresolusi tinggi
├── src/
│   ├── app/
│   │   ├── globals.css     # Gaya CSS kustom & reset global
│   │   ├── layout.tsx      # Kerangka layout metadata & ikon tab
│   │   └── page.tsx        # Titik masuk utama aplikasi (Entrypoint)
│   ├── components/
│   │   ├── Photobooth.tsx  # Mesin utama alur kamera, editor, & ekspor
│   │   └── StickerAssets.tsx # Katalog stiker, dekorasi, & ilustrasi lucu
│   ├── store/
│   │   └── usePhotoboothStore.ts # Penyimpanan state global jepretan foto
│   └── utils/
│       └── audio.ts        # Utilitas pemutar efek suara terintegrasi
├── tsconfig.json           # Konfigurasi TypeScript ketat
└── package.json            # Daftar dependensi pustaka & skrip proyek
```

---

## 🚀 Memulai Pengembangan Lokal (Getting Started)

1.  **Clone repositori ini:**
    ```bash
    git clone https://github.com/MuhHidayatt/photobooth.git
    cd photobooth
    ```

2.  **Instalasi dependensi proyek:**
    ```bash
    npm install
    ```

3.  **Jalankan server pengembangan lokal:**
    ```bash
    npm run dev
    ```
    Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

4.  **Verifikasi & Pembuatan Build Produksi:**
    ```bash
    npm run build
    ```

---

## 🚀 Panduan Deployment ke Vercel & Supabase (Production Go-Live)

### Langkah 1: Push ke GitHub Repository
```bash
git add .
git commit -m "feat: complete photobooth features with 8 official frames, dynamic showcase, and export"
git push origin main
```

### Langkah 2: Deploy ke Vercel
1. Masuk ke [Vercel Dashboard](https://vercel.com/) dan klik **"Add New Project"**.
2. Hubungkan repository GitHub `MuhHidayatt/photobooth`.
3. Pada bagian **Environment Variables**, tambahkan:
   - `NEXT_PUBLIC_SUPABASE_URL`: URL project Supabase Anda (misal `https://your-id.supabase.co`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anon / public API key Supabase Anda
   - `NEXT_PUBLIC_SITE_URL`: Domain Vercel Anda (misal `https://posean.vercel.app`)
4. Klik **Deploy**. Build Next.js 16 (Turbopack) akan otomatis selesai dalam hitungan detik.

### Langkah 3: Konfigurasi Supabase Authentication & Storage
1. Buka **Supabase Dashboard** > **Authentication** > **URL Configuration**.
2. Atur **Site URL** ke domain Vercel Anda: `https://posean.vercel.app`.
3. Tambahkan ke **Redirect URLs**:
   - `https://posean.vercel.app/**`
   - `https://posean.vercel.app/auth/callback`
   - `http://localhost:3000/**` (untuk pengujian lokal)
4. Pastikan storage bucket `photobooth-creations` dan `community-frames` berstatus **Public** agar hasil foto dan frame dapat diakses oleh browser pengguna.

---

## 🔒 Privasi Pengguna (Client-Side & Secure)

---

## 🎨 8 Tema Frame Resmi Posean (Themed Frame Presets)

Posean menyediakan 8 tema frame bawaan portrait beresolusi tinggi dengan transparansi alpha murni (`alpha = 0` pada lubang foto dan sudut luar, `alpha = 255` pada border dan dekorasi):

| No | Tema Frame | Grid | Total Foto | Deskripsi Visual & Gaya |
|---|---|---|---|---|
| 1 | **Birthday** | 2 kolom × 3 baris | 6 foto | Pastel pink/cream/peach, balon, bunting, lilin/kue, header "Happy Birthday" |
| 2 | **Nailong** | 1 kolom × 4 baris | 4 foto | Ceria kuning/cream/oranye, maskot dinosaurus kuning lucu orisinal |
| 3 | **Hello Kitty** | 1 kolom × 4 baris | 4 foto | Kawaii feminin pink/putih, pita, hati, bunga kecil, "Pretty in Pink" |
| 4 | **Mickey Mouse** | 1 kolom × 4 baris | 4 foto | Kartun klasik merah/hitam/kuning, sarung tangan putih, bintang, "FUN TIME!" |
| 5 | **Band Perunggu** | 1 kolom × 3 baris | 3 foto | Editorial indie alternatif Indonesia, tekstur kertas, grain film, notasi musik |
| 6 | **Formula 1** | 1 kolom × 3 baris | 3 foto | Motorsport dinamis merah/hitam, motif bendera catur balap, "RACE DAY" |
| 7 | **Vintage** | 2 kolom × 4 baris | 8 foto | Retro analog 35mm film perforasi, beige/cokelat, grain hangat, 8 foto konsisten |
| 8 | **Flowers** | 1 kolom × 3 baris | 3 foto | Floral aesthetic lembut, sage/cream/pink pastel/lavender, bunga & daun organik |

### 🧪 Verifikasi & Regenerasi Frame
*   **Verifikasi otomatis integritas alpha, grid, dan border:**
    ```bash
    npm run frames:verify
    ```
*   **Regenerasi aset PNG (`public/frames/*.png`) dan konfigurasi TypeScript (`src/data/framePresets.ts`):**
    ```bash
    npm run frames:generate
    ```

---

## ➕ Panduan Menambah Tema Frame Baru di Masa Depan

Untuk menambahkan tema frame baru ke Posean:

1. **Buka file generator:** [`scripts/generate-frames.mjs`](file:///d:/KULIAH/PROJECT/photobooth/scripts/generate-frames.mjs)
2. **Tambahkan konfigurasi tema ke array `THEMES`:**
   ```javascript
   THEMES.push({
     id: "nama-tema",
     file: "nama-tema.png",
     name: "Nama Tema",
     description: "Deskripsi singkat tema",
     bg_color: "#WARNA_BG",
     text_color: "#WARNA_TEKS",
     badge: "Badge",
     layout: layout({
       W: 900,         // lebar kanvas px (900 untuk strip, 1200 untuk grid)
       cols: 1,        // jumlah kolom foto
       rows: 4,        // jumlah baris foto
       M: 60,          // margin samping (px)
       G: 30,          // gap antar slot foto (px)
       Ht: 210,        // tinggi header (px)
       Hb: 210,        // tinggi footer (px)
       aspect: 4 / 3,  // rasio aspek tiap foto (lebar/tinggi)
     }),
     radius: 44,       // radius lengkungan sudut luar frame
     holeR: 20,        // radius lengkungan sudut lubang foto
     draw(L) {
       let s = `<rect width="${L.W}" height="${L.H}" fill="#WARNA_BG"/>`;
       // Tambahkan teks header/footer, ornamen, border, dll.
       s += holeOutline(L, 20, "#BORDER_LUBANG", 10);
       s += border(L, 44, "#BORDER_LUAR", 22);
       return s;
     },
   });
   ```
3. **Jalankan regenerasi:**
   ```bash
   npm run frames:generate
   ```
   Aset PNG transparan akan otomatis dihasilkan ke `public/frames/nama-tema.png` dan konfigurasi tersinkronisasi ke [`src/data/framePresets.ts`](file:///d:/KULIAH/PROJECT/photobooth/src/data/framePresets.ts).
4. **Verifikasi kepatuhan:**
   ```bash
   npm run frames:verify
   ```
5. Frame baru akan langsung muncul otomatis di tab **"Tema Frame"** pada halaman photobooth Posean tanpa perlu konfigurasi tambahan!

---

✨ *Dibuat dengan penuh cinta untuk mengabadikan momen-momen terbaikmu. Yuk, foto-foto dulu!* ✨

