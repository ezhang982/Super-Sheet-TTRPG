import { create } from "zustand";
import { temporal } from "zundo";
import {
  CharacterSchema,
  DEFAULT_REST_TAGS,
  type Character,
  type Block,
  type BlockType,
  type BlockStyle,
  type GlobalTheme,
  type LayoutItem,
} from "../types/schema";
import type { CharacterStore, Mode, RestAction } from "../types/store-contract";
import {
  loadInitialCharacter,
  debouncedSaveCharacter,
  saveCharacterToStorage,
  exportCharacterAsJson,
  loadCharacterById as loadCharFromStorage,
  duplicateCharacterById as duplicateCharInStorage,
  deleteCharacterById as deleteCharFromStorage,
  initStorageAndMigrate,
} from "./storage";
import { blankTemplate } from "../templates/blank";

// Initialize IndexedDB and migrate legacy localStorage data
if (typeof window !== "undefined") {
  initStorageAndMigrate().catch((err) =>
    console.warn("Storage initialization/migration warning:", err)
  );
}

function deepMerge<T extends Record<string, unknown>>(target: T, patch: Record<string, unknown>): T {
  const output = { ...target };
  for (const key of Object.keys(patch)) {
    const patchVal = patch[key];
    const targetVal = (target as Record<string, unknown>)[key];
    if (
      patchVal !== null &&
      typeof patchVal === "object" &&
      !Array.isArray(patchVal) &&
      targetVal !== null &&
      typeof targetVal === "object" &&
      !Array.isArray(targetVal)
    ) {
      (output as Record<string, unknown>)[key] = deepMerge(
        targetVal as Record<string, unknown>,
        patchVal as Record<string, unknown>
      );
    } else {
      (output as Record<string, unknown>)[key] = patchVal;
    }
  }
  return output;
}

const defaultRestActions: RestAction[] = [
  { id: "rest_short", label: "Short Rest", tag: DEFAULT_REST_TAGS[0] },
  { id: "rest_long", label: "Long Rest", tag: DEFAULT_REST_TAGS[1] },
];

