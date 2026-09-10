import { CharacterSchema, type Character } from "../types/schema";
import { createDefaultCharacter } from "./fixtures";

const STORAGE_PREFIX = "ttrpg_sheet_";
const ACTIVE_CHAR_KEY = "ttrpg_active_char_id";
const MANIFEST_KEY = "ttrpg_manifest";

export interface CharacterManifestEntry {
  id: string;
  name: string;
  system: string;
  updatedAt: number;
}

export function loadManifest(): CharacterManifestEntry[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(MANIFEST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveManifest(manifest: CharacterManifestEntry[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(MANIFEST_KEY, JSON.stringify(manifest));
  } catch (err) {
    console.error("Failed to save manifest to localStorage:", err);
  }
}

export function updateManifestEntry(char: Character): void {
  if (typeof localStorage === "undefined") return;
  const manifest = loadManifest();
  const existingIdx = manifest.findIndex((m) => m.id === char.meta.id);
  const entry: CharacterManifestEntry = {
    id: char.meta.id,
    name: char.meta.name,
    system: char.meta.system,
    updatedAt: char.meta.updatedAt,
  };

  if (existingIdx >= 0) {
    manifest[existingIdx] = entry;
  } else {
    manifest.push(entry);
  }
  saveManifest(manifest);
}

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

export function saveCharacterToStorage(char: Character): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${char.meta.id}`, JSON.stringify(char));
    localStorage.setItem(ACTIVE_CHAR_KEY, char.meta.id);
    updateManifestEntry(char);
  } catch (err) {
    console.error("Failed to save character to localStorage:", err);
  }
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
export function debouncedSaveCharacter(char: Character, delayMs = 300): void {
  if (typeof localStorage === "undefined") return;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    saveCharacterToStorage(char);
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
        // User cancelled the file picker dialog
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
