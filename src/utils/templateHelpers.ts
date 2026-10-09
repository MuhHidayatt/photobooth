import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { CommunityFrameTemplate } from "@/types/template";
import { ActiveSticker } from "@/store/usePhotoboothStore";
import { FRAME_PRESETS } from "@/data/framePresets";

const STORAGE_KEY = "posean_community_templates";

// 8 Official Posean Themed Frame Presets
export const OFFICIAL_FRAME_TEMPLATES: CommunityFrameTemplate[] = FRAME_PRESETS.map((p, idx) => ({
  id: `preset-${p.id}`,
  creator_name: "Posean Official",
  creator_avatar: "/logo.png",
  name: p.name,
  description: `${p.description} (${p.cols} kolom × ${p.rows} baris · ${p.total} foto)`,
  type: p.type,
  frames: p.total,
  aspect_ratio: p.cols > 1 ? "1/1" : "4/3",
  bg_color: p.bg_color,
  text_color: p.text_color,
  caption: p.name === "Birthday" ? "Happy Birthday" : p.name.toUpperCase(),
  default_filter: "none",
  stickers: [],
  image_url: p.image,
  frame_mode: "overlay",
  custom_slots: p.slots,
  frame_aspect_ratio: p.aspectRatio,
  is_public: true,
  uses_count: 240 + idx * 15,
  created_at: new Date(Date.now() - (7 + idx) * 86400000).toISOString(),
}));

