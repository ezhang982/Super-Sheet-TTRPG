import type { GlobalTheme } from "../types/schema";
import type { StyleCategory } from "./types";

// =============================================================================
// STYLE PACKS (PHASE 4 / STYLE SYSTEM PHASE 4)
// Curated 1-click complete visual themes bundling typography, colors,
// frames, corners, shapes, shading, textures, patterns, watermarks, and dividers.
// =============================================================================

export interface StylePackColors {
  canvasBackground: string;
  cardBackground: string;
  borderColor: string;
  accentColor: string;
}

export interface StylePackTokens {
  defaultFrame?: string;
  defaultCorners?: string;
  defaultShape?: string;
  defaultShading?: string;
  defaultGlow?: boolean;
  defaultTexture?: string;
  defaultPattern?: string;
  cardPatternOpacity?: number;
  defaultScrim?: boolean;
  canvasPattern?: string;
  canvasPatternOpacity?: number;
  canvasPatternScale?: number;
  defaultWatermark?: string;
  watermarkOpacity?: number;
  defaultWatermarkPosition?: string;
  canvasWatermark?: string;
  canvasWatermarkOpacity?: number;
  canvasWatermarkPosition?: string;
  canvasWatermarkScale?: number;
  defaultHeaderDivider?: string;
}

export interface StylePack {
  id: string;
  name: string;
  description: string;
  category: StyleCategory | "minimal";
  fontHeading: string;
  fontBody: string;
  colors: StylePackColors;
  tokens: StylePackTokens;
}

export const FALLBACK_STYLE_PACK_ID = "fantasy-parchment";

