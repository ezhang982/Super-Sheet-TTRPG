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

/**
 * Save character to both IndexedDB and localStorage (with manifest update)
 */
export function saveCharacterToStorage(char: Character): void {
  // Update localStorage (sync backup)
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${char.meta.id}`, JSON.stringify(char));
      localStorage.setItem(ACTIVE_CHAR_KEY, char.meta.id);
    } catch (err) {
      // QuotaExceededError in localStorage is expected if size > 5MB; IndexedDB handles this!
      console.warn("localStorage quota exceeded, continuing with IndexedDB:", err);
    }
  }

  // Asynchronous IndexedDB write
  idbSaveCharacter(char).catch((err) =>
    console.error("Failed to save character to IndexedDB:", err)
  );
  idbSetMeta("active_char_id", char.meta.id).catch(() => {});

  updateManifestEntry(char);
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
export function debouncedSaveCharacter(
  char: Character,
  delayMs = 300,
  onStatusChange?: (status: "saving" | "saved") => void
): void {
  if (onStatusChange) onStatusChange("saving");
  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    saveCharacterToStorage(char);
    if (onStatusChange) onStatusChange("saved");
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
