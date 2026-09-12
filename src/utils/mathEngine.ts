/**
 * mathEngine.ts — Safe, system-agnostic math calculation & formula engine for Super Sheet.
 *
 * Capabilities:
 * 1. Quick-Math Evaluation for Counters (relative inputs like +10, -5, *2, /2)
 * 2. Character Variable Extraction (@STR, @STR.mod, @Level, @HP.current, #prof:3)
 * 3. Safe Formula Evaluation (= 10 + @DEX.mod + @Prof, floor((@STR - 10) / 2))
 * 4. Error states (#REF!, #CIRCULAR!, #SYNTAX!) with human-readable explanations.
 */

import type { Character } from "../types/schema";

export interface FormulaResult {
  value: number | null;
  formatted: string;
  error?: "REF" | "SYNTAX" | "CIRCULAR" | "DIV_ZERO";
  unresolved?: string[];
  explanation?: string;
}

// -----------------------------------------------------------------------------
// 1. Quick-Math Evaluator for Counters & Steppers
// -----------------------------------------------------------------------------

/**
 * Evaluates relative arithmetic or direct numerical expressions entered into counters.
 * Examples:
 *   evaluateQuickMath(48, "+10") => 58
 *   evaluateQuickMath(48, "-14", 0) => 34
 *   evaluateQuickMath(20, "/2") => 10
 *   evaluateQuickMath(10, "*2") => 20
 *   evaluateQuickMath(10, "50") => 50
 *   evaluateQuickMath(10, "20 - 5") => 15
 */
export function evaluateQuickMath(
  current: number,
  input: string,
  min?: number,
  max?: number
): number {
  const trimmed = input.trim();
  if (!trimmed) return current;

  let result = current;

  // Relative operations
  if (trimmed.startsWith("+")) {
    const delta = parseFloat(trimmed.slice(1).trim());
    if (!isNaN(delta)) {
      result = current + delta;
    }
  } else if (trimmed.startsWith("-")) {
    const delta = parseFloat(trimmed.slice(1).trim());
    if (!isNaN(delta)) {
      result = current - delta;
    }
  } else if (trimmed.startsWith("*") || trimmed.startsWith("x") || trimmed.startsWith("X")) {
    const factor = parseFloat(trimmed.slice(1).trim());
    if (!isNaN(factor)) {
      result = current * factor;
    }
  } else if (trimmed.startsWith("/")) {
    const divisor = parseFloat(trimmed.slice(1).trim());
    if (!isNaN(divisor) && divisor !== 0) {
      result = Math.floor(current / divisor);
    }
  } else {
    // Try evaluating as a standalone direct expression (e.g. "45" or "10 + 5")
    const evaluated = evaluateSimpleExpression(trimmed);
    if (evaluated !== null && !isNaN(evaluated)) {
      result = evaluated;
    }
  }

  // Bounds clamping
  if (min !== undefined && result < min) {
    result = min;
  }
  if (max !== undefined && result > max) {
    result = max;
  }

  // Clean rounding to avoid floating point imprecision (e.g. 0.30000000000000004)
  return Math.round(result * 100) / 100;
}

// -----------------------------------------------------------------------------
// 2. Character Variable Extractor
// -----------------------------------------------------------------------------

export interface VariableDetail {
  name: string;
  value: number;
  displayVal: string;
  category: "Attributes" | "Vitals & Combat" | "Resources & Trackers" | "Profile & Tags";
  description?: string;
}

// -----------------------------------------------------------------------------
// 2. Character Variable Extractor
// -----------------------------------------------------------------------------

/**
 * Extracts a dictionary of variable references (@NAME) from a Character document.
 */
