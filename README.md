# ⚔️ Super-Sheet TTRPG

**Super-Sheet** is a modular, system-agnostic, grid-based character sheet builder and manager for tabletop roleplaying games (TTRPGs). Designed for players and Game Masters who want complete freedom over their character sheets without clunky page layouts or rigid system locks.

Whether you're running **D&D 5e**, **Pathfinder 2e**, **Blades in the Dark**, **Cyberpunk RED**, **Call of Cthulhu**, or your own homebrew system, Super-Sheet adapts to your campaign.

---

## 🌟 Key Features

- **🧱 Completely Modular 12-Column Grid**: Arrange, resize, and organize every piece of your character sheet using intuitive drag-and-drop.
- **⚡ Two Distinct Modes**:
  - **Edit Mode**: Build your sheet, drag and resize cards, configure stats, customize themes, and manage tabs.
  - **Play Mode**: Distraction-free, responsive layout optimized for live sessions. Single-click resource pips, quick HP adjustments, live tag filters, and equipment toggles.
- **🖱️ Right-Click Card Context Menu**: Right-click any card in Edit Mode to customize border themes, rename, add tags, move across tabs, or delete.
- **💤 Universal Rest Engine**: Press a single button (like *Short Rest* or *Long Rest*) to automatically reset HP, spell slots, class features, and magic item charges based on tags (`#short-rest`, `#long-rest`, or custom tags).
- **🎨 Expressive Theming & Borders**: Choose from high-fantasy, sci-fi, parchment, or eldritch presets—or customize fonts, colors, border styles (including ornamental double borders), and custom header banner art for individual cards.
- **🎒 Native Inventory & Container List**: Track items, quantities with fast single-click steppers, weights, currencies, equipped statuses, item charges, and carrying capacity.
- **💾 Local-First & Native File Picker**: Your data stays private in your browser's local storage. Export full sheets or blank templates directly to your chosen folder using modern browser File System Access (`Save As...`).

---

## 🧩 The 7 Modular Card Primitives

Super-Sheet breaks down any tabletop system into 7 flexible primitives:

| Primitive | Icon | Description & Example Uses |
| :--- | :---: | :--- |
| **Character Profile** | 👤 | Tracks core character identity: Name, System, Level, Experience, Player, and Class/Archetype. Syncs directly with sheet metadata. |
| **Resource Tracker** | 📊 | Continuous numeric pools with current, maximum, temporary values, and custom step sizes. Ideal for Hit Points, Temporary HP, Shield Capacity, Mana, or Sanity. |
| **Stat Group** | 🏷️ | Compact grid of attribute pills featuring label, score, and modifier/subtext. Perfect for D&D Abilities (STR, DEX, CON), Saving Throws, Skills, or SPECIAL stats. |
| **Feature Card** | 🃏 | Markdown-enabled cards for actions, spells, feats, and class features. Includes activation badges (*Action*, *Bonus Action*, *Reaction*, *Passive*) and optional embedded usage counters (e.g. 1/Short Rest). |
| **Pip Matrix** | 🔘 | Multi-row discrete pip counters. Click to expend, click to restore. Essential for Spell Slots, Ki Points, Sorcery Points, Death Saves, Grit, or Momentum. |
| **Notes / Journal** | 📝 | Full-featured Markdown text area with live reading preview. Great for character backstories, session notes, quest logs, and spell descriptions. |
| **Container / Inventory** | 🎒 | Item container list for backpacks, pouches, or chests. Features quantity `−` / `+` steppers, unit weights, item charges, equipped toggles, currencies, and carrying capacity. |

---

## 🎮 How to Play & Manage Your Sheet

### 1. Switching Modes
Use the toggle in the top-right corner to switch between **Edit Mode** (pencil) and **Play Mode** (dice).
- In **Edit Mode**, drag cards by their grab handle (`⠿`), drag bottom-right corners to resize, or right-click cards for options.
- In **Play Mode**, the grid locks into a clean, game-ready interface.

### 2. Right-Click Context Menu (Edit Mode)
Right-clicking any card opens a context menu with zero header clutter:
- **🎨 Customize Style & Borders**: Open the block styling modal.
- **✏️ Rename Block**: Inline rename the card title.
- **🏷️ Add Tag**: Add semantic tags like `#short-rest`, `#combat`, or `#inventory`.
- **📑 Move to Tab**: Instantly teleport the card to another tab without dragging across screens.
- **🗑️ Delete Block**: Remove the card from your sheet.

### 3. Inventory & Equipment Management
The **Container / Inventory** card lets you manage equipment on the fly:
- **Equip / Unequip**: Click the `⚪` / `⚔️` icon to equip or stow weapons, armor, or rings.
- **Quantity Steppers**: Single-click `−` and `+` to spend arrows, rations, or potions.
- **Item Charges**: Add usage charges to items (e.g., *Wand of Magic Missiles* with 7 charges). Click pips or use the stepper to spend charges.
- **Rest Recharging**: Give an item a `#short-rest` or `#long-rest` tag (or tag the entire container) to automatically recharge its charges when you rest!
- **Currencies & Capacity**: Track your coins (GP, SP, CP, or custom currencies like Credits/Gold) and monitor your total carried weight against your strength limit.

### 4. Semantic Tagging & Rest Engine
Every card and item can be tagged (e.g., `#short-rest`, `#long-rest`, `#spells`, `#combat`).
- **Tag Filtering (Play Mode)**: Click any tag in the filter bar at the top to highlight relevant cards and dim everything else.
- **Rest Action Bar**: Click **Short Rest** or **Long Rest** (or open the Rest Actions modal from the floating tools button to create custom rests like *Downtime Week*). Any tracker, pip row, or item tagged with that rest will automatically recharge to full.

### 5. Floating Tools Menu (FAB)
The draggable circular button (`⚙️`) in the corner gives quick access to:
- **+ Add Block**: Spawn any of the 7 primitives onto your active tab.
- **🎨 Theme & Styling**: Change fonts, backgrounds, card colors, or pick presets.
- **⏳ Rest Actions**: Trigger or configure custom rest buttons.
- **💾 Export Sheet**: Save your character JSON file to your computer.
- **📋 Export Template**: Export a clean template with all current values and name cleared, ready to share with friends.
- **📂 Import Sheet**: Load any previously saved Super-Sheet JSON file.

---

## 🛠️ Development & Technology Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) with [Zundo](https://github.com/charkour/zundo) (Undo / Redo history)
- **Grid Layout**: [react-grid-layout](https://github.com/react-grid-layout/react-grid-layout)
- **Schema Validation**: [Zod](https://zod.dev/) (Strict runtime JSON schema validation)
- **Markdown Rendering**: [react-markdown](https://github.com/remarkjs/react-markdown)
- **File System**: Native [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API) with universal fallback

### Running Locally

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ezhang982/Super-Sheet-TTRPG.git
   cd Super-Sheet-TTRPG
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Run the automated test suites**:
   ```bash
   npx tsx src/test/verify-phase1.ts
   npx tsx src/test/verify-phase2.ts
   npx tsx src/test/verify-phase3.ts
   npx tsx src/test/verify-phase4.ts
   npx tsx src/test/verify-inventory.ts
   ```

5. **Build for production**:
   ```bash
   npm run build
   ```

---

## 📜 License

Created for tabletop gamers everywhere. Open source under the MIT License.