export const STYLE_PACKS: StylePack[] = [
  {
    id: "fantasy-parchment",
    name: "High Fantasy Parchment",
    description: "Warm antique parchment with royal gold filigree, ornate flourishes, and subtle heraldic crests.",
    category: "fantasy",
    fontHeading: "'Cinzel', serif",
    fontBody: "'EB Garamond', serif",
    colors: {
      canvasBackground: "#1a1612",
      cardBackground: "#262018",
      borderColor: "#4a3e2e",
      accentColor: "#c89b3c",
    },
    tokens: {
      defaultFrame: "filigree",
      defaultCorners: "filigree",
      defaultShape: "rounded",
      defaultShading: "soft",
      defaultGlow: false,
      defaultTexture: "grain",
      defaultPattern: "constellation",
      cardPatternOpacity: 0.12,
      defaultScrim: false,
      canvasPattern: "speckle",
      canvasPatternOpacity: 0.15,
      canvasPatternScale: 1.5,
      defaultWatermark: "crest",
      watermarkOpacity: 0.08,
      defaultWatermarkPosition: "center",
      canvasWatermark: "d20",
      canvasWatermarkOpacity: 0.04,
      canvasWatermarkPosition: "center",
      canvasWatermarkScale: 1.5,
      defaultHeaderDivider: "flourish",
    },
  },
  {
    id: "cyberpunk-neon",
    name: "Cyberpunk Neon",
    description: "High-contrast dark synth terminal with sharp chamfers, circuit edges, scanlines, and electric cyan accents.",
    category: "scifi",
    fontHeading: "'Orbitron', sans-serif",
    fontBody: "'Share Tech Mono', monospace",
    colors: {
      canvasBackground: "#07090e",
      cardBackground: "#0d121d",
      borderColor: "#1b273d",
      accentColor: "#00f0ff",
    },
    tokens: {
      defaultFrame: "circuit-edge",
      defaultCorners: "tech",
      defaultShape: "chamfer",
      defaultShading: "deep",
      defaultGlow: true,
      defaultTexture: "scanlines",
      defaultPattern: "hex-mesh",
      cardPatternOpacity: 0.18,
      defaultScrim: true,
      canvasPattern: "grid",
      canvasPatternOpacity: 0.18,
      canvasPatternScale: 1.0,
      defaultWatermark: "biohazard",
      watermarkOpacity: 0.12,
      defaultWatermarkPosition: "bottom-right",
      canvasWatermark: "biohazard",
      canvasWatermarkOpacity: 0.05,
      canvasWatermarkPosition: "center",
      canvasWatermarkScale: 1.8,
      defaultHeaderDivider: "tech",
    },
  },
  {
    id: "gothic-horror",
    name: "Gothic Horror",
    description: "Cursed crypts and dark fantasy with iron spikes, deep vignettes, bone aesthetics, and crimson blood accents.",
    category: "gothic",
    fontHeading: "'Cinzel', serif",
    fontBody: "'EB Garamond', serif",
    colors: {
      canvasBackground: "#0e0b10",
      cardBackground: "#17121b",
      borderColor: "#38253a",
      accentColor: "#d93848",
    },
    tokens: {
      defaultFrame: "thorn-vine",
      defaultCorners: "spikes",
      defaultShape: "sharp",
      defaultShading: "vignette",
      defaultGlow: false,
      defaultTexture: "grain",
      defaultPattern: "hatch",
      cardPatternOpacity: 0.14,
      defaultScrim: true,
      canvasPattern: "speckle",
      canvasPatternOpacity: 0.2,
      canvasPatternScale: 1.2,
      defaultWatermark: "skull",
      watermarkOpacity: 0.1,
      defaultWatermarkPosition: "center",
      canvasWatermark: "skull",
      canvasWatermarkOpacity: 0.05,
      canvasWatermarkPosition: "center",
      canvasWatermarkScale: 1.5,
      defaultHeaderDivider: "gothic",
    },
  },
  {
    id: "grimdark-terminal",
    name: "Grimdark Terminal",
    description: "Cold retro-military data terminal with CRT phosphor green, monospace typography, and heavy rivets.",
    category: "scifi",
    fontHeading: "'Share Tech Mono', monospace",
    fontBody: "'Share Tech Mono', monospace",
    colors: {
      canvasBackground: "#060c07",
      cardBackground: "#0a160d",
      borderColor: "#1b3520",
      accentColor: "#22c55e",
    },
    tokens: {
      defaultFrame: "tech-brackets",
      defaultCorners: "rivets",
      defaultShape: "sharp",
      defaultShading: "deep",
      defaultGlow: true,
      defaultTexture: "scanlines",
      defaultPattern: "grid",
      cardPatternOpacity: 0.15,
      defaultScrim: false,
      canvasPattern: "blueprint",
      canvasPatternOpacity: 0.12,
      canvasPatternScale: 1.0,
      defaultWatermark: "none",
      watermarkOpacity: 0.05,
      defaultWatermarkPosition: "bottom-right",
      canvasWatermark: "none",
      canvasWatermarkOpacity: 0.04,
      canvasWatermarkPosition: "center",
      canvasWatermarkScale: 1.0,
      defaultHeaderDivider: "tech",
    },
  },
  {
    id: "celestial-arcane",
    name: "Celestial Arcane",
    description: "Cosmic wizardry with deep violet astral voids, starry constellations, gemstone accents, and glowing rune circles.",
    category: "fantasy",
    fontHeading: "'Cinzel', serif",
    fontBody: "'Inter', sans-serif",
    colors: {
      canvasBackground: "#0b0914",
      cardBackground: "#131024",
      borderColor: "#2b224d",
      accentColor: "#a855f7",
    },
    tokens: {
      defaultFrame: "celestial",
      defaultCorners: "gem",
      defaultShape: "rounded",
      defaultShading: "soft",
      defaultGlow: true,
      defaultTexture: "none",
      defaultPattern: "constellation",
      cardPatternOpacity: 0.22,
      defaultScrim: false,
      canvasPattern: "dots",
      canvasPatternOpacity: 0.15,
      canvasPatternScale: 1.25,
      defaultWatermark: "arcane-circle",
      watermarkOpacity: 0.15,
      defaultWatermarkPosition: "center",
      canvasWatermark: "arcane-circle",
      canvasWatermarkOpacity: 0.07,
      canvasWatermarkPosition: "center",
      canvasWatermarkScale: 2.0,
      defaultHeaderDivider: "gem",
    },
  },
  {
    id: "clean-obsidian",
    name: "Clean Obsidian",
    description: "Sleek, minimalist modern dashboard with crisp typography, subtle borders, and sky blue accents.",
    category: "minimal",
    fontHeading: "'Inter', sans-serif",
    fontBody: "'Inter', sans-serif",
    colors: {
      canvasBackground: "#111215",
      cardBackground: "#18191f",
      borderColor: "#282a36",
      accentColor: "#38bdf8",
    },
    tokens: {
      defaultFrame: "solid",
      defaultCorners: "none",
      defaultShape: "rounded",
      defaultShading: "none",
      defaultGlow: false,
      defaultTexture: "none",
      defaultPattern: "none",
      cardPatternOpacity: 0.05,
      defaultScrim: false,
      canvasPattern: "none",
      canvasPatternOpacity: 0.05,
      canvasPatternScale: 1.0,
      defaultWatermark: "none",
      watermarkOpacity: 0.05,
      defaultWatermarkPosition: "center",
      canvasWatermark: "none",
      canvasWatermarkOpacity: 0.05,
      canvasWatermarkPosition: "center",
      canvasWatermarkScale: 1.0,
      defaultHeaderDivider: "default",
    },
  },
  {
    id: "ancient-celtic",
    name: "Ancient Celtic",
    description: "Earthy druidic moss and ancient standing stones with celtic knotwork, antique serif type, and emerald accents.",
    category: "fantasy",
    fontHeading: "'Cinzel', serif",
    fontBody: "'EB Garamond', serif",
    colors: {
      canvasBackground: "#0d140e",
      cardBackground: "#142116",
      borderColor: "#28422d",
      accentColor: "#34d399",
    },
    tokens: {
      defaultFrame: "celtic",
      defaultCorners: "flourish",
      defaultShape: "rounded",
      defaultShading: "soft",
      defaultGlow: false,
      defaultTexture: "grain",
      defaultPattern: "hex-mesh",
      cardPatternOpacity: 0.12,
      defaultScrim: false,
      canvasPattern: "speckle",
      canvasPatternOpacity: 0.16,
      canvasPatternScale: 1.2,
      defaultWatermark: "crest",
      watermarkOpacity: 0.1,
      defaultWatermarkPosition: "center",
      canvasWatermark: "dragon",
      canvasWatermarkOpacity: 0.06,
      canvasWatermarkPosition: "center",
      canvasWatermarkScale: 1.8,
      defaultHeaderDivider: "celtic",
    },
  },
  {
    id: "royal-scroll",
    name: "Royal Scroll",
    description: "Majestic illuminated manuscript with gilded gold framing, dragon heraldry, and royal flourishes.",
    category: "fantasy",
    fontHeading: "'Cinzel', serif",
    fontBody: "'EB Garamond', serif",
    colors: {
      canvasBackground: "#1c1712",
      cardBackground: "#282119",
      borderColor: "#54412c",
      accentColor: "#e5a93c",
    },
    tokens: {
      defaultFrame: "scroll-royal",
      defaultCorners: "filigree",
      defaultShape: "rounded",
      defaultShading: "soft",
      defaultGlow: false,
      defaultTexture: "grain",
      defaultPattern: "constellation",
      cardPatternOpacity: 0.14,
      defaultScrim: false,
      canvasPattern: "speckle",
      canvasPatternOpacity: 0.15,
      canvasPatternScale: 1.5,
      defaultWatermark: "dragon",
      watermarkOpacity: 0.12,
      defaultWatermarkPosition: "center",
      canvasWatermark: "dragon",
      canvasWatermarkOpacity: 0.05,
      canvasWatermarkPosition: "center",
      canvasWatermarkScale: 1.8,
      defaultHeaderDivider: "flourish",
    },
  },
  {
    id: "frosted-mithril",
    name: "Frosted Mithril",
    description: "Gleaming elven mithril silver with frosted glass cards, runic inscriptions, and ice blue luminescence.",
    category: "metallic",
    fontHeading: "'Cinzel', serif",
    fontBody: "'EB Garamond', serif",
    colors: {
      canvasBackground: "#0d131a",
      cardBackground: "#15202b",
      borderColor: "#2d4257",
      accentColor: "#7dd3fc",
    },
    tokens: {
      defaultFrame: "silver",
      defaultCorners: "runes",
      defaultShape: "rounded",
      defaultShading: "soft",
      defaultGlow: true,
      defaultTexture: "glass",
      defaultPattern: "dots",
      cardPatternOpacity: 0.12,
      defaultScrim: true,
      canvasPattern: "constellation",
      canvasPatternOpacity: 0.14,
      canvasPatternScale: 1.2,
      defaultWatermark: "arcane-circle",
      watermarkOpacity: 0.1,
      defaultWatermarkPosition: "center",
      canvasWatermark: "compass",
      canvasWatermarkOpacity: 0.05,
      canvasWatermarkPosition: "center",
      canvasWatermarkScale: 1.6,
      defaultHeaderDivider: "runes",
    },
  },
  {
    id: "iron-crypt",
    name: "Iron Crypt",
    description: "Grim heavy-iron dungeoncrawler with carbon composite, spikes, skull emblems, and sinister amber torchlight.",
    category: "gothic",
    fontHeading: "'Cinzel', serif",
    fontBody: "'Share Tech Mono', monospace",
    colors: {
      canvasBackground: "#0f0f12",
      cardBackground: "#18181c",
      borderColor: "#363640",
      accentColor: "#f59e0b",
    },
    tokens: {
      defaultFrame: "iron-spikes",
      defaultCorners: "spikes",
      defaultShape: "sharp",
      defaultShading: "deep",
      defaultGlow: false,
      defaultTexture: "carbon",
      defaultPattern: "hatch",
      cardPatternOpacity: 0.15,
      defaultScrim: true,
      canvasPattern: "grid",
      canvasPatternOpacity: 0.1,
      canvasPatternScale: 1.0,
      defaultWatermark: "skull",
      watermarkOpacity: 0.12,
      defaultWatermarkPosition: "center",
      canvasWatermark: "skull",
      canvasWatermarkOpacity: 0.05,
      canvasWatermarkPosition: "center",
      canvasWatermarkScale: 1.6,
      defaultHeaderDivider: "gothic",
    },
  },
];

