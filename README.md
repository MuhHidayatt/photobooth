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

## 🔒 Privasi Pengguna (Client-Side & Secure)

Semua proses pengolahan media—mulai dari pengambilan jepretan kamera, rotasi/drag stiker, perangkaian canvas JPG resolusi tinggi, hingga pembuatan slideshow GIF anti-mirror—**dilakukan 100% di browser pengguna secara lokal (client-side)**. Tidak ada data foto yang diunggah ke server eksternal, menjamin privasi penuh bagi para pengguna Posean.

---

✨ *Dibuat dengan penuh cinta untuk mengabadikan momen-momen terbaikmu. Yuk, foto-foto dulu!* ✨
