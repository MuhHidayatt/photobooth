import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  AdminStats,
  AdminUserItem,
  AdminPhotoboothItem,
  CmsFrameItem,
  CmsStickerItem,
} from "@/types/admin";

// Demo/Mock Data Seed for Instant Offline/Portfolio Experience
const DEMO_USERS: AdminUserItem[] = [
  {
    id: "usr-demo-1",
    email: "creator@posean.art",
    display_name: "Aura Studio",
    avatar_url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Aura",
    role: "admin",
    is_pro: true,
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    creations_count: 12,
  },
  {
    id: "usr-demo-2",
    email: "sarah.k@gmail.com",
    display_name: "Sarah Jenkins",
    avatar_url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Sarah",
    role: "user",
    is_pro: true,
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    creations_count: 7,
  },
  {
    id: "usr-demo-3",
    email: "dimas.pratama@univ.ac.id",
    display_name: "Dimas Pratama",
    avatar_url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Dimas",
    role: "user",
    is_pro: false,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    creations_count: 4,
  },
  {
    id: "usr-demo-4",
    email: "hannah_lee@yahoo.com",
    display_name: "Hannah Lee",
    avatar_url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Hannah",
    role: "user",
    is_pro: false,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    creations_count: 2,
  },
];

const DEMO_FRAMES: CmsFrameItem[] = [
  {
    id: "frm-1",
    name: "Classic 4-Cut Strip",
    type: "strip",
    frames: 4,
    aspect_ratio: "4/3",
    bg_color: "#FFFFFF",
    text_color: "#0F172A",
    is_pro: false,
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: "frm-2",
    name: "Midnight Neo 3-Cut",
    type: "strip",
    frames: 3,
    aspect_ratio: "4/3",
    bg_color: "#121212",
    text_color: "#F8FAFC",
    is_pro: false,
    is_active: true,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: "frm-3",
    name: "Polaroid 2x2 Grid",
    type: "grid",
    frames: 4,
    aspect_ratio: "1/1",
    bg_color: "#FEF08A",
    text_color: "#1C1917",
    is_pro: true,
    is_active: true,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: "frm-4",
    name: "Vintage Cherry Duotone",
    type: "strip",
    frames: 4,
    aspect_ratio: "4/3",
    bg_color: "#FFE4E6",
    text_color: "#881337",
    is_pro: true,
    is_active: true,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

const DEMO_STICKERS: CmsStickerItem[] = [
  {
    id: "stk-1",
    name: "Glitter Sparkles",
    category: "Aesthetic",
    is_pro: false,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "stk-2",
    name: "Doodle Love Heart",
    category: "Doodles",
    is_pro: false,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "stk-3",
    name: "Y2K Cyber Star",
    category: "Aesthetic",
    is_pro: true,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "stk-4",
    name: "Chic Ribbon",
    category: "Icons",
    is_pro: true,
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

// Helper to get local creations across all users in localStorage
function getAllLocalCreations(): AdminPhotoboothItem[] {
  if (typeof window === "undefined") return [];
  const list: AdminPhotoboothItem[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("posean_creations_")) {
        const userId = key.replace("posean_creations_", "");
        const raw = localStorage.getItem(key);
        if (raw) {
          const items = JSON.parse(raw);
          items.forEach((item: any) => {
            list.push({
              id: item.id,
              user_id: userId,
              user_email: `${userId.slice(0, 8)}@demo.local`,
              user_name: `User ${userId.slice(0, 6)}`,
              user_avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${userId}`,
              theme: item.theme || "minimalist",
              caption: item.caption || "BEST MOMENTS",
              frame_count: item.frame_count || 4,
              jpg_url: item.jpg_url || "",
              gif_url: item.gif_url || "",
              is_favorite: !!item.is_favorite,
              is_public: true,
              created_at: item.created_at || new Date().toISOString(),
            });
          });
        }
      }
    }
  } catch (err) {
    console.error("Error reading local creations for admin:", err);
  }
  return list;
}

// 1. Fetch Admin Statistics
export async function fetchAdminStats(): Promise<AdminStats> {
  if (!isSupabaseConfigured) {
    const localPhotos = getAllLocalCreations();
    const totalUsers = DEMO_USERS.length;
    const totalPhotos = localPhotos.length + 18; // include simulated count
    const totalGifs = localPhotos.filter((p) => !!p.gif_url).length + 14;

    // Last 7 days trend
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const trends = Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - idx));
      return {
        date: d.toISOString().split("T")[0],
        dayName: days[d.getDay()],
        count: Math.floor(Math.random() * 12) + 3,
      };
    });

    return {
      totalUsers,
      totalPhotobooths: totalPhotos,
      totalGifs,
      activeToday: 5,
      proUsersCount: 2,
      recentCreations: localPhotos.slice(0, 5),
      activityTrends: trends,
    };
  }

  try {
    const [{ count: userCount }, { count: boothCount }, { data: recent }] =
      await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("photobooths").select("*", { count: "exact", head: true }),
        supabase
          .from("photobooths")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

    const mappedRecent: AdminPhotoboothItem[] = (recent || []).map((b: any) => ({
      id: b.id,
      user_id: b.user_id,
      user_email: "User",
      user_name: "Photoboother",
      user_avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${b.user_id}`,
      theme: b.theme,
      caption: b.caption,
      frame_count: b.frame_count,
      jpg_url: b.jpg_url,
      gif_url: b.gif_url,
      is_favorite: b.is_favorite,
      is_public: b.is_public ?? true,
      created_at: b.created_at,
    }));

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const trends = Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - idx));
      return {
        date: d.toISOString().split("T")[0],
        dayName: days[d.getDay()],
        count: Math.floor(Math.random() * 10) + 2,
      };
    });

    return {
      totalUsers: userCount || 0,
      totalPhotobooths: boothCount || 0,
      totalGifs: Math.round((boothCount || 0) * 0.75),
      activeToday: Math.min(8, (userCount || 1)),
      proUsersCount: 1,
      recentCreations: mappedRecent,
      activityTrends: trends,
    };
  } catch (err) {
    console.error("Failed to fetch admin stats from supabase:", err);
    return fetchAdminStatsMock();
  }
}

function fetchAdminStatsMock(): AdminStats {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    totalUsers: 4,
    totalPhotobooths: 22,
    totalGifs: 16,
    activeToday: 3,
    proUsersCount: 2,
    recentCreations: [],
    activityTrends: Array.from({ length: 7 }).map((_, i) => ({
      date: new Date(Date.now() - (6 - i) * 86400000).toISOString().split("T")[0],
      dayName: days[(new Date().getDay() - 6 + i + 7) % 7],
      count: 4 + i * 2,
    })),
  };
}

// 2. Fetch Users List
export async function fetchAdminUsers(): Promise<AdminUserItem[]> {
  if (!isSupabaseConfigured) {
    const stored = localStorage.getItem("posean_admin_mock_users");
    if (stored) return JSON.parse(stored);
    localStorage.setItem("posean_admin_mock_users", JSON.stringify(DEMO_USERS));
    return DEMO_USERS;
  }

  try {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const { data: booths } = await supabase
      .from("photobooths")
      .select("user_id");

    const countsMap = new Map<string, number>();
    (booths || []).forEach((b: any) => {
      countsMap.set(b.user_id, (countsMap.get(b.user_id) || 0) + 1);
    });

    return (profiles || []).map((u: any) => ({
      id: u.id,
      email: u.email,
      display_name: u.display_name || u.email.split("@")[0],
      avatar_url: u.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${u.id}`,
      role: (u.role as "user" | "admin") || "user",
      is_pro: !!u.is_pro,
      created_at: u.created_at,
      creations_count: countsMap.get(u.id) || 0,
    }));
  } catch (err) {
    console.error("fetchAdminUsers failed, using mock:", err);
    return DEMO_USERS;
  }
}

// 3. Update User Role
export async function updateAdminUserRole(
  userId: string,
  role: "user" | "admin"
): Promise<void> {
  if (!isSupabaseConfigured) {
    const users = await fetchAdminUsers();
    const updated = users.map((u) => (u.id === userId ? { ...u, role } : u));
    localStorage.setItem("posean_admin_mock_users", JSON.stringify(updated));
    return;
  }

  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) throw error;
}

// 4. Update User Tier (Free <-> Pro)
export async function updateAdminUserTier(
  userId: string,
  is_pro: boolean
): Promise<void> {
  if (!isSupabaseConfigured) {
    const users = await fetchAdminUsers();
    const updated = users.map((u) => (u.id === userId ? { ...u, is_pro } : u));
    localStorage.setItem("posean_admin_mock_users", JSON.stringify(updated));
    return;
  }

  const { error } = await supabase.from("profiles").update({ is_pro }).eq("id", userId);
  if (error) throw error;
}

// 5. Fetch All Photobooths for Moderation
export async function fetchAdminPhotobooths(query?: string): Promise<AdminPhotoboothItem[]> {
  if (!isSupabaseConfigured) {
    let list = getAllLocalCreations();
    if (list.length === 0) {
      // Return a simulated collection for gallery moderation demonstration
      list = [
        {
          id: "demo-pb-1",
          user_id: "usr-demo-2",
          user_email: "sarah.k@gmail.com",
          user_name: "Sarah Jenkins",
          user_avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Sarah",
          theme: "rose",
          caption: "WEEKEND GETAWAY 2026",
          frame_count: 4,
          jpg_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
          gif_url: "",
          is_favorite: true,
          is_public: true,
          created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        },
        {
          id: "demo-pb-2",
          user_id: "usr-demo-3",
          user_name: "Dimas Pratama",
          user_email: "dimas.pratama@univ.ac.id",
          user_avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Dimas",
          theme: "midnight",
          caption: "CAMPUS MEMORIES",
          frame_count: 3,
          jpg_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80",
          gif_url: "",
          is_favorite: false,
          is_public: true,
          created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
        },
      ];
    }
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (i) =>
          i.caption.toLowerCase().includes(q) ||
          i.theme.toLowerCase().includes(q) ||
          (i.user_email && i.user_email.toLowerCase().includes(q))
      );
    }
    return list;
  }

  try {
    let req = supabase
      .from("photobooths")
      .select("*")
      .order("created_at", { ascending: false });

    if (query) {
      req = req.or(`caption.ilike.%${query}%,theme.ilike.%${query}%`);
    }

    const { data: booths, error } = await req;
    if (error) throw error;

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, display_name, avatar_url");

    const profileMap = new Map<string, any>();
    (profiles || []).forEach((p: any) => profileMap.set(p.id, p));

    return (booths || []).map((b: any) => {
      const owner = profileMap.get(b.user_id);
      return {
        id: b.id,
        user_id: b.user_id,
        user_email: owner?.email || "User",
        user_name: owner?.display_name || "Photoboother",
        user_avatar: owner?.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${b.user_id}`,
        theme: b.theme,
        caption: b.caption,
        frame_count: b.frame_count,
        jpg_url: b.jpg_url,
        gif_url: b.gif_url,
        is_favorite: b.is_favorite,
        is_public: b.is_public ?? true,
        created_at: b.created_at,
      };
    });
  } catch (err) {
    console.error("fetchAdminPhotobooths error:", err);
    return [];
  }
}

// 6. Delete Photobooth (Admin Moderation)
export async function deleteAdminPhotobooth(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    // Delete from all local creation stores
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("posean_creations_")) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const items = JSON.parse(raw);
          const filtered = items.filter((x: any) => x.id !== id);
          localStorage.setItem(key, JSON.stringify(filtered));
        }
      }
    }
    return;
  }

  const { error } = await supabase.from("photobooths").delete().eq("id", id);
  if (error) throw error;
}

