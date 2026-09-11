import { CharacterSchema, type SkillListBlock } from "../types/schema";
import { dnd5eTemplate } from "../templates/dnd5e";
import { useCharacterStore } from "../store/useCharacterStore";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ ${message}`);
}

console.log("=== RUNNING PHASE 6: SKILL LIST PRIMITIVE TEST SUITE ===\n");

// -----------------------------------------------------------------------------
// 1. Schema Validation for Skill List Primitive
// -----------------------------------------------------------------------------
console.log("--- 1. Schema Validation for Skill List Block ---");

const dndParseResult = CharacterSchema.safeParse(dnd5eTemplate);
assert(dndParseResult.success, "D&D 5e Starter with SkillListBlock validates cleanly against CharacterSchema");

const dndSkillsBlock = dnd5eTemplate.blocks["block_dnd_skills"] as SkillListBlock;
assert(!!dndSkillsBlock, "D&D 5e template contains block_dnd_skills");
assert(dndSkillsBlock.type === "skill_list", "block_dnd_skills has type 'skill_list'");
assert(dndSkillsBlock.data.skills.length === 18, "D&D 5e template contains all 18 canonical skills");

const stealthSkill = dndSkillsBlock.data.skills.find((s) => s.name === "Stealth");
assert(!!stealthSkill, "Found Stealth skill in D&D template");
assert(stealthSkill?.stat === "DEX", "Stealth is associated with DEX");

// -----------------------------------------------------------------------------
// 2. Store Integration: addBlock('skill_list')
// -----------------------------------------------------------------------------
console.log("\n--- 2. Store Integration: addBlock('skill_list') ---");

const store = useCharacterStore.getState();
const activeTab = store.character.activeTabId;

store.addBlock(activeTab, "skill_list");
const stateAfterAdd = useCharacterStore.getState();
const addedBlockId = Object.keys(stateAfterAdd.character.blocks).find(
  (id) => stateAfterAdd.character.blocks[id].type === "skill_list"
);

assert(!!addedBlockId, "Successfully added skill_list block to store");
const addedBlock = stateAfterAdd.character.blocks[addedBlockId!] as SkillListBlock;
assert(addedBlock.title === "Skills", "Default title is 'Skills'");
assert(addedBlock.data.skills.length > 0, "Default skills populated");

// -----------------------------------------------------------------------------
// 3. Skill Mutations: Add, Edit, Cycle Proficiency, Remove
// -----------------------------------------------------------------------------
console.log("\n--- 3. Skill Mutations & Proficiency Cycling ---");

const initialCount = addedBlock.data.skills.length;
const newSkill = {
  id: "skill_custom_hacking",
  name: "Hacking",
  stat: "INT",
  value: "+5",
  proficiency: 1, // Proficient
};

// Add custom skill
store.updateBlockData(addedBlockId!, {
  skills: [...addedBlock.data.skills, newSkill],
});

let updatedBlock = useCharacterStore.getState().character.blocks[addedBlockId!] as SkillListBlock;
assert(updatedBlock.data.skills.length === initialCount + 1, "Added custom skill");

// Edit skill value & proficiency to 2 (Expertise)
const updatedSkills = updatedBlock.data.skills.map((s) =>
  s.id === "skill_custom_hacking" ? { ...s, value: "+8", proficiency: 2 } : s
);
store.updateBlockData(addedBlockId!, { skills: updatedSkills });

updatedBlock = useCharacterStore.getState().character.blocks[addedBlockId!] as SkillListBlock;
const hackingSkill = updatedBlock.data.skills.find((s) => s.id === "skill_custom_hacking")!;
assert(hackingSkill.value === "+8", "Skill value updated to +8");
assert(hackingSkill.proficiency === 2, "Skill proficiency set to 2 (Expertise)");

// Delete custom skill
store.updateBlockData(addedBlockId!, {
  skills: updatedBlock.data.skills.filter((s) => s.id !== "skill_custom_hacking"),
});

updatedBlock = useCharacterStore.getState().character.blocks[addedBlockId!] as SkillListBlock;
assert(updatedBlock.data.skills.length === initialCount, "Custom skill successfully deleted");

// -----------------------------------------------------------------------------
// 4. Template Scrubbing on Skill List
// -----------------------------------------------------------------------------
console.log("\n--- 4. Template Scrubbing Contract for Skills ---");

// Set proficiency and value on one of the skills
store.updateBlockData(addedBlockId!, {
  skills: updatedBlock.data.skills.map((s, idx) =>
    idx === 0 ? { ...s, value: "+10", proficiency: 2 } : s
  ),
});

// Mock window for export
(globalThis as any).window = {};

const templateChar = store.exportTemplate();
const templateSkillsBlock = templateChar.blocks[addedBlockId!] as SkillListBlock;

assert(!!templateSkillsBlock, "Template retains skill_list block");
assert(
  templateSkillsBlock.data.skills.length === updatedBlock.data.skills.length,
  "Template retains all skill rows"
);
assert(
  templateSkillsBlock.data.skills.every((s) => s.value === "" && s.proficiency === 0),
  "exportTemplate scrubs all skill values to empty strings and proficiencies to 0"
);
assert(
  templateSkillsBlock.data.skills[0].name === updatedBlock.data.skills[0].name,
  "Template retains skill names"
);
assert(
  templateSkillsBlock.data.skills[0].stat === updatedBlock.data.skills[0].stat,
  "Template retains skill stat associations"
);

console.log("\n🎉 ALL PHASE 6 SKILL LIST TESTS PASSED SUCCESSFULLY!\n");
