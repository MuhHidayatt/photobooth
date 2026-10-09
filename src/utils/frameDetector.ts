import { CustomSlot } from "@/types/template";

export interface FrameDetectionResult {
  success: boolean;
  slots: CustomSlot[];
  detectedCount: number;
  imageAspectRatio: number; // width / height
  naturalWidth: number;
  naturalHeight: number;
  message?: string;
  trimmedImageUrl?: string;
  wasTrimmed?: boolean;
  cropRect?: { x: number; y: number; width: number; height: number };
  originalImageUrl?: string;
  originalAspectRatio?: number;
}

export interface DetectFrameOptions {
  autoTrim?: boolean; // Defaults to true
  extraZoom?: number; // Zoom level 1.0 - 1.3 to trim faint outer shadows / borders
}

/**
 * Generate smart default slots if image has no transparent cutouts
 */
export function generateDefaultSlots(
  count: number,
  isGrid: boolean
): CustomSlot[] {
  if (isGrid || (count === 4 && isGrid)) {
    // 2x2 grid layout
    return [
      { x: 5, y: 5, width: 42.5, height: 42.5, borderRadius: 6 },
      { x: 52.5, y: 5, width: 42.5, height: 42.5, borderRadius: 6 },
      { x: 5, y: 52.5, width: 42.5, height: 42.5, borderRadius: 6 },
      { x: 52.5, y: 52.5, width: 42.5, height: 42.5, borderRadius: 6 },
    ];
  }

  // Vertical Strip (2, 3, or 4 photos)
  const marginX = 6;
  const width = 88;
  const topPadding = 5;
  const bottomPadding = 12; // reserve bottom space for branding / caption
  const gap = count === 2 ? 5 : count === 3 ? 3.5 : 2.5;

  const totalGap = (count - 1) * gap;
  const usableHeight = 100 - topPadding - bottomPadding - totalGap;
  const slotHeight = Math.max(10, usableHeight / count);

  const slots: CustomSlot[] = [];
  for (let i = 0; i < count; i++) {
    slots.push({
      x: marginX,
      y: Math.round((topPadding + i * (slotHeight + gap)) * 10) / 10,
      width,
      height: Math.round(slotHeight * 10) / 10,
      borderRadius: 6,
    });
  }

  return slots;
}

/**
 * Analyzes an image to detect dead margins (transparent or uniform Canva background)
 * and crops it so the photobooth strip graphic fills 100% of the frame (full-bleed).
 */
