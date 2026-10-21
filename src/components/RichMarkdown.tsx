import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { DICE_REGEX, rollDice, copyDiceCommand } from "../utils/diceRolls";
import { interpolateTextFormulas } from "../utils/mathEngine";
import { Icon } from "./ui/Icon";
import { faDiceD20, faCheck } from "@fortawesome/free-solid-svg-icons";

export interface DiceRollChipProps {
  notation: string;
}

export const DiceRollChip: React.FC<DiceRollChipProps> = ({ notation }) => {
  const [copied, setCopied] = useState(false);
  const [rolledVal, setRolledVal] = useState<number | null>(null);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const res = rollDice(notation);
    if (res) {
      setRolledVal(res.total);
    }
    await copyDiceCommand(notation);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setRolledVal(null);
    }, 2500);
  };

  return (
    <button
      type="button"
      className="dice-roll-chip"
      onClick={handleClick}
      title="Click to roll and copy /roll command to clipboard"
      style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
    >
      <Icon icon={faDiceD20} /> {notation}
      {rolledVal !== null && <span className="dice-rolled-val"> = {rolledVal}</span>}
      {copied && (
        <span className="dice-copied-badge" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
          <Icon icon={faCheck} /> Copied
        </span>
      )}
    </button>
  );
};

function formatMarkdownWithDice(text: string): string {
  return text.replace(DICE_REGEX, (match) => `[${match}](#dice:${match.replace(/\s+/g, "")})`);
}

export interface RichMarkdownProps {
  content?: string;
  variables?: Record<string, number>;
  className?: string;
  emptyFallback?: React.ReactNode;
}

export const RichMarkdown: React.FC<RichMarkdownProps> = ({
  content = "",
  variables,
  className = "",
  emptyFallback = null,
}) => {
  if (!content.trim()) {
    return emptyFallback ? <>{emptyFallback}</> : null;
  }

  const processed = variables
    ? interpolateTextFormulas(content, variables)
    : content;

  const formatted = formatMarkdownWithDice(processed);

  const markdownElement = (
    <ReactMarkdown
      components={{
        a: ({ href, children, ...props }) => {
          if (href?.startsWith("#dice:")) {
            const notation = href.replace("#dice:", "");
            return <DiceRollChip notation={notation} />;
          }
          return (
            <a href={href} target="_blank" rel="noreferrer" {...props}>
              {children}
            </a>
          );
        },
      }}
    >
      {formatted}
    </ReactMarkdown>
  );

  if (className) {
    return <div className={className}>{markdownElement}</div>;
  }

  return markdownElement;
};
