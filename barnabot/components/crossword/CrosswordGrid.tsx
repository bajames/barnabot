"use client";

import { useRef, useCallback } from "react";
import { CrosswordData } from "@/lib/crossword";

interface Props {
  crossword: CrosswordData;
  userGrid: string[][];
  onCellChange: (row: number, col: number, value: string) => void;
  checkResults: boolean[][] | null;
  selectedClue: { number: number; direction: "across" | "down" } | null;
}

export default function CrosswordGrid({
  crossword,
  userGrid,
  onCellChange,
  checkResults,
  selectedClue,
}: Props) {
  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);
  const { grid, gridSize } = crossword;

  // Find cells that belong to the currently selected clue
  const highlightedCells = useCallback((): Set<string> => {
    if (!selectedClue) return new Set();
    const clueList =
      selectedClue.direction === "across"
        ? crossword.clues.across
        : crossword.clues.down;
    const clue = clueList.find((c) => c.number === selectedClue.number);
    if (!clue) return new Set();

    const cells = new Set<string>();
    for (let i = 0; i < clue.length; i++) {
      const r = clue.startRow + (selectedClue.direction === "down" ? i : 0);
      const c = clue.startCol + (selectedClue.direction === "across" ? i : 0);
      cells.add(`${r}-${c}`);
    }
    return cells;
  }, [selectedClue, crossword.clues]);

  const highlighted = highlightedCells();

  const focusCell = (r: number, c: number) => {
    if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
      inputRefs.current[r]?.[c]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    r: number,
    c: number
  ) => {
    const moves: Record<string, [number, number]> = {
      ArrowRight: [0, 1],
      ArrowLeft: [0, -1],
      ArrowDown: [1, 0],
      ArrowUp: [-1, 0],
    };
    const move = moves[e.key];
    if (move) {
      e.preventDefault();
      let [dr, dc] = move;
      let nr = r + dr;
      let nc = c + dc;
      // Skip black cells
      while (
        nr >= 0 &&
        nr < gridSize &&
        nc >= 0 &&
        nc < gridSize &&
        grid[nr][nc].isBlack
      ) {
        nr += dr;
        nc += dc;
      }
      focusCell(nr, nc);
    }
    if (e.key === "Backspace" && !userGrid[r]?.[c]) {
      e.preventDefault();
      // Move back one cell (left, then up at row start)
      if (c > 0 && !grid[r][c - 1].isBlack) focusCell(r, c - 1);
      else if (r > 0) {
        // Find last non-black cell in previous row
        for (let pc = gridSize - 1; pc >= 0; pc--) {
          if (!grid[r - 1][pc].isBlack) {
            focusCell(r - 1, pc);
            break;
          }
        }
      }
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    r: number,
    c: number
  ) => {
    const raw = e.target.value.replace(/[^a-zA-Z]/g, "");
    const val = raw.slice(-1).toUpperCase();
    onCellChange(r, c, val);
    // Auto-advance right if a letter was typed
    if (val && c + 1 < gridSize && !grid[r][c + 1].isBlack) {
      focusCell(r, c + 1);
    }
  };

  return (
    <div
      className="inline-grid border-2 border-gray-800"
      style={{
        gridTemplateColumns: `repeat(${gridSize}, 2.25rem)`,
        gap: "1px",
        backgroundColor: "#1f2937",
      }}
    >
      {grid.map((row, r) =>
        row.map((cell, c) => {
          if (cell.isBlack) {
            return (
              <div
                key={`${r}-${c}`}
                className="w-9 h-9 bg-gray-900"
              />
            );
          }

          const key = `${r}-${c}`;
          const isHighlighted = highlighted.has(key);
          const result = checkResults?.[r]?.[c];

          let bgColor = "bg-white";
          if (isHighlighted) bgColor = "bg-blue-100";
          if (result === true) bgColor = "bg-green-100";
          if (result === false) bgColor = "bg-red-100";

          return (
            <div
              key={key}
              className={`relative w-9 h-9 ${bgColor}`}
            >
              {cell.clueNumber && (
                <span className="absolute top-0 left-0.5 text-[9px] leading-none text-gray-600 z-10 font-medium">
                  {cell.clueNumber}
                </span>
              )}
              <input
                ref={(el) => {
                  if (!inputRefs.current[r]) inputRefs.current[r] = [];
                  inputRefs.current[r][c] = el;
                }}
                type="text"
                inputMode="text"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={2}
                value={userGrid[r]?.[c] ?? ""}
                onChange={(e) => handleChange(e, r, c)}
                onKeyDown={(e) => handleKeyDown(e, r, c)}
                className={`
                  w-full h-full text-center text-sm font-bold uppercase
                  bg-transparent border-0 focus:outline-none
                  ${cell.clueNumber ? "pt-3" : "pt-0"}
                  ${result === false ? "text-red-600" : "text-gray-900"}
                  caret-transparent
                `}
              />
            </div>
          );
        })
      )}
    </div>
  );
}
