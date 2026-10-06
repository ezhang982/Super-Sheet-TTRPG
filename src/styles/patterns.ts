import type {
  BackgroundLayer,
  PatternContext,
  PatternDefinition,
  TextureDefinition,
} from "./types";

// =============================================================================
// PATTERNS & TEXTURES REGISTRY (part of the style registry; see registry.ts)
//
// Patterns are tileable and work on the canvas AND on cards. Each is either a
// CSS gradient or an inline SVG data URI. SVG data URIs cannot read CSS custom
// properties, so patterns receive a LITERAL color and are regenerated when the
// theme changes (they are cheap string builders; no caching needed yet).
//
// Strength: `ctx.opacity` (0..1) scales each pattern's designed maximum alpha.
// Those maximums are deliberately low (<= ~0.35) so text stays readable even
// at full strength.
// =============================================================================

export const FALLBACK_PATTERN_ID = "none";
export const FALLBACK_TEXTURE_ID = "none";

/** `color` at `alpha` (0..1) as a CSS color. */
function withAlpha(color: string, alpha: number): string {
  const pct = Math.round(Math.max(0, Math.min(1, alpha)) * 1000) / 10;
  return `color-mix(in srgb, ${color} ${pct}%, transparent)`;
}

function px(n: number, scale: number): string {
  return `${Math.round(n * scale * 100) / 100}px`;
}

