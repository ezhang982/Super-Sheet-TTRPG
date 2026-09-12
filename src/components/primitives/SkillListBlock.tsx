import React, { useState, useMemo } from "react";
import type { SkillListBlock as SkillListBlockType, SkillEntry, SkillListData } from "../../types/schema";
import type { Mode } from "../../types/store-contract";
import { FormulaInput } from "../FormulaInput";
import { useCharacterVariables } from "../../store/useCharacterVariables";
import { isFormula, evaluateFormula } from "../../utils/mathEngine";

interface SkillListBlockProps {
  block: SkillListBlockType;
  mode: Mode;
  onUpdateData: (patch: Partial<SkillListData> | Record<string, unknown>) => void;
}

export const DND_5E_STANDARD_SKILLS: Array<{ name: string; stat: string }> = [
  { name: "Acrobatics", stat: "DEX" },
  { name: "Animal Handling", stat: "WIS" },
  { name: "Arcana", stat: "INT" },
  { name: "Athletics", stat: "STR" },
  { name: "Deception", stat: "CHA" },
  { name: "History", stat: "INT" },
  { name: "Insight", stat: "WIS" },
  { name: "Intimidation", stat: "CHA" },
  { name: "Investigation", stat: "INT" },
  { name: "Medicine", stat: "WIS" },
  { name: "Nature", stat: "INT" },
  { name: "Perception", stat: "WIS" },
  { name: "Performance", stat: "CHA" },
  { name: "Persuasion", stat: "CHA" },
  { name: "Religion", stat: "INT" },
  { name: "Sleight of Hand", stat: "DEX" },
  { name: "Stealth", stat: "DEX" },
  { name: "Survival", stat: "WIS" },
];

