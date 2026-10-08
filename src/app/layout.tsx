import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://posean.vercel.app"),
  title: "Posean — Photobooth Online Retro-Modern",
  description: "Pose Dulu, Cerita Nanti. Strip photobooth retro-modern bertema playful, minimal, dan estetik langsung dari browser Anda.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Posean",
  },
  icons: {
    icon: "/logo.png",
  },
  openGraph: {
    title: "Posean — Photobooth Online Retro-Modern",
    description: "Ambil foto strip retro, animasi loop GIF, dan bagikan momen seru bersama teman langsung dari browser.",
    siteName: "Posean Photobooth",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Posean Photobooth",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Posean — Photobooth Online Retro-Modern",
    description: "Pose Dulu, Cerita Nanti. Strip photobooth retro-modern bertema playful dan minimal.",
    images: ["/logo.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#F6A04D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FCF8F2] text-slate-800 selection:bg-[#FFE66D] selection:text-slate-800">
        <div className="flex-1 w-full max-w-[1400px] mx-auto flex flex-col bg-[#F9F9F9] relative min-h-screen border-x border-slate-200/60 shadow-2xl font-sans">
          <Header />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
