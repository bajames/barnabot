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

export const GRID_SIZE = 15;

export function buildCrosswordPrompt(topic: string): string {
  return `You are an expert crossword puzzle constructor. Create a valid, solvable crossword puzzle about the topic: "${topic}".

REQUIREMENTS:
- Use a ${GRID_SIZE}x${GRID_SIZE} grid (${GRID_SIZE} rows, ${GRID_SIZE} columns, 0-indexed)
- At least 10 thematic words related to "${topic}"
- All words must be connected (no isolated sections)
- Black squares should have approximate 180-degree rotational symmetry
- Words must be at least 3 letters long; longer words (8-11 letters) are encouraged
- Every white cell must be part of both an across and a down word (fully checked grid)
- CRITICAL: Every word must be bounded by a black square or grid edge at BOTH ends. Two different words must NEVER share cells or run into each other without a black square between them.
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
- A cell gets a number if it starts an across word (is a white cell where the cell to its left is black/edge, and the word is 3+ letters) OR a down word (is a white cell where the cell above is black/edge, and the word is 3+ letters)
- Double-check: for every across word of length N starting at (r, startCol), verify that startCol+N equals ${GRID_SIZE} OR grid[r][startCol+N].isBlack is true`;
}

/**
 * Validates that every clue's answer matches the grid letters,
 * and that words are bounded by black squares / edges on both ends.
 * Returns a list of error strings, empty if valid.
 */
export function validateCrossword(data: CrosswordData): string[] {
  const { grid, gridSize, clues } = data;
  const errors: string[] = [];

  const allClues = [...clues.across, ...clues.down];
  for (const clue of allClues) {
    const { startRow, startCol, answer, direction, length } = clue;
    // Check answer matches grid
    for (let i = 0; i < length; i++) {
      const r = startRow + (direction === "down" ? i : 0);
      const c = startCol + (direction === "across" ? i : 0);
      if (r >= gridSize || c >= gridSize) {
        errors.push(`Clue ${clue.number} ${direction}: out of bounds at i=${i}`);
        break;
      }
      if (grid[r][c].isBlack) {
        errors.push(`Clue ${clue.number} ${direction}: black cell in word at (${r},${c})`);
        break;
      }
      const gridLetter = grid[r][c].letter.toUpperCase();
      const answerLetter = (answer[i] || "").toUpperCase();
      if (gridLetter !== answerLetter) {
        errors.push(`Clue ${clue.number} ${direction}: grid[${r}][${c}]="${gridLetter}" != answer[${i}]="${answerLetter}"`);
      }
    }
    // Check end boundary
    const endR = startRow + (direction === "down" ? length : 0);
    const endC = startCol + (direction === "across" ? length : 0);
    if (endR < gridSize && endC < gridSize && !grid[endR][endC].isBlack) {
      errors.push(`Clue ${clue.number} ${direction}: no black square at end (${endR},${endC})`);
    }
  }
  return errors;
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

  // Compute actual word length from grid for a given start position and direction
  const computeLength = (startRow: number, startCol: number, direction: "across" | "down"): number => {
    let len = 0;
    let r = startRow, c = startCol;
    while (r < gridSize && c < gridSize && !grid[r][c].isBlack) {
      len++;
      if (direction === "across") c++; else r++;
    }
    return len;
  };

  // Compute actual answer string from grid
  const computeAnswer = (startRow: number, startCol: number, direction: "across" | "down", length: number): string => {
    let answer = "";
    for (let i = 0; i < length; i++) {
      const r = startRow + (direction === "down" ? i : 0);
      const c = startCol + (direction === "across" ? i : 0);
      answer += grid[r]?.[c]?.letter || "";
    }
    return answer;
  };

  // Update clue numbers, lengths, and answers to match actual grid layout
  const updateClues = (clues: CrosswordClue[]) =>
    clues.map((clue) => {
      const length = computeLength(clue.startRow, clue.startCol, clue.direction);
      return {
        ...clue,
        number: numberMap[clue.startRow][clue.startCol] || clue.number,
        length,
        answer: computeAnswer(clue.startRow, clue.startCol, clue.direction, length),
      };
    });

  return {
    ...data,
    grid: newGrid,
    clues: {
      across: updateClues(data.clues.across).sort((a, b) => a.number - b.number),
      down: updateClues(data.clues.down).sort((a, b) => a.number - b.number),
    },
  };
}