export const SkillListBlock: React.FC<SkillListBlockProps> = ({
  block,
  mode,
  onUpdateData,
}) => {
  const variables = useCharacterVariables();
  const [searchTerm, setSearchTerm] = useState("");
  const skills = block.data.skills ?? [];
  const sortMode = block.data.sortMode ?? "alpha";

  // Cycle proficiency: 0 (None) -> 1 (Proficient) -> 2 (Expertise) -> 0
  const handleCycleProficiency = (skillId: string) => {
    const updated = skills.map((sk) => {
      if (sk.id === skillId) {
        const nextProf = ((sk.proficiency ?? 0) + 1) % 3;
        return { ...sk, proficiency: nextProf };
      }
      return sk;
    });
    onUpdateData({ skills: updated });
  };

  const handleUpdateSkill = (skillId: string, patch: Partial<SkillEntry>) => {
    const updated = skills.map((sk) => (sk.id === skillId ? { ...sk, ...patch } : sk));
    onUpdateData({ skills: updated });
  };

  const handleAddSkill = () => {
    const newSkill: SkillEntry = {
      id: `skill_${crypto.randomUUID()}`,
      name: "New Skill",
      stat: "DEX",
      value: "+0",
      proficiency: 0,
    };
    onUpdateData({ skills: [...skills, newSkill] });
  };

  const handleDeleteSkill = (skillId: string) => {
    onUpdateData({ skills: skills.filter((sk) => sk.id !== skillId) });
  };

  const handleSeedDndSkills = () => {
    const seeded: SkillEntry[] = DND_5E_STANDARD_SKILLS.map((s) => ({
      id: `skill_${crypto.randomUUID()}`,
      name: s.name,
      stat: s.stat,
      value: "+0",
      proficiency: 0,
    }));
    onUpdateData({ skills: seeded, sortMode: "alpha" });
  };

  // Filter & Sort
  const displayedSkills = useMemo(() => {
    let list = [...skills];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (sk) =>
          sk.name.toLowerCase().includes(q) ||
          sk.stat.toLowerCase().includes(q) ||
          sk.value.toLowerCase().includes(q)
      );
    }

    if (sortMode === "alpha") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortMode === "stat") {
      list.sort((a, b) => a.stat.localeCompare(b.stat) || a.name.localeCompare(b.name));
    }
    return list;
  }, [skills, searchTerm, sortMode]);

  const getProficiencyIcon = (prof: number) => {
    if (prof === 2) return "⨂"; // Expertise
    if (prof === 1) return "●"; // Proficient
    return "○"; // None
  };

  const getProficiencyTitle = (prof: number) => {
    if (prof === 2) return "Expertise (Click to reset)";
    if (prof === 1) return "Proficient (Click for Expertise)";
    return "Untrained (Click to mark proficient)";
  };

  return (
    <div className="skill-list-container">
      {/* Search Bar & Sort Mode Toolbar */}
      <div className="skill-list-toolbar">
        <div className="skill-search-wrapper">
          <span className="skill-search-icon">🔍</span>
          <input
            type="text"
            className="skill-search-input"
            placeholder="Filter skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="skill-search-clear"
              onClick={() => setSearchTerm("")}
              title="Clear filter"
            >
              ×
            </button>
          )}
        </div>

        <select
          className="skill-sort-select"
          value={sortMode}
          onChange={(e) => onUpdateData({ sortMode: e.target.value as any })}
          title="Sort order"
        >
          <option value="alpha">A-Z</option>
          <option value="stat">By Stat</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {/* Skills Table */}
      <div className="skill-list-scroll">
        {displayedSkills.length === 0 ? (
          <div className="skill-empty-hint">
            {skills.length === 0
              ? "No skills added yet."
              : `No skills matching "${searchTerm}".`}
          </div>
        ) : (
          <div className="skill-rows">
            {displayedSkills.map((skill) => {
              const prof = skill.proficiency ?? 0;
              return (
                <div
                  key={skill.id}
                  className={`skill-row ${prof > 0 ? "proficient" : ""} ${
                    prof === 2 ? "expertise" : ""
                  }`}
                >
                  {/* Proficiency Toggle Pip */}
                  <button
                    type="button"
                    className={`skill-prof-btn prof-${prof}`}
                    onClick={() => handleCycleProficiency(skill.id)}
                    title={getProficiencyTitle(prof)}
                  >
                    {getProficiencyIcon(prof)}
                  </button>

                  {/* Skill Name */}
                  <div className="skill-name-col">
                    {mode === "edit" ? (
                      <input
                        type="text"
                        className="skill-name-input"
                        value={skill.name}
                        onChange={(e) => handleUpdateSkill(skill.id, { name: e.target.value })}
                        placeholder="Skill Name"
                      />
                    ) : (
                      <span className="skill-name-label">{skill.name}</span>
                    )}
                  </div>

                  {/* Stat Association Badge */}
                  <div className="skill-stat-col">
                    {mode === "edit" ? (
                      <input
                        type="text"
                        className="skill-stat-input"
                        value={skill.stat}
                        onChange={(e) =>
                          handleUpdateSkill(skill.id, { stat: e.target.value.toUpperCase() })
                        }
                        placeholder="STAT"
                        maxLength={4}
                      />
                    ) : (
                      <span className="skill-stat-badge">{skill.stat || "—"}</span>
                    )}
                  </div>

                  {/* Modifier / Value */}
                  <div className={`skill-val-col ${mode === "edit" ? "skill-val-edit-col" : ""}`}>
                    {mode === "edit" ? (
                      <FormulaInput
                        className="skill-val-input"
                        value={skill.value}
                        onChange={(val) => handleUpdateSkill(skill.id, { value: val })}
                        placeholder="+0 or = @DEX.mod + @Prof"
                      />
                    ) : (() => {
                      if (isFormula(skill.value)) {
                        const evalRes = evaluateFormula(skill.value, variables);
                        if (evalRes.error) {
                          return (
                            <span
                              className="skill-val-display formula-error"
                              title={evalRes.explanation}
                            >
                              {evalRes.formatted}
                            </span>
                          );
                        }
                        return (
                          <span
                            className="skill-val-display formula-val"
                            title={`fx: ${evalRes.explanation}`}
                          >
                            {evalRes.formatted}
                            <span className="formula-fx-pill" title={`Formula: ${skill.value}`}>ƒx</span>
                          </span>
                        );
                      }
                      return <span className="skill-val-display">{skill.value || "+0"}</span>;
                    })()}
                  </div>

                  {/* Delete Action (Edit Mode) */}
                  {mode === "edit" && (
                    <button
                      type="button"
                      className="skill-delete-btn"
                      onClick={() => handleDeleteSkill(skill.id)}
                      title={`Remove ${skill.name}`}
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Mode Footer Controls */}
      {mode === "edit" && (
        <div className="skill-list-footer">
          <button
            type="button"
            className="skill-add-btn"
            onClick={handleAddSkill}
          >
            + Add Skill
          </button>

          {skills.length === 0 && (
            <button
              type="button"
              className="skill-preset-btn"
              onClick={handleSeedDndSkills}
              title="Seed standard 18 D&D 5e skills"
            >
              ⚡ Seed 5e Skills
            </button>
          )}
        </div>
      )}
    </div>
  );
};
