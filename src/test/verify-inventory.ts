import { CharacterSchema, type InventoryBlock } from "../types/schema";
import { createDefaultCharacter } from "../store/fixtures";
import { useCharacterStore } from "../store/useCharacterStore";
import { exportCharacterAsJson } from "../store/storage";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ ${message}`);
}

console.log("=== RUNNING INVENTORY PRIMITIVE & NEW FEATURES TEST SUITE ===\n");

const store = useCharacterStore.getState();
const defaultChar = createDefaultCharacter();
store.importCharacter(defaultChar);

const activeTab = useCharacterStore.getState().character.activeTabId;

// -----------------------------------------------------------------------------
// 1. Schema Validation for Inventory Block
// -----------------------------------------------------------------------------
console.log("--- 1. Schema Validation for Inventory Primitive ---");

const testInventoryBlock: InventoryBlock = {
  id: "block_bag_of_holding",
  type: "inventory",
  title: "Bag of Holding",
  tags: ["#equipment", "#magic"],
  style: {
    borderStyle: "double",
    borderColor: "#818cf8",
  },
  data: {
    items: [
      {
        id: "item_wand",
        name: "Wand of Magic Missiles",
        quantity: 1,
        weight: 1,
        cost: "120 gp",
        equipped: true,
        description: "Contains 7 charges. Can cast Magic Missile.",
        tags: ["#magic", "#long-rest"],
        charges: {
          enabled: true,
          current: 4,
          max: 7,
        },
      },
      {
        id: "item_potions",
        name: "Healing Potion",
        quantity: 3,
        weight: 0.5,
        cost: "50 gp each",
        equipped: false,
        description: "Restores 2d4 + 2 HP.",
        tags: ["#consumable"],
      },
    ],
    currency: {
      GP: "250",
      SP: "40",
      CP: "15",
    },
    capacity: {
      enabled: true,
      maxWeight: 500,
    },
  },
};

// Add to character and validate full schema
const charWithInventory = {
  ...defaultChar,
  blocks: {
    ...defaultChar.blocks,
    [testInventoryBlock.id]: testInventoryBlock,
  },
};

const parseResult = CharacterSchema.safeParse(charWithInventory);
assert(parseResult.success, "Character with InventoryBlock validates cleanly against CharacterSchema");

// -----------------------------------------------------------------------------
// 2. Store Integration: addBlock("inventory")
// -----------------------------------------------------------------------------
console.log("\n--- 2. Store Integration: addBlock('inventory') ---");

store.addBlock(activeTab, "inventory");
const stateAfterAdd = useCharacterStore.getState();
const createdBlockId = Object.keys(stateAfterAdd.character.blocks).find(
  (id) => stateAfterAdd.character.blocks[id].type === "inventory"
);

assert(!!createdBlockId, "Successfully added inventory block via store.addBlock");
const addedBlock = stateAfterAdd.character.blocks[createdBlockId!] as InventoryBlock;
assert(addedBlock.title === "Inventory & Items", "Default title is 'Inventory & Items'");
assert(addedBlock.data.items.length === 1, "Initialized with 1 sample item");
assert(addedBlock.data.currency?.GP !== undefined, "Initialized with default currency dictionary");
assert(addedBlock.data.capacity?.enabled === true, "Initialized with capacity tracking enabled");

// -----------------------------------------------------------------------------
// 3. Item Mutations: Quantity, Equip Status, Charges
// -----------------------------------------------------------------------------
console.log("\n--- 3. Item Mutations & Management ---");

// Add an item to the block
const newItem = {
  id: "item_ring_teleport",
  name: "Ring of Spell Storing",
  quantity: 1,
  weight: 0.1,
  cost: "500 gp",
  equipped: true,
  description: "Can store up to 5 levels of spells.",
  tags: ["#short-rest"],
  charges: {
    enabled: true,
    current: 1,
    max: 5,
  },
};

const currentItems = addedBlock.data.items;
store.updateBlockData(createdBlockId!, {
  items: [...currentItems, newItem],
});

let updatedBlock = useCharacterStore.getState().character.blocks[createdBlockId!] as InventoryBlock;
assert(updatedBlock.data.items.length === 2, "Added second item to inventory block");

// Modify quantity and equip status
const ring = updatedBlock.data.items.find((it) => it.id === "item_ring_teleport")!;
assert(ring.equipped === true, "Ring is marked as equipped");
assert(ring.charges?.current === 1, "Ring has 1 of 5 charges initially");

// -----------------------------------------------------------------------------
// 4. Rest Engine Integration: Recharge item charges
// -----------------------------------------------------------------------------
console.log("\n--- 4. Rest Engine Integration with Item Charges ---");

// The ring has tag "#short-rest" and charges 1 / 5.
// The block itself does NOT have #short-rest (tags: ["#new"]).
// Calling applyRest("#short-rest") should recharge the ring because of its item tag!
store.applyRest("#short-rest");

updatedBlock = useCharacterStore.getState().character.blocks[createdBlockId!] as InventoryBlock;
const ringAfterShortRest = updatedBlock.data.items.find((it) => it.id === "item_ring_teleport")!;
assert(
  ringAfterShortRest.charges?.current === 5,
  "Item charge recharged from 1 to max (5) during short rest based on item tag #short-rest"
);

// Now test container block-level tag reset:
// Tag the whole container block with "#long-rest" and add an item without item-level rest tag
store.updateBlockTags(createdBlockId!, ["#long-rest"]);

const potionBag = {
  id: "item_alchemist_kit",
  name: "Alchemist Vial Kit",
  quantity: 1,
  weight: 2,
  equipped: false,
  description: "3 uses per long rest.",
  tags: ["#tools"], // Note: no rest tag on item itself!
  charges: {
    enabled: true,
    current: 0,
    max: 3,
  },
};

store.updateBlockData(createdBlockId!, {
  items: [...updatedBlock.data.items, potionBag],
});

// Spend a charge on the ring
store.updateBlockData(createdBlockId!, {
  items: (useCharacterStore.getState().character.blocks[createdBlockId!] as InventoryBlock).data.items.map(
    (it) => (it.id === "item_alchemist_kit" ? { ...it, charges: { ...it.charges!, current: 0 } } : it)
  ),
});

// Take a long rest
store.applyRest("#long-rest");

updatedBlock = useCharacterStore.getState().character.blocks[createdBlockId!] as InventoryBlock;
const vialAfterLongRest = updatedBlock.data.items.find((it) => it.id === "item_alchemist_kit")!;
assert(
  vialAfterLongRest.charges?.current === 3,
  "Item inside container with block tag #long-rest recharged charges from 0 to max (3)"
);

// -----------------------------------------------------------------------------
// 5. Template Export with Inventory Blocks
// -----------------------------------------------------------------------------
console.log("\n--- 5. Template Export with Inventory ---");

// Drain charges to 1
store.updateBlockData(createdBlockId!, {
  items: updatedBlock.data.items.map((it) =>
    it.charges?.enabled ? { ...it, charges: { ...it.charges, current: 1 } } : it
  ),
});

const template = store.exportTemplate();
const templateBlock = template.blocks[createdBlockId!] as InventoryBlock;
const allRecharged = templateBlock.data.items.every(
  (it) => !it.charges?.enabled || it.charges.current === it.charges.max
);
assert(allRecharged, "exportTemplate resets all item charges in inventory blocks to maximum");

// -----------------------------------------------------------------------------
// 6. Export File Dialog & Fallback
// -----------------------------------------------------------------------------
console.log("\n--- 6. Export File Dialog & Fallback ---");

let showSavePickerCalled = false;
// Mock showSaveFilePicker
(globalThis as any).window = {
  showSaveFilePicker: async (options: any) => {
    showSavePickerCalled = true;
    assert(!!options.suggestedName, "showSaveFilePicker received suggested filename");
    assert(options.types[0].accept["application/json"][0] === ".json", "File picker accepts .json");
    return {
      createWritable: async () => ({
        write: async (content: string) => {
          assert(content.includes("Valerius Drake"), "Written JSON content contains character data");
        },
        close: async () => {},
      }),
    };
  },
};

exportCharacterAsJson(template, true).then((result) => {
  assert(result === true, "exportCharacterAsJson returns true on successful save");
  assert(showSavePickerCalled, "showSaveFilePicker was invoked when available");
  console.log("\n🎉 ALL INVENTORY & NEW FEATURE TESTS PASSED SUCCESSFULLY!\n");
});
