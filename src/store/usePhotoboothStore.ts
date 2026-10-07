import { create } from "zustand";

export type Step = "landing" | "layout" | "camera" | "editor" | "export";

export interface LayoutOption {
  id: number | string;
  name: string;
  frames: number;
  previewClass: string;
  type: "strip" | "grid";
  badge?: string;
}

export interface ActiveSticker {
  id: string;
  type: string;
  x: number; // percentage width (0-100)
  y: number; // percentage height (0-100)
  scale: number;
  rotation: number;
}

export interface PhotoEffect {
  filter: string; // Filter id, e.g. "none" | "noir" | "warm" | "pastel" | "vintage" | "summer" | "sage" | "cyber"
  rotation: number; // analog tilt
}

export interface FilterOption {
  id: string;
  name: string;
  badge: string;
  description: string;
  cssClass: string;
  cssFilter: string;
  accentColor: string;
}

export const FILTERS: FilterOption[] = [
  {
    id: "none",
    name: "Natural",
    badge: "Original",
    description: "Tanpa efek, warna alami kamera",
    cssClass: "filter-none",
    cssFilter: "none",
    accentColor: "#94A3B8",
  },
  {
    id: "noir",
    name: "Mono Noir",
    badge: "Life4Cuts",
    description: "Monokrom kontras tinggi khas photobooth Korea",
    cssClass: "filter-noir",
    cssFilter: "grayscale(1) contrast(1.28) brightness(0.98)",
    accentColor: "#0F172A",
  },
  {
    id: "warm",
    name: "Kodak Warm",
    badge: "Warm 35mm",
    description: "Sentuhan keemasan hangat analog 35mm",
    cssClass: "filter-warm",
    cssFilter: "sepia(0.28) saturate(1.22) contrast(1.08) brightness(1.04)",
    accentColor: "#D97706",
  },
  {
    id: "pastel",
    name: "Soft Pastel",
    badge: "Dreamy",
    description: "Tone cerah lembut merona dan glowing",
    cssClass: "filter-pastel",
    cssFilter: "contrast(0.95) brightness(1.08) saturate(1.15) hue-rotate(-5deg)",
    accentColor: "#EC4899",
  },
  {
    id: "vintage",
    name: "Retro 90s",
    badge: "Faded Film",
    description: "Estetika luntur nostalgic kamera analog 90s",
    cssClass: "filter-vintage",
    cssFilter: "sepia(0.42) contrast(0.95) saturate(0.9) brightness(1.02)",
    accentColor: "#B45309",
  },
  {
    id: "summer",
    name: "Summer Pop",
    badge: "Vibrant",
    description: "Saturasi tinggi ceria dan penuh energi",
    cssClass: "filter-summer",
    cssFilter: "contrast(1.12) saturate(1.35) brightness(1.05) sepia(0.08)",
    accentColor: "#EF4444",
  },
  {
    id: "sage",
    name: "Muted Olive",
    badge: "Minimalist",
    description: "Tone hijau sage lembut dan menenangkan",
    cssClass: "filter-sage",
    cssFilter: "hue-rotate(35deg) saturate(0.85) contrast(1.05) sepia(0.12)",
    accentColor: "#15803D",
  },
  {
    id: "cyber",
    name: "Cyber Chill",
    badge: "Y2K Cool",
    description: "Tone dingin futuristik dengan kontras tegas",
    cssClass: "filter-cyber",
    cssFilter: "contrast(1.1) brightness(1.02) saturate(1.15) hue-rotate(185deg)",
    accentColor: "#0284C7",
  },
];

export interface ThemeOption {
  id: string;
  name: string;
  bg: string; // background color of strip
  text: string; // caption text / border color
  border: string; // custom border style
  accent: string; // primary highlight color of UI
  uiBg: string; // UI secondary background color
  uiActiveBg: string; // UI highlighted item color
}

export const THEMES: ThemeOption[] = [
  {
    id: "matcha",
    name: "Matcha",
    bg: "#7C8F63",
    text: "#FFFFFF",
    border: "border border-[#FFFFFF]",
    accent: "#7C8F63",
    uiBg: "#F0F4E8",
    uiActiveBg: "#7C8F63",
  },
  {
    id: "cream",
    name: "Cream",
    bg: "#E9E2D8",
    text: "#3E3730",
    border: "border border-[#3E3730]",
    accent: "#E9E2D8",
    uiBg: "#FDFBF7",
    uiActiveBg: "#E9E2D8",
  },
  {
    id: "peach",
    name: "Peach",
    bg: "#DDA07A",
    text: "#4D2513",
    border: "border border-[#4D2513]",
    accent: "#DDA07A",
    uiBg: "#FFF5F0",
    uiActiveBg: "#DDA07A",
  },
  {
    id: "sky",
    name: "Sky",
    bg: "#7B99B7",
    text: "#FFFFFF",
    border: "border border-[#FFFFFF]",
    accent: "#7B99B7",
    uiBg: "#F0F6FC",
    uiActiveBg: "#7B99B7",
  },
  {
    id: "terracotta",
    name: "Terracotta",
    bg: "#B56B52",
    text: "#FFFFFF",
    border: "border border-[#FFFFFF]",
    accent: "#B56B52",
    uiBg: "#FDF5F2",
    uiActiveBg: "#B56B52",
  },
  {
    id: "charcoal",
    name: "Charcoal",
    bg: "#3E4149",
    text: "#FFFFFF",
    border: "border border-[#FFFFFF]",
    accent: "#3E4149",
    uiBg: "#F3F4F6",
    uiActiveBg: "#3E4149",
  },
];

