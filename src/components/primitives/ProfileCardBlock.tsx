import React from "react";
import type { Block } from "../../types/schema";
import { useCharacterStore } from "../../store/useCharacterStore";

type ProfileBlockType = Extract<Block, { type: "profile" }>;

interface ProfileCardBlockProps {
  block: ProfileBlockType;
  mode: "edit" | "play";
  onUpdateData: (patch: Partial<ProfileBlockType["data"]>) => void;
}

export const ProfileCardBlock: React.FC<ProfileCardBlockProps> = ({
  block,
  mode,
  onUpdateData,
}) => {
  const data = block.data;
  const setCharacterMeta = useCharacterStore((state) => state.setCharacterMeta);

  const handleNameChange = (name: string) => {
    onUpdateData({ characterName: name });
    setCharacterMeta({ name });
  };

  const handleSystemChange = (system: string) => {
    onUpdateData({ system });
    setCharacterMeta({ system });
  };

  if (mode === "edit") {
    return (
      <div className="profile-card-edit">
        <div className="profile-edit-field">
          <label>Character Name</label>
          <input
            type="text"
            value={data.characterName}
            placeholder="Character Name"
            onChange={(e) => handleNameChange(e.target.value)}
          />
        </div>

        <div className="profile-edit-row">
          <div className="profile-edit-field">
            <label>TTRPG System</label>
            <input
              type="text"
              value={data.system}
              placeholder="e.g. D&D 5e, Blades in the Dark"
              onChange={(e) => handleSystemChange(e.target.value)}
            />
          </div>
          <div className="profile-edit-field small">
            <label>Level</label>
            <input
              type="text"
              value={data.level || ""}
              placeholder="1"
              onChange={(e) => onUpdateData({ level: e.target.value })}
            />
          </div>
          <div className="profile-edit-field small">
            <label>Exp / XP</label>
            <input
              type="text"
              value={data.experience || ""}
              placeholder="0 XP"
              onChange={(e) => onUpdateData({ experience: e.target.value })}
            />
          </div>
        </div>

        <div className="profile-edit-row">
          <div className="profile-edit-field">
            <label>Player Name</label>
            <input
              type="text"
              value={data.playerName || ""}
              placeholder="Your name"
              onChange={(e) => onUpdateData({ playerName: e.target.value })}
            />
          </div>
          <div className="profile-edit-field">
            <label>Class / Subclass / Origin</label>
            <input
              type="text"
              value={data.extraInfo || ""}
              placeholder="e.g. Fighter (Battle Master)"
              onChange={(e) => onUpdateData({ extraInfo: e.target.value })}
            />
          </div>
        </div>
      </div>
    );
  }

  // Play Mode UX
  return (
    <div className="profile-card-play">
      <div className="profile-header-line">
        <h2 className="profile-character-name">
          {data.characterName || "Unnamed Character"}
        </h2>
        {data.system && (
          <span className="profile-system-badge">{data.system}</span>
        )}
      </div>

      <div className="profile-details-grid">
        {(data.level || data.experience) && (
          <div className="profile-detail-chip">
            {data.level && <span className="level-text">Level {data.level}</span>}
            {data.level && data.experience && <span className="chip-sep">•</span>}
            {data.experience && <span className="exp-text">{data.experience}</span>}
          </div>
        )}

        {data.playerName && (
          <div className="profile-detail-chip player">
            <span className="chip-label">Player:</span>
            <span className="chip-value">{data.playerName}</span>
          </div>
        )}

        {data.extraInfo && (
          <div className="profile-detail-chip extra">
            <span className="chip-value">{data.extraInfo}</span>
          </div>
        )}
      </div>
    </div>
  );
};
