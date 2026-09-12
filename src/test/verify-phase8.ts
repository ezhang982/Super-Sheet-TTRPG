import {
  evaluateQuickMath,
  extractCharacterVariables,
  evaluateFormula,
  isFormula,
} from "../utils/mathEngine";
import type { Character } from "../types/schema";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log("=== Phase 8: Math Engine & Formula Verification ===");

// 1. Quick Math Tests
console.log("1. Testing Quick Math for Counters...");
assert(evaluateQuickMath(48, "+10") === 58, "Relative addition failed");
assert(evaluateQuickMath(48, "+ 10") === 58, "Relative addition with space failed");
assert(evaluateQuickMath(48, "-14", 0) === 34, "Relative subtraction failed");
assert(evaluateQuickMath(5, "-10", 0) === 0, "Lower bound clamping failed");
assert(evaluateQuickMath(48, "+10", 0, 52) === 52, "Upper bound clamping failed");
assert(evaluateQuickMath(20, "/2") === 10, "Halving division failed");
assert(evaluateQuickMath(21, "/2") === 10, "Halving division floored failed");
assert(evaluateQuickMath(10, "*2") === 20, "Multiplication failed");
assert(evaluateQuickMath(10, "50") === 50, "Absolute number input failed");
assert(evaluateQuickMath(10, "20 - 4") === 16, "Direct arithmetic expression failed");
assert(evaluateQuickMath(10, "invalid") === 10, "Invalid input should preserve current");
assert(evaluateQuickMath(10, "") === 10, "Empty input should preserve current");
console.log("✓ Quick Math tests passed!");

// 2. Variable Extraction Tests
console.log("2. Testing Character Variable Extraction...");
const mockChar: Partial<Character> = {
  blocks: {
    block_stats: {
      id: "block_stats",
      type: "stat_group",
      title: "Ability Scores",
      tags: ["#core", "#prof:3"],
      style: {},
      data: {
        stats: [
          { label: "STR", score: "18", sub: "+4" },
          { label: "DEX", score: "14", sub: "+2" },
          { label: "CON", score: "10", sub: "+0" },
          { label: "CHA", score: "8", sub: "-1" },
        ],
      },
    },
    block_hp: {
      id: "block_hp",
      type: "tracker",
      title: "Hit Points",
      tags: ["#health"],
      style: {},
      data: {
        current: 45,
        max: 50,
        temp: 5,
        step: 1,
      },
    },
    block_vitals: {
      id: "block_vitals",
      type: "stat_group",
      title: "Combat Vitals",
      tags: ["#core"],
      style: {},
      data: {
        stats: [
          { label: "ARMOR CLASS", score: "16", sub: "Shield: +2" },
          { label: "PROFICIENCY", score: "+3", sub: "Bonus" },
          { label: "INITIATIVE", score: "+2", sub: "DEX" },
          { label: "SPEED", score: "30 ft", sub: "Walk" },
        ],
      },
    },
    block_profile: {
      id: "block_profile",
      type: "profile",
      title: "Identity",
      tags: [],
      style: {},
      data: {
        characterName: "Valerius",
        system: "D&D 5e",
        level: "5",
        experience: "6500",
      },
    },
  },
};

const vars = extractCharacterVariables(mockChar as Character);
assert(vars["@STR"] === 18, "STR score extraction failed");
assert(vars["@STR.mod"] === 4, "STR modifier extraction failed");
assert(vars["@CHA.mod"] === -1, "Negative modifier extraction failed");
assert(vars["@HitPoints.current"] === 45, "HP current extraction failed");
assert(vars["@HitPoints.max"] === 50, "HP max extraction failed");
assert(vars["@HP"] === 45, "HP alias extraction failed");
assert(vars["@MaxHP"] === 50, "MaxHP alias extraction failed");
assert(vars["@Level"] === 5, "Level extraction failed");

// Test smart aliases
assert(vars["@Prof"] === 3, "Prof alias extraction failed");
assert(vars["@PB"] === 3, "PB alias extraction failed");
assert(vars["@AC"] === 16, "AC alias extraction failed");
assert(vars["@Init"] === 2, "Init alias extraction failed");
assert(vars["@Speed"] === 30, "Speed alias extraction failed");
assert(vars["@ARMORCLASS.mod"] === 2, "Shield modifier extraction failed");

// Test getCharacterVariableDetails
import { getCharacterVariableDetails } from "../utils/mathEngine";
const details = getCharacterVariableDetails(mockChar as Character);
assert(details.length > 5, "Expected variable details to be populated");
assert(details.some((d) => d.name === "@AC"), "Expected @AC in details");
assert(details.some((d) => d.name === "@Prof"), "Expected @Prof in details");
console.log("✓ Variable extraction and alias tests passed!");

// 3. Formula Detection & Evaluation Tests
console.log("3. Testing Formula Evaluation...");
assert(isFormula("= 10 + @DEX.mod"), "Should detect starting with =");
assert(isFormula("10 + @DEX.mod"), "Should detect math with @");
assert(isFormula("@STR"), "Should detect standalone variable @STR");
assert(!isFormula("+5"), "Plain modifier string is not formula");
assert(!isFormula("65%"), "Skill percent is not formula");

// Basic math
const r1 = evaluateFormula("10 + 5 * 2", {});
assert(r1.value === 20, `Expected 20, got ${r1.value}`);

