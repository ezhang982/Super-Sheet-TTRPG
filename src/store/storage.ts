import { CharacterSchema, type Character } from "../types/schema";
import { createDefaultCharacter } from "./fixtures";
import {
  idbSaveCharacter,
  idbGetCharacter,
  idbDeleteCharacter,
  idbGetAllCharacters,
  idbSetMeta,
  idbGetMeta,
} from "./idb";

const STORAGE_PREFIX = "ttrpg_sheet_";
const ACTIVE_CHAR_KEY = "ttrpg_active_char_id";
const MANIFEST_KEY = "ttrpg_manifest";

export interface CharacterManifestEntry {
  id: string;
  name: string;
  system: string;
  updatedAt: number;
}

/**
 * Synchronous fallback read from localStorage for instant initial paint
 */
export function loadManifest(): CharacterManifestEntry[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(MANIFEST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Async read from IndexedDB with localStorage fallback
 */
export async function loadManifestAsync(): Promise<CharacterManifestEntry[]> {
  try {
    const idbManifest = await idbGetMeta<CharacterManifestEntry[]>("manifest");
    if (idbManifest && idbManifest.length > 0) {
      return idbManifest;
    }
  } catch (err) {
    console.warn("Could not read manifest from IndexedDB:", err);
  }
  return loadManifest();
}

export function saveManifest(manifest: CharacterManifestEntry[]): void {
  // Sync to localStorage
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(MANIFEST_KEY, JSON.stringify(manifest));
    } catch (err) {
      console.error("Failed to save manifest to localStorage:", err);
    }
  }
  // Sync to IndexedDB
  idbSetMeta("manifest", manifest).catch((err) =>
    console.error("Failed to save manifest to IndexedDB:", err)
  );
}

export function updateManifestEntry(char: Character): void {
  const manifest = loadManifest();
  const existingIdx = manifest.findIndex((m) => m.id === char.meta.id);
  const entry: CharacterManifestEntry = {
    id: char.meta.id,
    name: char.meta.name || "Untitled Character",
    system: char.meta.system || "Custom",
    updatedAt: char.meta.updatedAt || Date.now(),
  };

  if (existingIdx >= 0) {
    manifest[existingIdx] = entry;
  } else {
    manifest.push(entry);
  }
  saveManifest(manifest);
}

/**
 * Synchronous initial character loader (instant first paint)
 */
export function loadInitialCharacter(): Character {
  if (typeof localStorage === "undefined") {
    return createDefaultCharacter();
  }
  try {
    const activeId = localStorage.getItem(ACTIVE_CHAR_KEY);
    if (activeId) {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${activeId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        const result = CharacterSchema.safeParse(parsed);
        if (result.success) {
          return result.data;
        }
      }
    }
  } catch (err) {
    console.warn("Could not load character from localStorage, initializing default:", err);
  }

  const defaultChar = createDefaultCharacter();
  saveCharacterToStorage(defaultChar);
  return defaultChar;
}

/**
 * Initialize IndexedDB and migrate any existing data from localStorage
 */
export async function initStorageAndMigrate(): Promise<void> {
  if (typeof localStorage === "undefined") return;

  try {
    const existingIDBSheets = await idbGetAllCharacters();
    if (existingIDBSheets.length === 0) {
      // Migrate from localStorage
      const manifest = loadManifest();
      for (const entry of manifest) {
        const raw = localStorage.getItem(`${STORAGE_PREFIX}${entry.id}`);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            const result = CharacterSchema.safeParse(parsed);
            if (result.success) {
              await idbSaveCharacter(result.data);
            }
          } catch {
            // Ignore corrupted individual entries
          }
        }
      }

      if (manifest.length > 0) {
        await idbSetMeta("manifest", manifest);
      }

      const activeId = localStorage.getItem(ACTIVE_CHAR_KEY);
      if (activeId) {
        await idbSetMeta("active_char_id", activeId);
      }
    }
  } catch (err) {
    console.warn("initStorageAndMigrate encountered an error:", err);
  }
}

export interface ReconciliationResult {
  reconciled: boolean;
  source: "idb" | "localStorage" | "none";
  character: Character | null;
}

/**
 * Merge manifests across IndexedDB and localStorage by highest updatedAt
 */
export async function reconcileManifests(): Promise<CharacterManifestEntry[]> {
  const localManifest = loadManifest();
  const idbManifest = (await idbGetMeta<CharacterManifestEntry[]>("manifest")) || [];

  const map = new Map<string, CharacterManifestEntry>();
  for (const entry of localManifest) {
    map.set(entry.id, entry);
  }
  for (const entry of idbManifest) {
    const existing = map.get(entry.id);
    if (!existing || (entry.updatedAt || 0) > (existing.updatedAt || 0)) {
      map.set(entry.id, entry);
    }
  }

  // Also check all characters stored in IndexedDB to catch any unindexed sheets
  try {
    const allIdbSheets = await idbGetAllCharacters();
    for (const sheet of allIdbSheets) {
      const existing = map.get(sheet.meta.id);
      const sheetTime = sheet.meta.updatedAt || 0;
      if (!existing || sheetTime > (existing.updatedAt || 0)) {
        map.set(sheet.meta.id, {
          id: sheet.meta.id,
          name: sheet.meta.name || "Untitled Character",
          system: sheet.meta.system || "Custom",
          updatedAt: sheetTime,
        });
      }
    }
  } catch {}

  const merged = Array.from(map.values());
  saveManifest(merged);
  return merged;
}