// 7. CMS: Frames
export async function fetchCmsFrames(): Promise<CmsFrameItem[]> {
  let cmsList: CmsFrameItem[] = [];

  if (!isSupabaseConfigured) {
    const raw = localStorage.getItem("posean_cms_frames");
    cmsList = raw ? JSON.parse(raw) : DEMO_FRAMES;
  } else {
    try {
      const { data, error } = await supabase
        .from("cms_frames")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        cmsList = data;
      } else {
        cmsList = DEMO_FRAMES;
      }
    } catch {
      cmsList = DEMO_FRAMES;
    }
  }

  // Also include custom uploaded frames from community templates so admin can inspect & manage them
  try {
    const { fetchCommunityTemplates } = await import("./templateHelpers");
    const communityList = await fetchCommunityTemplates();
    const existingIds = new Set(cmsList.map((f) => f.id));

    communityList.forEach((tpl) => {
      if (!existingIds.has(tpl.id)) {
        cmsList.push({
          id: tpl.id,
          name: tpl.name,
          type: tpl.type,
          frames: tpl.frames,
          aspect_ratio: tpl.aspect_ratio,
          bg_color: tpl.bg_color,
          text_color: tpl.text_color,
          is_pro: false,
          is_active: true,
          image_url: tpl.image_url,
          frame_mode: tpl.frame_mode,
          creator_name: tpl.creator_name,
          created_at: tpl.created_at,
        });
      }
    });
  } catch (err) {
    // Non-blocking
  }

  return cmsList;
}

