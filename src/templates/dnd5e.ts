import type { Character } from "../types/schema";

export const dnd5eTemplate: Character = {
  version: "2.0.0",
  meta: {
    id: "template_dnd5e",
    name: "D&D 5e (2024) Starter",
    system: "D&D 5e",
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
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
    { id: "tab_core", label: "Combat & Core" },
    { id: "tab_spells", label: "Spells & Magic" },
    { id: "tab_features", label: "Features & Traits" },
    { id: "tab_inventory", label: "Inventory & Lore" },
  ],
  activeTabId: "tab_core",
  layouts: {
    tab_core: [
      { i: "block_dnd_profile", x: 0, y: 0, w: 7, h: 3 },
      { i: "block_dnd_hp", x: 7, y: 0, w: 5, h: 3 },
      { i: "block_dnd_vitals", x: 0, y: 3, w: 7, h: 2 },
      { i: "block_dnd_hit_dice", x: 7, y: 3, w: 5, h: 2 },
      { i: "block_dnd_attributes", x: 0, y: 5, w: 12, h: 2 },
      { i: "block_dnd_saves_insp", x: 0, y: 7, w: 6, h: 3 },
      { i: "block_dnd_attacks", x: 6, y: 7, w: 6, h: 3 },
      { i: "block_dnd_skills", x: 0, y: 10, w: 12, h: 5 },
    ],
    tab_spells: [
      { i: "block_dnd_spell_stats", x: 0, y: 0, w: 12, h: 2 },
      { i: "block_dnd_spell_slots", x: 0, y: 2, w: 6, h: 4 },
      { i: "block_dnd_cantrips", x: 6, y: 2, w: 6, h: 4 },
      { i: "block_dnd_prepared_spells", x: 0, y: 6, w: 12, h: 4 },
    ],
    tab_features: [
      { i: "block_dnd_class_features", x: 0, y: 0, w: 6, h: 4 },
      { i: "block_dnd_species_traits", x: 6, y: 0, w: 6, h: 4 },
      { i: "block_dnd_feats", x: 0, y: 4, w: 12, h: 4 },
    ],
    tab_inventory: [
      { i: "block_dnd_equipment", x: 0, y: 0, w: 12, h: 5 },
      { i: "block_dnd_notes", x: 0, y: 5, w: 12, h: 4 },
    ],
  },
  blocks: {
    // ---- Tab 1: Core ----
    block_dnd_profile: {
      id: "block_dnd_profile",
      type: "profile",
      title: "Character Identity",
      tags: ["#core", "#identity"],
      data: {
        characterName: "",
        system: "D&D 5e (2024)",
        level: "1",
        experience: "0 XP",
        playerName: "",
        extraInfo: "Class: Fighter | Species: Human | Background: Soldier",
      },
      style: {},
    },
    block_dnd_hp: {
      id: "block_dnd_hp",
      type: "tracker",
      title: "Hit Points",
      tags: ["#core", "#health", "#short-rest", "#long-rest"],
      data: {
        current: 12,
        max: 12,
        temp: 0,
        step: 1,
      },
      style: {
        borderColor: "#e06c75",
      },
    },
    block_dnd_vitals: {
      id: "block_dnd_vitals",
      type: "stat_group",
      title: "Combat Vitals",
      tags: ["#core", "#combat"],
      data: {
        stats: [
          { label: "ARMOR CLASS", score: "10", sub: "Shield: +0" },
          { label: "INITIATIVE", score: "+0", sub: "DEX" },
          { label: "SPEED", score: "30 ft", sub: "Walk" },
          { label: "PROFICIENCY", score: "+2", sub: "Bonus" },
        ],
      },
      style: {},
    },
    block_dnd_hit_dice: {
      id: "block_dnd_hit_dice",
      type: "tracker",
      title: "Hit Dice (d10)",
      tags: ["#health", "#long-rest"],
      data: {
        current: 1,
        max: 1,
        temp: 0,
        step: 1,
      },
      style: {},
    },
    block_dnd_attributes: {
      id: "block_dnd_attributes",
      type: "stat_group",
      title: "Ability Scores",
      tags: ["#core", "#stats"],
      data: {
        stats: [
          { label: "STR", score: "10", sub: "+0" },
          { label: "DEX", score: "10", sub: "+0" },
          { label: "CON", score: "10", sub: "+0" },
          { label: "INT", score: "10", sub: "+0" },
          { label: "WIS", score: "10", sub: "+0" },
          { label: "CHA", score: "10", sub: "+0" },
        ],
      },
      style: {},
    },
    block_dnd_saves_insp: {
      id: "block_dnd_saves_insp",
      type: "pip_array",
      title: "Death Saves & Inspiration",
      tags: ["#combat", "#core"],
      data: {
        rows: [
          { label: "Death Saves (Success)", total: 3, expended: 0 },
          { label: "Death Saves (Failure)", total: 3, expended: 0 },
          { label: "Heroic Inspiration", total: 1, expended: 0 },
        ],
      },
      style: {},
    },
    block_dnd_attacks: {
      id: "block_dnd_attacks",
      type: "card",
      title: "Weapons & Attacks",
      tags: ["#combat", "#action"],
      data: {
        badge: "Action",
        description:
          "| Name | Atk / DC | Damage & Type | Notes |\n| :--- | :--- | :--- | :--- |\n| **Longsword** | +4 | 1d8+2 Slashing | Versatile (1d10) |\n| **Shortbow** | +4 | 1d6+2 Piercing | Range 80/320 |",
      },
      style: {},
    },
    block_dnd_skills: {
      id: "block_dnd_skills",
      type: "skill_list",
      title: "Skills & Proficiencies",
      tags: ["#core", "#skills"],
      data: {
        sortMode: "alpha",
        skills: [
          { id: "sk_acro", name: "Acrobatics", stat: "DEX", value: "+2", proficiency: 0 },
          { id: "sk_anim", name: "Animal Handling", stat: "WIS", value: "+1", proficiency: 0 },
          { id: "sk_arca", name: "Arcana", stat: "INT", value: "+0", proficiency: 0 },
          { id: "sk_athl", name: "Athletics", stat: "STR", value: "+4", proficiency: 1 },
          { id: "sk_dece", name: "Deception", stat: "CHA", value: "+0", proficiency: 0 },
          { id: "sk_hist", name: "History", stat: "INT", value: "+0", proficiency: 0 },
          { id: "sk_insi", name: "Insight", stat: "WIS", value: "+1", proficiency: 0 },
          { id: "sk_inti", name: "Intimidation", stat: "CHA", value: "+2", proficiency: 1 },
          { id: "sk_inve", name: "Investigation", stat: "INT", value: "+0", proficiency: 0 },
          { id: "sk_medi", name: "Medicine", stat: "WIS", value: "+1", proficiency: 0 },
          { id: "sk_natu", name: "Nature", stat: "INT", value: "+0", proficiency: 0 },
          { id: "sk_perc", name: "Perception", stat: "WIS", value: "+3", proficiency: 1 },
          { id: "sk_perf", name: "Performance", stat: "CHA", value: "+0", proficiency: 0 },
          { id: "sk_pers", name: "Persuasion", stat: "CHA", value: "+0", proficiency: 0 },
          { id: "sk_reli", name: "Religion", stat: "INT", value: "+0", proficiency: 0 },
          { id: "sk_slei", name: "Sleight of Hand", stat: "DEX", value: "+2", proficiency: 0 },
          { id: "sk_stea", name: "Stealth", stat: "DEX", value: "+2", proficiency: 0 },
          { id: "sk_surv", name: "Survival", stat: "WIS", value: "+3", proficiency: 1 },
        ],
      },
      style: {},
    },

    // ---- Tab 2: Spells & Magic ----
    block_dnd_spell_stats: {
      id: "block_dnd_spell_stats",
      type: "stat_group",
      title: "Spellcasting Metrics",
      tags: ["#magic", "#stats"],
      data: {
        stats: [
          { label: "SPELL DC", score: "12", sub: "Save DC" },
          { label: "SPELL ATTACK", score: "+4", sub: "Bonus" },
          { label: "ABILITY", score: "INT", sub: "Spellcasting" },
          { label: "PREPARED", score: "4", sub: "Spells" },
        ],
      },
      style: {},
    },
    block_dnd_spell_slots: {
      id: "block_dnd_spell_slots",
      type: "pip_array",
      title: "Spell Slots",
      tags: ["#magic", "#long-rest"],
      data: {
        rows: [
          { label: "1st Level", total: 4, expended: 0 },
          { label: "2nd Level", total: 3, expended: 0 },
          { label: "3rd Level", total: 3, expended: 0 },
          { label: "4th Level", total: 3, expended: 0 },
          { label: "5th Level", total: 2, expended: 0 },
        ],
      },
      style: {
        borderColor: "#98c379",
      },
    },
    block_dnd_cantrips: {
      id: "block_dnd_cantrips",
      type: "card",
      title: "Cantrips Known",
      tags: ["#magic", "#cantrip"],
      data: {
        badge: "At Will",
        description:
          "- **Fire Bolt:** 1 Action | 120 ft | 1d10 Fire\n- **Mage Hand:** 1 Action | 30 ft | Utility hand\n- **Prestidigitation:** 1 Action | 10 ft | Minor magic trick",
      },
      style: {},
    },
    block_dnd_prepared_spells: {
      id: "block_dnd_prepared_spells",
      type: "card",
      title: "Prepared Spells",
      tags: ["#magic", "#prepared", "#long-rest"],
      data: {
        badge: "Spellbook",
        description:
          "### 1st Level\n- **Shield:** Reaction | Self | +5 AC until next turn\n- **Magic Missile:** 1 Action | 120 ft | 3 darts for 1d4+1 Force each\n- **Detect Magic:** 1 Action (Ritual) | Self | 30 ft aura",
        tracker: {
          enabled: true,
          current: 4,
          max: 4,
        },
      },
      style: {},
    },

    // ---- Tab 3: Features & Traits ----
    block_dnd_class_features: {
      id: "block_dnd_class_features",
      type: "card",
      title: "Class Features",
      tags: ["#class", "#feature", "#short-rest"],
      data: {
        badge: "Class",
        description:
          "### Second Wind\nYou have a well of stamina to regain hit points. On your turn, use a Bonus Action to regain `1d10 + Fighter Level` HP.\n\n### Fighting Style\nChoose a specialized fighting style bonus (e.g. Defense +1 AC, Archery +2 Atk).",
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
    block_dnd_species_traits: {
      id: "block_dnd_species_traits",
      type: "card",
      title: "Species Traits",
      tags: ["#species", "#lore"],
      data: {
        badge: "Species",
        description:
          "### Resourceful\nYou gain Heroic Inspiration whenever you finish a Long Rest.\n\n### Skillful\nYou gain proficiency in one skill of your choice.",
      },
      style: {},
    },
    block_dnd_feats: {
      id: "block_dnd_feats",
      type: "card",
      title: "Feats & Training",
      tags: ["#feat", "#passive"],
      data: {
        badge: "Feat",
        description:
          "### Alert (Origin Feat)\n- **Initiative Proficiency:** Add your Proficiency Bonus to Initiative rolls.\n- **Initiative Swap:** Swap initiative with a willing ally.",
      },
      style: {},
    },

    // ---- Tab 4: Inventory & Lore ----
    block_dnd_equipment: {
      id: "block_dnd_equipment",
      type: "inventory",
      title: "Equipment & Backpack",
      tags: ["#equipment", "#gear"],
      data: {
        items: [
          {
            id: "item_chainmail",
            name: "Chain Mail",
            quantity: 1,
            weight: 55,
            cost: "75 gp",
            equipped: true,
            description: "AC 16. Stealth disadvantage. Str 13 required.",
            tags: ["#armor"],
          },
          {
            id: "item_pack",
            name: "Dungeoneer's Pack",
            quantity: 1,
            weight: 35,
            cost: "12 gp",
            equipped: true,
            description: "Backpack, crowbar, hammer, 10 pitons, 10 torches, tinderbox, 10 days rations, waterskin, 50ft rope.",
            tags: ["#gear"],
          },
          {
            id: "item_potion",
            name: "Potion of Healing",
            quantity: 2,
            weight: 0.5,
            cost: "50 gp",
            equipped: false,
            description: "Restores 2d4 + 2 Hit Points as an Action or Bonus Action.",
            tags: ["#consumable"],
          },
        ],
        currency: {
          CP: "10",
          SP: "5",
          EP: "0",
          GP: "25",
          PP: "0",
        },
        capacity: {
          enabled: true,
          maxWeight: 150,
        },
      },
      style: {},
    },
    block_dnd_notes: {
      id: "block_dnd_notes",
      type: "notes",
      title: "Backstory & Languages",
      tags: ["#lore", "#roleplay"],
      data: {
        markdown:
          "### Backstory\nVeteran of the regional border wars, honoring a personal oath.\n\n### Languages\n- Common\n- Dwarvish\n\n### Alignment & Personality\n- **Alignment:** Lawful Good\n- **Personality Trait:** Always ready to stand between danger and those who cannot protect themselves.",
      },
      style: {},
    },
  },
};
