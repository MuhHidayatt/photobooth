import { ActiveSticker } from "@/store/usePhotoboothStore";

export interface CustomSlot {
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  width: number; // percentage (0 - 100)
  height: number; // percentage (0 - 100)
  borderRadius?: number; // corner radius in px
}

export interface CommunityFrameTemplate {
  id: string;
  user_id?: string;
  creator_name: string;
  creator_avatar: string;
  name: string;
  description?: string;
  type: "strip" | "grid";
  frames: number; // 2, 3, 4
  aspect_ratio: string; // e.g. "4/3"
  bg_color: string;
  text_color: string;
  caption?: string;
  default_filter?: string;
  stickers: ActiveSticker[];
  image_url?: string; // Optional uploaded custom frame image (Canva/Photoshop PNG overlay or background)
  frame_mode?: "overlay" | "background"; // "overlay" covers photos with transparent cutouts, "background" sits behind photos
  custom_slots?: CustomSlot[]; // Auto-detected or calibrated photo slot positions for Canva frames
  frame_aspect_ratio?: number; // Overall image natural aspect ratio (width / height)
  is_public: boolean;
  uses_count: number;
  created_at: string;
}

