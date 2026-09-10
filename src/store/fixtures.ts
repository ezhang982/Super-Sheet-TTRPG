import type { Character } from "../types/schema";

export const createDefaultCharacter = (): Character => ({
  version: "2.0.0",
  meta: {
    id: `char_${crypto.randomUUID()}`,
    name: "Valerius Drake",
    system: "Custom / D&D 5e",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  theme: {
    fontHeading: "Cinzel, serif",
    fontBody: "Inter, sans-serif",
    canvasBackground: "#121316",
    cardBackground: "#1c1e24",
    borderColor: "#2f333d",
    accentColor: "#e06c75",
  },
  tabs: [
    { id: "tab_main", label: "Combat & Core" },
    { id: "tab_notes", label: "Journal & Lore" },
  ],
  activeTabId: "tab_main",
  layouts: {
    tab_main: [
      { i: "block_profile", x: 0, y: 0, w: 5, h: 3 },
      { i: "block_hp", x: 5, y: 0, w: 7, h: 3 },
      { i: "block_stats", x: 0, y: 3, w: 12, h: 2 },
      { i: "block_action", x: 0, y: 5, w: 6, h: 3 },
      { i: "block_slots", x: 6, y: 5, w: 6, h: 3 },
    ],
    tab_notes: [
      { i: "block_backstory", x: 0, y: 0, w: 12, h: 5 },
    ],
  },
  blocks: {
    block_profile: {
      id: "block_profile",
      type: "profile",
      title: "Character Profile",
      tags: ["#core", "#identity"],
      data: {
        characterName: "Valerius Drake",
        system: "Custom / D&D 5e",
        level: "5",
        experience: "6,500 XP",
        playerName: "Eden",
        extraInfo: "Oath of the Crown Paladin",
      },
      style: {},
    },
    block_hp: {
      id: "block_hp",
      type: "tracker",
      title: "Hit Points",
      tags: ["#core", "#health", "#short-rest"],
      data: {
        current: 48,
        max: 52,
        temp: 5,
        step: 1,
      },
      style: {
        borderColor: "#e06c75",
      },
    },
    block_stats: {
      id: "block_stats",
      type: "stat_group",
      title: "Attributes",
      tags: ["#core", "#stats"],
      data: {
        stats: [
          { label: "STR", score: "18", sub: "+4" },
          { label: "DEX", score: "14", sub: "+2" },
          { label: "CON", score: "16", sub: "+3" },
          { label: "INT", score: "10", sub: "+0" },
          { label: "WIS", score: "12", sub: "+1" },
          { label: "CHA", score: "8", sub: "-1" },
        ],
      },
      style: {},
    },
    block_action: {
      id: "block_action",
      type: "card",
      title: "Action Surge",
      tags: ["#action", "#short-rest", "#fighter"],
      data: {
        badge: "Action",
        description: "Take one additional action on your turn.",
        tracker: {
          enabled: true,
          current: 1,
          max: 1,
        },
      },
      style: {
        borderStyle: "double",
        borderColor: "#e5c07b",
      },
    },
    block_slots: {
      id: "block_slots",
      type: "pip_array",
      title: "Spell Slots",
      tags: ["#magic", "#long-rest"],
      data: {
        rows: [
          { label: "1st Level", total: 4, expended: 1 },
          { label: "2nd Level", total: 3, expended: 0 },
        ],
      },
      style: {},
    },
    block_backstory: {
      id: "block_backstory",
      type: "notes",
      title: "Character Background",
      tags: ["#lore", "#roleplay"],
      data: {
        markdown: "### Origins\nExiled knight from the northern provinces seeking redemption.",
      },
      style: {},
    },
  },
});