export const LAYOUTS: LayoutOption[] = [
  { id: 2, name: "2 Foto (Strip)", frames: 2, previewClass: "grid-rows-2", type: "strip", badge: "Classic" },
  { id: 3, name: "3 Foto (Strip)", frames: 3, previewClass: "grid-rows-3", type: "strip", badge: "Standard" },
  { id: 4, name: "4 Foto (Strip)", frames: 4, previewClass: "grid-rows-4", type: "strip", badge: "Life4Cuts" },
  { id: "grid-2x2", name: "Grid 2x2 (Postcard)", frames: 4, previewClass: "grid-cols-2", type: "grid", badge: "Instagram Ready" },
];

interface PhotoboothState {
  // Navigation
  step: Step;
  setStep: (step: Step) => void;

  // Layout & Settings
  selectedLayout: LayoutOption;
  setSelectedLayout: (layout: LayoutOption) => void;
  countdownTime: number; // in seconds (3 | 5)
  setCountdownTime: (time: number) => void;

  // Session Photos
  capturedPhotos: string[]; // Base64 dataUrls
  setCapturedPhotos: (photos: string[]) => void;
  addCapturedPhoto: (photo: string, index: number) => void;
  singleRetakeIndex: number | null; // index of photo to retake (null if sequential)
  setSingleRetakeIndex: (index: number | null) => void;
  activePhotoEffects: PhotoEffect[];
  setActivePhotoEffects: (effects: PhotoEffect[]) => void;
  updateActivePhotoEffect: (index: number, effect: Partial<PhotoEffect>) => void;

  // Filter Options & Scopes
  globalFilter: string;
  setGlobalFilter: (filter: string) => void;
  selectedFilterTarget: "all" | number; // "all" or specific frame index
  setSelectedFilterTarget: (target: "all" | number) => void;
  applyFilter: (filterId: string) => void;

  // Customization
  selectedTheme: ThemeOption;
  setSelectedTheme: (theme: ThemeOption) => void;
  caption: string;
  setCaption: (caption: string) => void;
  stickers: ActiveSticker[];
  setStickers: (stickers: ActiveSticker[]) => void;
  addSticker: (type: string) => void;
  deleteSticker: (id: string) => void;
  updateSticker: (id: string, updates: Partial<ActiveSticker>) => void;
  selectedStickerId: string | null;
  setSelectedStickerId: (id: string | null) => void;
  stickerColor: string;
  setStickerColor: (color: string) => void;

  // Exported Caches
  exportJpgUrl: string | null;
  setExportJpgUrl: (url: string | null) => void;
  exportGifUrl: string | null;
  setExportGifUrl: (url: string | null) => void;
  exportVideoUrl: string | null;
  setExportVideoUrl: (url: string | null) => void;
  isGeneratingJpg: boolean;
  setIsGeneratingJpg: (val: boolean) => void;
  isGeneratingGif: boolean;
  setIsGeneratingGif: (val: boolean) => void;
  isGeneratingVideo: boolean;
  setIsGeneratingVideo: (val: boolean) => void;
  gifInterval: number; // seconds per frame. e.g., 0.1 for 10fps

  // Global settings
  audioMuted: boolean;
  setAudioMuted: (val: boolean) => void;

  // Reset helper
  resetStore: () => void;
}