export const useCharacterStore = create<CharacterStore>()(
  temporal(
    (set, get) => ({
      // ---- State ----
      character: loadInitialCharacter(),
      restActions: defaultRestActions,
      mode: "edit",
      activeTagFilter: null,
      saveStatus: "saved",
      enableTagSuggestions: true,

      // ---- Mode & Tag Filter ----
      setMode: (mode: Mode) => {
        set({ mode });
        const temporalState = (useCharacterStore as unknown as { temporal?: { getState: () => { pause: () => void; resume: () => void } } })
          .temporal?.getState();
        if (temporalState) {
          if (mode === "play") {
            temporalState.pause();
          } else {
            temporalState.resume();
          }
        }
      },

      setActiveTagFilter: (tag: string | null) => {
        set({ activeTagFilter: tag });
      },

      // ---- Character / Meta ----
      setCharacterMeta: (patch: Partial<Character["meta"]>) => {
        const { character } = get();
        set({
          character: {
            ...character,
            meta: {
              ...character.meta,
              ...patch,
              updatedAt: Date.now(),
            },
          },
        });
      },

      // ---- Tabs ----
      addTab: (label: string) => {
        const { character } = get();
        const newTabId = `tab_${crypto.randomUUID()}`;
        set({
          character: {
            ...character,
            tabs: [...character.tabs, { id: newTabId, label }],
            layouts: {
              ...character.layouts,
              [newTabId]: [],
            },
            activeTabId: newTabId,
            meta: { ...character.meta, updatedAt: Date.now() },
          },
        });
      },

      renameTab: (tabId: string, label: string) => {
        const { character } = get();
        set({
          character: {
            ...character,
            tabs: character.tabs.map((t) => (t.id === tabId ? { ...t, label } : t)),
            meta: { ...character.meta, updatedAt: Date.now() },
          },
        });
      },

      removeTab: (tabId: string) => {
        const { character } = get();
        // Guard: Prevent deleting the last remaining tab
        if (character.tabs.length <= 1) return;

        const tabBlocks = character.layouts[tabId]?.map((item) => item.i) ?? [];
        const remainingTabs = character.tabs.filter((t) => t.id !== tabId);
        const newActiveTabId =
          character.activeTabId === tabId ? remainingTabs[0].id : character.activeTabId;

        // Cascade deletion: remove all blocks in this tab
        const newBlocks = { ...character.blocks };
        for (const bId of tabBlocks) {
          delete newBlocks[bId];
        }

        const newLayouts = { ...character.layouts };
        delete newLayouts[tabId];

        set({
          character: {
            ...character,
            tabs: remainingTabs,
            activeTabId: newActiveTabId,
            layouts: newLayouts,
            blocks: newBlocks,
            meta: { ...character.meta, updatedAt: Date.now() },
          },
        });
      },

      setActiveTab: (tabId: string) => {
        const { character } = get();
        if (character.tabs.some((t) => t.id === tabId)) {
          set({
            character: {
              ...character,
              activeTabId: tabId,
            },
          });
        }
      },

      // ---- Layout & Blocks ----
      addBlock: (tabId: string, type: BlockType, initialData?: Block["data"]) => {
        const { character } = get();
        const blockId = `block_${crypto.randomUUID()}`;

        let data: Block["data"];
        if (initialData) {
          data = initialData;
        } else {
          switch (type) {
            case "tracker":
              data = { current: 10, max: 10, temp: 0, step: 1 };
              break;
            case "stat_group":
              data = { stats: [{ label: "STAT", score: "10", sub: "+0" }] };
              break;
            case "card":
              data = {
                badge: "Feature",
                description: "Description text here.",
                tracker: { enabled: false, current: 0, max: 0 },
              };
              break;
            case "pip_array":
              data = { rows: [{ label: "Resource", total: 3, expended: 0 }] };
              break;
            case "notes":
              data = { markdown: "Enter notes here..." };
              break;
            case "profile":
              data = {
                characterName: "New Character",
                system: "Custom",
                level: "1",
                experience: "0 XP",
                playerName: "",
                extraInfo: "",
              };
              break;
            case "inventory":
              data = {
                items: [
                  {
                    id: `item_${crypto.randomUUID()}`,
                    name: "Adventurer's Pack",
                    quantity: 1,
                    weight: 5,
                    cost: "10 gp",
                    equipped: true,
                    description: "Backpack filled with survival rations, bedroll, and torch.",
                    tags: ["#gear"],
                  },
                ],
                currency: { GP: "15", SP: "5", CP: "10" },
                capacity: { enabled: true, maxWeight: 60 },
              };
              break;
            case "skill_list":
              data = {
                skills: [
                  {
                    id: `skill_${crypto.randomUUID()}`,
                    name: "Athletics",
                    stat: "STR",
                    value: "+2",
                    proficiency: 1,
                  },
                  {
                    id: `skill_${crypto.randomUUID()}`,
                    name: "Stealth",
                    stat: "DEX",
                    value: "+4",
                    proficiency: 1,
                  },
                  {
                    id: `skill_${crypto.randomUUID()}`,
                    name: "Perception",
                    stat: "WIS",
                    value: "+3",
                    proficiency: 1,
                  },
                ],
                sortMode: "alpha",
              };
              break;
          }
        }

        const defaultTitles: Record<BlockType, string> = {
          tracker: "New Tracker",
          stat_group: "New Stat Group",
          card: "New Feature Card",
          pip_array: "New Pip Array",
          notes: "New Notes",
          profile: "Character Profile",
          inventory: "Inventory & Items",
          skill_list: "Skills",
        };

        const newBlock = {
          id: blockId,
          type,
          title: defaultTitles[type],
          tags: ["#new"],
          data,
          style: {},
        } as Block;

        const currentTabItems = character.layouts[tabId] ?? [];
        const maxY = currentTabItems.reduce((max, item) => Math.max(max, item.y + item.h), 0);

        const newLayoutItem: LayoutItem = {
          i: blockId,
          x: 0,
          y: maxY,
          w: type === "notes" ? 12 : type === "tracker" ? 4 : 6,
          h: type === "inventory" || type === "skill_list" ? 5 : 3,
        };

        set({
          character: {
            ...character,
            blocks: {
              ...character.blocks,
              [blockId]: newBlock,
            },
            layouts: {
              ...character.layouts,
              [tabId]: [...currentTabItems, newLayoutItem],
            },
            meta: { ...character.meta, updatedAt: Date.now() },
          },
        });
      },

      duplicateBlock: (blockId: string): string | null => {
        const { character } = get();
        const originalBlock = character.blocks[blockId];
        if (!originalBlock) return null;

        const newBlockId = `block_${crypto.randomUUID()}`;
        // Deep clone data, style, and tags
        const clonedData = JSON.parse(JSON.stringify(originalBlock.data));
        const clonedStyle = JSON.parse(JSON.stringify(originalBlock.style || {}));
        const clonedTags = [...originalBlock.tags];

        const newBlock: Block = {
          ...originalBlock,
          id: newBlockId,
          title: `${originalBlock.title} (Copy)`,
          tags: clonedTags,
          style: clonedStyle,
          data: clonedData,
        } as Block;

        // Find which tab this block belongs to and its layout item
        let targetTabId = character.activeTabId;
        let originalLayoutItem: LayoutItem | undefined;

        for (const [tId, layout] of Object.entries(character.layouts)) {
          const found = layout.find((item) => item.i === blockId);
          if (found) {
            targetTabId = tId;
            originalLayoutItem = found;
            break;
          }
        }

        const tabLayout = character.layouts[targetTabId] ?? [];
        let newLayoutItem: LayoutItem;

        if (originalLayoutItem) {
          // Attempt to position beside original if width permits, else directly beneath
          const canFitBeside = originalLayoutItem.x + originalLayoutItem.w * 2 <= 12;
          newLayoutItem = {
            i: newBlockId,
            x: canFitBeside ? originalLayoutItem.x + originalLayoutItem.w : originalLayoutItem.x,
            y: canFitBeside ? originalLayoutItem.y : originalLayoutItem.y + originalLayoutItem.h,
            w: originalLayoutItem.w,
            h: originalLayoutItem.h,
          };
        } else {
          const maxY = tabLayout.reduce((max, item) => Math.max(max, item.y + item.h), 0);
          newLayoutItem = {
            i: newBlockId,
            x: 0,
            y: maxY,
            w: originalBlock.type === "notes" ? 12 : originalBlock.type === "tracker" ? 4 : 6,
            h: originalBlock.type === "inventory" || originalBlock.type === "skill_list" ? 5 : 3,
          };
        }

        set({
          character: {
            ...character,
            blocks: {
              ...character.blocks,
              [newBlockId]: newBlock,
            },
            layouts: {
              ...character.layouts,
              [targetTabId]: [...tabLayout, newLayoutItem],
            },
            meta: { ...character.meta, updatedAt: Date.now() },
          },
        });

        return newBlockId;
      },

      deleteBlock: (blockId: string) => {
        const { character } = get();
        const newBlocks = { ...character.blocks };
        delete newBlocks[blockId];

        const newLayouts: Record<string, LayoutItem[]> = {};
        for (const [tId, layout] of Object.entries(character.layouts)) {
          newLayouts[tId] = layout.filter((item) => item.i !== blockId);
        }

        set({
          character: {
            ...character,
            blocks: newBlocks,
            layouts: newLayouts,
            meta: { ...character.meta, updatedAt: Date.now() },
          },
        });
      },

      updateTabLayout: (tabId: string, layout: LayoutItem[]) => {
        const { character } = get();
        set({
          character: {
            ...character,
            layouts: {
              ...character.layouts,
              [tabId]: layout,
            },
            meta: { ...character.meta, updatedAt: Date.now() },
          },
        });
      },

      moveBlockToTab: (blockId: string, fromTabId: string, toTabId: string) => {
        if (fromTabId === toTabId) return;
        const { character } = get();
        const sourceLayout = character.layouts[fromTabId] ?? [];
        const itemToMove = sourceLayout.find((item) => item.i === blockId);
        if (!itemToMove) return;

        const targetLayout = character.layouts[toTabId] ?? [];
        const maxY = targetLayout.reduce((max, item) => Math.max(max, item.y + item.h), 0);

        const movedItem: LayoutItem = {
          ...itemToMove,
          x: 0,
          y: maxY,
        };

        set({
          character: {
            ...character,
            layouts: {
              ...character.layouts,
              [fromTabId]: sourceLayout.filter((item) => item.i !== blockId),
              [toTabId]: [...targetLayout, movedItem],
            },
            meta: { ...character.meta, updatedAt: Date.now() },
          },
        });
      },

      updateBlockData: (blockId: string, patch: Partial<Block["data"]> | Record<string, unknown>) => {
        const { character } = get();
        const block = character.blocks[blockId];
        if (!block) return;

        const mergedData = deepMerge(
          block.data as Record<string, unknown>,
          patch as Record<string, unknown>
        );

        const updatedBlock = {
          ...block,
          data: mergedData,
        } as Block;

        set({
          character: {
            ...character,
            blocks: {
              ...character.blocks,
              [blockId]: updatedBlock,
            },
            meta: { ...character.meta, updatedAt: Date.now() },
          },
        });
      },

      updateBlockStyle: (blockId: string, patch: Partial<BlockStyle>) => {
        const { character } = get();
        const block = character.blocks[blockId];
        if (!block) return;

        const updatedBlock = {
          ...block,
          style: {
            ...block.style,
            ...patch,
          },
        } as Block;

        set({
          character: {
            ...character,
            blocks: {
              ...character.blocks,
              [blockId]: updatedBlock,
            },
            meta: { ...character.meta, updatedAt: Date.now() },
          },
        });
      },

      updateBlockTags: (blockId: string, tags: string[]) => {
        const { character } = get();
        const block = character.blocks[blockId];
        if (!block) return;

        const updatedBlock = {
          ...block,
          tags,
        } as Block;

        set({
          character: {
            ...character,
            blocks: {
              ...character.blocks,
              [blockId]: updatedBlock,
            },
            meta: { ...character.meta, updatedAt: Date.now() },
          },
        });
      },

      updateBlockTitle: (blockId: string, title: string) => {
        const { character } = get();
        const block = character.blocks[blockId];
        if (!block) return;

        const updatedBlock = {
          ...block,
          title,
        } as Block;

        set({
          character: {
            ...character,
            blocks: {
              ...character.blocks,
              [blockId]: updatedBlock,
            },
            meta: { ...character.meta, updatedAt: Date.now() },
          },
        });
      },

      setEnableTagSuggestions: (enabled: boolean) => {
        set({ enableTagSuggestions: enabled });
      },

      // ---- Theme ----
      setGlobalTheme: (patch: Partial<GlobalTheme>) => {
        const { character } = get();
        set({
          character: {
            ...character,
            theme: {
              ...character.theme,
              ...patch,
            },
            meta: { ...character.meta, updatedAt: Date.now() },
          },
        });
      },

      // ---- Rest Engine ----
      applyRest: (tag: string) => {
        const { character } = get();
        let changed = false;
        const newBlocks = { ...character.blocks };

        for (const [id, block] of Object.entries(newBlocks)) {
          const blockHasTag = block.tags.includes(tag);

          if (blockHasTag && block.type === "tracker") {
            newBlocks[id] = {
              ...block,
              data: {
                ...block.data,
                current: block.data.max,
                temp: 0,
              },
            };
            changed = true;
          } else if (blockHasTag && block.type === "pip_array") {
            newBlocks[id] = {
              ...block,
              data: {
                ...block.data,
                rows: block.data.rows.map((row) => ({ ...row, expended: 0 })),
              },
            };
            changed = true;
          } else if (blockHasTag && block.type === "card" && block.data.tracker?.enabled) {
            newBlocks[id] = {
              ...block,
              data: {
                ...block.data,
                tracker: {
                  ...block.data.tracker,
                  current: block.data.tracker.max,
                },
              },
            };
            changed = true;
          } else if (block.type === "inventory") {
            let itemsChanged = false;
            const updatedItems = block.data.items.map((item) => {
              const itemMatches = blockHasTag || item.tags.includes(tag);
              if (itemMatches && item.charges?.enabled && item.charges.current !== item.charges.max) {
                itemsChanged = true;
                return {
                  ...item,
                  charges: {
                    ...item.charges,
                    current: item.charges.max,
                  },
                };
              }
              return item;
            });

            if (itemsChanged) {
              newBlocks[id] = {
                ...block,
                data: {
                  ...block.data,
                  items: updatedItems,
                },
              };
              changed = true;
            }
          }
        }

        if (changed) {
          set({
            character: {
              ...character,
              blocks: newBlocks,
              meta: { ...character.meta, updatedAt: Date.now() },
            },
          });
        }
      },

      addRestAction: (label: string, tag: string) => {
        const { restActions } = get();
        const newAction: RestAction = {
          id: `rest_${crypto.randomUUID()}`,
          label,
          tag,
        };
        set({ restActions: [...restActions, newAction] });
      },

      removeRestAction: (id: string) => {
        const { restActions } = get();
        set({ restActions: restActions.filter((r) => r.id !== id) });
      },

      // ---- Persistence ----
      newCharacter: (template?: Character) => {
        const base = template ?? blankTemplate;
        const newId = `char_${crypto.randomUUID()}`;
        const now = Date.now();
        const freshChar: Character = {
          ...base,
          meta: {
            ...base.meta,
            id: newId,
            createdAt: now,
            updatedAt: now,
          },
        };
        set({ character: freshChar, activeTagFilter: null, mode: "edit" });
        saveCharacterToStorage(freshChar);
      },

      loadCharacterById: async (id: string) => {
        const { character } = get();
        saveCharacterToStorage(character);

        const found = await loadCharFromStorage(id);
        if (!found) return false;
        set({ character: found, activeTagFilter: null, saveStatus: "saved" });
        saveCharacterToStorage(found);
        return true;
      },

      duplicateCharacter: async (id: string) => {
        const { character } = get();
        if (character.meta.id === id) {
          saveCharacterToStorage(character);
        }
        const cloned = await duplicateCharInStorage(id);
        if (!cloned) return null;
        return cloned.meta.id;
      },

      deleteCharacter: async (id: string) => {
        const { character } = get();
        const success = await deleteCharFromStorage(id);
        if (success && character.meta.id === id) {
          get().newCharacter();
        }
        return success;
      },

      importCharacter: (json: unknown) => {
        const result = CharacterSchema.safeParse(json);
        if (!result.success) {
          const errorMsg = result.error.issues
            .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
            .join("; ");
          return { success: false, error: `Invalid character data: ${errorMsg}` };
        }
        set({ character: result.data });
        saveCharacterToStorage(result.data);
        return { success: true };
      },

      exportCharacter: () => {
        const { character } = get();
        exportCharacterAsJson(character, false);
        return character;
      },

      exportTemplate: () => {
        const { character } = get();
        const templateId = `char_${crypto.randomUUID()}`;
        const now = Date.now();
        const cleanedBlocks = { ...character.blocks };

        for (const [id, block] of Object.entries(cleanedBlocks)) {
          if (block.type === "tracker") {
            cleanedBlocks[id] = {
              ...block,
              data: {
                ...block.data,
                current: block.data.max,
                temp: 0,
              },
            };
          } else if (block.type === "pip_array") {
            cleanedBlocks[id] = {
              ...block,
              data: {
                ...block.data,
                rows: block.data.rows.map((r) => ({ ...r, expended: 0 })),
              },
            };
          } else if (block.type === "card" && block.data.tracker) {
            cleanedBlocks[id] = {
              ...block,
              data: {
                ...block.data,
                tracker: {
                  ...block.data.tracker,
                  current: block.data.tracker.max,
                },
              },
            };
          } else if (block.type === "inventory") {
            cleanedBlocks[id] = {
              ...block,
              data: {
                ...block.data,
                items: [], // Clear instance items
                currency: block.data.currency
                  ? Object.fromEntries(Object.keys(block.data.currency).map((k) => [k, "0"]))
                  : undefined,
              },
            };
          } else if (block.type === "profile") {
            cleanedBlocks[id] = {
              ...block,
              data: {
                ...block.data,
                characterName: "",
                playerName: "",
                level: "",
                experience: "",
                extraInfo: "",
              },
            };
          } else if (block.type === "stat_group") {
            cleanedBlocks[id] = {
              ...block,
              data: {
                ...block.data,
                stats: block.data.stats.map((s) => ({
                  ...s,
                  score: "",
                  sub: "",
                })),
              },
            };
          } else if (block.type === "notes") {
            cleanedBlocks[id] = {
              ...block,
              data: {
                ...block.data,
                markdown: "",
              },
            };
          } else if (block.type === "skill_list") {
            cleanedBlocks[id] = {
              ...block,
              data: {
                ...block.data,
                skills: block.data.skills.map((sk) => ({
                  ...sk,
                  value: "",
                  proficiency: 0,
                })),
              },
            };
          }
        }

        const templateChar: Character = {
          ...character,
          meta: {
            id: templateId,
            name: `${character.meta.name || "Character"} (Template)`,
            system: character.meta.system,
            createdAt: now,
            updatedAt: now,
          },
          blocks: cleanedBlocks,
        };

        exportCharacterAsJson(templateChar, true);
        return templateChar;
      },

      // ---- History ----
      undo: () => {
        const temporalState = (useCharacterStore as unknown as { temporal?: { getState: () => { undo: () => void } } })
          .temporal?.getState();
        temporalState?.undo();
      },

      redo: () => {
        const temporalState = (useCharacterStore as unknown as { temporal?: { getState: () => { redo: () => void } } })
          .temporal?.getState();
        temporalState?.redo();
      },
    }),
    {
      partialize: (state) => ({
        character: state.character,
        restActions: state.restActions,
      }),
      limit: 50,
    }
  )
);

// Subscribe to automatically debounce-save character changes to IndexedDB & localStorage
let prevCharacter = useCharacterStore.getState().character;
useCharacterStore.subscribe((state) => {
  if (state.character !== prevCharacter) {
    prevCharacter = state.character;
    debouncedSaveCharacter(state.character, 300, (status) => {
      if (useCharacterStore.getState().saveStatus !== status) {
        useCharacterStore.setState({ saveStatus: status });
      }
    });
  }
});
