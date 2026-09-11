import type { Character } from "../types/schema";

export const blankTemplate: Character = {
  version: "2.0.0",
  meta: {
    id: "template_blank",
    name: "Blank Canvas",
    system: "Custom",
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  },
  theme: {
    fontHeading: "Cinzel, serif",
    fontBody: "Inter, sans-serif",
    canvasBackground: "#121316",
    cardBackground: "#1c1e24",
    borderColor: "#2f333d",
    accentColor: "#61afef",
  },
  tabs: [{ id: "tab_main", label: "Main Sheet" }],
  activeTabId: "tab_main",
  layouts: {
    tab_main: [
      { i: "block_blank_profile", x: 0, y: 0, w: 6, h: 3 },
      { i: "block_blank_stats", x: 6, y: 0, w: 6, h: 3 },
      { i: "block_blank_notes", x: 0, y: 3, w: 12, h: 4 },
    ],
  },
  blocks: {
    block_blank_profile: {
      id: "block_blank_profile",
      type: "profile",
      title: "Character Profile",
      tags: ["#core", "#identity"],
      data: {
        characterName: "",
        system: "Custom",
        level: "1",
        experience: "",
        playerName: "",
        extraInfo: "",
      },
      style: {},
    },
    block_blank_stats: {
      id: "block_blank_stats",
      type: "stat_group",
      title: "Core Attributes",
      tags: ["#core", "#stats"],
      data: {
        stats: [
          { label: "MIGHT", score: "10", sub: "+0" },
          { label: "AGILITY", score: "10", sub: "+0" },
          { label: "WITS", score: "10", sub: "+0" },
          { label: "RESOLVE", score: "10", sub: "+0" },
        ],
      },
      style: {},
    },
    block_blank_notes: {
      id: "block_blank_notes",
      type: "notes",
      title: "Notes & Rules",
      tags: ["#notes"],
      data: {
        markdown: "### Welcome to your new sheet!\nClick **+ Add Block** to add trackers, feature cards, or pip matrices.",
      },
      style: {},
    },
  },
};
