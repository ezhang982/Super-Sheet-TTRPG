import { z } from "zod";

// =============================================================================
// PHASE 0 — CANONICAL SCHEMA
// This file is the single source of truth for the character data shape.
// TypeScript types are inferred below, never hand-duplicated. Runtime import
// validation (importCharacter) uses CharacterSchema.parse() directly.
// Do not add fields anywhere else that duplicate what's declared here.
// =============================================================================

// ---------- Meta ----------
const CharacterMetaSchema = z.object({
  id: z.string(),
  name: z.string(),
  system: z.string(), // free text, e.g. "D&D 5e", "Custom", "Blades in the Dark"
  createdAt: z.number(), // unix ms
  updatedAt: z.number(),
});

// ---------- Theme ----------
const GlobalThemeSchema = z.object({
  fontHeading: z.string(),
  fontBody: z.string(),
  canvasBackground: z.string(), // solid color, CSS gradient, or image URL
  cardBackground: z.string(),
  borderColor: z.string(),
  accentColor: z.string(),
});

const BlockStyleSchema = z
  .object({
    borderStyle: z.enum(["none", "solid", "double", "dashed", "groove", "ornate"]),
    borderColor: z.string(),
    backgroundOpacity: z.number().min(0).max(1),
    backgroundUrl: z.string(), // URL only — never an upload, keeps JSON/localStorage light
    headerBannerUrl: z.string(),
  })
  .partial(); // every field optional; unset falls back to global theme

// ---------- Tabs & Layout ----------
const TabSchema = z.object({
  id: z.string(),
  label: z.string(),
});

const LayoutItemSchema = z.object({
  i: z.string(), // block id — must match a key in `blocks`
  x: z.number().int().min(0).max(11),
  y: z.number().int().min(0),
  w: z.number().int().min(1).max(12),
  h: z.number().int().min(1),
});

// ---------- Block data payloads (one per primitive, §5 of blueprint) ----------
const TrackerDataSchema = z.object({
  current: z.number(),
  max: z.number(),
  temp: z.number().optional(),
  step: z.number().default(1),
});

const StatEntrySchema = z.object({
  label: z.string(),
  score: z.string(),
  sub: z.string(),
});

const StatGroupDataSchema = z.object({
  stats: z.array(StatEntrySchema),
});

const EmbeddedTrackerSchema = z.object({
  enabled: z.boolean(),
  current: z.number(),
  max: z.number(),
});

const CardDataSchema = z.object({
  badge: z.string().optional(),
  description: z.string(), // markdown
  tracker: EmbeddedTrackerSchema.optional(),
});

const PipRowSchema = z.object({
  label: z.string(),
  total: z.number().int().min(0),
  expended: z.number().int().min(0),
});

const PipArrayDataSchema = z.object({
  rows: z.array(PipRowSchema),
});

const NotesDataSchema = z.object({
  markdown: z.string(),
});

const ProfileDataSchema = z.object({
  characterName: z.string(),
  system: z.string(),
  level: z.string().optional(),
  experience: z.string().optional(),
  playerName: z.string().optional(),
  extraInfo: z.string().optional(),
});

const InventoryItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  quantity: z.number().default(1),
  weight: z.number().default(0),
  cost: z.string().optional(),
  equipped: z.boolean().default(false),
  description: z.string().default(""),
  tags: z.array(z.string()).default([]),
  charges: EmbeddedTrackerSchema.optional(),
});

const InventoryCapacitySchema = z.object({
  enabled: z.boolean().default(false),
  maxWeight: z.number().default(100),
});

const InventoryDataSchema = z.object({
  items: z.array(InventoryItemSchema),
  currency: z.record(z.string(), z.string()).optional(),
  capacity: InventoryCapacitySchema.optional(),
});

// ---------- Block discriminated union ----------
// Every block shares { id, title, tags, style }; `type` discriminates the
// `data` payload. tags[] is the ONLY reset/filter mechanism — no separate
// resetTrigger/resetTag field exists anywhere below (locked in v2, §6.1).
const BaseBlockFields = {
  id: z.string(),
  title: z.string(),
  tags: z.array(z.string()),
  style: BlockStyleSchema,
};

const TrackerBlockSchema = z.object({
  ...BaseBlockFields,
  type: z.literal("tracker"),
  data: TrackerDataSchema,
});

const StatGroupBlockSchema = z.object({
  ...BaseBlockFields,
  type: z.literal("stat_group"),
  data: StatGroupDataSchema,
});

const CardBlockSchema = z.object({
  ...BaseBlockFields,
  type: z.literal("card"),
  data: CardDataSchema,
});

const PipArrayBlockSchema = z.object({
  ...BaseBlockFields,
  type: z.literal("pip_array"),
  data: PipArrayDataSchema,
});

const NotesBlockSchema = z.object({
  ...BaseBlockFields,
  type: z.literal("notes"),
  data: NotesDataSchema,
});

const ProfileBlockSchema = z.object({
  ...BaseBlockFields,
  type: z.literal("profile"),
  data: ProfileDataSchema,
});

const InventoryBlockSchema = z.object({
  ...BaseBlockFields,
  type: z.literal("inventory"),
  data: InventoryDataSchema,
});

export const BlockSchema = z.discriminatedUnion("type", [
  TrackerBlockSchema,
  StatGroupBlockSchema,
  CardBlockSchema,
  PipArrayBlockSchema,
  NotesBlockSchema,
  ProfileBlockSchema,
  InventoryBlockSchema,
]);

// ---------- Root character document ----------
export const CharacterSchema = z.object({
  version: z.string(), // schema version, e.g. "2.0.0" — see CLAUDE.md "Schema versioning"
  meta: CharacterMetaSchema,
  theme: GlobalThemeSchema,
  tabs: z.array(TabSchema),
  activeTabId: z.string(),
  layouts: z.record(z.string(), z.array(LayoutItemSchema)), // tabId -> layout items
  blocks: z.record(z.string(), BlockSchema), // blockId -> block
});

// ---------- Inferred types (never hand-write these separately) ----------
export type Character = z.infer<typeof CharacterSchema>;
export type Block = z.infer<typeof BlockSchema>;
export type BlockType = Block["type"];
export type Tab = z.infer<typeof TabSchema>;
export type LayoutItem = z.infer<typeof LayoutItemSchema>;
export type GlobalTheme = z.infer<typeof GlobalThemeSchema>;
export type BlockStyle = z.infer<typeof BlockStyleSchema>;
export type CharacterMeta = z.infer<typeof CharacterMetaSchema>;
export type InventoryItem = z.infer<typeof InventoryItemSchema>;
export type InventoryData = z.infer<typeof InventoryDataSchema>;
export type InventoryBlock = z.infer<typeof InventoryBlockSchema>;

// ---------- Reserved reset-tag vocabulary ----------
// Reset tags are ordinary strings in `tags[]` — the schema does not special-
// case them. These are only the tags the app SEEDS the Rest Action Bar with
// by default; the bar itself is user-extensible (see CLAUDE.md "Rest
// Actions"), so this list is a default, not an enum enforced at the schema
// level.
export const DEFAULT_REST_TAGS = ["#short-rest", "#long-rest"] as const;
