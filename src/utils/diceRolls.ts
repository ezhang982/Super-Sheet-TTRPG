/**
 * Utility for detecting dice notation patterns (e.g. "1d20+5", "2d6", "8d6 fire")
 * and formatting them for tabletop tools or rolling.
 */

// Matches patterns like "1d20", "2d6+4", "1d10 - 2", "3d8 + 10" in prose
export const DICE_REGEX = /\b(\d+d\d+(?:\s*[+-]\s*\d+)?)\b/gi;

/**
 * Checks if a standalone string represents valid dice notation (e.g. "2d6", "1d20+5", "d20").
 */
export function isDiceNotation(notation: string): boolean {
  const clean = notation.replace(/\s+/g, "");
  return /^\d*d\d+(?:[+-]\d+)?$/i.test(clean);
}

export interface DiceRollResult {
  notation: string;
  diceCount: number;
  diceSides: number;
  modifier: number;
  rolls: number[];
  total: number;
}

/**
 * Parses and rolls a dice notation string like "2d6 + 3" or "d20".
 */
export function rollDice(notation: string): DiceRollResult | null {
  const clean = notation.replace(/\s+/g, "");
  const match = clean.match(/^(\d*)d(\d+)(?:([+-])(\d+))?$/i);
  if (!match) return null;

  const count = match[1] ? parseInt(match[1], 10) : 1;
  const sides = parseInt(match[2], 10);
  const sign = match[3] === "-" ? -1 : 1;
  const mod = match[4] ? parseInt(match[4], 10) * sign : 0;

  if (count <= 0 || sides <= 0 || count > 100 || sides > 1000) return null;

  const rolls: number[] = [];
  let sum = 0;
  for (let i = 0; i < count; i++) {
    const roll = Math.floor(Math.random() * sides) + 1;
    rolls.push(roll);
    sum += roll;
  }

  return {
    notation,
    diceCount: count,
    diceSides: sides,
    modifier: mod,
    rolls,
    total: sum + mod,
  };
}

/**
 * Copies a dice command e.g. "/roll 1d20+5" to clipboard.
 */
export async function copyDiceCommand(notation: string): Promise<boolean> {
  const clean = notation.trim();
  const command = `/roll ${clean}`;
  try {
    await navigator.clipboard.writeText(command);
    return true;
  } catch {
    return false;
  }
}
