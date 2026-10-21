import type { GlobalTheme } from "../types/schema";

export interface ThemePreset {
  id: string;
  name: string;
  theme: GlobalTheme;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "fantasy-default",
    name: "High Fantasy",
    theme: {
      fontHeading: "'Cinzel', serif",
      fontBody: "'EB Garamond', serif",
      canvasBackground: "#121316",
      cardBackground: "#1c1e24",
      borderColor: "#2f333d",
      accentColor: "#e06c75",
    },
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk / Sci-Fi",
    theme: {
      fontHeading: "'Orbitron', sans-serif",
      fontBody: "'Share Tech Mono', monospace",
      canvasBackground: "#080b10",
      cardBackground: "#0f141c",
      borderColor: "#1e293b",
      accentColor: "#00f0ff",
    },
  },
  {
    id: "parchment",
    name: "Antique Parchment",
    theme: {
      fontHeading: "'Cinzel', serif",
      fontBody: "'EB Garamond', serif",
      canvasBackground: "#221d17",
      cardBackground: "#2f2820",
      borderColor: "#4a3f32",
      accentColor: "#d4a373",
    },
  },
  {
    id: "eldritch",
    name: "Eldritch Arcane",
    theme: {
      fontHeading: "'Cinzel', serif",
      fontBody: "'Inter', sans-serif",
      canvasBackground: "#0d0b14",
      cardBackground: "#171322",
      borderColor: "#302645",
      accentColor: "#a855f7",
    },
  },
  {
    id: "clean-dark",
    name: "Clean Obsidian",
    theme: {
      fontHeading: "'Inter', sans-serif",
      fontBody: "'Inter', sans-serif",
      canvasBackground: "#18181b",
      cardBackground: "#27272a",
      borderColor: "#3f3f46",
      accentColor: "#38bdf8",
    },
  },
];
