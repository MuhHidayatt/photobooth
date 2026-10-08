export interface AdminStats {
  totalUsers: number;
  totalPhotobooths: number;
  totalGifs: number;
  activeToday: number;
  proUsersCount: number;
  recentCreations: AdminPhotoboothItem[];
  activityTrends: { date: string; count: number; dayName: string }[];
}

export interface AdminUserItem {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string;
  role: "user" | "admin";
  is_pro: boolean;
  created_at: string;
  creations_count: number;
}

export interface AdminPhotoboothItem {
  id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  user_avatar?: string;
  theme: string;
  caption: string;
  frame_count: number;
  jpg_url: string;
  gif_url?: string;
  is_favorite: boolean;
  is_public: boolean;
  created_at: string;
}

export interface CmsFrameItem {
  id: string;
  name: string;
  type: "strip" | "grid";
  frames: number;
  aspect_ratio: string;
  bg_color: string;
  text_color: string;
  is_pro: boolean;
  is_active: boolean;
  preview_url?: string;
  created_at: string;
}

export interface CmsStickerItem {
  id: string;
  name: string;
  category: "Doodles" | "Icons" | "Aesthetic" | "Words";
  svg_content?: string;
  image_url?: string;
  is_pro: boolean;
  is_active: boolean;
  created_at: string;
}
