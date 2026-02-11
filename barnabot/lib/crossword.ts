export interface CrosswordCell {
  letter: string;      // Correct answer letter, or "" for black cell
  isBlack: boolean;
  clueNumber?: number; // Number label shown in top-left corner of cell
}

export interface CrosswordClue {
  number: number;
  direction: "across" | "down";
  clue: string;
  answer: string;
  startRow: number;
  startCol: number;
  length: number;
}

export interface CrosswordData {
  topic: string;
  title: string;
  grid: CrosswordCell[][];
  clues: {
    across: CrosswordClue[];
    down: CrosswordClue[];
  };
  gridSize: number;
}

export const GRID_SIZE = 11;

export function buildCrosswordPrompt(topic: string): string {
  return `You are an expert crossword puzzle constructor. Create a valid, solvable crossword puzzle about the topic: "${topic}".

REQUIREMENTS:
- Use an ${GRID_SIZE}x${GRID_SIZE} grid (${GRID_SIZE} rows, ${GRID_SIZE} columns, 0-indexed)
- At least 15 thematic words related to "${topic}"
- All words must be connected (no isolated sections)
- Black squares should have approximate 180-degree rotational symmetry
- Words must be at least 3 letters long
- Every white cell must be part of both an across and a down word (fully checked grid)
- Clues should be clever and fun, appropriate for the topic

Return ONLY a valid JSON object with NO other text, preamble, or explanation. Use exactly this structure:

{
  "topic": "${topic}",
  "title": "A title for this crossword",
  "gridSize": ${GRID_SIZE},
  "grid": [
    [{"letter": "A", "isBlack": false}, {"letter": "", "isBlack": true}, ...],
    ...
  ],
  "clues": {
    "across": [
      {
        "number": 1,
        "direction": "across",
        "clue": "The clue text",
        "answer": "ANSWER",
        "startRow": 0,
        "startCol": 0,
        "length": 6
      }
    ],
    "down": [
      {
        "number": 1,
        "direction": "down",
        "clue": "The clue text",
        "answer": "ANSWER",
        "startRow": 0,
        "startCol": 0,
        "length": 5
      }
    ]
  }
}

IMPORTANT:
- grid must be exactly ${GRID_SIZE} rows, each with exactly ${GRID_SIZE} cells
- letter must be an uppercase letter for white cells, "" for black cells
- Every answer in clues must exactly match the letters in the grid at the given coordinates
- Clue numbers must be sequential starting from 1, assigned left-to-right, top-to-bottom
- A cell gets a number if it starts an across word (is a white cell where the cell to its left is black/edge, and the word is 3+ letters) OR a down word (is a white cell where the cell above is black/edge, and the word is 3+ letters)`;
}

/**
 * Recomputes clue numbers from the grid layout.
 * Claude's numbering can be off, so we recompute from scratch.
 */
export function recomputeClueNumbers(data: CrosswordData): CrosswordData {
  const { grid, gridSize } = data;
  const numberMap: number[][] = Array.from({ length: gridSize }, () =>
    Array(gridSize).fill(0)
  );

  let num = 1;
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (grid[r][c].isBlack) continue;
      const startsAcross =
        (c === 0 || grid[r][c - 1].isBlack) &&
        c + 1 < gridSize &&
        !grid[r][c + 1].isBlack;
      const startsDown =
        (r === 0 || grid[r - 1][c].isBlack) &&
        r + 1 < gridSize &&
        !grid[r + 1][c].isBlack;
      if (startsAcross || startsDown) {
        numberMap[r][c] = num++;
      }
    }
  }

  // Apply numbers to grid cells
  const newGrid = grid.map((row, r) =>
    row.map((cell, c) => ({
      ...cell,
      clueNumber: numberMap[r][c] || undefined,
    }))
  );

  // Update clue numbers to match recomputed positions
  const updateClues = (clues: CrosswordClue[]) =>
    clues.map((clue) => ({
      ...clue,
      number: numberMap[clue.startRow][clue.startCol] || clue.number,
    }));

  return {
    ...data,
    grid: newGrid,
    clues: {
      across: updateClues(data.clues.across).sort((a, b) => a.number - b.number),
      down: updateClues(data.clues.down).sort((a, b) => a.number - b.number),
    },
  };
}
