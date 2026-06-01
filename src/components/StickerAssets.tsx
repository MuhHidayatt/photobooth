import React from "react";

export interface StickerDef {
  id: string;
  name: string;
  render: (color?: string) => React.ReactNode;
}

export const STICKERS: StickerDef[] = [
  {
    id: "smiley",
    name: "Happy Smiley",
    render: (color = "#1E293B") => (
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="44" stroke={color} strokeWidth="6" fill="#FFFFFF" />
        <circle cx="36" cy="42" r="5.5" fill={color} />
        <circle cx="64" cy="42" r="5.5" fill={color} />
        <path d="M30,58 Q50,75 70,58" stroke={color} strokeWidth="6" strokeLinecap="round" />
        <circle cx="24" cy="52" r="4" fill="#FFAAA6" opacity="0.6" />
        <circle cx="76" cy="52" r="4" fill="#FFAAA6" opacity="0.6" />
      </svg>
    ),
  },
  {
    id: "star",
    name: "Cute Star",
    render: (color = "#1E293B") => (
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50,4 C50,33 67,50 96,50 C67,50 50,67 50,96 C50,67 33,50 4,50 C33,50 50,33 5,4 Z" fill="#FFFFFF" stroke={color} strokeWidth="6" strokeLinejoin="round" />
        <circle cx="50" cy="50" r="10" fill={color} opacity="0.15" />
      </svg>
    ),
  },
  {
    id: "cloud",
    name: "Fluffy Cloud",
    render: (color = "#1E293B") => (
      <svg viewBox="0 0 100 65" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M24,52 C10,52 4,42 12,32 C6,18 20,8 34,16 C42,5 64,5 72,16 C84,12 94,22 88,36 C95,46 84,52 76,52 Z" fill="#FFFFFF" stroke={color} strokeWidth="6" strokeLinejoin="round" />
        <circle cx="34" cy="34" r="3.5" fill={color} />
        <circle cx="66" cy="34" r="3.5" fill={color} />
        <path d="M46,40 Q50,43 54,40" stroke={color} strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "heart",
    name: "Minimal Heart",
    render: (color = "#1E293B") => (
      <svg viewBox="0 0 100 90" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50,83 C50,83 6,51 6,28 C6,12 19,3 33,7 C43,10 50,22 50,22 C50,22 57,10 67,7 C81,3 94,12 94,28 C94,51 50,83 50,83 Z" fill="#FFFFFF" stroke={color} strokeWidth="6" strokeLinejoin="round" />
        <path d="M50,75 C50,75 14,46 14,28 C14,17 23,11 33,13 C41,15 46,24 47,26 L50,33 L53,26 C54,24 59,15 67,13 C77,11 86,17 86,28 C86,46 50,75 50,75 Z" fill={color} opacity="0.85" />
      </svg>
    ),
  },
  {
    id: "sparkles",
    name: "Sparkle",
    render: (color = "#1E293B") => (
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50,15 C50,32 58,40 75,40 C58,40 50,48 50,65 C50,48 42,40 25,40 C42,40 50,32 50,15 Z" fill="#FFFFFF" stroke={color} strokeWidth="5" />
        <path d="M80,55 C80,63 84,67 92,67 C84,67 80,71 80,79 C80,71 76,67 68,67 C76,67 80,63 80,55 Z" fill="#FFFFFF" stroke={color} strokeWidth="3" />
        <path d="M22,60 C22,66 25,69 31,69 C25,69 22,72 22,78 C22,72 19,69 13,69 C19,69 22,66 22,60 Z" fill="#FFFFFF" stroke={color} strokeWidth="3" />
      </svg>
    ),
  },
  {
    id: "flower",
    name: "Cute Flower",
    render: (color = "#1E293B") => (
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="30" r="16" fill="#FFFFFF" stroke={color} strokeWidth="5" />
        <circle cx="70" cy="45" r="16" fill="#FFFFFF" stroke={color} strokeWidth="5" />
        <circle cx="60" cy="68" r="16" fill="#FFFFFF" stroke={color} strokeWidth="5" />
        <circle cx="40" cy="68" r="16" fill="#FFFFFF" stroke={color} strokeWidth="5" />
        <circle cx="30" cy="45" r="16" fill="#FFFFFF" stroke={color} strokeWidth="5" />
        <circle cx="50" cy="50" r="15" fill={color} />
        <circle cx="46" cy="47" r="3" fill="#FFFFFF" />
      </svg>
    ),
  },
  {
    id: "camera",
    name: "Cute Camera",
    render: (color = "#1E293B") => (
      <svg viewBox="0 0 100 70" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="13" width="94" height="54" rx="10" fill="#FFFFFF" stroke={color} strokeWidth="6" />
        <circle cx="50" cy="40" r="17" fill="#FFFFFF" stroke={color} strokeWidth="6" />
        <circle cx="50" cy="40" r="10" fill={color} />
        <circle cx="47" cy="37" r="3" fill="#FFFFFF" />
        <rect x="18" y="22" width="12" height="8" rx="2" fill={color} />
        <circle cx="80" cy="23" r="4.5" fill={color} />
        <path d="M35,13 L38,5 L62,5 L65,13 Z" fill="#FFFFFF" stroke={color} strokeWidth="6" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "music",
    name: "Music Note",
    render: (color = "#1E293B") => (
      <svg viewBox="0 0 90 90" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M25,60 C25,50 35,46 41,52 C45,56 42,66 35,66 C27,66 25,60 25,60 Z" fill={color} stroke={color} strokeWidth="2" />
        <path d="M60,50 C60,40 70,36 76,42 C80,46 77,56 70,56 C62,56 60,50 60,50 Z" fill={color} stroke={color} strokeWidth="2" />
        <path d="M39,52 L39,15 L74,5 L74,42" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M39,26 L74,16" stroke={color} strokeWidth="6" />
      </svg>
    ),
  },
];
