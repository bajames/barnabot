"use client";

import { useState, useEffect, useCallback } from "react";
import { WORDS_6, WORDS_7 } from "@/lib/sixseven-words";

const MAX_GUESSES = 6;

type LetterState = "correct" | "present" | "absent" | "empty" | "typing";

interface TileState {
  letter: string;
  state: LetterState;
}

function pickWord(): string {
  const useSevenLetter = Math.random() < 0.5;
  const list = useSevenLetter ? WORDS_7 : WORDS_6;
  // Pick from top 1000 for more recognizable words
  return list[Math.floor(Math.random() * 1000)];
}

function evaluateGuess(guess: string, answer: string): LetterState[] {
  const result: LetterState[] = Array(guess.length).fill("absent");
  const answerArr = answer.split("");
  const guessArr = guess.split("");

  // First pass: correct positions
  guessArr.forEach((letter, i) => {
    if (letter === answerArr[i]) {
      result[i] = "correct";
      answerArr[i] = "#"; // Mark used
    }
  });

  // Second pass: present but wrong position
  guessArr.forEach((letter, i) => {
    if (result[i] === "correct") return;
    const idx = answerArr.indexOf(letter);
    if (idx !== -1) {
      result[i] = "present";
      answerArr[idx] = "#";
    }
  });

  return result;
}

const TILE_COLORS: Record<LetterState, string> = {
  correct: "bg-green-600 border-green-600 text-white",
  present: "bg-yellow-500 border-yellow-500 text-white",
  absent: "bg-gray-600 border-gray-600 text-white",
  empty: "bg-white border-gray-300 text-gray-900",
  typing: "bg-white border-gray-500 text-gray-900",
};

const KEY_COLORS: Record<LetterState, string> = {
  correct: "bg-green-600 text-white",
  present: "bg-yellow-500 text-white",
  absent: "bg-gray-500 text-white",
  empty: "bg-gray-200 text-gray-900",
  typing: "bg-gray-200 text-gray-900",
};

const KEYBOARD_ROWS = [
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L"],
  ["ENTER","Z","X","C","V","B","N","M","⌫"],
];



export default function SixSevenPage() {
  const [answer, setAnswer] = useState<string>(() => pickWord());
  const [guesses, setGuesses] = useState<TileState[][]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>("");
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [shake, setShake] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  const wordLen = answer.length;
  const wordList = wordLen === 6 ? WORDS_6 : WORDS_7;

  const showMessage = (msg: string, duration = 1500) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), duration);
  };

  const submitGuess = useCallback(() => {
    if (currentGuess.length !== wordLen) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      showMessage(`Word must be ${wordLen} letters`);
      return;
    }

    if (!wordList.includes(currentGuess)) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      showMessage("Not in word list");
      return;
    }

    const states = evaluateGuess(currentGuess, answer);
    const newRow: TileState[] = currentGuess.split("").map((letter, i) => ({
      letter,
      state: states[i],
    }));

    setGuesses((prev) => [...prev, newRow]);
    setCurrentGuess("");

    const isWin = currentGuess === answer;
    const isLastGuess = guesses.length + 1 >= MAX_GUESSES;

    if (isWin) {
      setTimeout(() => {
        setWon(true);
        setGameOver(true);
        showMessage("Brilliant!", 3000);
      }, wordLen * 80 + 200);
    } else if (isLastGuess) {
      setTimeout(() => {
        setGameOver(true);
        showMessage(answer, 4000);
      }, wordLen * 80 + 200);
    }
  }, [currentGuess, wordLen, wordList, answer, guesses.length]);

  const handleKey = useCallback((key: string) => {
    if (gameOver) return;
    if (key === "ENTER") {
      submitGuess();
    } else if (key === "⌫" || key === "BACKSPACE") {
      setCurrentGuess((prev) => prev.slice(0, -1));
    } else if (/^[A-Z]$/.test(key) && currentGuess.length < wordLen) {
      setCurrentGuess((prev) => prev + key);
    }
  }, [gameOver, submitGuess, currentGuess.length, wordLen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      handleKey(e.key.toUpperCase());
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleKey]);

  const newGame = () => {
    setAnswer(pickWord());
    setGuesses([]);
    setCurrentGuess("");
    setGameOver(false);
    setWon(false);
    setMessage(null);
  };

  // Build keyboard letter states
  const letterStates: Record<string, LetterState> = {};
  guesses.forEach((row) => {
    row.forEach(({ letter, state }) => {
      const prev = letterStates[letter];
      if (prev === "correct") return;
      if (prev === "present" && state === "absent") return;
      letterStates[letter] = state;
    });
  });

  // Build display rows
  const displayRows: TileState[][] = [];
  for (let i = 0; i < MAX_GUESSES; i++) {
    if (i < guesses.length) {
      displayRows.push(guesses[i]);
    } else if (i === guesses.length && !gameOver) {
      // Current guess row
      const row: TileState[] = [];
      for (let j = 0; j < wordLen; j++) {
        row.push({
          letter: currentGuess[j] || "",
          state: currentGuess[j] ? "typing" : "empty",
        });
      }
      displayRows.push(row);
    } else {
      displayRows.push(Array(wordLen).fill({ letter: "", state: "empty" as LetterState }));
    }
  }

  const tileSize = wordLen === 7 ? "w-11 h-11" : "w-12 h-12";
  const tileText = wordLen === 7 ? "text-xl" : "text-2xl";

  return (
    <div className="max-w-lg mx-auto flex flex-col items-center">
      <div className="w-full mb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">SixSeven</h2>
        <p className="text-sm text-gray-500">
          Guess the {wordLen}-letter word in {MAX_GUESSES} tries.
        </p>
      </div>

      {/* Message toast */}
      {message && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-lg">
          {message}
        </div>
      )}

      {/* Grid */}
      <div className="mb-6 space-y-1.5">
        {displayRows.map((row, rowIdx) => {
          const isCurrentRow = rowIdx === guesses.length && !gameOver;
          return (
            <div
              key={rowIdx}
              className={`flex gap-1.5 ${isCurrentRow && shake ? "animate-[shake_0.5s_ease-in-out]" : ""}`}
            >
              {row.map((tile, colIdx) => {
                const delay = `${colIdx * 80}ms`;
                const isRevealing = rowIdx === guesses.length - 1;
                return (
                  <div
                    key={colIdx}
                    className={`
                      ${tileSize} border-2 flex items-center justify-center
                      ${tileText} font-bold uppercase select-none
                      ${TILE_COLORS[tile.state]}
                      ${isRevealing ? "transition-all duration-300" : ""}
                      ${tile.letter && tile.state === "typing" ? "scale-105" : ""}
                    `}
                    style={isRevealing ? { transitionDelay: delay } : {}}
                  >
                    {tile.letter}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Keyboard */}
      <div className="space-y-1.5 w-full max-w-sm">
        {KEYBOARD_ROWS.map((row, i) => (
          <div key={i} className="flex justify-center gap-1">
            {row.map((key) => {
              const state = letterStates[key] || "empty";
              const isWide = key === "ENTER" || key === "⌫";
              return (
                <button
                  key={key}
                  onClick={() => handleKey(key)}
                  className={`
                    ${isWide ? "px-3 text-xs" : "w-9"} h-14 rounded font-bold text-sm
                    ${KEY_COLORS[state]}
                    active:scale-95 transition-transform
                  `}
                >
                  {key}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* New game button */}
      {gameOver && (
        <button
          onClick={newGame}
          className="mt-6 px-6 py-2.5 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
        >
          New Game
        </button>
      )}

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
