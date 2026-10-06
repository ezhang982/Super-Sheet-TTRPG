import type { CustomAsset } from "../types/schema";

// =============================================================================
// MY DESIGNS — ASSET LIBRARY INTERFACE (Phase 0, no implementation yet)
//
// Decisions (see styling roadmap v2, section 4):
//  - The library lives in the browser (IndexedDB), shared by all characters.
//  - Using an asset embeds a COPY in that character's `customAssets`, so
//    exports/shares stay portable even if browser storage is cleared.
//  - Asset ids are a hash of the sanitized SVG, so identical art dedupes.
//  - Editing a design creates a NEW asset (new id). Characters keep using the
//    old version until the user explicitly chooses "Update design".
// =============================================================================

export interface AssetLibrary {
  list(): Promise<CustomAsset[]>;
  get(id: string): Promise<CustomAsset | undefined>;
  /** Stores an already-sanitized asset; returns it with its content-hash id. */
  add(asset: Omit<CustomAsset, "id">): Promise<CustomAsset>;
  remove(id: string): Promise<void>;
  /** Merge assets embedded in an imported character into the library. */
  mergeFromCharacter(assets: Record<string, CustomAsset>): Promise<void>;
}
