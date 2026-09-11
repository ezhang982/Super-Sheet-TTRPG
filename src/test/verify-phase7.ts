import type { Character } from "../types/schema";
import { useCharacterStore } from "../store/useCharacterStore";
import {
  idbSaveCharacter,
  idbGetCharacter,
  idbGetAllCharacters,
  idbDeleteCharacter,
  idbSetMeta,
  idbGetMeta,
} from "../store/idb";
import {
  loadManifest,
  saveCharacterToStorage,
  loadCharacterById,
  duplicateCharacterById,
  deleteCharacterById,
  initStorageAndMigrate,
} from "../store/storage";
import { blankTemplate } from "../templates/blank";
import { dnd5eTemplate } from "../templates/dnd5e";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ ${message}`);
}

async function runTests() {
  console.log("=== RUNNING PHASE 7: PERSISTENCE & MULTI-CHARACTER SUITE ===\n");

  // ---------------------------------------------------------------------------
  // 1. IndexedDB Basic CRUD & Meta Operations
  // ---------------------------------------------------------------------------
  console.log("--- 1. IndexedDB Direct Operations ---");

  const testChar1: Character = {
    ...blankTemplate,
    meta: {
      ...blankTemplate.meta,
      id: "char_test_idb_1",
      name: "Valeros the Brave",
      system: "Pathfinder 2e",
      updatedAt: 1000,
    },
  };

  await idbSaveCharacter(testChar1);
  const fetched = await idbGetCharacter("char_test_idb_1");
  assert(!!fetched, "idbGetCharacter found saved character");
  assert(fetched?.meta.name === "Valeros the Brave", "Character name preserved in storage");
  assert(fetched?.meta.system === "Pathfinder 2e", "Character system preserved in storage");

  const allChars = await idbGetAllCharacters();
  assert(allChars.some((c) => c.meta.id === "char_test_idb_1"), "idbGetAllCharacters contains testChar1");

  await idbSetMeta("test_key", { version: 2 });
  const metaVal = await idbGetMeta<{ version: number }>("test_key");
  assert(metaVal?.version === 2, "idbSetMeta & idbGetMeta work correctly");

  await idbDeleteCharacter("char_test_idb_1");
  const deleted = await idbGetCharacter("char_test_idb_1");
  assert(deleted === null, "idbDeleteCharacter successfully removed character");

  // ---------------------------------------------------------------------------
  // 2. Mock LocalStorage Migration to IndexedDB
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. Storage Migration: LocalStorage to IndexedDB ---");

  // Create a mock localStorage environment
  const mockStorage = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (key: string) => mockStorage.get(key) ?? null,
    setItem: (key: string, val: string) => mockStorage.set(key, val),
    removeItem: (key: string) => mockStorage.delete(key),
    clear: () => mockStorage.clear(),
  };

  const legacyChar: Character = {
    ...dnd5eTemplate,
    meta: {
      ...dnd5eTemplate.meta,
      id: "char_legacy_5e",
      name: "Gimli the Fighter",
      system: "D&D 5e (2024)",
      updatedAt: 2000,
    },
  };

  mockStorage.set("ttrpg_sheet_char_legacy_5e", JSON.stringify(legacyChar));
  mockStorage.set("ttrpg_manifest", JSON.stringify([
    {
      id: "char_legacy_5e",
      name: "Gimli the Fighter",
      system: "D&D 5e (2024)",
      updatedAt: 2000,
    },
  ]));
  mockStorage.set("ttrpg_active_char_id", "char_legacy_5e");

  await initStorageAndMigrate();

  const migratedChar = await idbGetCharacter("char_legacy_5e");
  assert(!!migratedChar, "Legacy character successfully migrated to IndexedDB");
  assert(migratedChar?.meta.name === "Gimli the Fighter", "Migrated character data is intact");

  const migratedManifest = await idbGetMeta<any[]>("manifest");
  assert(Array.isArray(migratedManifest) && migratedManifest.length >= 1, "Manifest migrated to IndexedDB metadata");

  // ---------------------------------------------------------------------------
  // 3. Storage Layer: Save, Load, Duplicate, Delete
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. Storage Layer Functions ---");

  saveCharacterToStorage(legacyChar);
  const loadedChar = await loadCharacterById("char_legacy_5e");
  assert(!!loadedChar && loadedChar.meta.id === "char_legacy_5e", "loadCharacterById successfully returned character");

  const duplicated = await duplicateCharacterById("char_legacy_5e");
  assert(!!duplicated, "duplicateCharacterById successfully duplicated character");
  assert(duplicated?.meta.id !== "char_legacy_5e", "Duplicated character has unique ID");
  assert(duplicated?.meta.name === "Gimli the Fighter (Copy)", "Duplicated character has '(Copy)' suffix");

  const manifestAfterDupe = loadManifest();
  assert(manifestAfterDupe.some((m) => m.id === duplicated?.meta.id), "Manifest includes duplicated character");

  // Delete original
  const deleteRes = await deleteCharacterById("char_legacy_5e");
  assert(deleteRes === true, "deleteCharacterById returns true");
  const checkDeleted = await loadCharacterById("char_legacy_5e");
  assert(checkDeleted === null, "Deleted character can no longer be loaded");
  const manifestAfterDelete = loadManifest();
  assert(!manifestAfterDelete.some((m) => m.id === "char_legacy_5e"), "Deleted character removed from manifest");

  // ---------------------------------------------------------------------------
  // 4. Store Integration: Multi-Character Switching & SaveStatus
  // ---------------------------------------------------------------------------
  console.log("\n--- 4. Zustand Store Integration & Character Switching ---");

  const store = useCharacterStore.getState();

  // Create a new character sheet
  store.newCharacter(blankTemplate);
  store.setCharacterMeta({ name: "Aria the Rogue", system: "Shadowdark" });

  const activeChar = useCharacterStore.getState().character;
  assert(activeChar.meta.name === "Aria the Rogue", "New character initialized and renamed");

  // Duplicate active character via store action
  const dupeId = await store.duplicateCharacter(activeChar.meta.id);
  assert(!!dupeId, "Store duplicateCharacter returned new ID");

  const dupeChar = await loadCharacterById(dupeId!);
  assert(dupeChar?.meta.name === "Aria the Rogue (Copy)", "Store duplicate saved cloned character");

  // Switch to the duplicated character
  const switchSuccess = await store.loadCharacterById(dupeId!);
  assert(switchSuccess, "store.loadCharacterById succeeded");
  assert(useCharacterStore.getState().character.meta.id === dupeId, "Active store character changed to duplicate");

  // Delete the original character while we are on the duplicated character
  await store.deleteCharacter(activeChar.meta.id);
  const checkOldDeleted = await loadCharacterById(activeChar.meta.id);
  assert(checkOldDeleted === null, "Original character successfully deleted via store");

  // Verify saveStatus transitions to 'saving' during debounced save, then resolves to 'saved'
  store.setCharacterMeta({ name: "Aria Updated" });
  assert(useCharacterStore.getState().saveStatus === "saving", "Store saveStatus transitions to 'saving' on mutation");

  // Wait for debounce timer (300ms) to complete
  await new Promise((resolve) => setTimeout(resolve, 350));
  assert(useCharacterStore.getState().saveStatus === "saved", "Store saveStatus settles back to 'saved' after debounce");

  console.log("\n🎉 ALL PHASE 7 PERSISTENCE & SWITCHER TESTS PASSED!\n");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  if (typeof (globalThis as any).process !== "undefined") {
    (globalThis as any).process.exit(1);
  }
});
