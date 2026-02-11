"use client";

import { useState } from "react";

interface Props {
  onGenerate: (topic: string) => void;
  isLoading: boolean;
}

export default function CrosswordForm({ onGenerate, isLoading }: Props) {
  const [topic, setTopic] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim() && !isLoading) {
      onGenerate(topic.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 items-center">
      <input
        type="text"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="Enter a topic (e.g. space, cooking, jazz...)"
        disabled={isLoading}
        className="flex-1 max-w-md px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
      />
      <button
        type="submit"
        disabled={!topic.trim() || isLoading}
        className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? "Generating..." : "Generate"}
      </button>
    </form>
  );
}
