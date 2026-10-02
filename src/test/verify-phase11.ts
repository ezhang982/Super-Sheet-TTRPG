import { useCharacterStore } from "../store/useCharacterStore";
import {
  debouncedSaveCharacter,
  flushPendingSave,
  hasInFlightWrites,
  waitForInFlightWrites,
  reconcileStorage,
  reconcileManifests,
  saveManifest,
} from "../store/storage";
import {
  idbSaveCharacter,
  idbGetCharacter,
  idbSetMeta,
} from "../store/idb";
import { createDefaultCharacter } from "../store/fixtures";
import type { Character, TrackerBlock } from "../types/schema";

type TrackerData = TrackerBlock["data"];

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✓ ${message}`);
}


async function runPhase11Tests() {
  console.log("=== Running Phase 11 Verification Suite ===");

  // =========================================================================
  // Test 1: Lifecycle Save Flush & In-Flight Tracking
  // =========================================================================
  console.log("\n--- Test 1: Lifecycle Save Flush & In-Flight Tracking ---");
  const testChar = createDefaultCharacter();
  testChar.meta.id = "char_phase11_flush_test";
  testChar.meta.name = "Flush Test Hero";

  let statusReported: "saving" | "saved" | null = null;
  debouncedSaveCharacter(testChar, 5000, (status) => {
    statusReported = status;
  });

  assert(statusReported === "saving", "debouncedSaveCharacter reported 'saving' status immediately");
  assert(hasInFlightWrites() === true, "hasInFlightWrites() detects pending debounce save");

  // Call flushPendingSave() synchronously (simulating visibilitychange / beforeunload)
  flushPendingSave();

  assert(statusReported === "saved", "flushPendingSave() triggered status callback to 'saved'");

  // Await in-flight IndexedDB writes to complete
  const writesSettled = await waitForInFlightWrites();
  assert(writesSettled === true, "waitForInFlightWrites() settled all writes");
  assert(hasInFlightWrites() === false, "hasInFlightWrites() is false after writes complete");

  const flushedFromIdb = await idbGetCharacter("char_phase11_flush_test");
  assert(flushedFromIdb !== null, "Character document was saved to storage on flush");
  assert(flushedFromIdb?.meta.name === "Flush Test Hero", "Saved character data matches pending snapshot");


  // =========================================================================
  // Test 2: Dual-Storage Reconciliation & Split-Brain Cache Prevention
  // =========================================================================
  console.log("\n--- Test 2: Dual-Storage Reconciliation & Split-Brain Cache Prevention ---");
  const staleLocalChar: Character = {
    ...createDefaultCharacter(),
    meta: {
      id: "char_reconcile_test",
      name: "Stale Local Hero",
      system: "D&D 5e",
      createdAt: 1000,
      updatedAt: 1000, // Older timestamp
    },
  };

  const freshIdbChar: Character = {
    ...staleLocalChar,
    meta: {
      ...staleLocalChar.meta,
      name: "Fresh IndexedDB Hero",
      updatedAt: 2000, // Newer timestamp
    },
  };

  // Seed IndexedDB with the newer document and set as active
  await idbSaveCharacter(freshIdbChar);
  await idbSetMeta("active_char_id", freshIdbChar.meta.id);

  // Run reconciliation against the stale local character
  const reconcileRes = await reconcileStorage(staleLocalChar);
  assert(reconcileRes.reconciled === true, "reconcileStorage detected disparity");
  assert(reconcileRes.source === "idb", "IndexedDB identified as authoritative source");
  assert(reconcileRes.character?.meta.name === "Fresh IndexedDB Hero", "Fresh IndexedDB document selected");

  // Reconcile Manifests
  saveManifest([
    { id: "char_reconcile_test", name: "Stale Local Hero", system: "D&D 5e", updatedAt: 1000 },
  ]);
  await idbSetMeta("manifest", [
    { id: "char_reconcile_test", name: "Fresh IndexedDB Hero", system: "D&D 5e", updatedAt: 2000 },
  ]);

  const reconciledManifest = await reconcileManifests();
  const entry = reconciledManifest.find((m) => m.id === "char_reconcile_test");
  assert(entry !== undefined, "Reconciled manifest includes character");
  assert(entry?.name === "Fresh IndexedDB Hero", "Manifest retained newer metadata name");
  assert(entry?.updatedAt === 2000, "Manifest retained newer updatedAt timestamp");

  // =========================================================================
  // Test 3: Granular State Subscriptions & Re-render Isolation
  // =========================================================================
  console.log("\n--- Test 3: Granular State Subscriptions & Re-render Isolation ---");
  const store = useCharacterStore.getState();
  store.newCharacter();

  const charBefore = useCharacterStore.getState().character;
  const activeTabId = charBefore.activeTabId;
  const layoutBefore = charBefore.layouts[activeTabId];

  // Find a block to mutate
  const blockIds = Object.keys(charBefore.blocks);
  assert(blockIds.length > 0, "Character has blocks on active canvas");
  const targetBlockId = blockIds[0];
  const otherBlockId = blockIds.find((id) => id !== targetBlockId);


  // Update target block data
  store.updateBlockData(targetBlockId, {
    current: 99,
  });

  const charAfter = useCharacterStore.getState().character;
  const layoutAfter = charAfter.layouts[activeTabId];

  assert(layoutBefore === layoutAfter, "Canvas layout array reference is identical after block data mutation (Pass IDs, Not Objects)");
  assert(charBefore.blocks[targetBlockId] !== charAfter.blocks[targetBlockId], "Mutated block reference updated");
  if (otherBlockId) {
    assert(
      charBefore.blocks[otherBlockId] === charAfter.blocks[otherBlockId],
      "Unmodified sibling blocks preserve exact reference identity (0 re-renders for other blocks)"
    );
  }

  // =========================================================================
  // Test 4: Scoped Play Mode History & Counter Undo
  // =========================================================================
  console.log("\n--- Test 4: Scoped Play Mode History & Counter Undo ---");
  // 1. Switch to Play Mode
  store.setMode("play");
  assert(useCharacterStore.getState().mode === "play", "Switched to Play Mode");

  // Add a dedicated tracker block for testing Play Mode counter actions
  store.setMode("edit");
  store.addBlock(activeTabId, "tracker");
  const trackerBlockId = Object.keys(useCharacterStore.getState().character.blocks).find(
    (id) => useCharacterStore.getState().character.blocks[id].type === "tracker"
  )!;

  store.updateBlockData(trackerBlockId, { current: 20, max: 20, temp: 0 });
  store.clearHistory(); // Clear temporal edit history
  store.clearPlayHistory(); // Clear play history

  // Switch to Play Mode
  store.setMode("play");

  // Modify counter in Play Mode: take 7 damage -> 13
  store.updateBlockData(trackerBlockId, { current: 13 });


  const playPast1 = useCharacterStore.getState().playHistory.past;
  assert(playPast1.length === 1, "Play Mode counter change recorded to playHistory");
  assert(
    (useCharacterStore.getState().character.blocks[trackerBlockId].data as TrackerData).current === 13,
    "Current value is 13"
  );
  assert(useCharacterStore.getState().canUndoPlayMode() === true, "canUndoPlayMode() is true");

  // Undo Play Mode counter change
  store.undoPlayMode();
  assert(
    (useCharacterStore.getState().character.blocks[trackerBlockId].data as TrackerData).current === 20,
    "undoPlayMode() successfully rolled back counter from 13 to 20"
  );
  assert(useCharacterStore.getState().canRedoPlayMode() === true, "canRedoPlayMode() is true");

  // Redo Play Mode counter change
  store.redoPlayMode();
  assert(
    (useCharacterStore.getState().character.blocks[trackerBlockId].data as TrackerData).current === 13,
    "redoPlayMode() successfully rolled forward counter from 20 to 13"
  );

  // 2. Test Batch Rest Undo in Play Mode
  store.updateBlockTags(trackerBlockId, ["#short-rest"]);
  store.applyRest("#short-rest"); // Tracker resets to max (20)
  assert(
    (useCharacterStore.getState().character.blocks[trackerBlockId].data as TrackerData).current === 20,
    "applyRest reset tracker to 20"
  );

  // Undo rest reset in Play Mode
  store.undoPlayMode();
  assert(
    (useCharacterStore.getState().character.blocks[trackerBlockId].data as TrackerData).current === 13,
    "undoPlayMode() reverted batch rest action back to 13"
  );

  // 3. Test Isolation from Edit Mode Temporal
  store.setMode("edit");
  const temporalState = (useCharacterStore as any).temporal?.getState();
  const pastTemporalStates = temporalState?.pastStates?.length ?? 0;
  assert(
    pastTemporalStates === 0,
    "Edit Mode temporal layout history was NOT contaminated by Play Mode counter undo/redo actions"
  );



  // 4. Test Clearing on Character Switch
  store.setMode("play");
  store.updateBlockData(trackerBlockId, { current: 5 });
  assert(useCharacterStore.getState().playHistory.past.length > 0, "playHistory has entries");
  store.newCharacter();
  assert(useCharacterStore.getState().playHistory.past.length === 0, "newCharacter() cleared playHistory");

  console.log("\n🎉 ALL PHASE 11 VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉\n");
}

runPhase11Tests().catch((err) => {
  console.error("Test failed with error:", err);
  throw err;
});