const STYLE_PACKS_BY_ID: Record<string, StylePack> = Object.fromEntries(
  STYLE_PACKS.map((pack) => [pack.id, pack])
);

export function isKnownStylePack(id: string | undefined): id is string {
  return !!id && Object.prototype.hasOwnProperty.call(STYLE_PACKS_BY_ID, id);
}

export function getStylePack(id: string | undefined): StylePack | undefined {
  if (!id) return undefined;
  return STYLE_PACKS_BY_ID[id];
}

export function listStylePacks(): StylePack[] {
  return STYLE_PACKS;
}

/**
 * Builds a GlobalTheme object from a StylePack.
 * If options.keepColors is true, the current theme's colors are preserved.
 * Explicitly sets any unselected tokens to undefined so older tokens don't leak over.
 */
export function buildThemeFromPack(
  pack: StylePack,
  currentTheme?: GlobalTheme,
  options?: { keepColors?: boolean }
): GlobalTheme {
  const keepColors = options?.keepColors && currentTheme;

  const canvasBackground = keepColors
    ? currentTheme.canvasBackground
    : pack.colors.canvasBackground;
  const cardBackground = keepColors
    ? currentTheme.cardBackground
    : pack.colors.cardBackground;
  const borderColor = keepColors
    ? currentTheme.borderColor
    : pack.colors.borderColor;
  const accentColor = keepColors
    ? currentTheme.accentColor
    : pack.colors.accentColor;

  return {
    fontHeading: pack.fontHeading,
    fontBody: pack.fontBody,
    canvasBackground,
    cardBackground,
    borderColor,
    accentColor,
    tagColors: currentTheme?.tagColors,
    // Pack token bindings (explicit undefined clears former pack tokens)
    defaultFrame: pack.tokens.defaultFrame,
    defaultCorners: pack.tokens.defaultCorners,
    defaultShape: pack.tokens.defaultShape,
    defaultShading: pack.tokens.defaultShading,
    defaultGlow: pack.tokens.defaultGlow,
    defaultTexture: pack.tokens.defaultTexture,
    defaultPattern: pack.tokens.defaultPattern,
    cardPatternOpacity: pack.tokens.cardPatternOpacity,
    defaultScrim: pack.tokens.defaultScrim,
    canvasPattern: pack.tokens.canvasPattern,
    canvasPatternOpacity: pack.tokens.canvasPatternOpacity,
    canvasPatternScale: pack.tokens.canvasPatternScale,
    defaultWatermark: pack.tokens.defaultWatermark,
    watermarkOpacity: pack.tokens.watermarkOpacity,
    defaultWatermarkPosition: pack.tokens.defaultWatermarkPosition,
    canvasWatermark: pack.tokens.canvasWatermark,
    canvasWatermarkOpacity: pack.tokens.canvasWatermarkOpacity,
    canvasWatermarkPosition: pack.tokens.canvasWatermarkPosition,
    canvasWatermarkScale: pack.tokens.canvasWatermarkScale,
    defaultHeaderDivider: pack.tokens.defaultHeaderDivider,
    animation: undefined,
    packId: pack.id,
  };
}
