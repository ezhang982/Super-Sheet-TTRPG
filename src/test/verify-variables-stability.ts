import { createDefaultCharacter } from "../store/fixtures";
import {
  getCachedCharacterVariables,
  getCachedCharacterVariableDetails,
} from "../store/useCharacterVariables";
import { useCharacterStore } from "../store/useCharacterStore";
import type { Character } from "../types/schema";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✓ ${message}`);
}

console.log("=== RUNNING CHARACTER VARIABLES CACHING & STABILITY TESTS ===");

const char1: Character = createDefaultCharacter();

// 1. Referential Stability Test
const vars1 = getCachedCharacterVariables(char1);
const vars2 = getCachedCharacterVariables(char1);
assert(vars1 === vars2, "getCachedCharacterVariables must return the exact same reference when character is unchanged");

const details1 = getCachedCharacterVariableDetails(char1);
const details2 = getCachedCharacterVariableDetails(char1);
assert(details1 === details2, "getCachedCharacterVariableDetails must return the exact same reference when character is unchanged");

// 2. Correct Recalculation on Mutation
const char2: Character = JSON.parse(JSON.stringify(char1));
char2.meta.updatedAt = Date.now() + 100;
const hpBlock = char2.blocks.block_hp;
if (hpBlock && hpBlock.type === "tracker") {
  hpBlock.data.current = 99;
}

const vars3 = getCachedCharacterVariables(char2);
assert(vars1 !== vars3, "getCachedCharacterVariables must recalculate when character changes");
assert(vars3["@HP"] === 99, "Updated HP variable must be reflected in newly calculated cache");

// Verify that repeat calls with char2 return the cached char2 reference
const vars4 = getCachedCharacterVariables(char2);
assert(vars3 === vars4, "getCachedCharacterVariables must return cached reference for char2");

// 3. Details caching on char2
const details3 = getCachedCharacterVariableDetails(char2);
const details4 = getCachedCharacterVariableDetails(char2);
assert(details3 === details4, "getCachedCharacterVariableDetails must return cached reference for char2");

// 4. Test Zustand selector simulation
const state = useCharacterStore.getState();
const selectorVars1 = getCachedCharacterVariables(state.character);
const selectorVars2 = getCachedCharacterVariables(state.character);
assert(selectorVars1 === selectorVars2, "Store character variables selector must be referentially stable");

const selectorDetails1 = getCachedCharacterVariableDetails(state.character);
const selectorDetails2 = getCachedCharacterVariableDetails(state.character);
assert(selectorDetails1 === selectorDetails2, "Store character variable details selector must be referentially stable");

console.log("🎉 All referential stability tests passed successfully!");
