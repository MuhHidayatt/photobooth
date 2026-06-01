import { create } from "zustand";

export type Step = "landing" | "layout" | "camera" | "editor" | "export";

export interface LayoutOption {
  id: number;
  name: string;
  frames: number;
  previewClass: string;
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
  filter: string; // "none" | "warm" | "sepia" | "noir" | "sage" | "summer"
  rotation: number; // analog tilt
}

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
  { id: 2, name: "2 Foto (Strip)", frames: 2, previewClass: "grid-rows-2" },
  { id: 3, name: "3 Foto (Strip)", frames: 3, previewClass: "grid-rows-3" },
  { id: 4, name: "4 Foto (Strip)", frames: 4, previewClass: "grid-rows-4" },
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
  isGeneratingJpg: boolean;
  setIsGeneratingJpg: (val: boolean) => void;
  isGeneratingGif: boolean;
  setIsGeneratingGif: (val: boolean) => void;
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
  isGeneratingJpg: false,
  setIsGeneratingJpg: (isGeneratingJpg) => set({ isGeneratingJpg }),
  isGeneratingGif: false,
  setIsGeneratingGif: (isGeneratingGif) => set({ isGeneratingGif }),
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
      stickers: [],
      selectedStickerId: null,
      caption: "",
      exportJpgUrl: null,
      exportGifUrl: null,
      isGeneratingJpg: false,
      isGeneratingGif: false,
    })),
}));