export function extractCharacterVariables(character: Character): Record<string, number> {
  const vars: Record<string, number> = {};

  if (!character || !character.blocks) return vars;

  for (const block of Object.values(character.blocks)) {
    // Stat Groups (@STR, @STR.mod, @AC, @Prof, etc.)
    if (block.type === "stat_group" && block.data?.stats) {
      for (const stat of block.data.stats) {
        const rawLabel = stat.label?.trim();
        if (!rawLabel) continue;

        const cleanKey = rawLabel.replace(/[^a-zA-Z0-9_]/g, "").toUpperCase();
        if (!cleanKey) continue;

        // Parse Score (e.g. "18", "+2", "30 ft" -> 30)
        const scoreMatch = stat.score?.match(/([+-]?\d+(?:\.\d+)?)/);
        if (scoreMatch) {
          const scoreNum = parseFloat(scoreMatch[1]);
          if (!isNaN(scoreNum)) {
            vars[`@${cleanKey}`] = scoreNum;
            vars[`@${rawLabel.replace(/\s+/g, "")}`] = scoreNum;

            // Common TTRPG aliases
            if (cleanKey === "PROFICIENCY" || cleanKey === "PROF") {
              vars["@Prof"] = scoreNum;
              vars["@PB"] = scoreNum;
              vars["@Proficiency"] = scoreNum;
              vars["@PROF"] = scoreNum;
            } else if (cleanKey === "ARMORCLASS" || cleanKey === "AC") {
              vars["@AC"] = scoreNum;
              vars["@ArmorClass"] = scoreNum;
              vars["@ARMORCLASS"] = scoreNum;
            } else if (cleanKey === "INITIATIVE" || cleanKey === "INIT") {
              vars["@Init"] = scoreNum;
              vars["@Initiative"] = scoreNum;
              vars["@INIT"] = scoreNum;
            } else if (cleanKey === "SPEED") {
              vars["@Speed"] = scoreNum;
            } else if (cleanKey === "SPELLDC" || cleanKey === "DC") {
              vars["@SpellDC"] = scoreNum;
              vars["@DC"] = scoreNum;
            } else if (cleanKey === "SPELLATTACK" || cleanKey === "SPELLATK") {
              vars["@SpellAttack"] = scoreNum;
              vars["@SpellAtk"] = scoreNum;
            }
          }
        }

        // Parse Sub / Modifier (e.g. "+3", "-1", "Shield: +2")
        const subMatch = stat.sub?.match(/([+-]?\d+(?:\.\d+)?)/);
        if (subMatch) {
          const subNum = parseFloat(subMatch[1]);
          if (!isNaN(subNum)) {
            vars[`@${cleanKey}.mod`] = subNum;
            vars[`@${cleanKey}.sub`] = subNum;
            vars[`@${cleanKey}_mod`] = subNum;
            vars[`@${rawLabel.replace(/\s+/g, "")}.mod`] = subNum;

            // If label is "PROFICIENCY", also allow @Prof.mod
            if (cleanKey === "PROFICIENCY" || cleanKey === "PROF") {
              vars["@Prof.mod"] = subNum;
              vars["@PB.mod"] = subNum;
            }
          }
        }
      }
    }

    // Trackers (@HP.current, @HP.max, etc.)
    if (block.type === "tracker" && block.data) {
      const titleKey = (block.title || "tracker").replace(/[^a-zA-Z0-9_]/g, "");
      if (titleKey) {
        vars[`@${titleKey}.current`] = block.data.current;
        vars[`@${titleKey}.max`] = block.data.max;
        vars[`@${titleKey}`] = block.data.current;

        // Common aliases for Hit Points -> @HP
        const lowerTitle = titleKey.toLowerCase();
        if (lowerTitle.includes("hitpoint") || lowerTitle === "hp") {
          vars["@HP.current"] = block.data.current;
          vars["@HP.max"] = block.data.max;
          vars["@HP"] = block.data.current;
          vars["@MaxHP"] = block.data.max;
          vars["@HitPoints"] = block.data.current;
        }
      }
    }

    // Profile (@Level, @XP)
    if (block.type === "profile" && block.data) {
      const lvlMatch = block.data.level?.match(/\d+/);
      if (lvlMatch) {
        const lvl = parseFloat(lvlMatch[0]);
        if (!isNaN(lvl)) {
          vars["@Level"] = lvl;
          vars["@LEVEL"] = lvl;
        }
      }
      const xpMatch = block.data.experience?.match(/\d+/);
      if (xpMatch) {
        const xp = parseFloat(xpMatch[0]);
        if (!isNaN(xp)) {
          vars["@XP"] = xp;
          vars["@Experience"] = xp;
        }
      }
    }

    // Custom Tagged Variables (#prof:3 or @Prof:3 or #prof=3 or #shield: 2)
    if (Array.isArray(block.tags)) {
      for (const tag of block.tags) {
        const match = tag.match(/^[#@](\w+)[:=\s]+([+-]?\d+(?:\.\d+)?)$/i);
        if (match) {
          const varName = match[1];
          const val = parseFloat(match[2]);
          if (!isNaN(val)) {
            vars[`@${varName}`] = val;
            vars[`@${varName.toUpperCase()}`] = val;
          }
        }
      }
    }
  }

  // Second pass: evaluate formula-based scores and modifiers
  for (const block of Object.values(character.blocks)) {
    if (block.type === "stat_group" && block.data?.stats) {
      for (const stat of block.data.stats) {
        const rawLabel = stat.label?.trim();
        if (!rawLabel) continue;
        const cleanKey = rawLabel.replace(/[^a-zA-Z0-9_]/g, "").toUpperCase();

        // Formula score
        if (stat.score && isFormula(stat.score)) {
          const scoreEval = evaluateFormula(stat.score, vars);
          if (scoreEval.value !== null) {
            vars[`@${cleanKey}`] = scoreEval.value;
            vars[`@${rawLabel.replace(/\s+/g, "")}`] = scoreEval.value;
            if (cleanKey === "ARMORCLASS" || cleanKey === "AC") {
              vars["@AC"] = scoreEval.value;
            }
          }
        }

        // Formula sub / mod
        if (stat.sub && isFormula(stat.sub)) {
          const evalResult = evaluateFormula(stat.sub, vars);
          if (evalResult.value !== null) {
            vars[`@${cleanKey}.mod`] = evalResult.value;
            vars[`@${cleanKey}.sub`] = evalResult.value;
            vars[`@${cleanKey}_mod`] = evalResult.value;
            vars[`@${rawLabel.replace(/\s+/g, "")}.mod`] = evalResult.value;
          }
        }
      }
    }
  }

  return vars;
}

/**
 * Returns structured, categorized variables for the autocomplete UI.
 */
export function getCharacterVariableDetails(character: Character): VariableDetail[] {
  const vars = extractCharacterVariables(character);
  const details: VariableDetail[] = [];
  const added = new Set<string>();

  const addDetail = (
    name: string,
    category: VariableDetail["category"],
    description?: string
  ) => {
    if (vars[name] !== undefined && !added.has(name)) {
      added.add(name);
      const val = vars[name];
      const displayVal = val >= 0 && name.endsWith(".mod") ? `+${val}` : `${val}`;
      details.push({ name, value: val, displayVal, category, description });
    }
  };

  // 1. Attributes (STR, DEX, CON, INT, WIS, CHA)
  const mainStats = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];
  for (const s of mainStats) {
    addDetail(`@${s}`, "Attributes", `${s} Score`);
    addDetail(`@${s}.mod`, "Attributes", `${s} Modifier`);
  }

  // 2. Vitals & Combat
  addDetail("@AC", "Vitals & Combat", "Armor Class");
  addDetail("@Prof", "Vitals & Combat", "Proficiency Bonus");
  addDetail("@Init", "Vitals & Combat", "Initiative Modifier");
  addDetail("@Speed", "Vitals & Combat", "Speed (ft)");
  addDetail("@SpellDC", "Vitals & Combat", "Spell Save DC");
  addDetail("@SpellAtk", "Vitals & Combat", "Spell Attack Bonus");

  // 3. Resources & Trackers
  addDetail("@HP", "Resources & Trackers", "Current Hit Points");
  addDetail("@HP.max", "Resources & Trackers", "Maximum Hit Points");
  addDetail("@HitDice", "Resources & Trackers", "Hit Dice");

  // 4. Profile
  addDetail("@Level", "Profile & Tags", "Character Level");
  addDetail("@XP", "Profile & Tags", "Experience Points");

  // 5. Remaining variables in character
  for (const [name, val] of Object.entries(vars)) {
    if (added.has(name)) continue;
    // Skip duplicate all-caps variants if mixed case exists
    if (name.startsWith("@") && !added.has(name)) {
      added.add(name);
      const displayVal = val >= 0 && name.endsWith(".mod") ? `+${val}` : `${val}`;
      details.push({
        name,
        value: val,
        displayVal,
        category: name.includes(".current") || name.includes(".max") ? "Resources & Trackers" : "Profile & Tags",
      });
    }
  }

  return details;
}

// -----------------------------------------------------------------------------
// 3. Formula Parser & Evaluator
// -----------------------------------------------------------------------------

/**
 * Determines whether a string is a formula expression.
 */
export function isFormula(input: string): boolean {
  if (!input || typeof input !== "string") return false;
  const trimmed = input.trim();
  if (trimmed.startsWith("=")) return true;
  if (trimmed.includes("@")) return true;
  // If it has arithmetic operators with numbers, e.g. "10 + 5" (not just signed numbers "+2")
  if (/[+*/^]/.test(trimmed) && /\d/.test(trimmed) && !/^[+-]\s*\d+(\.\d+)?$/.test(trimmed)) {
    return true;
  }
  return false;
}

/**
 * Evaluates a user-defined formula (e.g. "= 10 + @DEX.mod + @Prof").
 * Zero dependencies, pure safe AST/recursive evaluation.
 */
export function evaluateFormula(
  formula: string,
  variables: Record<string, number>,
  visited: Set<string> = new Set()
): FormulaResult {
  let expr = formula.trim();
  if (expr.startsWith("=")) {
    expr = expr.slice(1).trim();
  }

  // Find all @variables referenced in expression
  const varMatches = expr.match(/@[a-zA-Z0-9_.]+/g) || [];
  const unresolved: string[] = [];
  const explanationParts: Record<string, number> = {};

  // Case-insensitive lookup map for variables
  const lowerVarMap: Record<string, number> = {};
  for (const [k, v] of Object.entries(variables)) {
    lowerVarMap[k.toLowerCase()] = v;
  }

  let substituted = expr;

  for (const rawVar of varMatches) {
    // Circular reference guard
    if (visited.has(rawVar.toLowerCase())) {
      return {
        value: null,
        formatted: "⚠️ #CIRCULAR!",
        error: "CIRCULAR",
        explanation: `Circular reference detected in ${rawVar}`,
      };
    }

    const val = variables[rawVar] ?? lowerVarMap[rawVar.toLowerCase()];
    if (val === undefined) {
      if (!unresolved.includes(rawVar)) {
        unresolved.push(rawVar);
      }
    } else {
      explanationParts[rawVar] = val;
      // Replace whole variable token with safe value (wrapped in parentheses for negative numbers)
      const replacement = val < 0 ? `(${val})` : `${val}`;
      // Replace only full variable occurrences
      const escaped = rawVar.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      substituted = substituted.replace(new RegExp(`${escaped}(?![a-zA-Z0-9_.])`, "g"), replacement);
    }
  }

  if (unresolved.length > 0) {
    return {
      value: null,
      formatted: "⚠️ #REF!",
      error: "REF",
      unresolved,
      explanation: `Unresolved: ${unresolved.join(", ")}`,
    };
  }

  // Parse and evaluate arithmetic expression
  try {
    const val = evaluateTokenizedExpression(substituted);
    if (val === null || isNaN(val)) {
      return {
        value: null,
        formatted: "⚠️ #SYNTAX!",
        error: "SYNTAX",
        explanation: "Invalid mathematical syntax",
      };
    }

    if (!isFinite(val)) {
      return {
        value: null,
        formatted: "⚠️ #DIV/0!",
        error: "DIV_ZERO",
        explanation: "Division by zero",
      };
    }

    // Format display cleanly: e.g. whole numbers as integer, positive as +X if original was signed
    const rounded = Math.round(val * 100) / 100;
    const formatted = rounded >= 0 ? `+${rounded}` : `${rounded}`;

    // Build friendly explanation string: e.g. "@DEX.mod + @Prof (2 + 3) = 5"
    let subbed = expr;
    const varEntries = Object.entries(explanationParts);
    for (const [k, v] of varEntries) {
      const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      subbed = subbed.replace(new RegExp(escaped, "g"), `${v}`);
    }

    let explanation: string;
    if (varEntries.length > 0 && subbed !== expr) {
      if (varEntries.length === 1 && expr.toLowerCase() === varEntries[0][0].toLowerCase()) {
        explanation = `${expr} = ${rounded}`;
      } else {
        explanation = `${expr} (${subbed}) = ${rounded}`;
      }
    } else {
      explanation = `${expr} = ${rounded}`;
    }

    return {
      value: rounded,
      formatted,
      explanation,
    };
  } catch {
    return {
      value: null,
      formatted: "⚠️ #SYNTAX!",
      error: "SYNTAX",
      explanation: "Failed to evaluate formula",
    };
  }
}

// -----------------------------------------------------------------------------
// 4. Safe Recursive-Descent Expression Parser
// -----------------------------------------------------------------------------

/**
 * Tokenizer & Parser for arithmetic expressions supporting:
 * +, -, *, /, %, ^, (), floor(), ceil(), round(), abs(), min(a,b), max(a,b)
 */
function evaluateTokenizedExpression(expr: string): number | null {
  const tokens = tokenize(expr);
  if (tokens.length === 0) return null;

  let pos = 0;

  function peek(): string | null {
    return pos < tokens.length ? tokens[pos] : null;
  }

  function consume(): string {
    return tokens[pos++];
  }

  // Grammar:
  // Expression -> Term (('+' | '-') Term)*
  // Term       -> Factor (('*' | '/' | '%') Factor)*
  // Factor     -> Power ('^' Power)*
  // Power      -> Unary
  // Unary      -> ('+' | '-')? Primary
  // Primary    -> Number | '(' Expression ')' | FunctionCall

  function parseExpression(): number {
    let result = parseTerm();
    while (peek() === "+" || peek() === "-") {
      const op = consume();
      const right = parseTerm();
      result = op === "+" ? result + right : result - right;
    }
    return result;
  }

  function parseTerm(): number {
    let result = parseFactor();
    while (peek() === "*" || peek() === "/" || peek() === "%") {
      const op = consume();
      const right = parseFactor();
      if (op === "*") result = result * right;
      else if (op === "/") {
        if (right === 0) return Infinity;
        result = result / right;
      } else if (op === "%") {
        result = result % right;
      }
    }
    return result;
  }

  function parseFactor(): number {
    let result = parseUnary();
    while (peek() === "^") {
      consume();
      const right = parseUnary();
      result = Math.pow(result, right);
    }
    return result;
  }

  function parseUnary(): number {
    if (peek() === "-") {
      consume();
      return -parsePrimary();
    }
    if (peek() === "+") {
      consume();
      return parsePrimary();
    }
    return parsePrimary();
  }

  function parsePrimary(): number {
    const token = peek();
    if (!token) throw new Error("Unexpected end of expression");

    // Number literal
    if (/^\d+(\.\d+)?$/.test(token)) {
      consume();
      return parseFloat(token);
    }

    // Parentheses
    if (token === "(") {
      consume();
      const result = parseExpression();
      if (consume() !== ")") throw new Error("Missing closing parenthesis");
      return result;
    }

    // Function call: floor, ceil, round, abs, min, max
    const funcName = token.toLowerCase();
    if (["floor", "ceil", "round", "abs", "min", "max"].includes(funcName)) {
      consume();
      if (consume() !== "(") throw new Error(`Missing opening parenthesis after ${funcName}`);
      const args: number[] = [];
      if (peek() !== ")") {
        args.push(parseExpression());
        while (peek() === ",") {
          consume();
          args.push(parseExpression());
        }
      }
      if (consume() !== ")") throw new Error(`Missing closing parenthesis for ${funcName}`);

      switch (funcName) {
        case "floor":
          return Math.floor(args[0] ?? 0);
        case "ceil":
          return Math.ceil(args[0] ?? 0);
        case "round":
          return Math.round(args[0] ?? 0);
        case "abs":
          return Math.abs(args[0] ?? 0);
        case "min":
          return Math.min(...args);
        case "max":
          return Math.max(...args);
      }
    }

    throw new Error(`Unexpected token: ${token}`);
  }

  const result = parseExpression();
  if (pos < tokens.length) {
    throw new Error(`Unexpected token at end: ${tokens[pos]}`);
  }
  return result;
}

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  const str = input.trim();

  while (i < str.length) {
    const ch = str[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // Numbers (integer or decimal)
    if (/\d/.test(ch) || (ch === "." && /\d/.test(str[i + 1] || ""))) {
      let num = "";
      while (i < str.length && (/[\d.]/.test(str[i]))) {
        num += str[i++];
      }
      tokens.push(num);
      continue;
    }

    // Identifier / function name (e.g. floor, min)
    if (/[a-zA-Z_]/.test(ch)) {
      let ident = "";
      while (i < str.length && /[a-zA-Z0-9_]/.test(str[i])) {
        ident += str[i++];
      }
      tokens.push(ident);
      continue;
    }

    // Operators and delimiters
    if ("+-*/%^(),".includes(ch)) {
      tokens.push(ch);
      i++;
      continue;
    }

    // Unknown character: skip
    i++;
  }

  return tokens;
}

function evaluateSimpleExpression(expr: string): number | null {
  try {
    return evaluateTokenizedExpression(expr);
  } catch {
    return null;
  }
}

// -----------------------------------------------------------------------------
// 5. Inline Text / Markdown Formula Interpolation
// -----------------------------------------------------------------------------

function formatFormulaForText(expr: string, val: number, fallbackFormatted: string): string {
  const trimmed = expr.trim().replace(/^=/, "").trim();
  // If negative, always format as e.g. -2
  if (val < 0) return `${val}`;
  // If explicitly starts with +
  if (trimmed.startsWith("+")) return `+${val}`;
  // If it starts with a base number (e.g. "10 + ...", "8 + ..."), it's an AC/DC/base calculation: format unsigned
  if (/^\d/.test(trimmed)) return `${val}`;
  // If it's a pure score variable without .mod (e.g. "@STR", "@CON", "@HP", "@AC", "@Level", "@Speed")
  if (
    /^@[a-zA-Z0-9_]+$/.test(trimmed) &&
    !trimmed.toLowerCase().endsWith(".mod") &&
    !["@prof", "@pb", "@init"].includes(trimmed.toLowerCase())
  ) {
    return `${val}`;
  }
  // Otherwise, if it involves a modifier or starts with a modifier/bonus
  if (
    trimmed.toLowerCase().includes(".mod") ||
    trimmed.toLowerCase().includes("@prof") ||
    trimmed.toLowerCase().includes("@pb") ||
    trimmed.toLowerCase().includes("@init")
  ) {
    return `+${val}`;
  }
  return fallbackFormatted;
}

/**
 * Replaces inline formulas and variable tokens in text/markdown with evaluated results.
 * Supports:
 *   {@DEX.mod + @Prof}   -> [+5](# "fx: @DEX.mod + @Prof = 5")
 *   {{@DEX.mod + @Prof}} -> [+5](# "fx: @DEX.mod + @Prof = 5")
 *   {10 + @DEX.mod}      -> [13](# "fx: 10 + 3 = 13")
 *   "@Dex.mod"           -> [+3](# "fx: @Dex.mod = 3")
 *   "@Dex.mod + 2"       -> [+5](# "fx: @Dex.mod + 2 = 5")
 *   @DEX.mod             -> [+3](# "fx: @DEX.mod = 3")
 *   @STR                 -> [16](# "fx: @STR = 16")
 */
export function interpolateTextFormulas(
  text: string,
  variables: Record<string, number>
): string {
  if (!text || typeof text !== "string") return text;

  // Case-insensitive lookup map
  const lowerMap = new Map<string, { key: string; val: number }>();
  for (const [k, v] of Object.entries(variables)) {
    lowerMap.set(k.toLowerCase(), { key: k, val: v });
  }

  const tokens: string[] = [];
  const makeToken = (replacement: string) => {
    const id = tokens.length;
    tokens.push(replacement);
    return `___FX_TOKEN_${id}___`;
  };

  // 1. Double or single curly braces: {= 10 + @DEX.mod} or {{@DEX.mod + @Prof}} or {@DEX.mod} or {10 + 5}
  let working = text.replace(/\{\{?\s*([=]?[^}\n]*@[^}\n]*|[=][^}\n]*|[0-9][0-9+\-*/^().\s]*)\s*\}?\}/g, (_match, rawExpr) => {
    let expr = rawExpr.trim();
    if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
      expr = expr.slice(1, -1).trim();
    }
    const evalRes = evaluateFormula(expr, variables);
    if (evalRes.error) {
      return makeToken(`[⚠️ #${evalRes.error}!](# "${evalRes.explanation}")`);
    }
    const display = evalRes.value !== null ? formatFormulaForText(expr, evalRes.value, evalRes.formatted) : evalRes.formatted;
    return makeToken(`[${display}](# "fx: ${evalRes.explanation}")`);
  });

  // 2. Quoted formulas or variables: e.g. "@Dex.mod" or "@Dex.mod + @Prof" or "=@STR.mod"
  working = working.replace(/"([=]?[^"\n]*@[^"\n]*|[=][^"\n]*)"/g, (fullMatch, rawExpr) => {
    const expr = rawExpr.trim();
    const evalRes = evaluateFormula(expr, variables);
    if (evalRes.error) {
      // If it looks like a formula explicitly intended by user (starts with @ or =), show error badge
      if (expr.startsWith("@") || expr.startsWith("=")) {
        return makeToken(`[⚠️ #${evalRes.error}!](# "${evalRes.explanation}")`);
      }
      // Otherwise preserve original quotes
      return fullMatch;
    }
    const display = evalRes.value !== null ? formatFormulaForText(expr, evalRes.value, evalRes.formatted) : evalRes.formatted;
    return makeToken(`[${display}](# "fx: ${evalRes.explanation}")`);
  });

  // 3. Standalone known @variables not already inside tokens
  working = working.replace(/(^|[\s(,:;])@([a-zA-Z0-9_.]+)(?=[^a-zA-Z0-9_.]|$)/g, (match, prefix, varKey) => {
    const lower = `@${varKey.toLowerCase()}`;
    const found = lowerMap.get(lower);
    if (found) {
      const display =
        found.val >= 0 &&
        (found.key.toLowerCase().endsWith(".mod") || found.key === "@Prof" || found.key === "@PB" || found.key === "@Init")
          ? `+${found.val}`
          : `${found.val}`;
      const token = makeToken(`[${display}](# "fx: ${found.key} = ${found.val}")`);
      return `${prefix}${token}`;
    }
    return match;
  });

  // 4. Restore tokens safely
  return working.replace(/___FX_TOKEN_(\d+)___/g, (_m, id) => tokens[parseInt(id, 10)] ?? "");
}
