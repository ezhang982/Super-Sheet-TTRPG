import { useMemo } from "react";
import { useCharacterStore } from "./useCharacterStore";
import { extractCharacterVariables, getCharacterVariableDetails, type VariableDetail } from "../utils/mathEngine";

export function useCharacterVariables(): Record<string, number> {
  const character = useCharacterStore((state) => state.character);
  return useMemo(() => extractCharacterVariables(character), [character]);
}

export function useCharacterVariableDetails(): VariableDetail[] {
  const character = useCharacterStore((state) => state.character);
  return useMemo(() => getCharacterVariableDetails(character), [character]);
}
