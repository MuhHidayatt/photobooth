import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface PhotoboothRecord {
  id: string;
  user_id: string;
  theme: string;
  caption: string;
  frame_count: number;
  jpg_url: string;
  gif_url: string;
  is_favorite: boolean;
  created_at: string;
}

// Helper to compress base64 images to prevent QuotaExceededError in localStorage
async function compressBase64(dataUrl: string, maxWidth: number, quality: number): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith("data:image")) return dataUrl;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// Convert base64 dataUrl to Blob/File and upload to Supabase Storage
export async function uploadBase64ToStorage(
  userId: string,
  dataUrl: string,
  fileExtension: string
): Promise<string> {
  if (!isSupabaseConfigured) {
    // Fallback: return compressed dataUrl for local mock persistence
    if (fileExtension === "jpg") {
      return await compressBase64(dataUrl, 400, 0.7);
    }
    if (fileExtension === "gif" && dataUrl.length > 1500000) {
      console.warn("Mock local GIF too large, skipping GIF persistence to save localStorage quota.");
      return "";
    }
    return dataUrl;
  }

  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const fileName = `${userId}/${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 7)}.${fileExtension}`;

    const { data, error } = await supabase.storage
      .from("photobooths")
      .upload(fileName, blob, {
        contentType: fileExtension === "gif" ? "image/gif" : "image/jpeg",
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Storage upload error:", error);
      throw error;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("photobooths").getPublicUrl(fileName);

    return publicUrl;
  } catch (err) {
    console.error("Failed to upload to storage, returning local URL:", err);
    return dataUrl;
  }
}

// Save a photobooth record to the database
export async function savePhotobooth(
  userId: string,
  theme: string,
  caption: string,
  frameCount: number,
  jpgDataUrl: string,
  gifDataUrl: string | null
): Promise<PhotoboothRecord> {
  const jpgUrl = await uploadBase64ToStorage(userId, jpgDataUrl, "jpg");
  const gifUrl = gifDataUrl ? await uploadBase64ToStorage(userId, gifDataUrl, "gif") : "";

  if (!isSupabaseConfigured) {
    // Mock database save (using localStorage)
    const newRecord: PhotoboothRecord = {
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      theme,
      caption,
      frame_count: frameCount,
      jpg_url: jpgUrl,
      gif_url: gifUrl,
      is_favorite: false,
      created_at: new Date().toISOString(),
    };

    const current = getLocalCreations(userId);
    localStorage.setItem(`posean_creations_${userId}`, JSON.stringify([newRecord, ...current]));
    return newRecord;
  }

  const { data, error } = await supabase
    .from("photobooths")
    .insert([
      {
        user_id: userId,
        theme,
        caption,
        frame_count: frameCount,
        jpg_url: jpgUrl,
        gif_url: gifUrl,
        is_favorite: false,
      },
    ])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as PhotoboothRecord;
}

// Fetch all photobooths for a user
export async function fetchPhotobooths(userId: string): Promise<PhotoboothRecord[]> {
  if (!isSupabaseConfigured) {
    return getLocalCreations(userId);
  }

  const { data, error } = await supabase
    .from("photobooths")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data as PhotoboothRecord[];
}

// Toggle favorite state
export async function toggleFavorite(
  id: string,
  userId: string,
  currentState: boolean
): Promise<boolean> {
  const nextState = !currentState;

  if (!isSupabaseConfigured || id.startsWith("local_")) {
    const creations = getLocalCreations(userId);
    const updated = creations.map((c) => (c.id === id ? { ...c, is_favorite: nextState } : c));
    localStorage.setItem(`posean_creations_${userId}`, JSON.stringify(updated));
    return nextState;
  }

  const { error } = await supabase
    .from("photobooths")
    .update({ is_favorite: nextState })
    .eq("id", id);

  if (error) {
    throw error;
  }

  return nextState;
}

// Delete a photobooth
export async function deletePhotobooth(id: string, userId: string): Promise<void> {
  if (!isSupabaseConfigured || id.startsWith("local_")) {
    const creations = getLocalCreations(userId);
    const updated = creations.filter((c) => c.id !== id);
    localStorage.setItem(`posean_creations_${userId}`, JSON.stringify(updated));
    return;
  }

  // Attempt to delete from DB
  const { error } = await supabase.from("photobooths").delete().eq("id", id);
  if (error) {
    throw error;
  }
}

// Helper to load localStorage items
function getLocalCreations(userId: string): PhotoboothRecord[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(`posean_creations_${userId}`);
  return stored ? JSON.parse(stored) : [];
}
