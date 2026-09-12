import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useCharacterStore } from "../store/useCharacterStore";

export interface Combatant {
  id: string;
  name: string;
  initiative: number;
  hp: number;
  maxHp: number;
  isDown: boolean;
}

interface SessionScratchpadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY_NOTES = "super_sheet_session_scratchpad_notes";
const STORAGE_KEY_COMBAT = "super_sheet_session_scratchpad_combat";

export const SessionScratchpadModal: React.FC<SessionScratchpadModalProps> = ({
  isOpen,
  onClose,
}) => {
  const activeTabId = useCharacterStore((state) => state.character.activeTabId);
  const addBlock = useCharacterStore((state) => state.addBlock);

  const [activeSubTab, setActiveSubTab] = useState<"notes" | "combat">("notes");

  // Scratchpad Notes State
  const [notes, setNotes] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_NOTES) || "";
    } catch {
      return "";
    }
  });

  // Combatants State
  const [combatants, setCombatants] = useState<Combatant[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COMBAT);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentTurnIdx, setCurrentTurnIdx] = useState<number>(0);
  const [newActorName, setNewActorName] = useState("");
  const [newActorInit, setNewActorInit] = useState("");
  const [newActorHp, setNewActorHp] = useState("");
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Auto-save notes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_NOTES, notes);
    } catch {
      // ignore
    }
  }, [notes]);

  // Auto-save combatants
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COMBAT, JSON.stringify(combatants));
    } catch {
      // ignore
    }
  }, [combatants]);

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  const handleClearNotes = () => {
    if (window.confirm("Clear all session scratchpad notes?")) {
      setNotes("");
    }
  };

  const handleCopyNotes = async () => {
    try {
      await navigator.clipboard.writeText(notes);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2000);
    } catch {
      // fallback
    }
  };

  const handlePromoteToBlock = () => {
    if (!notes.trim()) return;
    addBlock(activeTabId, "notes", {
      markdown: notes,
    });
    alert("Created a permanent Notes block with your session notes on the active tab!");
    onClose();
  };

  // Combat tracker handlers
  const handleAddCombatant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActorName.trim()) return;
    const hpVal = parseInt(newActorHp) || 10;
    const initVal = parseInt(newActorInit) || 10;

    const newEntry: Combatant = {
      id: `actor_${crypto.randomUUID()}`,
      name: newActorName.trim(),
      initiative: initVal,
      hp: hpVal,
      maxHp: hpVal,
      isDown: false,
    };

    setCombatants((prev) => [...prev, newEntry]);
    setNewActorName("");
    setNewActorInit("");
    setNewActorHp("");
  };

  const handleSortInitiative = () => {
    setCombatants((prev) =>
      [...prev].sort((a, b) => b.initiative - a.initiative)
    );
    setCurrentTurnIdx(0);
  };

  const handleNextTurn = () => {
    if (combatants.length === 0) return;
    setCurrentTurnIdx((prev) => (prev + 1) % combatants.length);
  };

  const handleHpChange = (id: string, delta: number) => {
    setCombatants((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const updated = Math.max(0, c.hp + delta);
        return { ...c, hp: updated, isDown: updated === 0 };
      })
    );
  };

  const handleRemoveCombatant = (id: string) => {
    setCombatants((prev) => prev.filter((c) => c.id !== id));
  };

  const handleClearCombat = () => {
    if (window.confirm("Clear all combatants from the tracker?")) {
      setCombatants([]);
      setCurrentTurnIdx(0);
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog session-scratchpad-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="scratchpad-dialog-title"
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon">📜</span>
            <h3 id="scratchpad-dialog-title">Session Scratchpad & Combat Log</h3>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        {/* Subtab Toggle */}
        <div className="scratchpad-nav-tabs">
          <button
            type="button"
            className={`scratchpad-nav-btn ${activeSubTab === "notes" ? "active" : ""}`}
            onClick={() => setActiveSubTab("notes")}
          >
            📝 Scratchpad Notes
          </button>
          <button
            type="button"
            className={`scratchpad-nav-btn ${activeSubTab === "combat" ? "active" : ""}`}
            onClick={() => setActiveSubTab("combat")}
          >
            ⚔️ Combat & Initiative ({combatants.length})
          </button>
        </div>

        <div className="modal-body scratchpad-body">
          {activeSubTab === "notes" ? (
            <div className="scratchpad-notes-panel">
              <p className="modal-description">
                Quick, ephemeral in-session notes (monster HP, clues, room descriptions, shop prices).
                Persists in your browser without cluttering your character sheet layout.
              </p>

              <textarea
                className="scratchpad-textarea"
                placeholder="Type session clues, loot, room details, or quick reminders here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                autoFocus
              />

              <div className="scratchpad-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleClearNotes}
                  disabled={!notes}
                >
                  Clear Notes
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCopyNotes}
                  disabled={!notes}
                >
                  {copiedNotification ? "✓ Copied!" : "📋 Copy to Clipboard"}
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handlePromoteToBlock}
                  disabled={!notes.trim()}
                  title="Converts these notes into a permanent Notes block on the active sheet tab"
                >
                  ➕ Promote to Notes Block
                </button>
              </div>
            </div>
          ) : (
            <div className="scratchpad-combat-panel">
              <form className="combat-add-form" onSubmit={handleAddCombatant}>
                <input
                  type="text"
                  placeholder="Combatant / Monster Name"
                  value={newActorName}
                  onChange={(e) => setNewActorName(e.target.value)}
                  className="combat-input name"
                  required
                />
                <input
                  type="number"
                  placeholder="Init"
                  value={newActorInit}
                  onChange={(e) => setNewActorInit(e.target.value)}
                  className="combat-input num"
                  title="Initiative roll"
                />
                <input
                  type="number"
                  placeholder="HP"
                  value={newActorHp}
                  onChange={(e) => setNewActorHp(e.target.value)}
                  className="combat-input num"
                  title="Hit Points"
                />
                <button type="submit" className="btn-primary add-actor-btn">
                  + Add
                </button>
              </form>

              <div className="combat-control-bar">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleSortInitiative}
                  disabled={combatants.length < 2}
                  title="Sort from highest initiative to lowest"
                >
                  ⚡ Sort Initiative
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleNextTurn}
                  disabled={combatants.length < 2}
                  title="Advance active turn"
                >
                  ⏭ Next Turn
                </button>
                <button
                  type="button"
                  className="btn-secondary danger-text"
                  onClick={handleClearCombat}
                  disabled={combatants.length === 0}
                >
                  Clear All
                </button>
              </div>

              <div className="combatant-list">
                {combatants.length === 0 ? (
                  <div className="empty-combat-hint">
                    No active combatants. Add monsters, NPCs, or party members above to track initiative and HP tallies.
                  </div>
                ) : (
                  combatants.map((c, idx) => {
                    const isCurrent = idx === currentTurnIdx;
                    return (
                      <div
                        key={c.id}
                        className={`combatant-card ${isCurrent ? "active-turn" : ""} ${
                          c.isDown ? "is-down" : ""
                        }`}
                      >
                        <div className="combatant-init-badge" title="Initiative">
                          {c.initiative}
                        </div>
                        <div className="combatant-info">
                          <div className="combatant-name-row">
                            <strong className="combatant-name">{c.name}</strong>
                            {isCurrent && <span className="active-turn-tag">Active Turn</span>}
                            {c.isDown && <span className="down-tag">Down / 0 HP</span>}
                          </div>
                          <div className="combatant-hp-row">
                            <span className="hp-label">HP:</span>
                            <span className="hp-val">
                              {c.hp} / {c.maxHp}
                            </span>
                            <div className="hp-steppers">
                              <button
                                type="button"
                                className="hp-quick-btn"
                                onClick={() => handleHpChange(c.id, -5)}
                                title="-5 HP"
                              >
                                -5
                              </button>
                              <button
                                type="button"
                                className="hp-quick-btn"
                                onClick={() => handleHpChange(c.id, -1)}
                                title="-1 HP"
                              >
                                -1
                              </button>
                              <button
                                type="button"
                                className="hp-quick-btn"
                                onClick={() => handleHpChange(c.id, 1)}
                                title="+1 HP"
                              >
                                +1
                              </button>
                              <button
                                type="button"
                                className="hp-quick-btn"
                                onClick={() => handleHpChange(c.id, 5)}
                                title="+5 HP"
                              >
                                +5
                              </button>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="remove-actor-btn"
                          onClick={() => handleRemoveCombatant(c.id)}
                          title="Remove combatant"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
