/**
 * Client-Side Video MP4 Compiler for Posean Photobooth
 * Generates an HD 9:16 vertical video (1080x1920 / 720x1280) ready for
 * Instagram Reels, Stories, TikTok, and WhatsApp Status.
 */

export interface VideoCompileOptions {
  photos: string[]; // Individual photo dataUrls (with filters baked in)
  stripImageUrl: string; // The complete rendered HD strip/grid JPG
  themeBg: string; // Background color of the theme (e.g. #7C8F63)
  themeText: string;
  caption?: string;
  isGrid?: boolean;
}

// Helper to load an image as an HTMLImageElement
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

export async function compileStoryVideoMp4(options: VideoCompileOptions): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("Video export is only supported in browser environments.");
  }

  const { photos, stripImageUrl, themeBg, themeText, caption, isGrid } = options;

  // 1. Preload images
  const stripImg = await loadImage(stripImageUrl);
  const photoImgs = await Promise.all(photos.map((p) => loadImage(p)));

  // 2. Set up offscreen Canvas (720 x 1280 = 9:16 vertical HD video)
  const width = 720;
  const height = 1280;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Unable to create canvas 2D context for video compilation.");
  }

  // 3. Detect best supported video format
  const preferredTypes = [
    "video/mp4;codecs=avc1",
    "video/mp4",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];

  let selectedMime = "video/mp4";
  for (const mime of preferredTypes) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(mime)) {
      selectedMime = mime;
      break;
    }
  }

  // 4. Capture canvas stream at 30 FPS
  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, {
    mimeType: selectedMime,
    videoBitsPerSecond: 3500000, // 3.5 Mbps for crisp HD quality
  });

  const recordedChunks: Blob[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  const recordingFinished = new Promise<string>((resolve, reject) => {
    recorder.onstop = () => {
      try {
        const finalBlob = new Blob(recordedChunks, {
          type: selectedMime.includes("mp4") ? "video/mp4" : "video/webm",
        });
        const videoObjectUrl = URL.createObjectURL(finalBlob);
        resolve(videoObjectUrl);
      } catch (err) {
        reject(err);
      }
    };
    recorder.onerror = (e) => reject(e);
  });

  recorder.start();

  // 5. Render animation timeline
  // Total duration: 4800ms
  // Phase 1 (0 - 2400ms): Fast snapshot sequence of each captured photo with shutter clicks
  // Phase 2 (2400 - 4800ms): Complete photobooth strip showcase with gentle pulse and sparkles
  const totalDuration = 4800;
  const startTime = performance.now();
  const photoCount = photoImgs.length;
  const phase1Duration = 2400;
  const perPhotoDuration = phase1Duration / (photoCount || 1);

  return new Promise<string>((resolve, reject) => {
    function drawFrame(currentTime: number) {
      const elapsed = currentTime - startTime;

      if (!ctx) return;

      // --- A. Draw Aesthetic Background ---
      // Radial gradient background derived from theme color
      const gradient = ctx.createRadialGradient(
        width / 2,
        height * 0.45,
        50,
        width / 2,
        height * 0.5,
        height * 0.7
      );
      gradient.addColorStop(0, "#FAF8F5");
      gradient.addColorStop(0.5, themeBg);
      gradient.addColorStop(1, "#18181B");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Decorative top vintage badge
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.fillRect(width / 2 - 140, 60, 280, 44);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#1E293B";
      ctx.strokeRect(width / 2 - 140, 60, 280, 44);

      ctx.font = "bold 16px monospace";
      ctx.fillStyle = "#1E293B";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("✨ POSEAN PHOTOBOOTH", width / 2, 82);

      // Subtitle tag
      ctx.font = "bold 10px monospace";
      ctx.fillStyle = "#64748B";
      ctx.fillText("MEMORIES REEL • " + new Date().getFullYear(), width / 2, 125);

      // Bottom footer badge
      ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
      ctx.fillRect(width / 2 - 160, height - 90, 320, 40);
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.strokeRect(width / 2 - 160, height - 90, 320, 40);

      ctx.font = "bold 13px monospace";
      ctx.fillStyle = "#FFE66D";
      ctx.textAlign = "center";
      ctx.fillText(caption ? `"${caption.toUpperCase()}"` : "POSE DULU, CERITA NANTI 📸", width / 2, height - 70);

      // --- B. Center Animation ---
      if (elapsed < phase1Duration) {
        // === PHASE 1: Sequential Individual Photos ===
        const currentPhotoIndex = Math.min(
          photoCount - 1,
          Math.floor(elapsed / perPhotoDuration)
        );
        const timeInCurrentPhoto = elapsed % perPhotoDuration;
        const currentPhotoImg = photoImgs[currentPhotoIndex];

        // Shutter flash effect at the start of each photo (first 100ms)
        const isFlash = timeInCurrentPhoto < 110;

        if (currentPhotoImg) {
          // Draw single photo card in Polaroid frame style
          const cardWidth = 460;
          const cardHeight = 440;
          const cardX = (width - cardWidth) / 2;
          const cardY = 320;

          // Card shadow
          ctx.fillStyle = "rgba(0,0,0,0.35)";
          ctx.fillRect(cardX + 8, cardY + 8, cardWidth, cardHeight);

          // Card background
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(cardX, cardY, cardWidth, cardHeight);
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = "#1E293B";
          ctx.strokeRect(cardX, cardY, cardWidth, cardHeight);

          // Photo image inside card
          const photoPadding = 18;
          const photoW = cardWidth - photoPadding * 2;
          const photoH = 340;
          ctx.drawImage(
            currentPhotoImg,
            cardX + photoPadding,
            cardY + photoPadding,
            photoW,
            photoH
          );

          // Label under individual photo
          ctx.font = "bold 14px monospace";
          ctx.fillStyle = "#1E293B";
          ctx.textAlign = "center";
          ctx.fillText(
            `SNAP #${currentPhotoIndex + 1} OF ${photoCount}`,
            width / 2,
            cardY + cardHeight - 26
          );

          // Flash overlay
          if (isFlash) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
            ctx.fillRect(0, 0, width, height);
          }
        }
      } else {
        // === PHASE 2: Complete Photobooth Strip Showcase ===
        const phase2Elapsed = elapsed - phase1Duration;
        const progress = phase2Elapsed / (totalDuration - phase1Duration);

        // Flash transition on cut to full strip (first 120ms)
        if (phase2Elapsed < 120) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
          ctx.fillRect(0, 0, width, height);
        }

        // Draw Complete Strip Image centered
        // Determine aspect ratio of full strip
        const naturalW = stripImg.naturalWidth || stripImg.width || 300;
        const naturalH = stripImg.naturalHeight || stripImg.height || 900;
        const stripAspect = naturalW / naturalH;

        let targetH = isGrid ? 680 : 880;
        let targetW = targetH * stripAspect;

        // Ensure target width fits canvas nicely
        if (targetW > width - 100) {
          targetW = width - 100;
          targetH = targetW / stripAspect;
        }

        const stripX = (width - targetW) / 2;
        const stripY = (height - targetH) / 2;

        // Subtle gentle breathing scale
        const scale = 1 + Math.sin(progress * Math.PI) * 0.02;

        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.scale(scale, scale);
        ctx.translate(-width / 2, -height / 2);

        // Strip shadow
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fillRect(stripX + 12, stripY + 12, targetW, targetH);

        // Strip image
        ctx.drawImage(stripImg, stripX, stripY, targetW, targetH);
        ctx.restore();

        // Decorative floating sparkles
        const sparkleCount = 6;
        for (let i = 0; i < sparkleCount; i++) {
          const angle = (i / sparkleCount) * Math.PI * 2 + progress * Math.PI * 2;
          const sx = width / 2 + Math.cos(angle) * (targetW / 2 + 35);
          const sy = height / 2 + Math.sin(angle) * (targetH / 2 + 25);

          ctx.fillStyle = "#FFE66D";
          ctx.beginPath();
          ctx.arc(sx, sy, 3 + Math.sin(progress * 10 + i) * 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (elapsed < totalDuration) {
        requestAnimationFrame(drawFrame);
      } else {
        // Stop recording when total duration reached
        recorder.stop();
        recordingFinished.then(resolve).catch(reject);
      }
    }

    requestAnimationFrame(drawFrame);
  });
}