export const usePhotoboothStore = create<PhotoboothState>((set) => ({
  // Navigation
  step: "landing",
  setStep: (step) => set({ step }),

  // Layout & Settings
  selectedLayout: LAYOUTS[2], // 4 frames default
  setSelectedLayout: (selectedLayout) => set({ selectedLayout }),
  countdownTime: 3,
  setCountdownTime: (countdownTime) => set({ countdownTime }),

  // Session Photos
  capturedPhotos: [],
  setCapturedPhotos: (capturedPhotos) => set({ capturedPhotos }),
  addCapturedPhoto: (photo, index) =>
    set((state) => {
      const newPhotos = [...state.capturedPhotos];
      newPhotos[index] = photo;

      const newEffects = [...state.activePhotoEffects];
      if (!newEffects[index]) {
        newEffects[index] = {
          filter: "none",
          rotation: 0,
        };
      }

      return {
        capturedPhotos: newPhotos,
        activePhotoEffects: newEffects,
      };
    }),
  singleRetakeIndex: null,
  setSingleRetakeIndex: (singleRetakeIndex) => set({ singleRetakeIndex }),
  activePhotoEffects: [],
  setActivePhotoEffects: (activePhotoEffects) => set({ activePhotoEffects }),
  updateActivePhotoEffect: (index, effect) =>
    set((state) => {
      const newEffects = [...state.activePhotoEffects];
      if (newEffects[index]) {
        newEffects[index] = { ...newEffects[index], ...effect };
      }
      return { activePhotoEffects: newEffects };
    }),

  // Filter Options & Scopes
  globalFilter: "none",
  setGlobalFilter: (globalFilter) => set({ globalFilter }),
  selectedFilterTarget: "all",
  setSelectedFilterTarget: (selectedFilterTarget) => set({ selectedFilterTarget }),
  applyFilter: (filterId) =>
    set((state) => {
      const frameCount = state.selectedLayout.frames;
      const currentEffects = [...state.activePhotoEffects];
      for (let i = 0; i < frameCount; i++) {
        if (!currentEffects[i]) {
          currentEffects[i] = { filter: state.globalFilter || "none", rotation: 0 };
        }
      }

      if (state.selectedFilterTarget === "all") {
        const updated = currentEffects.map((eff) => ({ ...eff, filter: filterId }));
        return {
          globalFilter: filterId,
          activePhotoEffects: updated,
        };
      } else {
        const idx = state.selectedFilterTarget;
        if (idx >= 0 && idx < frameCount) {
          currentEffects[idx] = { ...currentEffects[idx], filter: filterId };
        }
        return {
          activePhotoEffects: currentEffects,
        };
      }
    }),

  // Customization
  selectedTheme: THEMES[1], // Cream default
  setSelectedTheme: (selectedTheme) => set({ selectedTheme }),
  caption: "",
  setCaption: (caption) => set({ caption }),
  stickers: [],
  setStickers: (stickers) => set({ stickers }),
  addSticker: (type) =>
    set((state) => {
      const newSticker: ActiveSticker = {
        id: `sticker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        x: 35 + Math.random() * 15,
        y: 40 + Math.random() * 15,
        scale: 1.0,
        rotation: (Math.random() - 0.5) * 10,
      };
      return {
        stickers: [...state.stickers, newSticker],
        selectedStickerId: newSticker.id,
      };
    }),
  deleteSticker: (id) =>
    set((state) => ({
      stickers: state.stickers.filter((s) => s.id !== id),
      selectedStickerId: state.selectedStickerId === id ? null : state.selectedStickerId,
    })),
  updateSticker: (id, updates) =>
    set((state) => ({
      stickers: state.stickers.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    })),
  selectedStickerId: null,
  setSelectedStickerId: (selectedStickerId) => set({ selectedStickerId }),
  stickerColor: "#3E3730",
  setStickerColor: (stickerColor) => set({ stickerColor }),

  // Exported Caches
  exportJpgUrl: null,
  setExportJpgUrl: (exportJpgUrl) => set({ exportJpgUrl }),
  exportGifUrl: null,
  setExportGifUrl: (exportGifUrl) => set({ exportGifUrl }),
  exportVideoUrl: null,
  setExportVideoUrl: (exportVideoUrl) => set({ exportVideoUrl }),
  isGeneratingJpg: false,
  setIsGeneratingJpg: (isGeneratingJpg) => set({ isGeneratingJpg }),
  isGeneratingGif: false,
  setIsGeneratingGif: (isGeneratingGif) => set({ isGeneratingGif }),
  isGeneratingVideo: false,
  setIsGeneratingVideo: (isGeneratingVideo) => set({ isGeneratingVideo }),
  gifInterval: 0.1, // 10 FPS

  // Global settings
  audioMuted: false,
  setAudioMuted: (audioMuted) => set({ audioMuted }),

  // Reset helper
  resetStore: () =>
    set((state) => ({
      step: "landing",
      capturedPhotos: [],
      singleRetakeIndex: null,
      activePhotoEffects: [],
      globalFilter: "none",
      selectedFilterTarget: "all",
      stickers: [],
      selectedStickerId: null,
      caption: "",
      exportJpgUrl: null,
      exportGifUrl: null,
      exportVideoUrl: null,
      isGeneratingJpg: false,
      isGeneratingGif: false,
      isGeneratingVideo: false,
    })),
}));