export async function trimImageMargins(
  imageSource: string | HTMLImageElement,
  extraZoom: number = 1.0
): Promise<{
  wasTrimmed: boolean;
  trimmedImageUrl: string;
  cropRect: { x: number; y: number; width: number; height: number };
  width: number;
  height: number;
  aspectRatio: number;
}> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve({
        wasTrimmed: false,
        trimmedImageUrl: typeof imageSource === "string" ? imageSource : "",
        cropRect: { x: 0, y: 0, width: 600, height: 1520 },
        width: 600,
        height: 1520,
        aspectRatio: 0.395,
      });
      return;
    }

    const processImg = (img: HTMLImageElement) => {
      const W = img.naturalWidth || 600;
      const H = img.naturalHeight || 1520;
      const origAspect = W / H;

      try {
        const canvas = document.createElement("canvas");
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        if (!ctx) {
          resolve({
            wasTrimmed: false,
            trimmedImageUrl: img.src,
            cropRect: { x: 0, y: 0, width: W, height: H },
            width: W,
            height: H,
            aspectRatio: origAspect,
          });
          return;
        }

        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, W, H).data;

        // Sample background from 4 corners and edge midpoints
        const samplePoints = [
          { x: 2, y: 2 },
          { x: W - 3, y: 2 },
          { x: 2, y: H - 3 },
          { x: W - 3, y: H - 3 },
          { x: Math.floor(W / 2), y: 2 },
          { x: Math.floor(W / 2), y: H - 3 },
          { x: 2, y: Math.floor(H / 2) },
          { x: W - 3, y: Math.floor(H / 2) },
        ];

        let transparentSamples = 0;
        const opaqueSamples: { r: number; g: number; b: number }[] = [];

        for (const pt of samplePoints) {
          const idx = (pt.y * W + pt.x) * 4;
          const a = data[idx + 3];
          if (a < 50) {
            transparentSamples++;
          } else {
            opaqueSamples.push({
              r: data[idx],
              g: data[idx + 1],
              b: data[idx + 2],
            });
          }
        }

        // Background is transparent if at least 2 samples have alpha < 50
        const isTransparentBg = transparentSamples >= 2;

        let bgR = 255;
        let bgG = 255;
        let bgB = 255;
        if (!isTransparentBg && opaqueSamples.length > 0) {
          bgR = Math.round(opaqueSamples.reduce((acc, c) => acc + c.r, 0) / opaqueSamples.length);
          bgG = Math.round(opaqueSamples.reduce((acc, c) => acc + c.g, 0) / opaqueSamples.length);
          bgB = Math.round(opaqueSamples.reduce((acc, c) => acc + c.b, 0) / opaqueSamples.length);
        }

        // Step size for rapid scanning
        const stepX = Math.max(1, Math.floor(W / 500));
        const stepY = Math.max(1, Math.floor(H / 500));

        let minX = W;
        let maxX = 0;
        let minY = H;
        let maxY = 0;

        // Minimum hits to avoid single-pixel noise
        const minColHits = Math.max(3, Math.floor((H / stepY) * 0.015));
        for (let x = 0; x < W; x += stepX) {
          let hits = 0;
          for (let y = 0; y < H; y += stepY) {
            const idx = (y * W + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];

            // A pixel is "content" (cartoon border, characters, etc.)
            const isContent = isTransparentBg
              ? a >= 85 // ignore faint Canva drop shadow & outer transparent area
              : a < 50 || Math.hypot(r - bgR, g - bgG, b - bgB) > 28;

            if (isContent) {
              hits++;
              if (hits >= minColHits) break;
            }
          }
          if (hits >= minColHits) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
          }
        }

        const minRowHits = Math.max(3, Math.floor((W / stepX) * 0.015));
        for (let y = 0; y < H; y += stepY) {
          let hits = 0;
          for (let x = 0; x < W; x += stepX) {
            const idx = (y * W + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];

            const isContent = isTransparentBg
              ? a >= 85
              : a < 50 || Math.hypot(r - bgR, g - bgG, b - bgB) > 28;

            if (isContent) {
              hits++;
              if (hits >= minRowHits) break;
            }
          }
          if (hits >= minRowHits) {
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }

        // If no content found or inverted, fallback to full image
        if (minX >= maxX || minY >= maxY) {
          resolve({
            wasTrimmed: false,
            trimmedImageUrl: img.src,
            cropRect: { x: 0, y: 0, width: W, height: H },
            width: W,
            height: H,
            aspectRatio: origAspect,
          });
          return;
        }

        // Small 0.5% padding so strokes don't touch hard edges
        const padX = Math.round(W * 0.005);
        const padY = Math.round(H * 0.005);
        minX = Math.max(0, minX - padX);
        maxX = Math.min(W - 1, maxX + padX);
        minY = Math.max(0, minY - padY);
        maxY = Math.min(H - 1, maxY + padY);

        let cropW = maxX - minX + 1;
        let cropH = maxY - minY + 1;

        // Apply extraZoom if provided (crops inward slightly to remove remaining shadows)
        if (extraZoom > 1.0) {
          const z = Math.min(1.35, extraZoom);
          const insetW = Math.round((cropW * (1 - 1 / z)) / 2);
          const insetH = Math.round((cropH * (1 - 1 / z)) / 2);
          minX = Math.min(W - 10, minX + insetW);
          maxX = Math.max(minX + 10, maxX - insetW);
          minY = Math.min(H - 10, minY + insetH);
          maxY = Math.max(minY + 10, maxY - insetH);
          cropW = maxX - minX + 1;
          cropH = maxY - minY + 1;
        }

        const widthRatio = cropW / W;
        const heightRatio = cropH / H;

        // If crop is >= 96% in both dimensions, trimming is unnecessary
        if (widthRatio >= 0.96 && heightRatio >= 0.96 && extraZoom <= 1.0) {
          resolve({
            wasTrimmed: false,
            trimmedImageUrl: img.src,
            cropRect: { x: 0, y: 0, width: W, height: H },
            width: W,
            height: H,
            aspectRatio: origAspect,
          });
          return;
        }

        // Create cropped canvas
        const cropCanvas = document.createElement("canvas");
        cropCanvas.width = cropW;
        cropCanvas.height = cropH;
        const cropCtx = cropCanvas.getContext("2d");

        if (!cropCtx) {
          resolve({
            wasTrimmed: false,
            trimmedImageUrl: img.src,
            cropRect: { x: 0, y: 0, width: W, height: H },
            width: W,
            height: H,
            aspectRatio: origAspect,
          });
          return;
        }

        cropCtx.drawImage(img, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
        const trimmedDataUrl = cropCanvas.toDataURL("image/png");

        resolve({
          wasTrimmed: true,
          trimmedImageUrl: trimmedDataUrl,
          cropRect: { x: minX, y: minY, width: cropW, height: cropH },
          width: cropW,
          height: cropH,
          aspectRatio: cropW / cropH,
        });
      } catch (err) {
        console.error("trimImageMargins error:", err);
        resolve({
          wasTrimmed: false,
          trimmedImageUrl: img.src,
          cropRect: { x: 0, y: 0, width: W, height: H },
          width: W,
          height: H,
          aspectRatio: origAspect,
        });
      }
    };

    if (typeof imageSource === "string") {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => processImg(img);
      img.onerror = () => {
        resolve({
          wasTrimmed: false,
          trimmedImageUrl: imageSource,
          cropRect: { x: 0, y: 0, width: 600, height: 1520 },
          width: 600,
          height: 1520,
          aspectRatio: 0.395,
        });
      };
      img.src = imageSource;
    } else {
      processImg(imageSource);
    }
  });
}

