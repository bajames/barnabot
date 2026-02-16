"use client";

import { useRef, useCallback, useEffect } from "react";
import { CrosswordData, CrosswordClue } from "@/lib/crossword";

interface Props {
  crossword: CrosswordData;
  userGrid: string[][];
  onCellChange: (row: number, col: number, value: string) => void;
  checkResults: boolean[][] | null;
  selectedClue: { number: number; direction: "across" | "down" } | null;
  onClueSelect: (number: number, direction: "across" | "down") => void;
}

export default function CrosswordGrid({
  crossword,
  userGrid,
  onCellChange,
  checkResults,
  selectedClue,
  onClueSelect,
}: Props) {
  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);
  const { grid, gridSize, clues } = crossword;

  // Find cells that belong to the currently selected clue
  const highlightedCells = useCallback((): Set<string> => {
    if (!selectedClue) return new Set();
    const clueList =
      selectedClue.direction === "across" ? clues.across : clues.down;
    const clue = clueList.find((c) => c.number === selectedClue.number);
    if (!clue) return new Set();

    const cells = new Set<string>();
    for (let i = 0; i < clue.length; i++) {
      const r = clue.startRow + (selectedClue.direction === "down" ? i : 0);
      const c = clue.startCol + (selectedClue.direction === "across" ? i : 0);
      cells.add(`${r}-${c}`);
    }
    return cells;
  }, [selectedClue, clues]);

  const highlighted = highlightedCells();

  const focusCell = (r: number, c: number) => {
    if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
      inputRefs.current[r]?.[c]?.focus();
    }
  };

  // When a clue is selected externally, focus its first cell
  useEffect(() => {
    if (!selectedClue) return;
    const clueList =
      selectedClue.direction === "across" ? clues.across : clues.down;
    const clue = clueList.find((c) => c.number === selectedClue.number);
    if (clue) {
      focusCell(clue.startRow, clue.startCol);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClue]);

  // Find which clue(s) a cell belongs to
  const getCluesForCell = useCallback(
    (r: number, c: number): { across: CrosswordClue | null; down: CrosswordClue | null } => {
      const across =
        clues.across.find(
          (cl) => cl.startRow === r && c >= cl.startCol && c < cl.startCol + cl.length
        ) ?? null;
      const down =
        clues.down.find(
          (cl) => cl.startCol === c && r >= cl.startRow && r < cl.startRow + cl.length
        ) ?? null;
      return { across, down };
    },
    [clues]
  );

  const handleCellClick = (r: number, c: number) => {
    focusCell(r, c);
    const { across, down } = getCluesForCell(r, c);
    // If already selected clue covers this cell, toggle direction; otherwise pick across first
    if (selectedClue) {
      const currentClue =
        selectedClue.direction === "across" ? across : down;
      if (currentClue && currentClue.number === selectedClue.number) {
        // Toggle to other direction if available
        const other = selectedClue.direction === "across" ? down : across;
        if (other) {
          onClueSelect(other.number, other.direction);
          return;
        }
      }
    }
    if (across) {
      onClueSelect(across.number, "across");
    } else if (down) {
      onClueSelect(down.number, "down");
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
      const [dr, dc] = move;
      let nr = r + dr;
      let nc = c + dc;
      while (
        nr >= 0 && nr < gridSize &&
        nc >= 0 && nc < gridSize &&
        grid[nr][nc].isBlack
      ) {
        nr += dr;
        nc += dc;
      }
      if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize) {
        focusCell(nr, nc);
        // Update selected clue based on direction of movement
        const { across, down } = getCluesForCell(nr, nc);
        if (dc !== 0 && across) onClueSelect(across.number, "across");
        else if (dr !== 0 && down) onClueSelect(down.number, "down");
      }
    }
    if (e.key === "Backspace" && !userGrid[r]?.[c]) {
      e.preventDefault();
      if (c > 0 && !grid[r][c - 1].isBlack) focusCell(r, c - 1);
      else if (r > 0) {
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
    if (val) {
      // Auto-advance in the direction of the selected clue
      if (selectedClue?.direction === "across" && c + 1 < gridSize && !grid[r][c + 1].isBlack) {
        focusCell(r, c + 1);
      } else if (selectedClue?.direction === "down" && r + 1 < gridSize && !grid[r + 1][c].isBlack) {
        focusCell(r + 1, c);
      } else if (c + 1 < gridSize && !grid[r][c + 1].isBlack) {
        focusCell(r, c + 1);
      }
    }
  };

  const CELL_SIZE = 36; // px

  return (
    <div
      className="inline-grid border-2 border-gray-800"
      style={{
        gridTemplateColumns: `repeat(${gridSize}, ${CELL_SIZE}px)`,
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
                style={{ width: CELL_SIZE, height: CELL_SIZE }}
                className="bg-gray-900"
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
              style={{ width: CELL_SIZE, height: CELL_SIZE }}
              className={`relative ${bgColor} cursor-text`}
              onClick={() => handleCellClick(r, c)}
            >
              {cell.clueNumber && (
                <span className="absolute top-0 left-0.5 text-[8px] leading-none text-gray-600 z-10 font-medium select-none">
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
                onFocus={() => handleCellClick(r, c)}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  textAlign: "center",
                  fontSize: "0.875rem",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  caretColor: "transparent",
                  color: result === false ? "#dc2626" : "#111827",
                  // Use line-height equal to cell height for perfect vertical centering
                  lineHeight: `${CELL_SIZE}px`,
                  paddingTop: cell.clueNumber ? "8px" : "0px",
                  paddingBottom: cell.clueNumber ? "0px" : "0px",
                  boxSizing: "border-box",
                  cursor: "text",
                }}
              />
            </div>
          );
        })
      )}
    </div>
  );
}
