import type {
  Character,
  Block,
  BlockType,
  GlobalTheme,
  BlockStyle,
  LayoutItem,
} from "./schema";

// =============================================================================
// PHASE 0 — CANONICAL STORE CONTRACT
// This is the full mutation surface every component is allowed to talk to.
// Nothing mutates `character` state ad hoc outside these actions. If a new
// mutation is needed later, it gets added here first and CLAUDE.md gets
// updated in the same commit — the contract is not allowed to drift silently
// across sessions.
// =============================================================================

export interface RestAction {
  id: string; // e.g. "rest_short"
  label: string; // button label, e.g. "Short Rest"
  tag: string; // the tag in blocks' tags[] this button resets, e.g. "#short-rest"
}

export type Mode = "edit" | "play";

export interface CharacterStore {
  // ---- State ----
  character: Character;
  restActions: RestAction[]; // seeded from DEFAULT_REST_TAGS; user can add/rename/remove (UI ships Phase 4, store supports it from Phase 0)
  mode: Mode;
  activeTagFilter: string | null;

  // ---- Mode & Filter ----
  setMode: (mode: Mode) => void;
  setActiveTagFilter: (tag: string | null) => void;

  // ---- Character / meta ----
  setCharacterMeta: (patch: Partial<Character["meta"]>) => void;

  // ---- Tabs ----
  addTab: (label: string) => void;
  renameTab: (tabId: string, label: string) => void;
  // removeTab cascades deletion to all blocks residing on that tab, prevents
  // deleting the last remaining tab, and reassigns activeTabId to an available tab.
  // (UI prompts confirmation if tab has blocks).
  removeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;

  // ---- Layout & blocks ----
  // updateTabLayout is committed ONCE per gesture from react-grid-layout's
  // onDragStop/onResizeStop. RGL reorganizes and compacts neighboring blocks on
  // collision, so committing the full tab layout array ensures all shifted blocks
  // stay in sync, preserves one undo step per gesture, and avoids per-frame store re-renders.
  addBlock: (tabId: string, type: BlockType, initialData?: Block["data"]) => void;
  deleteBlock: (blockId: string) => void;
  updateTabLayout: (tabId: string, layout: LayoutItem[]) => void;
  moveBlockToTab: (blockId: string, fromTabId: string, toTabId: string) => void;
  // updateBlockData performs a deep merge patch so nested fields (e.g. card.tracker)
  // can be updated without wiping out unmentioned keys.
  updateBlockData: (blockId: string, patch: Partial<Block["data"]> | Record<string, unknown>) => void;
  updateBlockStyle: (blockId: string, patch: Partial<BlockStyle>) => void;
  updateBlockTags: (blockId: string, tags: string[]) => void;
  updateBlockTitle: (blockId: string, title: string) => void;

  // ---- Theme ----
  setGlobalTheme: (patch: Partial<GlobalTheme>) => void;

  // ---- Rest engine ----
  // applyRest scans every block's tags[] for `tag`; matches reset per §6.1
  // (tracker -> current = max, pip_array -> every row's expended = 0).
  applyRest: (tag: string) => void;
  addRestAction: (label: string, tag: string) => void;
  removeRestAction: (id: string) => void;

  // ---- Persistence ----
  importCharacter: (json: unknown) => { success: true } | { success: false; error: string };
  exportCharacter: () => Character;
  exportTemplate: () => Character; // strips meta.name + all instance values, keeps layout/tags/theme

  // ---- History ----
  // Implemented as an undo middleware wrapping this store (temporal slice via zundo),
  // covering only the structural mutations above — NOT Play Mode tracker/pip
  // value changes. Text-field edits are debounced so one undo step = one
  // pause in typing, not one keystroke. Session-only; cleared on reload;
  // never touches persisted localStorage state. See CLAUDE.md §8.3.
  undo: () => void;
  redo: () => void;
}