/**
 * Reconcile character documents and manifests between IndexedDB and localStorage.
 * If IndexedDB holds a newer timestamp than the currently loaded/localStorage character,
 * returns the authoritative character from IndexedDB and syncs the localStorage cache.
 */
export async function reconcileStorage(currentCharacter?: Character): Promise<ReconciliationResult> {
  try {
    // 1. Get active ID from IDB, fallback to localStorage or current character
    const idbActiveId = await idbGetMeta<string>("active_char_id");
    const localActiveId = typeof localStorage !== "undefined" ? localStorage.getItem(ACTIVE_CHAR_KEY) : null;
    const activeId = idbActiveId || localActiveId || currentCharacter?.meta.id;

    if (!activeId) {
      return { reconciled: false, source: "none", character: null };
    }

    // 2. Fetch from IndexedDB
    const idbChar = await idbGetCharacter(activeId);
    let localChar: Character | null = currentCharacter || null;

    if (!localChar && typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${activeId}`);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          const valid = CharacterSchema.safeParse(parsed);
          if (valid.success) localChar = valid.data;
        } catch {}
      }
    }

    // 3. Manifest reconciliation: merge IDB and localStorage entries, keeping newer timestamps
    await reconcileManifests();

    // 4. Compare timestamps between IndexedDB and localStorage
    const idbTime = idbChar?.meta.updatedAt ?? 0;
    const localTime = localChar?.meta.updatedAt ?? 0;

    if (idbChar && idbTime > localTime) {
      // IndexedDB is newer! Authoritative IDB wins over stale/truncated localStorage
      if (typeof localStorage !== "undefined") {
        try {
          localStorage.setItem(`${STORAGE_PREFIX}${idbChar.meta.id}`, JSON.stringify(idbChar));
          localStorage.setItem(ACTIVE_CHAR_KEY, idbChar.meta.id);
        } catch (err) {
          console.warn("Could not cache reconciled IDB sheet to localStorage (quota exceeded):", err);
        }
      }
      return { reconciled: true, source: "idb", character: idbChar };
    } else if (localChar && localTime > idbTime) {
      // localStorage is newer! Catch up IndexedDB
      await idbSaveCharacter(localChar);
      await idbSetMeta("active_char_id", localChar.meta.id);
      return { reconciled: true, source: "localStorage", character: localChar };
    }

    return { reconciled: false, source: "none", character: idbChar || localChar || null };
  } catch (err) {
    console.warn("reconcileStorage warning:", err);
    return { reconciled: false, source: "none", character: null };
  }
}

/**
 * Combined startup initialization, legacy migration, and dual-storage reconciliation
 */
export async function initAndReconcileStorage(currentCharacter?: Character): Promise<ReconciliationResult> {
  // 1. Setup lifecycle save flush listeners
  setupStorageLifecycleListeners();

  // 2. Perform legacy migration if IDB is empty
  await initStorageAndMigrate();

  // 3. Reconcile dual storage
  return reconcileStorage(currentCharacter);
}


/**
 * Load a character from IndexedDB by ID (falls back to localStorage)
 */
export async function loadCharacterById(id: string): Promise<Character | null> {
  try {
    const fromIdb = await idbGetCharacter(id);
    if (fromIdb) {
      const result = CharacterSchema.safeParse(fromIdb);
      if (result.success) return result.data;
    }
  } catch (err) {
    console.warn(`Failed to read ${id} from IndexedDB:`, err);
  }

  // Fallback to localStorage
  if (typeof localStorage !== "undefined") {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${id}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        const result = CharacterSchema.safeParse(parsed);
        if (result.success) return result.data;
      }
    } catch {}
  }

  return null;
}

/**
 * Delete a character by ID from IndexedDB, localStorage, and manifest
 */
export async function deleteCharacterById(id: string): Promise<boolean> {
  try {
    await idbDeleteCharacter(id);
  } catch (err) {
    console.error(`Failed to delete ${id} from IndexedDB:`, err);
  }

  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${id}`);
    } catch {}
  }

  const manifest = loadManifest().filter((m) => m.id !== id);
  saveManifest(manifest);
  return true;
}

/**
 * Duplicate an existing character by ID and save as a new sheet
 */