function svgUrl(svg: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

// ---------- Patterns ----------

const PATTERN_LIST: PatternDefinition[] = [
  { id: "none", label: "None", render: () => undefined },
  {
    id: "dots",
    label: "Dot Matrix",
    render: ({ color, opacity, scale }) => ({
      image: `radial-gradient(circle, ${withAlpha(color, 0.4 * opacity)} 1.2px, transparent 1.7px)`,
      size: px(18, scale),
      repeat: "repeat",
    }),
  },
  {
    id: "grid",
    label: "Cyber Grid",
    render: ({ color, opacity, scale }) => {
      const line = withAlpha(color, 0.3 * opacity);
      return {
        image: `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`,
        size: `${px(28, scale)} ${px(28, scale)}, ${px(28, scale)} ${px(28, scale)}`,
        repeat: "repeat",
      };
    },
  },
  {
    id: "blueprint",
    label: "Blueprint",
    render: ({ color, opacity, scale }) => {
      const minor = withAlpha(color, 0.14 * opacity);
      const major = withAlpha(color, 0.32 * opacity);
      const s1 = `${px(14, scale)} ${px(14, scale)}`;
      const s2 = `${px(70, scale)} ${px(70, scale)}`;
      return {
        image: [
          `linear-gradient(${major} 1px, transparent 1px)`,
          `linear-gradient(90deg, ${major} 1px, transparent 1px)`,
          `linear-gradient(${minor} 1px, transparent 1px)`,
          `linear-gradient(90deg, ${minor} 1px, transparent 1px)`,
        ].join(", "),
        size: [s2, s2, s1, s1].join(", "),
        repeat: "repeat",
      };
    },
  },
  {
    id: "hatch",
    label: "Diagonal Hatch",
    render: ({ color, opacity, scale }) => ({
      image: `repeating-linear-gradient(45deg, ${withAlpha(color, 0.28 * opacity)} 0 1px, transparent 1px ${px(10, scale)})`,
      size: "auto",
      repeat: "repeat",
    }),
  },
  {
    id: "hex-mesh",
    label: "Hex Mesh",
    render: ({ color, opacity, scale }) => {
      // Seamless flat-top honeycomb, side 16: tile 48 x 55.43.
      const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="55.43" viewBox="0 0 48 55.43">` +
        `<g fill="none" stroke="${color}" stroke-opacity="${round(0.32 * opacity)}" stroke-width="1">` +
        `<path d="M16 0L32 0L40 13.86L32 27.71L16 27.71L8 13.86Z"/>` +
        `<path d="M16 27.71L32 27.71L40 41.57L32 55.43L16 55.43L8 41.57Z"/>` +
        `<path d="M0 13.86L8 13.86M40 13.86L48 13.86M0 41.57L8 41.57M40 41.57L48 41.57"/>` +
        `</g></svg>`;
      return { image: svgUrl(svg), size: `${px(48, scale)} ${px(55.43, scale)}`, repeat: "repeat" };
    },
  },
  {
    id: "constellation",
    label: "Constellation",
    render: ({ color, opacity, scale }) => {
      const stars: Array<[number, number, number]> = [
        [20, 30, 1.7], [70, 18, 1.2], [120, 48, 1.9], [90, 100, 1.5],
        [40, 122, 1.2], [146, 110, 1.3], [150, 18, 1], [12, 86, 1],
      ];
      const links = "M20 30L70 18L120 48L90 100L40 122M120 48L146 110";
      const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">` +
        `<path d="${links}" fill="none" stroke="${color}" stroke-opacity="${round(0.18 * opacity)}" stroke-width="0.8"/>` +
        `<g fill="${color}" fill-opacity="${round(0.45 * opacity)}">` +
        stars.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join("") +
        `</g></svg>`;
      return { image: svgUrl(svg), size: `${px(160, scale)} ${px(160, scale)}`, repeat: "repeat" };
    },
  },
  {
    id: "speckle",
    label: "Parchment Speckle",
    render: ({ color, opacity, scale }) => {
      const dots: Array<[number, number, number]> = [
        [8, 12, 0.8], [27, 60, 0.6], [41, 22, 1.1], [58, 91, 0.7], [73, 40, 0.5],
        [90, 8, 0.9], [104, 74, 0.6], [112, 108, 1], [20, 104, 0.7], [66, 66, 0.5],
        [96, 52, 0.5], [34, 84, 0.5], [50, 4, 0.6], [118, 28, 0.7], [6, 70, 0.5],
        [80, 114, 0.6], [14, 40, 0.4], [108, 92, 0.4], [60, 116, 0.5], [44, 50, 0.4],
      ];
      const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">` +
        `<g fill="${color}" fill-opacity="${round(0.5 * opacity)}">` +
        dots.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join("") +
        `</g></svg>`;
      return { image: svgUrl(svg), size: `${px(120, scale)} ${px(120, scale)}`, repeat: "repeat" };
    },
  },
];

const PATTERNS: Record<string, PatternDefinition> = Object.fromEntries(
  PATTERN_LIST.map((p) => [p.id, p])
);

export function isKnownPattern(id: string | undefined): id is string {
  return !!id && Object.prototype.hasOwnProperty.call(PATTERNS, id);
}

export function getPattern(id: string | undefined): PatternDefinition {
  return isKnownPattern(id) ? PATTERNS[id] : PATTERNS[FALLBACK_PATTERN_ID];
}

export function listPatterns(): PatternDefinition[] {
  return PATTERN_LIST;
}

/** Convenience: render a pattern by id (undefined for none/unknown). */
export function renderPattern(
  id: string | undefined,
  ctx: PatternContext
): BackgroundLayer | undefined {
  return getPattern(id).render(ctx);
}

// ---------- Card textures ----------

const GRAIN_SVG =
  `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128">` +
  `<filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/>` +
  `<feColorMatrix type="saturate" values="0"/></filter>` +
  `<rect width="100%" height="100%" filter="url(#n)" opacity="0.1"/></svg>`;

const TEXTURE_LIST: TextureDefinition[] = [
  { id: "none", label: "Flat" },
  {
    id: "grain",
    label: "Subtle Grain",
    layer: { image: svgUrl(GRAIN_SVG), size: "128px 128px", repeat: "repeat", position: "0 0" },
  },
  {
    id: "carbon",
    label: "Carbon Weave",
    layer: {
      image:
        "repeating-linear-gradient(45deg, rgba(255,255,255,0.045) 0 2px, rgba(0,0,0,0.2) 2px 4px), " +
        "repeating-linear-gradient(-45deg, rgba(255,255,255,0.03) 0 2px, rgba(0,0,0,0.16) 2px 4px)",
      size: "auto, auto",
      repeat: "repeat",
    },
  },
  {
    id: "scanlines",
    label: "Scanlines",
    layer: {
      image: "repeating-linear-gradient(0deg, rgba(0,0,0,0.28) 0 1px, transparent 1px 3px)",
      size: "auto",
      repeat: "repeat",
    },
  },
  {
    // backdrop-filter is applied in App.css (`.texture-glass`); opt-in only
    // because blur is the most expensive effect when many cards use it.
    id: "glass",
    label: "Frosted Glass",
    layer: {
      image: "linear-gradient(135deg, rgba(255,255,255,0.12), transparent 45%)",
      size: "100% 100%",
      repeat: "no-repeat",
    },
    className: "texture-glass",
    shadow: "inset 0 1px 0 rgba(255, 255, 255, 0.18)",
    translucentBg: 0.55,
  },
];

const TEXTURES: Record<string, TextureDefinition> = Object.fromEntries(
  TEXTURE_LIST.map((t) => [t.id, t])
);

export function isKnownTexture(id: string | undefined): id is string {
  return !!id && Object.prototype.hasOwnProperty.call(TEXTURES, id);
}

export function getTexture(id: string | undefined): TextureDefinition {
  return isKnownTexture(id) ? TEXTURES[id] : TEXTURES[FALLBACK_TEXTURE_ID];
}

export function listTextures(): TextureDefinition[] {
  return TEXTURE_LIST;
}
