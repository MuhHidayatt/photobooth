# 📸 POSEAN — Premium Online Photobooth

> **"Pose Dulu, Cerita Nanti."**  
> Aplikasi photobooth online modern bertema playful, neo-brutalist retro yang dirancang untuk menghasilkan strip foto berkualitas studio (ala Life4Cuts / Photoism Korea) langsung dari browser tanpa instalasi aplikasi.

![Next.js 16](https://img.shields.io/badge/Next.js-16.2.6-black?style=flat-square&logo=next.js)
![React 19](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-emerald?style=flat-square&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-Responsive-38bdf8?style=flat-square&logo=tailwind-css)

---

## ✨ Fitur Unggulan (Core Features)

### 1. 🎨 8 Tema Frame Resmi & Desain Grafis Transparan
Posean dilengkapi dengan 8 preset frame portrait resmi yang siap pakai dengan cutout transparan berkualitas tinggi (alpha channel murni):
* **Birthday Celebration** (2x3 = 6 foto) — Nuansa pastel party, balon, lilin, dan kue ulang tahun.
* **Nailong Dino** (1x4 = 4 foto) — Maskot dinosaurus kuning ceria dan menggemaskan.
* **Hello Kitty Kawaii** (1x4 = 4 foto) — Nuansa pink feminin, pita manis, dan ornamen hati.
* **Mickey Mouse Classic** (1x4 = 4 foto) — Gaya kartun retro merah, kuning, dan hitam.
* **Band Perunggu** (1x3 = 3 foto) — Estetika indie alternative Indonesia dengan tekstur kertas vintage.
* **Formula 1 Grand Prix** (1x3 = 3 foto) — Nuansa balap motorsport dinamis dengan bendera catur.
* **Vintage 35mm Film** (2x4 = 8 foto) — Klise rol film analog 35mm klasik bertekstur grain hangat.
* **Flowers Garden** (1x3 = 3 foto) — Estetika floral botani lembut dengan daun dan bunga mekar.

### 2. ✂️ Dukungan Frame Kustom Canva / Photoshop (Auto-Slot Detection)
* Pengguna dapat mengunggah desain frame mereka sendiri langsung dari Canva atau Photoshop (PNG transparan).
* Algoritma cerdas otomatis mendeteksi koordinat lubang foto (*auto-crop/trim* & kalibrasi slot) sehingga foto hasil jepretan langsung terpasang pas tanpa terpotong berantakan.

### 3. ⏰ Polaroid & Y2K Vintage Digital Date Stamp
* Cetakan tanggal dan jam retro otomatis ala kamera saku digital 90s/2000s (*Sony Cyber-shot, Olympus, Casio Exilim*) dan kamera instan Polaroid.
* **3 Format Tanggal:** `'26 10 10` (YY MM DD), `10.10.2026` (DD.MM.YYYY), atau `OCT 10 '26` (MMM DD 'YY).
* **5 Pilihan Warna LED Glow:** Amber 90s (`#FF9500`), Vintage Yellow (`#FFE66D`), Neon Green (`#39FF14`), Cyber Red (`#FF3B30`), dan Clean White (`#FFFFFF`).
* **Fleksibilitas Posisi:** Dapat ditempatkan di sudut kanan bawah setiap foto atau di footer strip foto.
* **Toggle Jam Menit:** Menampilkan waktu real-time jepretan foto.

### 4. 🎛️ Studio Editor & Filter Analog Lengkap
* **8 Filter Film Analog:** Natural, Mono Noir (Life4Cuts Korea), Kodak Warm 35mm, Soft Pastel, Retro 90s, Summer Pop, Muted Olive (Sage), dan Cyber Chill (Y2K).
* **Doodles & Stiker Interaktif:** Tambahkan stiker lucu dengan kontrol rotasi, skala, pergeseran posisi (drag & drop), dan tombol acak stiker otomatis.
* **Single Retake:** Jepret ulang foto pada frame tertentu tanpa harus mengulang pemotretan dari awal.
* **Kustom Caption & Watermark:** Tambahkan pesan kenangan dan atur logo identitas strip foto.

### 5. 📦 Ekspor Multi-Format HD (WYSIWYG)
* **PNG Transparan (Alpha HD):** Ekspor PNG beresolusi 4x dengan latar belakang transparan murni, siap cetak fisik atau dijadikan stiker.
* **High-Res JPG (4x Ultra HD):** Strip foto tajam siap cetak ukuran strip photobooth standar.
* **Boomerang Loop GIF:** Animasi slideshow bergerak murni dari jepretan foto kamera dengan opsi kecepatan (*Slow, Normal, Fast*).
* **Video MP4 9:16:** Video vertikal dinamis siap unggah ke Instagram Reels, TikTok, atau WhatsApp Story.

### 6. 📱 Scan QR Instant Transfer ke HP & Web Share
* Pengguna dapat memindai QR code di layar untuk langsung mengunduh hasil foto ke smartphone mereka melalui rute `/download`.
* Integrasi **Web Share API** untuk membagikan hasil foto langsung ke WhatsApp, Twitter/X, atau media sosial lain.

### 7. ☁️ Akun Pengguna, Galeri Pribadi, & Komunitas
* **Autentikasi Aman:** Login menggunakan Google OAuth atau Email Magic Link via Supabase.
* **Galeri Pribadi (`/my-photobooths`):** Semua kenangan yang disimpan tersimpan rapi di cloud storage.
* **Koleksi Favorit (`/favorites`):** Tandai strip foto terbaik dengan tanda love.
* **Etalase Frame Komunitas (`/frames`):** Jelajahi, cari, dan gunakan kreasi frame yang dibagikan oleh komunitas.

### 8. 🛡️ Administrator Control Center & CMS Studio (`/admin`)
* **Overview:** Monitor statistik pengguna, total strip tersimpan, dan volume ekspor GIF/video.
* **CMS Studio:** Buat dan kelola frame resmi, atur status publikasi, dan konfigurasi stiker dinamis.
* **Moderasi Galeri:** Monitor konten publik untuk menjaga kepatuhan komunitas.
* **Proteksi Akses:** Role-based authorization khusus untuk akun admin.

### 9. 🎵 Background Music (BGM) Player & Audio FX
* Pemutar musik pengiring sesi photobooth dengan beragam trek instrumen santai (Lofi, Jazz, Retro Pop).
* Efek suara interaktif: countdown *tick-tick*, suara mekanis *shutter*, dan tombol pop.

---

## 🛠️ Teknologi & Pustaka (Tech Stack)

| Lapisan | Teknologi | Kegunaan |
|---|---|---|
| **Frontend Framework** | [Next.js 16 (App Router)](https://nextjs.org/) + Turbopack | Server & Client Components, prerendering rute statis super cepat |
| **Bahasa** | [TypeScript](https://www.typescriptlang.org/) | Type-safety ketat di seluruh komponen, store, dan utilitas |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | Utilitas desain responsif neo-brutalisme |
| **Animasi & Interaksi** | [Framer Motion](https://www.framer.com/motion/) | Transisi mulus antar step, modal pop-up, dan draggable stickers |
| **State Management** | [Zustand](https://github.com/pmndrs/zustand) + LocalStorage Sync | Pengelolaan state alur kamera, editor, filter, dan audio secara global |
| **Media Rendering** | [html-to-image](https://github.com/bubkoo/html-to-image) | Rendering canvas strip foto HD ke JPEG & PNG transparan |
| **Animasi GIF** | [gifshot](https://github.com/yahoo/gifshot) | Kompilasi frame kamera menjadi animasi loop GIF di sisi klien |
| **Backend & Cloud** | [Supabase](https://supabase.com/) | PostgreSQL, Auth (Google & Email), dan Storage Bucket |

---

## 📂 Struktur Direktori Proyek

```bash
photobooth/
├── public/
│   ├── frames/                 # 8 file PNG frame resmi (transparan cutout)
│   ├── logo.png                # Aset branding Posean
│   └── audio/                  # Aset audio BGM & efek suara shutter
├── scripts/
│   ├── generate-frames.mjs     # Skrip generator SVG-to-PNG 8 frame resmi
│   ├── seed-frames-db.mjs      # Skrip seed frame resmi ke database Supabase
│   └── verify-frames.mjs       # Skrip QA audit alpha channel & dimensi frame
├── src/
│   ├── app/
│   │   ├── admin/              # Panel dashboard admin & CMS studio
│   │   ├── download/           # Halaman download instan via mobile QR scan
│   │   ├── favorites/          # Halaman koleksi foto favorit pengguna
│   │   ├── frames/             # Etalase katalog frame komunitas & resmi
│   │   ├── login/              # Halaman autentikasi login & sign-up
│   │   ├── my-photobooths/     # Galeri pribadi foto pengguna
│   │   ├── profile/            # Pengaturan profil pengguna
│   │   ├── globals.css         # Reset CSS global & styling neo-brutalist
│   │   ├── layout.tsx          # Root layout & penyedia metadata SEO
│   │   └── page.tsx            # Entrypoint utama alur photobooth
│   ├── components/
│   │   ├── photobooth/         # Komponen alur inti photobooth:
│   │   │   ├── LayoutStep.tsx  # Pemilihan layout grid & preset tema
│   │   │   ├── CameraStep.tsx  # Kontrol kamera, hitung mundur, & jepretan
│   │   │   ├── EditorStep.tsx  # Studio edit filter, stiker, teks, & date stamp
│   │   │   └── ExportStep.tsx  # Halaman unduh HD JPG, PNG, GIF, MP4, & share
│   │   ├── templates/          # Komponen kartu frame & modal buat template
│   │   ├── AuthModal.tsx       # Modal login cepat Google/Email
│   │   ├── Header.tsx          # Navigasi atas, kontrol audio, & profile avatar
│   │   ├── Footer.tsx          # Informasi hak cipta & branding bawah
│   │   └── SaveMemoriesModal.tsx # Modal simpan kenangan ke galeri cloud
│   ├── data/
│   │   └── framePresets.ts     # Konfigurasi data TypeScript 8 frame resmi
│   ├── store/
│   │   ├── useAuthStore.ts     # State management sesi akun & profil Supabase
│   │   └── usePhotoboothStore.ts # State management photobooth, foto, & editor
│   └── utils/
│       ├── audio.ts            # Web Audio API engine & pemutar efek suara
│       ├── frameDetector.ts    # Pendeteksi lubang slot otomatis frame Canva/PNG
│       ├── photoboothHelpers.ts # Utilitas pemrosesan foto, doodle, & date stamp
│       ├── supabaseHelpers.ts  # Kueri database & pengunggah storage Supabase
│       └── videoExporter.ts    # Engine perekam video MP4 vertikal 9:16
├── supabase_schema.sql         # Skema tabel database, RLS security, & trigger
├── .env.example                # Panduan konfigurasi environment variable
├── package.json
└── tsconfig.json
```

---

## 🚀 Panduan Memulai Lokal (Getting Started)

### 1. Kloning Repository
```bash
git clone https://github.com/MuhHidayatt/photobooth.git
cd photobooth
```

### 2. Pasang Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment Variables
Salin file `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```
Buka `.env.local` dan lengkapi kredensial Supabase Anda:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Setup Database Supabase
1. Buka **Supabase Dashboard** > **SQL Editor**.
2. Jalankan isi file [`supabase_schema.sql`](file:///d:/KULIAH/PROJECT/photobooth/supabase_schema.sql) untuk membuat tabel `profiles`, `photobooths`, `frame_templates`, dan aturan keamanan RLS (*Row Level Security*).
3. Buat dua Storage Bucket di Supabase berstatus **Public**:
   - `photobooth-creations`
   - `community-frames`

### 5. Masukkan 8 Frame Resmi ke Database (Seeding)
Jalankan skrip seed otomatis agar 8 frame resmi muncul di etalase database:
```bash
npm run frames:seed
```

### 6. Jalankan Server Pengembangan
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## 🧪 Skrip Pengujian & Verifikasi Kualitas

Posean dilengkapi skrip otomatis untuk memastikan stabilitas dan kualitas:

* **Pemeriksaan Tipe TypeScript:**
  ```bash
  npx tsc --noEmit
  ```
* **Audit Integritas Frame PNG (Alpha, Dimensi, & Slot):**
  ```bash
  npm run frames:verify
  ```
* **Regenerasi Aset Frame PNG Resmi:**
  ```bash
  npm run frames:generate
  ```
* **Uji Build Produksi Next.js:**
  ```bash
  npm run build
  ```

---

## 🌐 Panduan Deployment ke Vercel (Production Go-Live)

1. **Hubungkan Repository ke Vercel:**
   * Buka [Vercel Dashboard](https://vercel.com/) > Klik **"Add New Project"**.
   * Pilih repository GitHub `MuhHidayatt/photobooth` dan klik **"Import"**.
2. **Atur Environment Variables di Vercel:**
   * `NEXT_PUBLIC_SUPABASE_URL` = URL project Supabase Anda.
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Anon / public key Supabase Anda.
   * `NEXT_PUBLIC_SITE_URL` = Domain Vercel Anda (misal `https://posean.vercel.app`).
3. **Klik "Deploy":** Next.js 16 dengan Turbopack akan mengompilasi dan aplikasi langsung aktif.
4. **Perbarui Redirect URL di Supabase:**
   * Buka **Supabase Dashboard** > **Authentication** > **URL Configuration**.
   * Masukkan domain live Vercel Anda ke **Site URL** dan **Redirect URLs** (`https://posean.vercel.app/**`).

---

## 🔒 Privasi Pengguna & Keamanan Data (Client-Side Privacy)

* **Pemrosesan Di Sisi Klien:** Pengambilan foto, penerapan filter, pemotongan rasio aspek 4:3, dan pembuatan animasi GIF seluruhnya diproses langsung di browser pengguna menggunakan HTML5 Canvas API.
* **Tanpa Penyimpanan Diam-Diam:** Kamera dan foto pengguna tidak pernah diunggah ke server tanpa izin atau tindakan eksplisit dari pengguna (misal: saat pengguna menekan tombol *"Simpan ke Galeri"*).
* **Pembersihan Resource Otomatis:** Aliran stream kamera perangkat keras (*webcam track*) otomatis ditutup segera setelah sesi selesai atau halaman berganti, menjamin lampu indikator kamera laptop/HP mati secara semestinya.

---

## 📜 Lisensi & Hak Cipta

Proyek ini dikembangkan secara independen untuk keperluan proyek photobooth kreatif modern.  
© 2026 **Posean** — *Good Moments. Pose Dulu, Cerita Nanti.*
