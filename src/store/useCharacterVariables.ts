import { useCharacterStore } from "./useCharacterStore";
import {
  extractCharacterVariables,
  getCharacterVariableDetails,
  type VariableDetail,
} from "../utils/mathEngine";
import type { Character } from "../types/schema";

let lastCharForVars: Character | null = null;
let cachedVars: Record<string, number> = {};

/**
 * Returns a referentially stable dictionary of character variables (@NAME -> value).
 * Only recomputes when the character document reference actually changes.
 */
export function getCachedCharacterVariables(character: Character): Record<string, number> {
  if (character === lastCharForVars) {
    return cachedVars;
  }
  lastCharForVars = character;
  cachedVars = extractCharacterVariables(character);
  return cachedVars;
}

let lastCharForDetails: Character | null = null;
let cachedDetails: VariableDetail[] = [];

/**
 * Returns a referentially stable list of variable details for autocomplete and pickers.
 * Only recomputes when the character document reference actually changes.
 */
export function getCachedCharacterVariableDetails(character: Character): VariableDetail[] {
  if (character === lastCharForDetails) {
    return cachedDetails;
  }
  lastCharForDetails = character;
  cachedDetails = getCharacterVariableDetails(character);
  return cachedDetails;
}

export function useCharacterVariables(): Record<string, number> {
  return useCharacterStore((state) => getCachedCharacterVariables(state.character));
}

export function useCharacterVariableDetails(): VariableDetail[] {
  return useCharacterStore((state) => getCachedCharacterVariableDetails(state.character));
}

