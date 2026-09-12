import type { Block } from "../types/schema";

/**
 * Keyword-to-Tag dictionary for Super Sheet.
 * Scans block text and suggests relevant tags for rest mechanics, action economy,
 * spells, equipment, and tabletop categorization.
 */
export const KEYWORD_TAG_MAP: Array<{ regex: RegExp; tag: string }> = [
  // Rest mechanics (vital for Rest Engine)
  { regex: /\bshort\s*rest\b/i, tag: "#short-rest" },
  { regex: /\blong\s*rest\b/i, tag: "#long-rest" },

  // Action economy
  { regex: /\bbonus\s*action\b/i, tag: "#bonus-action" },
  { regex: /\breaction\b/i, tag: "#reaction" },
  { regex: /\b(?<!bonus\s+)action\b/i, tag: "#action" },
  { regex: /\bpassive\b/i, tag: "#passive" },

  // Spellcasting & Magic
  { regex: /\bconcentration\b/i, tag: "#concentration" },
  { regex: /\britual\b/i, tag: "#ritual" },
  { regex: /\battunement\b|\battuned\b/i, tag: "#attunement" },
  { regex: /\bspells?\b|\bcantrips?\b|\bslot\b/i, tag: "#spell" },
  { regex: /\bmagical?\b|\barcane\b|\bdivine\b/i, tag: "#magic" },

  // Combat & Equipment
  { regex: /\bweapons?\b|\bmelee\b|\branged\b|\battack\b/i, tag: "#weapon" },
  { regex: /\barmou?r\b|\bshields?\b|\bac\b/i, tag: "#armor" },
  { regex: /\bdamage\b|\bslashing\b|\bpiercing\b|\bbludgeoning\b/i, tag: "#damage" },
  { regex: /\bsaving\s*throws?\b|\bsaves?\b/i, tag: "#save" },
  { regex: /\bheal(ing|s)?\b|\bcure\b|\bhit\s*points?\b|\bregain\b/i, tag: "#healing" },

  // Consumables & Items
  { regex: /\bpotions?\b|\belixir\b/i, tag: "#potion" },
  { regex: /\bscrolls?\b/i, tag: "#scroll" },
  { regex: /\btools?\b|\butility\b/i, tag: "#utility" },
  { regex: /\bresource\b|\bcharges?\b|\buses?\b/i, tag: "#resource" },
];

/**
 * Extracts searchable text corpus from a block.
 */
export function extractBlockCorpus(block: Block): string {
  const parts: string[] = [block.title];

  switch (block.type) {
    case "card":
      if (block.data.badge) parts.push(block.data.badge);
      if (block.data.description) parts.push(block.data.description);
      break;
    case "notes":
      if (block.data.markdown) parts.push(block.data.markdown);
      break;
    case "inventory":
      if (block.data.items) {
        for (const item of block.data.items) {
          parts.push(item.name);
          if (item.description) parts.push(item.description);
          if (item.tags) parts.push(...item.tags);
        }
      }
      break;
    case "stat_group":
      if (block.data.stats) {
        for (const s of block.data.stats) {
          parts.push(s.label);
          if (s.sub) parts.push(s.sub);
        }
      }
      break;
    case "tracker":
      // Title already included
      break;
    case "pip_array":
      if (block.data.rows) {
        for (const r of block.data.rows) {
          parts.push(r.label);
        }
      }
      break;
    case "skill_list":
      if (block.data.skills) {
        for (const sk of block.data.skills) {
          parts.push(sk.name);
        }
      }
      break;
    case "profile":
      if (block.data.characterName) parts.push(block.data.characterName);
      if (block.data.extraInfo) parts.push(block.data.extraInfo);
      break;
  }

  return parts.join(" ");
}

/**
 * Scans block text and returns up to `max` suggested tags that are not already present.
 */
export function getSuggestedTags(block: Block, max = 6): string[] {
  const corpus = extractBlockCorpus(block);
  if (!corpus.trim()) return [];

  const existingTags = new Set(block.tags.map((t) => t.toLowerCase()));
  const suggested: string[] = [];

  for (const { regex, tag } of KEYWORD_TAG_MAP) {
    if (!existingTags.has(tag.toLowerCase()) && regex.test(corpus)) {
      if (!suggested.includes(tag)) {
        suggested.push(tag);
        if (suggested.length >= max) break;
      }
    }
  }

  return suggested;
}