/**
 * Detects transparent cutout windows in an uploaded PNG frame image.
 * Uses auto-trimming so that Canva canvas margins are removed first,
 * making the cartoon photobooth strip 100% FULL from edge to edge.
 */
export async function detectFrameSlots(
  imageSource: string,
  expectedFrames: number = 3,
  isGrid: boolean = false,
  options: DetectFrameOptions = { autoTrim: true, extraZoom: 1.0 }
): Promise<FrameDetectionResult> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve({
        success: false,
        slots: generateDefaultSlots(expectedFrames, isGrid),
        detectedCount: 0,
        imageAspectRatio: isGrid ? 0.86 : expectedFrames === 4 ? 0.31 : expectedFrames === 3 ? 0.395 : 0.55,
        naturalWidth: 600,
        naturalHeight: 1520,
        message: "Browser environment required for slot detection.",
      });
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = async () => {
      const originalWidth = img.naturalWidth || 600;
      const originalHeight = img.naturalHeight || 1520;
      const originalAspectRatio = originalWidth / originalHeight;

      try {
        let activeImage: HTMLImageElement | HTMLCanvasElement = img;
        let activeWidth = originalWidth;
        let activeHeight = originalHeight;
        let activeAspectRatio = originalAspectRatio;
        let wasTrimmed = false;
        let trimmedImageUrl: string | undefined = undefined;
        let cropRect: { x: number; y: number; width: number; height: number } | undefined = undefined;

        // Auto-Trim Margins if enabled
        if (options.autoTrim !== false) {
          const trimRes = await trimImageMargins(img, options.extraZoom || 1.0);
          if (trimRes.wasTrimmed) {
            wasTrimmed = true;
            trimmedImageUrl = trimRes.trimmedImageUrl;
            cropRect = trimRes.cropRect;
            activeWidth = trimRes.width;
            activeHeight = trimRes.height;
            activeAspectRatio = trimRes.aspectRatio;

            // Create canvas for scanning the trimmed image
            const tCanvas = document.createElement("canvas");
            tCanvas.width = trimRes.width;
            tCanvas.height = trimRes.height;
            const tCtx = tCanvas.getContext("2d");
            if (tCtx) {
              tCtx.drawImage(
                img,
                trimRes.cropRect.x,
                trimRes.cropRect.y,
                trimRes.cropRect.width,
                trimRes.cropRect.height,
                0,
                0,
                trimRes.width,
                trimRes.height
              );
              activeImage = tCanvas;
            }
          }
        }

        // Downsample for fast pixel scanning (target width 300px)
        const targetW = Math.min(300, activeWidth);
        const targetH = Math.round(targetW / activeAspectRatio);

        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        if (!ctx) {
          resolve({
            success: false,
            slots: generateDefaultSlots(expectedFrames, isGrid),
            detectedCount: 0,
            imageAspectRatio: activeAspectRatio,
            naturalWidth: activeWidth,
            naturalHeight: activeHeight,
            trimmedImageUrl,
            wasTrimmed,
            cropRect,
            originalImageUrl: imageSource,
            originalAspectRatio,
            message: "Context 2D tidak tersedia.",
          });
          return;
        }

        ctx.drawImage(activeImage, 0, 0, targetW, targetH);
        const imgData = ctx.getImageData(0, 0, targetW, targetH).data;

        // Step size for sampling: 2px
        const S = 2;
        const cols = Math.floor(targetW / S);
        const rows = Math.floor(targetH / S);
        const totalCells = cols * rows;

        // 0 = opaque, 1 = transparent
        const grid = new Uint8Array(totalCells);
        let transparentCount = 0;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const px = c * S;
            const py = r * S;
            const alpha = imgData[(py * targetW + px) * 4 + 3];
            // If alpha is transparent (< 45)
            if (alpha < 45) {
              grid[r * cols + c] = 1;
              transparentCount++;
            }
          }
        }

        // If very few transparent pixels (< 2% of image), likely an opaque JPG or solid PNG
        if (transparentCount < totalCells * 0.02) {
          resolve({
            success: false,
            slots: generateDefaultSlots(expectedFrames, isGrid),
            detectedCount: 0,
            imageAspectRatio: activeAspectRatio,
            naturalWidth: activeWidth,
            naturalHeight: activeHeight,
            trimmedImageUrl,
            wasTrimmed,
            cropRect,
            originalImageUrl: imageSource,
            originalAspectRatio,
            message: wasTrimmed
              ? "✂️ Margin kanvas Canva berhasil dipangkas! Menggunakan slot proporsional."
              : "Gambar tidak memiliki area transparan. Menggunakan slot proporsional.",
          });
          return;
        }

        // Find connected components using BFS
        const visited = new Uint8Array(totalCells);
        interface Component {
          minC: number;
          maxC: number;
          minR: number;
          maxR: number;
          count: number;
          touchesBorder: boolean;
        }

        const components: Component[] = [];
        const getIdx = (c: number, r: number) => r * cols + c;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const idx = getIdx(c, r);
            if (grid[idx] === 1 && visited[idx] === 0) {
              // Start BFS
              let minC = c;
              let maxC = c;
              let minR = r;
              let maxR = r;
              let count = 0;
              let touchesBorder = false;

              const queue: number[] = [idx];
              visited[idx] = 1;

              while (queue.length > 0) {
                const cur = queue.pop()!;
                const currC = cur % cols;
                const currR = Math.floor(cur / cols);
                count++;

                if (currC < minC) minC = currC;
                if (currC > maxC) maxC = currC;
                if (currR < minR) minR = currR;
                if (currR > maxR) maxR = currR;

                if (currC === 0 || currC === cols - 1 || currR === 0 || currR === rows - 1) {
                  touchesBorder = true;
                }

                // 4-neighborhood
                const neighbors = [
                  currC > 0 ? getIdx(currC - 1, currR) : -1,
                  currC < cols - 1 ? getIdx(currC + 1, currR) : -1,
                  currR > 0 ? getIdx(currC, currR - 1) : -1,
                  currR < rows - 1 ? getIdx(currC, currR + 1) : -1,
                ];

                for (const n of neighbors) {
                  if (n !== -1 && grid[n] === 1 && visited[n] === 0) {
                    visited[n] = 1;
                    queue.push(n);
                  }
                }
              }

              components.push({ minC, maxC, minR, maxR, count, touchesBorder });
            }
          }
        }

        // Filter valid cutouts
        const validCutouts = components.filter((comp) => {
          const areaFraction = comp.count / totalCells;
          // Ignore tiny noise (less than 1.5% of canvas area)
          if (areaFraction < 0.015) return false;

          // If it spans more than 50% of the canvas, it's outer background
          if (comp.touchesBorder && areaFraction > 0.5) return false;

          const widthPx = (comp.maxC - comp.minC) * S;
          const heightPx = (comp.maxR - comp.minR) * S;

          // Must be at least 20px wide & high
          if (widthPx < 20 || heightPx < 20) return false;

          return true;
        });

        // Sort cutouts: top to bottom
        validCutouts.sort((a, b) => {
          if (isGrid) {
            const rowDiff = Math.abs(a.minR - b.minR);
            if (rowDiff > rows * 0.15) {
              return a.minR - b.minR;
            }
            return a.minC - b.minC;
          }
          return a.minR - b.minR;
        });

        if (validCutouts.length > 0) {
          let selected = validCutouts;
          if (validCutouts.length > expectedFrames) {
            selected = [...validCutouts]
              .sort((a, b) => b.count - a.count)
              .slice(0, expectedFrames)
              .sort((a, b) => a.minR - b.minR);
          }

          const detectedSlots: CustomSlot[] = selected.map((comp) => {
            const minX = comp.minC * S;
            const maxX = (comp.maxC + 1) * S;
            const minY = comp.minR * S;
            const maxY = (comp.maxR + 1) * S;

            return {
              x: Math.round((minX / targetW) * 1000) / 10,
              y: Math.round((minY / targetH) * 1000) / 10,
              width: Math.round(((maxX - minX) / targetW) * 1000) / 10,
              height: Math.round(((maxY - minY) / targetH) * 1000) / 10,
              borderRadius: 6,
            };
          });

          resolve({
            success: true,
            slots: detectedSlots,
            detectedCount: detectedSlots.length,
            imageAspectRatio: activeAspectRatio,
            naturalWidth: activeWidth,
            naturalHeight: activeHeight,
            trimmedImageUrl,
            wasTrimmed,
            cropRect,
            originalImageUrl: imageSource,
            originalAspectRatio,
            message: wasTrimmed
              ? `✂️ Margin kanvas Canva dipangkas! ${detectedSlots.length} lubang foto otomatis FULL memenuhi strip.`
              : `Berhasil mendeteksi ${detectedSlots.length} lubang foto transparan secara otomatis!`,
          });
          return;
        }

        // Fallback default slots
        resolve({
          success: false,
          slots: generateDefaultSlots(expectedFrames, isGrid),
          detectedCount: 0,
          imageAspectRatio: activeAspectRatio,
          naturalWidth: activeWidth,
          naturalHeight: activeHeight,
          trimmedImageUrl,
          wasTrimmed,
          cropRect,
          originalImageUrl: imageSource,
          originalAspectRatio,
          message: wasTrimmed
            ? "✂️ Margin kanvas dipangkas! Menggunakan slot proporsional yang disesuaikan."
            : "Area transparan tidak cukup terpisah. Menggunakan slot default yang disesuaikan.",
        });
      } catch (err) {
        console.error("Frame slot detection error:", err);
        resolve({
          success: false,
          slots: generateDefaultSlots(expectedFrames, isGrid),
          detectedCount: 0,
          imageAspectRatio: originalAspectRatio,
          naturalWidth: originalWidth,
          naturalHeight: originalHeight,
          originalImageUrl: imageSource,
        });
      }
    };

    img.onerror = () => {
      resolve({
        success: false,
        slots: generateDefaultSlots(expectedFrames, isGrid),
        detectedCount: 0,
        imageAspectRatio: isGrid ? 0.86 : 0.395,
        naturalWidth: 600,
        naturalHeight: 1520,
        message: "Gagal memuat gambar untuk dianalisis.",
      });
    };

    img.src = imageSource;
  });
}
