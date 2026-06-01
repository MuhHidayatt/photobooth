import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Posean — Photobooth Online",
  description: "Pose Dulu, Cerita Nanti. Strip photobooth retro-modern bertema playful dan minimal.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Posean",
  },
  icons: {
    icon: "/logo.png",
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
        {children}
      </body>
    </html>
  );
}
