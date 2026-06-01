import Photobooth from "@/components/Photobooth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Posean — Pose Dulu Cerita Nanti",
  description: "Buat strip photobooth digital modern bertema playful, minimal, dan estetika youthful secara gratis, cepat, dan 100% client-side.",
  keywords: "posean, photobooth, digital photobooth, vertical strip, camera stream, gif loop converter, photobooth lucu, photobooth online",
};

export default function Home() {
  return (
    <div className="min-h-screen w-full flex flex-col bg-[#FCF8F2] selection:bg-[#EEDAA2] selection:text-[#4A3E3D]">
      <Photobooth />
    </div>
  );
}
