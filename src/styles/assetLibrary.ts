import type { CustomAsset, CustomAssetKind } from "../types/schema";
import {
  idbSaveDesign,
  idbGetDesign,
  idbGetAllDesigns,
  idbDeleteDesign,
} from "../store/idb";
import { sanitizeSvg } from "./svgSanitizer";

// =============================================================================
// MY DESIGNS — ASSET LIBRARY (PHASE 5 / STYLE SYSTEM PHASE 5)
//
// The shared browser-stored library of user-created SVG designs.
// Embeds copies in characters on export, so exports stay portable.
// =============================================================================

const LOCAL_STORAGE_KEY = "ttrpg_my_designs";

// In-memory cache for instant synchronous lookups during render loops
const assetCache = new Map<string, CustomAsset>();

function loadCacheFromLocalStorage(): void {
  if (typeof localStorage === "undefined") return;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return;
    const items = JSON.parse(raw) as CustomAsset[];
    for (const item of items) {
      if (item && item.id) {
        assetCache.set(item.id, item);
      }
    }
  } catch (err) {
    console.warn("Failed to read custom designs from localStorage cache:", err);
  }
}

function persistCacheToLocalStorage(): void {
  if (typeof localStorage === "undefined") return;
  try {
    const items = Array.from(assetCache.values());
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn("Failed to persist custom designs to localStorage cache:", err);
  }
}

// Hydrate cache on module load
loadCacheFromLocalStorage();

if (typeof window !== "undefined") {
  idbGetAllDesigns()
    .then((designs) => {
      for (const d of designs) {
        assetCache.set(d.id, d);
      }
      persistCacheToLocalStorage();
    })
    .catch((err) => console.warn("Failed to hydrate designs from IndexedDB:", err));
}

export interface AssetLibrary {
  list(): Promise<CustomAsset[]>;
  listSync(): CustomAsset[];
  get(id: string): Promise<CustomAsset | undefined>;
  getSync(id: string): CustomAsset | undefined;
  /** Stores an already-sanitized (or freshly sanitized) asset; returns it with its content-hash id. */
  add(asset: Omit<CustomAsset, "id">): Promise<CustomAsset>;
  remove(id: string): Promise<void>;
  /** Merge assets embedded in an imported character into the library. */
  mergeFromCharacter(assets: Record<string, CustomAsset>): Promise<void>;
}

export const assetLibrary: AssetLibrary = {
  async list(): Promise<CustomAsset[]> {
    try {
      const fromIdb = await idbGetAllDesigns();
      for (const d of fromIdb) {
        assetCache.set(d.id, d);
      }
      persistCacheToLocalStorage();
      return fromIdb;
    } catch {
      return Array.from(assetCache.values());
    }
  },

  listSync(): CustomAsset[] {
    return Array.from(assetCache.values());
  },

  async get(id: string): Promise<CustomAsset | undefined> {
    const inMemory = assetCache.get(id);
    if (inMemory) return inMemory;
    try {
      const fromIdb = await idbGetDesign(id);
      if (fromIdb) {
        assetCache.set(fromIdb.id, fromIdb);
        persistCacheToLocalStorage();
      }
      return fromIdb;
    } catch {
      return undefined;
    }
  },

  getSync(id: string): CustomAsset | undefined {
    return assetCache.get(id);
  },

  async add(asset: Omit<CustomAsset, "id">): Promise<CustomAsset> {
    const sanitized = sanitizeSvg(asset.svg);
    if (!sanitized.ok) {
      throw new Error(`Cannot add design: ${sanitized.reason}`);
    }

    const completeAsset: CustomAsset = {
      id: sanitized.id,
      kind: asset.kind,
      name: asset.name.trim().slice(0, 80),
      svg: sanitized.svg,
      slice: asset.slice,
      recolor: asset.recolor ?? true,
    };

    assetCache.set(completeAsset.id, completeAsset);
    persistCacheToLocalStorage();
    await idbSaveDesign(completeAsset);

    return completeAsset;
  },

  async remove(id: string): Promise<void> {
    assetCache.delete(id);
    persistCacheToLocalStorage();
    await idbDeleteDesign(id);
  },

  async mergeFromCharacter(assets: Record<string, CustomAsset>): Promise<void> {
    for (const asset of Object.values(assets)) {
      if (!asset || !asset.svg) continue;
      const sanitized = sanitizeSvg(asset.svg);
      if (!sanitized.ok) continue;

      const merged: CustomAsset = {
        ...asset,
        id: sanitized.id,
        svg: sanitized.svg,
      };

      assetCache.set(merged.id, merged);
      await idbSaveDesign(merged);
    }
    persistCacheToLocalStorage();
  },
};

export function getCustomAssetSync(id: string): CustomAsset | undefined {
  return assetLibrary.getSync(id);
}

export function listCustomAssetsSync(kind?: CustomAssetKind): CustomAsset[] {
  const all = assetLibrary.listSync();
  return kind ? all.filter((a) => a.kind === kind) : all;
}

