import type { Character, CustomAsset } from "../types/schema";

const DB_NAME = "super_sheet_db";
const DB_VERSION = 2;
const STORE_SHEETS = "sheets";
const STORE_META = "meta";
const STORE_DESIGNS = "my_designs";

// In-memory fallback for non-browser environments (e.g. Node.js unit tests)
const memorySheets = new Map<string, Character>();
const memoryMeta = new Map<string, unknown>();
const memoryDesigns = new Map<string, CustomAsset>();


function isIndexedDBAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      reject(new Error("IndexedDB is not available in this environment"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_SHEETS)) {
        db.createObjectStore(STORE_SHEETS, { keyPath: "meta.id" });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META);
      }
      if (!db.objectStoreNames.contains(STORE_DESIGNS)) {
        db.createObjectStore(STORE_DESIGNS, { keyPath: "id" });
      }
    };


    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save a character document to IndexedDB
 */
export async function idbSaveCharacter(char: Character): Promise<void> {
  if (!isIndexedDBAvailable()) {
    memorySheets.set(char.meta.id, JSON.parse(JSON.stringify(char)));
    return;
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_SHEETS], "readwrite");
    const store = tx.objectStore(STORE_SHEETS);
    const request = store.put(char);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get a single character document from IndexedDB by ID
 */
export async function idbGetCharacter(id: string): Promise<Character | null> {
  if (!isIndexedDBAvailable()) {
    const found = memorySheets.get(id);
    return found ? JSON.parse(JSON.stringify(found)) : null;
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_SHEETS], "readonly");
    const store = tx.objectStore(STORE_SHEETS);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete a character from IndexedDB by ID
 */
export async function idbDeleteCharacter(id: string): Promise<void> {
  if (!isIndexedDBAvailable()) {
    memorySheets.delete(id);
    return;
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_SHEETS], "readwrite");
    const store = tx.objectStore(STORE_SHEETS);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all character documents stored in IndexedDB
 */
export async function idbGetAllCharacters(): Promise<Character[]> {
  if (!isIndexedDBAvailable()) {
    return Array.from(memorySheets.values()).map((c) => JSON.parse(JSON.stringify(c)));
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_SHEETS], "readonly");
    const store = tx.objectStore(STORE_SHEETS);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Set metadata value (e.g. active character ID or manifest)
 */
export async function idbSetMeta<T>(key: string, value: T): Promise<void> {
  if (!isIndexedDBAvailable()) {
    memoryMeta.set(key, JSON.parse(JSON.stringify(value)));
    return;
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_META], "readwrite");
    const store = tx.objectStore(STORE_META);
    const request = store.put(value, key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get metadata value
 */
export async function idbGetMeta<T>(key: string): Promise<T | null> {
  if (!isIndexedDBAvailable()) {
    const found = memoryMeta.get(key);
    return found !== undefined ? (JSON.parse(JSON.stringify(found)) as T) : null;
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_META], "readonly");
    const store = tx.objectStore(STORE_META);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save custom design asset to IndexedDB
 */
export async function idbSaveDesign(asset: CustomAsset): Promise<void> {
  if (!isIndexedDBAvailable()) {
    memoryDesigns.set(asset.id, JSON.parse(JSON.stringify(asset)));
    return;
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_DESIGNS], "readwrite");
    const store = tx.objectStore(STORE_DESIGNS);
    const request = store.put(asset);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get a single custom design asset by ID
 */
export async function idbGetDesign(id: string): Promise<CustomAsset | undefined> {
  if (!isIndexedDBAvailable()) {
    const found = memoryDesigns.get(id);
    return found ? JSON.parse(JSON.stringify(found)) : undefined;
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_DESIGNS], "readonly");
    const store = tx.objectStore(STORE_DESIGNS);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || undefined);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all custom design assets from IndexedDB
 */
export async function idbGetAllDesigns(): Promise<CustomAsset[]> {
  if (!isIndexedDBAvailable()) {
    return Array.from(memoryDesigns.values()).map((v) => JSON.parse(JSON.stringify(v)));
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_DESIGNS], "readonly");
    const store = tx.objectStore(STORE_DESIGNS);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete a custom design asset by ID
 */
export async function idbDeleteDesign(id: string): Promise<void> {
  if (!isIndexedDBAvailable()) {
    memoryDesigns.delete(id);
    return;
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_DESIGNS], "readwrite");
    const store = tx.objectStore(STORE_DESIGNS);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