// Default starter templates for immediate rich experience
export const STARTER_TEMPLATES: CommunityFrameTemplate[] = [
  ...OFFICIAL_FRAME_TEMPLATES,
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
        if (item.name === "Birthday Test") return;

        let imageUrl = item.image_url;
        let frameMode = item.frame_mode || "overlay";
        let customSlots = Array.isArray(item.custom_slots) ? item.custom_slots : undefined;
        let frameAspectRatio = typeof item.frame_aspect_ratio === "number" ? item.frame_aspect_ratio : undefined;

        let cleanStickers = Array.isArray(item.stickers) ? item.stickers : [];
        const metaSticker = cleanStickers.find((s: any) => s.type === "__frame_meta__");
        if (metaSticker) {
          imageUrl = imageUrl || metaSticker.image_url;
          frameMode = metaSticker.frame_mode || frameMode;
          customSlots = customSlots || metaSticker.custom_slots;
          frameAspectRatio = frameAspectRatio || metaSticker.frame_aspect_ratio;
          cleanStickers = cleanStickers.filter((s: any) => s.type !== "__frame_meta__");
        }

        const matchedPreset = FRAME_PRESETS.find(
          (p) =>
            p.image === imageUrl ||
            p.name.toLowerCase() === item.name.toLowerCase() ||
            p.id === item.name.toLowerCase().replace(/\s+/g, "-")
        );
        if (matchedPreset) {
          imageUrl = imageUrl || matchedPreset.image;
          customSlots = customSlots || matchedPreset.slots;
          frameAspectRatio = frameAspectRatio || matchedPreset.aspectRatio;
          if (item.creator_name === "Anonymous") {
            item.creator_name = "Posean Official";
          }
        }

        mergedMap.set(item.id, {
          id: item.id,
          user_id: item.user_id,
          creator_name: item.creator_name || "Creator",
          creator_avatar:
            item.creator_avatar ||
            (item.creator_name === "Posean Official"
              ? "/logo.png"
              : `https://api.dicebear.com/7.x/pixel-art/svg?seed=${item.creator_name || "user"}`),
          name: item.name,
          description: item.description || (matchedPreset ? `${matchedPreset.description} (${matchedPreset.cols} kolom × ${matchedPreset.rows} baris · ${matchedPreset.total} foto)` : ""),
          type: item.type || (matchedPreset?.type || "strip"),
          frames: item.frames || (matchedPreset?.total || 4),
          aspect_ratio: item.aspect_ratio || "4/3",
          bg_color: item.bg_color || (matchedPreset?.bg_color || "#FFFFFF"),
          text_color: item.text_color || (matchedPreset?.text_color || "#1E293B"),
          caption: item.caption || "",
          default_filter: item.default_filter || "none",
          stickers: cleanStickers,
          image_url: imageUrl,
          frame_mode: frameMode,
          custom_slots: customSlots,
          frame_aspect_ratio: frameAspectRatio,
          is_public: item.is_public ?? true,
          uses_count: item.uses_count || 0,
          created_at: item.created_at || new Date().toISOString(),
        });
      });

      // Ensure all official presets are present
      OFFICIAL_FRAME_TEMPLATES.forEach((official) => {
        const alreadyExists = Array.from(mergedMap.values()).some(
          (m) => m.name.toLowerCase() === official.name.toLowerCase()
        );
        if (!alreadyExists) {
          mergedMap.set(official.id, official);
        }
      });

      // Merge local starters if not already present
      localList.forEach((local) => {
        const alreadyExists = Array.from(mergedMap.values()).some(
          (m) => m.name.toLowerCase() === local.name.toLowerCase()
        );
        if (!alreadyExists && !mergedMap.has(local.id)) {
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
  custom_slots?: import("@/types/template").CustomSlot[];
  frame_aspect_ratio?: number;
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
    custom_slots: params.custom_slots,
    frame_aspect_ratio: params.frame_aspect_ratio,
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

      if (newTemplate.custom_slots) {
        payload.custom_slots = newTemplate.custom_slots;
      }
      if (typeof newTemplate.frame_aspect_ratio === "number") {
        payload.frame_aspect_ratio = newTemplate.frame_aspect_ratio;
      }

      if (params.user_id) {
        payload.user_id = params.user_id;
      }

      let { data, error } = await supabase
        .from("frame_templates")
        .insert([payload])
        .select()
        .single();

      // If error might be due to custom_slots or frame_aspect_ratio column missing in remote DB, retry without them
      if (error && (error.message?.includes("column") || error.code === "42703")) {
        console.warn("Supabase missing optional columns, retrying insert with standard columns...");
        delete payload.custom_slots;
        delete payload.frame_aspect_ratio;
        const retryResult = await supabase
          .from("frame_templates")
          .insert([payload])
          .select()
          .single();
        data = retryResult.data;
        error = retryResult.error;
      }

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

// Update an existing template (e.g. after auto-trimming or editing)
export async function updateCommunityTemplate(
  updatedTemplate: CommunityFrameTemplate
): Promise<CommunityFrameTemplate> {
  const current = getLocalTemplates();
  const index = current.findIndex((t) => t.id === updatedTemplate.id);
  if (index !== -1) {
    current[index] = { ...current[index], ...updatedTemplate };
  } else {
    current.unshift(updatedTemplate);
  }
  saveLocalTemplates(current);

  if (isSupabaseConfigured && supabase) {
    try {
      const payload: any = {
        name: updatedTemplate.name,
        description: updatedTemplate.description,
        type: updatedTemplate.type,
        frames: updatedTemplate.frames,
        bg_color: updatedTemplate.bg_color,
        text_color: updatedTemplate.text_color,
        caption: updatedTemplate.caption,
        default_filter: updatedTemplate.default_filter,
        stickers: updatedTemplate.stickers,
        image_url: updatedTemplate.image_url,
        frame_mode: updatedTemplate.frame_mode,
        custom_slots: updatedTemplate.custom_slots,
        frame_aspect_ratio: updatedTemplate.frame_aspect_ratio,
      };

      const { error } = await supabase
        .from("frame_templates")
        .update(payload)
        .eq("id", updatedTemplate.id);

      if (error && (error.message?.includes("column") || error.code === "42703")) {
        delete payload.custom_slots;
        delete payload.frame_aspect_ratio;
        await supabase
          .from("frame_templates")
          .update(payload)
          .eq("id", updatedTemplate.id);
      }
    } catch (err) {
      console.warn("Failed to update template in Supabase:", err);
    }
  }

  return updatedTemplate;
}
