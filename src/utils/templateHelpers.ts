import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { CommunityFrameTemplate } from "@/types/template";
import { ActiveSticker } from "@/store/usePhotoboothStore";

const STORAGE_KEY = "posean_community_templates";

// Default starter templates for immediate rich experience
export const STARTER_TEMPLATES: CommunityFrameTemplate[] = [
  {
    id: "tpl-starter-1",
    creator_name: "Aura Studio",
    creator_avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Aura",
    name: "Y2K Pastel Heart",
    description: "Frame pastel aesthetic nuansa dreamy dengan aksen hati dan bintang retro.",
    type: "strip",
    frames: 4,
    aspect_ratio: "4/3",
    bg_color: "#FFE4E6",
    text_color: "#881337",
    caption: "SWEET HEARTS ♡",
    default_filter: "pastel",
    stickers: [
      { id: "st-1", type: "heart", x: 18, y: 15, scale: 1.1, rotation: -12 },
      { id: "st-2", type: "sparkles", x: 82, y: 45, scale: 0.9, rotation: 15 },
      { id: "st-3", type: "star", x: 80, y: 78, scale: 1, rotation: 8 },
    ],
    is_public: true,
    uses_count: 142,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: "tpl-starter-2",
    creator_name: "Sarah Jenkins",
    creator_avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Sarah",
    name: "Midnight Neo Noir",
    description: "Nuansa gelap kontras tinggi ala photobooth Life4Cuts Seoul edisi malam.",
    type: "strip",
    frames: 4,
    aspect_ratio: "4/3",
    bg_color: "#18181B",
    text_color: "#FFFFFF",
    caption: "MIDNIGHT MEMORIES",
    default_filter: "noir",
    stickers: [
      { id: "st-4", type: "sparkles", x: 85, y: 12, scale: 1.2, rotation: 10 },
      { id: "st-5", type: "music", x: 15, y: 82, scale: 1.0, rotation: -8 },
    ],
    is_public: true,
    uses_count: 98,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: "tpl-starter-3",
    creator_name: "Dimas Pratama",
    creator_avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Dimas",
    name: "Vintage Polaroid 2x2",
    description: "Format kartu pos grid 2x2 bertema analog 35mm hangat dan nostalgic.",
    type: "grid",
    frames: 4,
    aspect_ratio: "1/1",
    bg_color: "#FEF3C7",
    text_color: "#78350F",
    caption: "VINTAGE SOUL 35MM",
    default_filter: "vintage",
    stickers: [
      { id: "st-6", type: "camera", x: 15, y: 88, scale: 1.1, rotation: -6 },
      { id: "st-7", type: "flower", x: 85, y: 88, scale: 1.0, rotation: 12 },
    ],
    is_public: true,
    uses_count: 76,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "tpl-starter-4",
    creator_name: "Hannah Lee",
    creator_avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Hannah",
    name: "Matcha Garden 3-Cut",
    description: "Format strip 3 foto bertema matcha sage lembut dan minimalis estetik.",
    type: "strip",
    frames: 3,
    aspect_ratio: "4/3",
    bg_color: "#7C8F63",
    text_color: "#FFFFFF",
    caption: "MATCHA MOMENTS 🍃",
    default_filter: "sage",
    stickers: [
      { id: "st-8", type: "cloud", x: 82, y: 18, scale: 1.0, rotation: 5 },
      { id: "st-9", type: "flower", x: 16, y: 75, scale: 1.1, rotation: -10 },
    ],
    is_public: true,
    uses_count: 53,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

// Helper to get local templates
function getLocalTemplates(): CommunityFrameTemplate[] {
  if (typeof window === "undefined") return STARTER_TEMPLATES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(STARTER_TEMPLATES));
      return STARTER_TEMPLATES;
    }
    return JSON.parse(raw);
  } catch {
    return STARTER_TEMPLATES;
  }
}

