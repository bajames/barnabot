"use client";

import { useState } from "react";
import CrosswordForm from "@/components/crossword/CrosswordForm";
import CrosswordGrid from "@/components/crossword/CrosswordGrid";
import CrosswordClues from "@/components/crossword/CrosswordClues";
import { CrosswordData } from "@/lib/crossword";

type GenerationStatus =
  | "idle"
  | "requesting"
  | "thinking"
  | "done"
  | "error";

const PROGRESS_STEPS = [
  { status: "requesting", label: "Sending request to Claude..." },
  { status: "thinking", label: "Claude is building your crossword grid..." },
];

export default function CrosswordPage() {
  const [crossword, setCrossword] = useState<CrosswordData | null>(null);
  const [userGrid, setUserGrid] = useState<string[][]>([]);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [checkResults, setCheckResults] = useState<boolean[][] | null>(null);
  const [selectedClue, setSelectedClue] = useState<{
    number: number;
    direction: "across" | "down";
  } | null>(null);

  const isLoading = generationStatus === "requesting" || generationStatus === "thinking";

  const handleGenerate = async (topic: string) => {
    setGenerationStatus("requesting");
    setError(null);
    setCrossword(null);
    setCheckResults(null);
    setSelectedClue(null);

    // Simulate progress steps for UX
    const thinkingTimer = setTimeout(() => {
      setGenerationStatus("thinking");
    }, 2000);

    try {
      const res = await fetch("/api/crossword/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });

      clearTimeout(thinkingTimer);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }

      const data: CrosswordData = await res.json();
      setCrossword(data);
      setUserGrid(
        data.grid.map((row) => row.map((cell) => (cell.isBlack ? "#" : "")))
      );
      setGenerationStatus("done");
    } catch (err) {
      clearTimeout(thinkingTimer);
      setError(
        err instanceof Error ? err.message : "Something went wrong. Try again."
      );
      setGenerationStatus("error");
    }
  };

  const handleCellChange = (r: number, c: number, val: string) => {
    setUserGrid((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = val;
      return next;
    });
    setCheckResults(null);
  };

  const handleCheckAnswers = () => {
    if (!crossword) return;
    const results = crossword.grid.map((row, r) =>
      row.map((cell, c) => {
        if (cell.isBlack) return true;
        return (userGrid[r]?.[c] ?? "").toUpperCase() === cell.letter.toUpperCase();
      })
    );
    setCheckResults(results);
  };

  const handleRevealAnswers = () => {
    if (!crossword) return;
    setUserGrid(crossword.grid.map((row) => row.map((cell) => cell.letter || "#")));
    setCheckResults(crossword.grid.map((row) => row.map(() => true)));
  };

  const handleClueSelect = (number: number, direction: "across" | "down") => {
    setSelectedClue({ number, direction });
  };

  const handleReset = () => {
    if (!crossword) return;
    setUserGrid(crossword.grid.map((row) => row.map((cell) => (cell.isBlack ? "#" : ""))));
    setCheckResults(null);
  };

  const allCorrect =
    checkResults !== null &&
    crossword !== null &&
    crossword.grid.every((row, r) =>
      row.every((cell, c) => cell.isBlack || checkResults[r][c])
    );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Crossword Puzzle</h2>
        <p className="text-sm text-gray-500">
          Enter any topic and Claude will generate a custom crossword for you.
        </p>
      </div>

      <CrosswordForm onGenerate={handleGenerate} isLoading={isLoading} />

      {/* Progress indicator */}
      {isLoading && (
        <div className="mt-6 flex items-center gap-3 text-sm text-gray-500">
          <svg
            className="animate-spin h-4 w-4 text-blue-500 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span>
            {generationStatus === "requesting"
              ? "Sending request to Claude..."
              : "Claude is constructing your crossword grid — this takes 20-30 seconds..."}
          </span>
        </div>
      )}

      {/* Error */}
      {generationStatus === "error" && error && (
        <p className="mt-4 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">
          {error}
        </p>
      )}

      {/* Crossword */}
      {crossword && generationStatus === "done" && (
        <div className="mt-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800">{crossword.title}</h3>
            <p className="text-xs text-gray-400">Topic: {crossword.topic}</p>
          </div>

          {allCorrect && (
            <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">
              🎉 Congratulations — puzzle complete!
            </div>
          )}

          <div className="flex gap-8 items-start">
            <div>
              <CrosswordGrid
                crossword={crossword}
                userGrid={userGrid}
                onCellChange={handleCellChange}
                checkResults={checkResults}
                selectedClue={selectedClue}
              />
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleCheckAnswers}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Check Answers
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={handleRevealAnswers}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Reveal All
                </button>
              </div>
            </div>

            <CrosswordClues
              clues={crossword.clues}
              selectedClue={selectedClue}
              onClueSelect={handleClueSelect}
            />
          </div>
        </div>
      )}
    </div>
  );
}
