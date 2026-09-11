# ⚔️ Super-Sheet

> A free, open-source character sheet builder for tabletop RPGs that puts creative control back in your hands.

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646cff.svg)](https://vitejs.dev/)

---

## Why I Built Super-Sheet

If you've played tabletop RPGs online over the last few years, you've probably used tools like D&D Beyond or Demiplane. They're great at what they do: if you want a digital character builder that handles all the official math, looks up rules from books you've purchased, and guides you step-by-step through character creation, those platforms work well.

But they also come with heavy trade-offs:
- Your sheet is locked into a rigid, one-size-fits-all layout.
- The second you want to use homebrew rules, a weird third-party class, or house rules your table agreed on, the automated rules engine fights you every step of the way.
- They're tied to specific commercial systems and paywalled storefronts. If you want to switch from 5e to *Shadowdark*, *Pathfinder*, *Call of Cthulhu*, or a game you designed yourself on a weekend, you have to find an entirely new tool.

**Super-Sheet takes the opposite approach.** 

Think of it like a digital corkboard or a flexible canvas made specifically for TTRPGs. It doesn't calculate your math behind the scenes, it doesn't roll dice for you, and it doesn't care what game system you're playing. Instead, it gives you a freeform grid, a set of clean building blocks (health bars, spell slot trackers, stat groups, inventory lists, action cards), and lets you build a character sheet that actually fits how your brain works during a session.

---

## Who This Is For (And Who It Isn't For)

I want to be upfront about what Super-Sheet is:

- **This is for players and GMs who like tinkering.** If you enjoy opening up a blank sheet, picking your colors and fonts, deciding where your abilities sit, and crafting a layout that feels distinctly *yours*, you'll feel right at home here.
- **This requires a little bit of time and intention.** While Super-Sheet includes pre-made starter templates to get you moving quickly, this isn't a "click three buttons and auto-generate a level 10 wizard" tool. You type your stats in manually, write out your features, and decide how your page is organized.
- **This is for any tabletop game.** D&D 5e (2024 or 2014), *Pathfinder 2e*, *Blades in the Dark*, *Cyberpunk RED*, *MÖRK BORG*, *Mothership*, or your own homebrew campaign—if it uses numbers, trackers, or notes, it works here.

---

## What You Can Do

### 1. Build On an Open 12-Column Grid
Every block on your sheet can be dragged around and resized to your liking. Want your spells right next to your actions? Move them there. Want your hit points huge in the center of the screen? Expand them. You can also organize your character across multiple tabs (like *Core Combat*, *Spells*, *Inventory*, and *Backstory*) so your screen stays uncluttered.

### 2. Inspect and Edit Small Cards Without Messing Up Your Layout
One of the most annoying things about grid layouts is sizing a card small so it looks tidy during gameplay, only to realize you can't read or edit the text without dragging everything else out of place. 

In Super-Sheet, every card has a little **Pop-Out button (`⛶`)**. Click it, and the card smoothly pops up into a roomy focus window where you can read or edit everything comfortably. When you close it, your grid layout hasn't budged at all.

### 3. The 8 Building Blocks
You build your sheet by mixing and matching 8 simple card types:
- **Character Profile (`👤`)**: Tracks your character's name, game system, level, XP, player name, and background details.
- **Resource Tracker (`📊`)**: Number pools with `+` / `−` buttons, max values, and temporary HP/shields. Great for Hit Points, Mana, Sanity, or Stress.
- **Stat Group (`🏷️`)**: Clean attribute pills showing a stat label, score, and modifier (like STR 16 / +3 or INT 18 / +4).
- **Skill List (`🎯`)**: A dedicated list for skills with associated stats, modifiers (`+5`, `65%`, `2d6`), live search filtering, and click-to-cycle proficiency dots (Untrained `○`, Proficient `●`, Expertise `⨂`). There's also a one-click button to seed all 18 standard 5e skills.
- **Feature & Action Cards (`🃏`)**: Cards for abilities, spells, and feats. Supports Markdown formatting, action badges (*Action*, *Bonus Action*, *Reaction*, *Passive*), and optional embedded usage trackers (e.g. *1 per Short Rest*).
- **Pip Matrix (`🔘`)**: Rows of clickable bubbles. Click to cross them off, click to bring them back. Perfect for spell slots, Ki points, Sorcery points, death saves, or ammunition.
- **Notes & Lore (`📝`)**: A full Markdown notepad with a live preview toggle for backstories, session recaps, quest logs, and spell descriptions.
- **Container & Inventory (`🎒`)**: Item lists with single-click quantity steppers, unit weights, item charges (like wands), equipped weapon toggles (`⚔️`), coin pouches, and carrying capacity tracking.

### 4. Two Modes: Editing vs. Playing
- **Edit Mode (Pencil icon)**: Drag and resize cards, change titles, add tags, tweak colors, and use full `Ctrl+Z` undo/redo.
- **Play Mode (Dice icon)**: Locks the grid completely so you don't accidentally move cards during an encounter. Buttons turn into quick toggles: tap a pip to expend a spell slot, adjust your HP with a click, toggle equipped weapons, or filter cards by tag. On phone screens, Play Mode automatically stacks into a clean, easy-to-scroll single column.

### 5. Tagging and Rest Resets
You can tag any card, tracker, or item with hashtags (like `#short-rest`, `#long-rest`, `#combat`, or `#spells`).
- In Play Mode, clicking a tag at the top highlights matching cards and dims everything else so you can focus on what matters in the moment.
- Clicking **Short Rest** or **Long Rest** (or any custom rest you create, like *Scene Reset* or *Downtime*) automatically refills any tracker, pip row, or item charges tagged for that rest.

### 6. Multiple Characters & Auto-Saving
Everything is stored directly in your browser using **IndexedDB**. That means:
- No 5MB browser storage limits crashing your sheets.
- No accounts to create and no passwords to remember.
- A live status indicator in the bottom corner lets you know when your edits are saved (`✓ Saved locally`).
- The **Character Switcher (`👥`)** lets you keep unlimited character sheets saved locally, search through them, duplicate an existing character to try out a new build, or safely delete old ones.

### 7. Shareable Community Templates
When you design a layout you're proud of, you can click **Export Template**. Super-Sheet automatically wipes your personal details (character name, current health, filled inventory, and backstory notes) while preserving your layout, custom themes, stat blocks, skill lists, and card descriptions. 

You get a clean `.json` file that you can send to your friends or post online so others can use your design for their own games.

---

## Theming & Styling

Everyone's character has a different vibe, so your sheet should too:
- **Global Themes**: Pick from built-in presets (*High Fantasy*, *Cyberpunk / Sci-Fi*, *Antique Parchment*, *Eldritch Arcane*, *Clean Obsidian*) or dial in your own colors, fonts, and background textures.
- **Per-Card Customization**: Right-click any card in Edit Mode to give it a custom border color, choose an ornate frame style, or add a custom banner image across the header.

---

## Running It Locally

Super-Sheet runs entirely in your browser with zero backend or database servers to manage.

```bash
# 1. Clone the repository
git clone https://github.com/ezhang982/Super-Sheet-TTRPG.git
cd Super-Sheet-TTRPG

# 2. Install dependencies
npm install

# 3. Start the local development server
npm run dev
```

If you want to run the automated test suites:
```bash
node ./node_modules/tsx/dist/cli.mjs src/test/verify-phase7.ts
```

Or build a production bundle:
```bash
npm run build
```

---

## Open Source & The GPLv3 License

Super-Sheet is free software licensed under the **[GNU General Public License v3.0 (GPLv3)](LICENSE)**.

### Why GPL?
I deliberately chose the GNU GPLv3 because it is a **copyleft** license. That means Super-Sheet will remain free, open, and community-owned forever. 

Anyone can look at the code, learn from it, modify it, or run their own version. But if someone takes this project and distributes a modified version, they are legally required to keep their code open and free under the same GPLv3 license too. No company can take this community work, close the source, slap a subscription on it, and lock it behind a paywall.

---

## Feedback & Community

This project is built for the community. If you have ideas for new card primitives, suggestions for quality-of-life improvements, or cool sheet templates you've built, please open an issue or share your templates in the repository discussions. 

Happy gaming! 🎲