export async function saveCmsFrame(
  frame: Omit<CmsFrameItem, "id" | "created_at"> & { id?: string }
): Promise<CmsFrameItem> {
  if (!isSupabaseConfigured) {
    const current = await fetchCmsFrames();
    if (frame.id) {
      const updated = current.map((f) => (f.id === frame.id ? { ...f, ...frame } : f));
      localStorage.setItem("posean_cms_frames", JSON.stringify(updated));
      return updated.find((f) => f.id === frame.id)!;
    }
    const newFrame: CmsFrameItem = {
      ...frame,
      id: `frame_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    localStorage.setItem("posean_cms_frames", JSON.stringify([newFrame, ...current]));
    return newFrame;
  }

  try {
    if (frame.id) {
      const { data, error } = await supabase
        .from("cms_frames")
        .update(frame)
        .eq("id", frame.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const { data, error } = await supabase
      .from("cms_frames")
      .insert([frame])
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn("Supabase saveCmsFrame fallback to local cache:", err);
    const current = await fetchCmsFrames();
    const newFrame: CmsFrameItem = {
      ...frame,
      id: frame.id || `frame_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    localStorage.setItem("posean_cms_frames", JSON.stringify([newFrame, ...current]));
    return newFrame;
  }
}

export async function deleteCmsFrame(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const current = await fetchCmsFrames();
    const filtered = current.filter((f) => f.id !== id);
    localStorage.setItem("posean_cms_frames", JSON.stringify(filtered));
  } else {
    try {
      const { error } = await supabase.from("cms_frames").delete().eq("id", id);
      if (error) throw error;
    } catch {
      const current = await fetchCmsFrames();
      const filtered = current.filter((f) => f.id !== id);
      localStorage.setItem("posean_cms_frames", JSON.stringify(filtered));
    }
  }

  // Also remove from community frame templates if it was from there
  try {
    const { deleteCommunityTemplate } = await import("./templateHelpers");
    await deleteCommunityTemplate(id);
  } catch (err) {
    // Non-blocking
  }
}

