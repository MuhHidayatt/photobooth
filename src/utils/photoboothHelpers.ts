import { ActiveSticker, PhotoEffect, FILTERS } from "@/store/usePhotoboothStore";

/**
 * Generates an aesthetic randomized sticker set tailored for strip or grid 2x2.
 */
export function generateRandomDoodles(layoutType: "strip" | "grid"): ActiveSticker[] {
  const doodleTypes = ["smiley", "star", "cloud", "heart", "sparkles", "flower", "camera", "music"];
  const maxSafeY = 85;

  const isGrid = layoutType === "grid";
  const positions = isGrid
    ? [
        { x: 5, y: 6 },
        { x: 95, y: 6 },
        { x: 50, y: 6 },
        { x: 5, y: 45 },
        { x: 95, y: 45 },
        { x: 50, y: 45 },
        { x: 18, y: 88 },
        { x: 82, y: 88 },
      ]
    : [
        { x: 6, y: 5 },
        { x: 94, y: 5 },
        { x: 6, y: 22 },
        { x: 94, y: 22 },
        { x: 6, y: 44 },
        { x: 94, y: 44 },
        { x: 6, y: 62 },
        { x: 94, y: 62 },
        { x: 6, y: 72 },
        { x: 94, y: 72 },
      ].filter((pos) => pos.y < maxSafeY - 4);

  const shuffled = [...positions].sort(() => 0.5 - Math.random());
  const count = isGrid ? Math.floor(Math.random() * 3) + 3 : Math.floor(Math.random() * 4) + 3;
  const selectedPositions = shuffled.slice(0, count);

  return selectedPositions.map((pos, idx) => {
    const type = doodleTypes[Math.floor(Math.random() * doodleTypes.length)];
    return {
      id: `auto_sticker_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      x: pos.x,
      y: pos.y,
      scale: 0.85 + Math.random() * 0.3,
      rotation: (Math.random() - 0.5) * 45,
    };
  });
}

/**
 * Crops captured camera photo to exact 4:3 aspect ratio and flips horizontally if front camera.
 */
export function processCapturedPhoto(dataUrl: string, mode: "user" | "environment"): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const sw = img.naturalWidth || img.width;
      const sh = img.naturalHeight || img.height;
      const targetAspect = 4 / 3;

      let cw = sw;
      let ch = sh;
      let cx = 0;
      let cy = 0;

      if (sw / sh > targetAspect) {
        ch = sh;
        cw = sh * targetAspect;
        cx = (sw - cw) / 2;
        cy = 0;
      } else {
        cw = sw;
        ch = sw / targetAspect;
        cx = 0;
        cy = (sh - ch) / 2;
      }

      const maxW = 960;
      let finalW = cw;
      let finalH = ch;
      if (finalW > maxW) {
        finalH = Math.round((maxW / finalW) * finalH);
        finalW = maxW;
      }

      const canvas = document.createElement("canvas");
      canvas.width = finalW;
      canvas.height = finalH;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        if (mode === "user") {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(img, cx, cy, cw, ch, 0, 0, finalW, finalH);
        resolve(canvas.toDataURL("image/jpeg", 0.90));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Bakes active filter presets directly into image canvases for GIF and Video exports.
 */
export function getFilteredPhotoFrames(
  photos: string[],
  activePhotoEffects: PhotoEffect[],
  globalFilter: string
): Promise<string[]> {
  return Promise.all(
    photos.map((photoUrl, idx) => {
      const effect = activePhotoEffects[idx] || { filter: globalFilter || "none" };
      const filterDef = FILTERS.find((f) => f.id === effect.filter);
      if (!filterDef || filterDef.id === "none" || filterDef.cssFilter === "none") {
        return Promise.resolve(photoUrl);
      }

      return new Promise<string>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.filter = filterDef.cssFilter;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL("image/jpeg", 0.95));
          } else {
            resolve(photoUrl);
          }
        };
        img.onerror = () => resolve(photoUrl);
        img.src = photoUrl;
      });
    })
  );
}