// Parentheses & precedence
const r2 = evaluateFormula("(10 + 5) * 2", {});
assert(r2.value === 30, `Expected 30, got ${r2.value}`);

// Variable substitution
const r3 = evaluateFormula("= 10 + @DEX.mod + @prof", vars);
assert(r3.value === 15, `Expected 15, got ${r3.value}`);
assert(r3.formatted === "+15", `Expected +15, got ${r3.formatted}`);

// D&D modifier calculation with floor()
const r4 = evaluateFormula("= floor((@STR - 10) / 2)", vars);
assert(r4.value === 4, `Expected 4, got ${r4.value}`);
assert(r4.formatted === "+4", `Expected +4, got ${r4.formatted}`);

// Negative result
const r5 = evaluateFormula("= @CHA.mod - 2", vars);
assert(r5.value === -3, `Expected -3, got ${r5.value}`);
assert(r5.formatted === "-3", `Expected -3, got ${r5.formatted}`);

// Functions: min & max
const r6 = evaluateFormula("= min(10, @STR)", vars);
assert(r6.value === 10, `Expected 10, got ${r6.value}`);

// Error Handling: Missing Reference (#REF!)
const rErrRef = evaluateFormula("= 10 + @UnknownVar", vars);
assert(rErrRef.error === "REF", "Should report REF error on missing variable");
assert(Boolean(rErrRef.unresolved?.includes("@UnknownVar")), "Should identify unresolved variable");
assert(rErrRef.formatted.includes("#REF!"), "Should format as #REF!");

// Error Handling: Division by Zero (#DIV/0!)
const rDiv0 = evaluateFormula("= 10 / 0", vars);
assert(rDiv0.error === "DIV_ZERO", "Should report division by zero");

// 4. Testing 2nd-pass Formula Modifiers in Stat Groups
console.log("4. Testing 2nd-pass Formula Modifiers in Stat Groups...");
const charWithFormulaStat: Partial<Character> = {
  blocks: {
    block_stats: {
      id: "block_stats",
      type: "stat_group",
      title: "Attributes",
      tags: [],
      style: {},
      data: {
        stats: [
          { label: "STR", score: "16", sub: "= floor((@STR - 10) / 2)" },
        ],
      },
    },
  },
};

const formulaVars = extractCharacterVariables(charWithFormulaStat as Character);
assert(formulaVars["@STR"] === 16, "STR score failed");
assert(formulaVars["@STR.mod"] === 3, `Expected @STR.mod to be 3, got ${formulaVars["@STR.mod"]}`);

// A skill referencing @STR.mod
const skillEval = evaluateFormula("= @STR.mod + 2", formulaVars);
assert(skillEval.value === 5, `Expected 5, got ${skillEval.value}`);
assert(skillEval.formatted === "+5", `Expected +5, got ${skillEval.formatted}`);
console.log("✓ 2nd-pass formula modifiers passed!");

// 5. Testing Inline Markdown Text Formula Interpolation
console.log("5. Testing Inline Markdown Text Formula Interpolation...");
import { interpolateTextFormulas } from "../utils/mathEngine";

// Test 5a: Curly braces equation: {@DEX.mod + @Prof}
const text1 = "Weapon attack: {@DEX.mod + @Prof} to hit.";
const res1 = interpolateTextFormulas(text1, vars);
assert(res1.includes("[+5](# "), `Expected [+5], got: ${res1}`);
assert(res1.includes('fx: @DEX.mod + @Prof (2 + 3) = 5'), `Expected explanation in tooltip, got: ${res1}`);

// Test 5b: Quoted variable: "@Dex.mod"
const text2 = 'This weapon attack has a "@Dex.mod" to hit.';
const res2 = interpolateTextFormulas(text2, vars);
assert(res2.includes("[+2](# "), `Expected [+2], got: ${res2}`);
assert(res2.includes('fx: @Dex.mod = 2'), `Expected explanation, got: ${res2}`);

// Test 5c: Standalone variable: @STR and @DEX.mod
const text3 = "Score: @STR, Mod: @DEX.mod";
const res3 = interpolateTextFormulas(text3, vars);
assert(res3.includes("[18](# "), `Expected [18], got: ${res3}`);
assert(res3.includes("[+2](# "), `Expected [+2], got: ${res3}`);

// Test 5d: Unsigned base calculation: Spell DC {8 + @Prof + @CHA.mod}
const text4 = "Spell Save DC: {8 + @Prof + @CHA.mod}";
const res4 = interpolateTextFormulas(text4, vars);
assert(res4.includes("[10](# "), `Expected [10], got: ${res4}`);

// Test 5e: Pure arithmetic: {10 + 5}
const text5 = "Bonus: {10 + 5}";
const res5 = interpolateTextFormulas(text5, vars);
assert(res5.includes("[15](# "), `Expected [15], got: ${res5}`);

// Test 5f: Error badge on missing variable: {@UnknownStat}
const text6 = "Effect: {@UnknownStat + 2}";
const res6 = interpolateTextFormulas(text6, vars);
assert(res6.includes("[⚠️ #REF!](# "), `Expected #REF! badge, got: ${res6}`);

console.log("✓ Inline Markdown Text Formula Interpolation passed!");

console.log("✓ Formula evaluation tests passed!");
console.log("All Phase 8 mathEngine tests passed successfully!");