// 8. CMS: Stickers
export async function fetchCmsStickers(): Promise<CmsStickerItem[]> {
  if (!isSupabaseConfigured) {
    const raw = localStorage.getItem("posean_cms_stickers");
    if (raw) return JSON.parse(raw);
    localStorage.setItem("posean_cms_stickers", JSON.stringify(DEMO_STICKERS));
    return DEMO_STICKERS;
  }

  try {
    const { data, error } = await supabase
      .from("cms_stickers")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    if (!data || data.length === 0) return DEMO_STICKERS;
    return data;
  } catch {
    return DEMO_STICKERS;
  }
}

export async function saveCmsSticker(
  sticker: Omit<CmsStickerItem, "id" | "created_at"> & { id?: string }
): Promise<CmsStickerItem> {
  if (!isSupabaseConfigured) {
    const current = await fetchCmsStickers();
    if (sticker.id) {
      const updated = current.map((s) => (s.id === sticker.id ? { ...s, ...sticker } : s));
      localStorage.setItem("posean_cms_stickers", JSON.stringify(updated));
      return updated.find((s) => s.id === sticker.id)!;
    }
    const newSticker: CmsStickerItem = {
      ...sticker,
      id: `stk_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    localStorage.setItem("posean_cms_stickers", JSON.stringify([newSticker, ...current]));
    return newSticker;
  }

  try {
    if (sticker.id) {
      const { data, error } = await supabase
        .from("cms_stickers")
        .update(sticker)
        .eq("id", sticker.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const { data, error } = await supabase
      .from("cms_stickers")
      .insert([sticker])
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn("Supabase saveCmsSticker fallback to local cache:", err);
    const current = await fetchCmsStickers();
    const newSticker: CmsStickerItem = {
      ...sticker,
      id: sticker.id || `stk_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    localStorage.setItem("posean_cms_stickers", JSON.stringify([newSticker, ...current]));
    return newSticker;
  }
}

export async function deleteCmsSticker(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const current = await fetchCmsStickers();
    const filtered = current.filter((s) => s.id !== id);
    localStorage.setItem("posean_cms_stickers", JSON.stringify(filtered));
    return;
  }
  const { error } = await supabase.from("cms_stickers").delete().eq("id", id);
  if (error) throw error;
}
