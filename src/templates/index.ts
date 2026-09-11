import type { Character } from "../types/schema";
import { dnd5eTemplate } from "./dnd5e";
import { blankTemplate } from "./blank";

export interface TemplateDefinition {
  id: string;
  name: string;
  system: string;
  description: string;
  badge: string;
  icon: string;
  template: Character;
}

export const BUILTIN_TEMPLATES: TemplateDefinition[] = [
  {
    id: "dnd5e",
    name: "D&D 5e (2024) Starter",
    system: "D&D 5e",
    description:
      "Official 2024 sheet inspired layout with Combat vitals, 6 ability scores, Spell Slots matrix, Attacks, Class Features, and Inventory.",
    badge: "Popular",
    icon: "⚔️",
    template: dnd5eTemplate,
  },
  {
    id: "blank",
    name: "Blank Canvas",
    system: "System-Agnostic",
    description:
      "A completely fresh, minimalist slate with a Profile, 4 core attributes, and notes. Perfect for building custom layouts.",
    badge: "Clean",
    icon: "📄",
    template: blankTemplate,
  },
];
