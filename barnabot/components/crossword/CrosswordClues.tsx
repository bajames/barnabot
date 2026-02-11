"use client";

import { CrosswordClue } from "@/lib/crossword";

interface Props {
  clues: { across: CrosswordClue[]; down: CrosswordClue[] };
  selectedClue: { number: number; direction: "across" | "down" } | null;
  onClueSelect: (number: number, direction: "across" | "down") => void;
}

function ClueList({
  clues,
  direction,
  selectedClue,
  onClueSelect,
}: {
  clues: CrosswordClue[];
  direction: "across" | "down";
  selectedClue: Props["selectedClue"];
  onClueSelect: Props["onClueSelect"];
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
        {direction === "across" ? "Across" : "Down"}
      </h3>
      <ul className="space-y-1">
        {clues.map((clue) => {
          const isSelected =
            selectedClue?.number === clue.number &&
            selectedClue?.direction === direction;
          return (
            <li key={`${direction}-${clue.number}`}>
              <button
                onClick={() => onClueSelect(clue.number, direction)}
                className={`text-left w-full text-sm px-2 py-1 rounded-lg transition-colors ${
                  isSelected
                    ? "bg-blue-50 text-blue-800"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="font-semibold mr-1.5">{clue.number}.</span>
                {clue.clue}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function CrosswordClues({
  clues,
  selectedClue,
  onClueSelect,
}: Props) {
  return (
    <div className="w-72 flex-shrink-0 space-y-6 overflow-y-auto max-h-[600px] pr-1">
      <ClueList
        clues={clues.across}
        direction="across"
        selectedClue={selectedClue}
        onClueSelect={onClueSelect}
      />
      <ClueList
        clues={clues.down}
        direction="down"
        selectedClue={selectedClue}
        onClueSelect={onClueSelect}
      />
    </div>
  );
}