export async function duplicateCharacterById(id: string): Promise<Character | null> {
  const original = await loadCharacterById(id);
  if (!original) return null;

  const newId = `char_${crypto.randomUUID()}`;
  const now = Date.now();

  const clone: Character = {
    ...original,
    meta: {
      ...original.meta,
      id: newId,
      name: `${original.meta.name} (Copy)`,
      createdAt: now,
      updatedAt: now,
    },
  };

  saveCharacterToStorage(clone);
  return clone;
}

let inFlightIdbWrites = 0;
let pendingCharacterToSave: Character | null = null;
let pendingStatusChangeCb: ((status: "saving" | "saved") => void) | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let lifecycleListenersAttached = false;

/**
 * Check if there are active in-flight writes or pending debounced saves
 */
export function hasInFlightWrites(): boolean {
  return pendingCharacterToSave !== null || inFlightIdbWrites > 0;
}

/**
 * Wait for all pending and in-flight writes to finish settling
 */
export async function waitForInFlightWrites(timeoutMs = 1000): Promise<boolean> {
  const start = Date.now();
  while (hasInFlightWrites()) {
    if (Date.now() - start > timeoutMs) return false;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  return true;
}


/**
 * Flush any pending debounced save immediately to localStorage and IndexedDB
 */
export function flushPendingSave(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  if (pendingCharacterToSave) {
    const char = pendingCharacterToSave;
    const cb = pendingStatusChangeCb;
    pendingCharacterToSave = null;
    pendingStatusChangeCb = null;
    saveCharacterToStorage(char);
    if (cb) cb("saved");
  }
}

/**
 * Register Page Lifecycle API listeners to prevent tab-close data loss
 */
export function setupStorageLifecycleListeners(): void {
  if (lifecycleListenersAttached) return;
  if (typeof window === "undefined" || typeof document === "undefined") return;

  lifecycleListenersAttached = true;

  // 1. Page Visibility API: visibilitychange (document.visibilityState === 'hidden')
  // Guaranteed by browsers when switching tabs, minimizing, locking screen, or closing tab
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushPendingSave();
    }
  });

  // 2. pagehide: Fires reliably on mobile Safari and Chromium during navigation/unload
  window.addEventListener("pagehide", () => {
    flushPendingSave();
  });

  // 3. beforeunload: Synchronously flushes and alerts user if async IDB write is in-flight
  window.addEventListener("beforeunload", (event) => {
    flushPendingSave();
    if (hasInFlightWrites()) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
}

/**
 * Save character to both IndexedDB and localStorage (with manifest update)
 */
export function saveCharacterToStorage(char: Character): void {
  // If this exact character was pending debounce save, clear pending reference
  if (pendingCharacterToSave?.meta.id === char.meta.id) {
    pendingCharacterToSave = null;
  }

  // 1. Update localStorage (sync backup for instant frame-0 paint)
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${char.meta.id}`, JSON.stringify(char));
      localStorage.setItem(ACTIVE_CHAR_KEY, char.meta.id);
    } catch (err) {
      // QuotaExceededError in localStorage is expected if size > 5MB; IndexedDB handles this!
      console.warn("localStorage quota exceeded, continuing with IndexedDB:", err);
    }
  }

  // 2. Asynchronous IndexedDB write with in-flight tracking
  inFlightIdbWrites++;
  idbSaveCharacter(char)
    .catch((err) =>
      console.error("Failed to save character to IndexedDB:", err)
    )
    .finally(() => {
      inFlightIdbWrites = Math.max(0, inFlightIdbWrites - 1);
    });

  idbSetMeta("active_char_id", char.meta.id).catch(() => {});

  updateManifestEntry(char);
}

export function debouncedSaveCharacter(
  char: Character,
  delayMs = 300,
  onStatusChange?: (status: "saving" | "saved") => void
): void {
  pendingCharacterToSave = char;
  pendingStatusChangeCb = onStatusChange || null;
  if (onStatusChange) onStatusChange("saving");
  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    flushPendingSave();
  }, delayMs);
}

export async function exportCharacterAsJson(char: Character, isTemplate = false): Promise<boolean> {
  const dataStr = JSON.stringify(char, null, 2);
  const filename = `${char.meta.name.toLowerCase().replace(/[^a-z0-9]/g, "-") || "character"}${
    isTemplate ? "-template" : "-sheet"
  }.json`;

  // Modern File System Access API: opens native OS file save dialog (folder picker)
  if (typeof window !== "undefined" && "showSaveFilePicker" in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: isTemplate ? "JSON Character Template" : "JSON Character Sheet",
            accept: { "application/json": [".json"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(dataStr);
      await writable.close();
      return true;
    } catch (err: any) {
      if (err.name === "AbortError") {
        return false;
      }
      console.warn("showSaveFilePicker failed, falling back to standard download:", err);
    }
  }

  // Fallback for browsers without File System Access API
  if (typeof document === "undefined") return false;
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}
