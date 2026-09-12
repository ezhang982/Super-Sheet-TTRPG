import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Block, InventoryItem } from "../../types/schema";
import { evaluateQuickMath, interpolateTextFormulas } from "../../utils/mathEngine";
import { useCharacterVariables } from "../../store/useCharacterVariables";

type InventoryBlockType = Extract<Block, { type: "inventory" }>;

interface InventoryBlockProps {
  block: InventoryBlockType;
  mode: "edit" | "play";
  onUpdateData: (patch: Partial<InventoryBlockType["data"]> | Record<string, unknown>) => void;
}

export const InventoryBlock: React.FC<InventoryBlockProps> = ({
  block,
  mode,
  onUpdateData,
}) => {
  const data = block.data;
  const variables = useCharacterVariables();
  const items = data.items || [];
  const currency = data.currency || { GP: "0", SP: "0", CP: "0" };
  const capacity = data.capacity || { enabled: false, maxWeight: 100 };

  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingQtyItemId, setEditingQtyItemId] = useState<string | null>(null);
  const [qtyInputVal, setQtyInputVal] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [newCurrencyKey, setNewCurrencyKey] = useState("");
  const [showCurrencyConfig, setShowCurrencyConfig] = useState(false);

  // Total weight computation
  const totalWeight = items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const wt = Number(item.weight) || 0;
    return sum + qty * wt;
  }, 0);

  // Helper to update full item list
  const updateItems = (newItems: InventoryItem[]) => {
    onUpdateData({ items: newItems });
  };

  // Helper to update a single item
  const updateItem = (itemId: string, patch: Partial<InventoryItem>) => {
    const newItems = items.map((it) => (it.id === itemId ? { ...it, ...patch } : it));
    updateItems(newItems);
  };

  // Delete an item
  const handleDeleteItem = (itemId: string) => {
    updateItems(items.filter((it) => it.id !== itemId));
    if (editingItemId === itemId) setEditingItemId(null);
    if (expandedItemId === itemId) setExpandedItemId(null);
  };

  // Add a new item
  const handleAddNewItem = () => {
    const newItem: InventoryItem = {
      id: `item_${crypto.randomUUID()}`,
      name: "New Item",
      quantity: 1,
      weight: 1,
      cost: "",
      equipped: false,
      description: "",
      tags: [],
    };
    const newItems = [...items, newItem];
    updateItems(newItems);
    setEditingItemId(newItem.id);
  };

  // Stepper for quantity in play mode
  const handleAdjustQuantity = (itemId: string, delta: number) => {
    const item = items.find((it) => it.id === itemId);
    if (!item) return;
    const newQty = Math.max(0, (item.quantity || 0) + delta);
    updateItem(itemId, { quantity: newQty });
  };

  // Toggle equipped state
  const handleToggleEquip = (itemId: string) => {
    const item = items.find((it) => it.id === itemId);
    if (!item) return;
    updateItem(itemId, { equipped: !item.equipped });
  };

  // Stepper or Pip for item charges
  const handleAdjustCharges = (itemId: string, delta: number) => {
    const item = items.find((it) => it.id === itemId);
    if (!item || !item.charges || !item.charges.enabled) return;
    const newCurrent = Math.max(0, Math.min(item.charges.max, item.charges.current + delta));
    updateItem(itemId, {
      charges: {
        ...item.charges,
        current: newCurrent,
      },
    });
  };

  const handleToggleChargePip = (itemId: string, pipIdx: number) => {
    const item = items.find((it) => it.id === itemId);
    if (!item || !item.charges || !item.charges.enabled) return;
    const isAvailable = pipIdx < item.charges.current;
    const newCurrent = isAvailable ? pipIdx : pipIdx + 1;
    updateItem(itemId, {
      charges: {
        ...item.charges,
        current: Math.max(0, Math.min(item.charges.max, newCurrent)),
      },
    });
  };

  // Currency updates
  const handleUpdateCurrency = (key: string, val: string) => {
    onUpdateData({
      currency: {
        ...currency,
        [key]: val,
      },
    });
  };

  const handleRemoveCurrency = (key: string) => {
    const newCurr = { ...currency };
    delete newCurr[key];
    onUpdateData({ currency: newCurr });
  };

  const handleAddCurrency = () => {
    const trimmed = newCurrencyKey.trim().toUpperCase();
    if (!trimmed || currency[trimmed] !== undefined) return;
    onUpdateData({
      currency: {
        ...currency,
        [trimmed]: "0",
      },
    });
    setNewCurrencyKey("");
  };

  // Filtered items in Play Mode
  const filteredItems = items.filter((it) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      it.name.toLowerCase().includes(q) ||
      it.tags?.some((t) => t.toLowerCase().includes(q)) ||
      (it.description && it.description.toLowerCase().includes(q))
    );
  });

  // Capacity calculations
  const isOverweight = capacity.enabled && capacity.maxWeight > 0 && totalWeight > capacity.maxWeight;
  const capacityPct = capacity.enabled && capacity.maxWeight > 0
    ? Math.min(100, Math.round((totalWeight / capacity.maxWeight) * 100))
    : 0;

  // =========================================================================
  // EDIT MODE
  // =========================================================================
  if (mode === "edit") {
    return (
      <div className="inventory-edit-panel">
        {/* Top Controls: Currency & Capacity Config */}
        <div className="inventory-config-bar">
          <div className="inventory-capacity-config">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={capacity.enabled}
                onChange={(e) =>
                  onUpdateData({
                    capacity: {
                      ...capacity,
                      enabled: e.target.checked,
                    },
                  })
                }
              />
              <span>Track Capacity Limit</span>
            </label>
            {capacity.enabled && (
              <div className="capacity-input-group">
                <input
                  type="number"
                  min="1"
                  className="capacity-limit-input"
                  value={capacity.maxWeight}
                  onChange={(e) =>
                    onUpdateData({
                      capacity: {
                        ...capacity,
                        maxWeight: Math.max(1, parseFloat(e.target.value) || 1),
                      },
                    })
                  }
                />
                <span className="capacity-unit">lbs / units</span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="inventory-toggle-btn"
            onClick={() => setShowCurrencyConfig(!showCurrencyConfig)}
          >
            🪙 {showCurrencyConfig ? "Hide Currencies" : "Manage Currencies"}
          </button>
        </div>

        {/* Currency Config Drawer */}
        {showCurrencyConfig && (
          <div className="inventory-currencies-panel">
            <div className="currency-row-list">
              {Object.entries(currency).map(([currKey, currVal]) => (
                <div key={currKey} className="currency-chip-edit">
                  <span className="currency-name">{currKey}:</span>
                  <input
                    type="text"
                    className="currency-val-input"
                    value={currVal}
                    onChange={(e) => handleUpdateCurrency(currKey, e.target.value)}
                  />
                  <button
                    type="button"
                    className="currency-remove-btn"
                    onClick={() => handleRemoveCurrency(currKey)}
                    title={`Remove ${currKey}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="currency-add-row">
              <input
                type="text"
                className="currency-new-input"
                placeholder="New denomination (e.g. PP, EP)"
                value={newCurrencyKey}
                onChange={(e) => setNewCurrencyKey(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCurrency()}
              />
              <button type="button" className="currency-add-btn" onClick={handleAddCurrency}>
                + Add
              </button>
            </div>
          </div>
        )}

        {/* Item List Header */}
        <div className="inventory-edit-header">
          <span className="inventory-item-count">
            {items.length} {items.length === 1 ? "Item" : "Items"} • Total Weight: {totalWeight.toFixed(1)}
          </span>
          <button
            type="button"
            className="inventory-add-item-btn"
            onClick={handleAddNewItem}
          >
            + Add Item
          </button>
        </div>

        {/* Item List */}
        <div className="inventory-items-container">
          {items.length === 0 ? (
            <div className="inventory-empty-state">
              <p>No items in this container yet.</p>
              <button
                type="button"
                className="inventory-add-item-btn"
                onClick={handleAddNewItem}
              >
                + Add First Item
              </button>
            </div>
          ) : (
            items.map((item) => {
              const isEditing = editingItemId === item.id;

              return (
                <div key={item.id} className={`inventory-item-card ${isEditing ? "is-editing" : ""}`}>
                  <div className="item-row-header">
                    <button
                      type="button"
                      className={`item-equip-toggle ${item.equipped ? "equipped" : ""}`}
                      onClick={() => updateItem(item.id, { equipped: !item.equipped })}
                      title={item.equipped ? "Equipped (click to unequip)" : "Unequipped (click to equip)"}
                    >
                      {item.equipped ? "⚔️" : "⚪"}
                    </button>

                    <span
                      className="item-name-summary"
                      onClick={() => setEditingItemId(isEditing ? null : item.id)}
                    >
                      <strong>{item.name}</strong>
                      <span className="item-qty-badge">x{item.quantity}</span>
                      {item.weight > 0 && (
                        <span className="item-wt-badge">{(item.weight * item.quantity).toFixed(1)} wt</span>
                      )}
                      {item.cost && <span className="item-cost-badge">{item.cost}</span>}
                    </span>

                    <div className="item-header-actions">
                      <button
                        type="button"
                        className="item-edit-toggle-btn"
                        onClick={() => setEditingItemId(isEditing ? null : item.id)}
                        title={isEditing ? "Done editing" : "Edit details"}
                      >
                        {isEditing ? "Done" : "✏️"}
                      </button>
                      <button
                        type="button"
                        className="item-delete-btn"
                        onClick={() => handleDeleteItem(item.id)}
                        title="Delete item"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Expanded Edit Form for this Item */}
                  {isEditing && (
                    <div className="item-edit-body">
                      <div className="item-form-grid">
                        <div className="item-field">
                          <label>Item Name:</label>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateItem(item.id, { name: e.target.value })}
                            placeholder="e.g. Longsword +1, Healing Potion"
                          />
                        </div>

                        <div className="item-field-row">
                          <div className="item-field-sm">
                            <label>Qty:</label>
                            <input
                              type="number"
                              min="0"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(item.id, {
                                  quantity: Math.max(0, parseInt(e.target.value, 10) || 0),
                                })
                              }
                            />
                          </div>

                          <div className="item-field-sm">
                            <label>Unit Wt:</label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={item.weight}
                              onChange={(e) =>
                                updateItem(item.id, {
                                  weight: Math.max(0, parseFloat(e.target.value) || 0),
                                })
                              }
                            />
                          </div>

                          <div className="item-field-sm">
                            <label>Cost:</label>
                            <input
                              type="text"
                              value={item.cost || ""}
                              placeholder="e.g. 50 gp"
                              onChange={(e) => updateItem(item.id, { cost: e.target.value })}
                            />
                          </div>
                        </div>

                        {/* Charges Configuration */}
                        <div className="item-charges-config">
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={!!item.charges?.enabled}
                              onChange={(e) => {
                                const enabled = e.target.checked;
                                updateItem(item.id, {
                                  charges: {
                                    enabled,
                                    current: item.charges?.current ?? 3,
                                    max: item.charges?.max ?? 3,
                                  },
                                });
                              }}
                            />
                            <span>Has Uses / Charges (e.g. 3/Day or Potion)</span>
                          </label>

                          {item.charges?.enabled && (
                            <div className="tracker-inputs-inline">
                              <div className="tracker-field">
                                <label>Current:</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={item.charges.current}
                                  onChange={(e) =>
                                    updateItem(item.id, {
                                      charges: {
                                        ...item.charges!,
                                        current: parseInt(e.target.value, 10) || 0,
                                      },
                                    })
                                  }
                                />
                              </div>
                              <div className="tracker-field">
                                <label>Max:</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.charges.max}
                                  onChange={(e) =>
                                    updateItem(item.id, {
                                      charges: {
                                        ...item.charges!,
                                        max: Math.max(1, parseInt(e.target.value, 10) || 1),
                                      },
                                    })
                                  }
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Tags */}
                        <div className="item-field">
                          <label>Tags (space or comma separated, e.g. #short-rest #weapon):</label>
                          <input
                            type="text"
                            value={item.tags ? item.tags.join(" ") : ""}
                            placeholder="#short-rest #magic #potion"
                            onChange={(e) => {
                              const rawTags = e.target.value
                                .split(/[\s,]+/)
                                .map((t) => (t.startsWith("#") ? t : t ? `#${t}` : ""))
                                .filter(Boolean);
                              updateItem(item.id, { tags: rawTags });
                            }}
                          />
                        </div>

                        {/* Markdown Description / Notes */}
                        <div className="item-field">
                          <label>Description / Effects (Markdown):</label>
                          <textarea
                            rows={3}
                            value={item.description || ""}
                            placeholder="Item properties, damage dice, lore, or notes..."
                            onChange={(e) => updateItem(item.id, { description: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // PLAY MODE
  // =========================================================================
  return (
    <div className="inventory-play-container">
      {/* Top Banner: Currencies & Capacity */}
      <div className="inventory-play-header">
        {/* Currencies Bar */}
        {Object.keys(currency).length > 0 && (
          <div className="inventory-currency-pill-bar">
            {Object.entries(currency).map(([k, v]) => (
              <span key={k} className="currency-pill">
                <span className="currency-symbol">🪙</span>
                <span className="currency-val">{v}</span>
                <span className="currency-unit">{k}</span>
              </span>
            ))}
          </div>
        )}

        {/* Capacity Bar */}
        {capacity.enabled && (
          <div className={`inventory-capacity-meter ${isOverweight ? "overweight" : ""}`}>
            <div className="capacity-meta">
              <span className="capacity-label">Capacity</span>
              <span className="capacity-numbers">
                <strong>{totalWeight.toFixed(1)}</strong> / {capacity.maxWeight} lbs
              </span>
            </div>
            <div className="capacity-track">
              <div
                className={`capacity-fill ${isOverweight ? "fill-danger" : ""}`}
                style={{ width: `${Math.min(100, capacityPct)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Filter / Search Row if multiple items */}
      {items.length > 5 && (
        <div className="inventory-search-bar">
          <input
            type="text"
            placeholder="Search items, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="inventory-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="inventory-clear-search"
              onClick={() => setSearchQuery("")}
            >
              ×
            </button>
          )}
        </div>
      )}

      {/* Items List in Play Mode */}
      <div className="inventory-play-list">
        {filteredItems.length === 0 ? (
          <div className="inventory-empty-state">
            {searchQuery ? <p>No items match "{searchQuery}"</p> : <p>Bag is empty.</p>}
          </div>
        ) : (
          filteredItems.map((item) => {
            const isExpanded = expandedItemId === item.id;
            const charges = item.charges;
            const hasDetails = !!item.description || (item.tags && item.tags.length > 0);

            return (
              <div
                key={item.id}
                className={`inventory-play-row ${item.equipped ? "row-equipped" : ""}`}
              >
                <div className="row-main">
                  {/* Equipped Checkbox / Toggle */}
                  <button
                    type="button"
                    className={`play-equip-badge ${item.equipped ? "active" : ""}`}
                    onClick={() => handleToggleEquip(item.id)}
                    title={item.equipped ? "Equipped (click to unequip)" : "Unequipped (click to equip)"}
                  >
                    {item.equipped ? "⚔️" : "⚪"}
                  </button>

                  {/* Name & Tags */}
                  <div
                    className="play-item-info"
                    onClick={() => hasDetails && setExpandedItemId(isExpanded ? null : item.id)}
                    style={{ cursor: hasDetails ? "pointer" : "default" }}
                  >
                    <div className="play-item-title-row">
                      <span className="play-item-name">{item.name}</span>
                      {item.cost && <span className="play-cost-chip">{item.cost}</span>}
                    </div>

                    <div className="play-item-sub">
                      {item.weight > 0 && (
                        <span className="play-item-weight">
                          {(item.weight * item.quantity).toFixed(1)} lbs
                        </span>
                      )}
                      {item.tags && item.tags.length > 0 && (
                        <span className="play-item-tags">
                          {item.tags.map((t) => (
                            <span key={t} className="play-tag-pill">
                              {t}
                            </span>
                          ))}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Charges Trackers (if enabled) */}
                  {charges && charges.enabled && (
                    <div className="play-item-charges">
                      {charges.max <= 5 ? (
                        <div className="item-pips-strip">
                          {Array.from({ length: charges.max }).map((_, idx) => {
                            const isAvail = idx < charges.current;
                            return (
                              <button
                                key={idx}
                                type="button"
                                className={`item-pip ${isAvail ? "available" : "expended"}`}
                                onClick={() => handleToggleChargePip(item.id, idx)}
                                title={isAvail ? "Click to use charge" : "Click to restore charge"}
                              />
                            );
                          })}
                        </div>
                      ) : (
                        <div className="item-stepper-inline">
                          <button
                            type="button"
                            className="item-step-btn"
                            onClick={() => handleAdjustCharges(item.id, -1)}
                            disabled={charges.current <= 0}
                          >
                            −
                          </button>
                          <span className="item-step-val">
                            {charges.current}/{charges.max}
                          </span>
                          <button
                            type="button"
                            className="item-step-btn"
                            onClick={() => handleAdjustCharges(item.id, 1)}
                            disabled={charges.current >= charges.max}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quantity Stepper */}
                  <div className="play-qty-stepper">
                    <button
                      type="button"
                      className="qty-step-btn"
                      onClick={() => handleAdjustQuantity(item.id, -1)}
                      disabled={item.quantity <= 0}
                      title="Decrease quantity"
                    >
                      −
                    </button>
                    {editingQtyItemId === item.id ? (
                      <input
                        type="text"
                        className="direct-counter-input qty-counter-input"
                        value={qtyInputVal}
                        autoFocus
                        placeholder="±N"
                        style={{ width: "42px", textAlign: "center", padding: "1px 3px", fontSize: "0.85rem" }}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => setQtyInputVal(e.target.value)}
                        onBlur={() => {
                          const nextVal = evaluateQuickMath(item.quantity, qtyInputVal, 0);
                          updateItem(item.id, { quantity: nextVal });
                          setEditingQtyItemId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const nextVal = evaluateQuickMath(item.quantity, qtyInputVal, 0);
                            updateItem(item.id, { quantity: nextVal });
                            setEditingQtyItemId(null);
                          }
                          if (e.key === "Escape") setEditingQtyItemId(null);
                        }}
                      />
                    ) : (
                      <span
                        className="qty-number"
                        title="Click to input relative math (e.g. +50, -5) or exact quantity"
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          setQtyInputVal(item.quantity.toString());
                          setEditingQtyItemId(item.id);
                        }}
                      >
                        {item.quantity}
                      </span>
                    )}
                    <button
                      type="button"
                      className="qty-step-btn"
                      onClick={() => handleAdjustQuantity(item.id, 1)}
                      title="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  {/* Details expansion toggle */}
                  {hasDetails && (
                    <button
                      type="button"
                      className="play-expand-arrow"
                      onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                      title={isExpanded ? "Collapse notes" : "Expand notes"}
                    >
                      {isExpanded ? "▲" : "▼"}
                    </button>
                  )}
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && item.description && (
                  <div className="play-item-details-drawer prose-content">
                    <ReactMarkdown>{interpolateTextFormulas(item.description, variables)}</ReactMarkdown>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