// Helper to save local templates
function saveLocalTemplates(templates: CommunityFrameTemplate[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch (err) {
    console.error("Failed to save templates to localStorage:", err);
  }
}

// Fetch all public community templates
export async function fetchCommunityTemplates(): Promise<CommunityFrameTemplate[]> {
  const localList = getLocalTemplates();

  if (!isSupabaseConfigured || !supabase) {
    return localList;
  }

  try {
    const { data, error } = await supabase
      .from("frame_templates")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Supabase fetch frame_templates error, using local fallback:", error);
      return localList;
    }

    if (data && data.length > 0) {
      const mergedMap = new Map<string, CommunityFrameTemplate>();
      
      // Add server templates
      data.forEach((item: any) => {
        mergedMap.set(item.id, {
          id: item.id,
          user_id: item.user_id,
          creator_name: item.creator_name || "Creator",
          creator_avatar: item.creator_avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${item.creator_name || 'user'}`,
          name: item.name,
          description: item.description || "",
          type: item.type || "strip",
          frames: item.frames || 4,
          aspect_ratio: item.aspect_ratio || "4/3",
          bg_color: item.bg_color || "#FFFFFF",
          text_color: item.text_color || "#1E293B",
          caption: item.caption || "",
          default_filter: item.default_filter || "none",
          stickers: Array.isArray(item.stickers) ? item.stickers : [],
          image_url: item.image_url,
          frame_mode: item.frame_mode || "overlay",
          is_public: item.is_public ?? true,
          uses_count: item.uses_count || 0,
          created_at: item.created_at || new Date().toISOString(),
        });
      });

      // Merge local starters if not already present
      localList.forEach((local) => {
        if (!mergedMap.has(local.id)) {
          mergedMap.set(local.id, local);
        }
      });

      const result = Array.from(mergedMap.values());
      saveLocalTemplates(result);
      return result;
    }

    return localList;
  } catch (err) {
    console.error("fetchCommunityTemplates failed:", err);
    return localList;
  }
}

// Create a new frame template
export async function createCommunityTemplate(params: {
  user_id?: string;
  creator_name: string;
  creator_avatar?: string;
  name: string;
  description?: string;
  type: "strip" | "grid";
  frames: number;
  bg_color: string;
  text_color: string;
  caption?: string;
  default_filter?: string;
  stickers: ActiveSticker[];
  image_url?: string;
  frame_mode?: "overlay" | "background";
}): Promise<CommunityFrameTemplate> {
  const newTemplate: CommunityFrameTemplate = {
    id: `tpl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    user_id: params.user_id,
    creator_name: params.creator_name || "Creator",
    creator_avatar:
      params.creator_avatar ||
      `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(params.creator_name || "creator")}`,
    name: params.name,
    description: params.description || "",
    type: params.type,
    frames: params.frames,
    aspect_ratio: params.type === "grid" ? "1/1" : "4/3",
    bg_color: params.bg_color,
    text_color: params.text_color,
    caption: params.caption || "",
    default_filter: params.default_filter || "none",
    stickers: params.stickers || [],
    image_url: params.image_url,
    frame_mode: params.frame_mode || (params.image_url ? "overlay" : undefined),
    is_public: true,
    uses_count: 0,
    created_at: new Date().toISOString(),
  };

  // 1. Save locally first for instantaneous responsiveness
  const currentLocal = getLocalTemplates();
  saveLocalTemplates([newTemplate, ...currentLocal]);

  // 2. Save to Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const payload: any = {
        name: newTemplate.name,
        description: newTemplate.description,
        type: newTemplate.type,
        frames: newTemplate.frames,
        aspect_ratio: newTemplate.aspect_ratio,
        bg_color: newTemplate.bg_color,
        text_color: newTemplate.text_color,
        caption: newTemplate.caption,
        default_filter: newTemplate.default_filter,
        stickers: newTemplate.stickers,
        image_url: newTemplate.image_url,
        frame_mode: newTemplate.frame_mode,
        is_public: true,
        uses_count: 0,
        creator_name: newTemplate.creator_name,
        creator_avatar: newTemplate.creator_avatar,
      };

      if (params.user_id) {
        payload.user_id = params.user_id;
      }

      const { data, error } = await supabase
        .from("frame_templates")
        .insert([payload])
        .select()
        .single();

      if (!error && data) {
        newTemplate.id = data.id;
        // Update local with server id
        const updatedLocal = getLocalTemplates().map((t) =>
          t.id === newTemplate.id ? { ...t, id: data.id } : t
        );
        saveLocalTemplates(updatedLocal);
      } else if (error) {
        console.warn("Supabase insert template failed, using local save:", error);
      }
    } catch (err) {
      console.error("Failed to insert template to Supabase:", err);
    }
  }

  return newTemplate;
}

// Increment template uses count
export async function incrementTemplateUsage(templateId: string): Promise<void> {
  // Update local
  const localList = getLocalTemplates();
  const updated = localList.map((tpl) =>
    tpl.id === templateId ? { ...tpl, uses_count: (tpl.uses_count || 0) + 1 } : tpl
  );
  saveLocalTemplates(updated);

  // Update Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const target = updated.find((t) => t.id === templateId);
      if (target) {
        await supabase
          .from("frame_templates")
          .update({ uses_count: target.uses_count })
          .eq("id", templateId);
      }
    } catch (err) {
      console.warn("Failed to increment template usage in Supabase:", err);
    }
  }
}

// Delete template (if owner or admin)
export async function deleteCommunityTemplate(templateId: string): Promise<void> {
  const current = getLocalTemplates();
  const filtered = current.filter((t) => t.id !== templateId);
  saveLocalTemplates(filtered);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("frame_templates").delete().eq("id", templateId);
    } catch (err) {
      console.error("Failed to delete template from Supabase:", err);
    }
  }
}
