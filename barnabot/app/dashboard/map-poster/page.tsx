"use client";

import { useState } from "react";
import { THEMES, THEME_LABELS } from "@/lib/map-poster";

type Status = "idle" | "installing" | "generating" | "done" | "error";

export default function MapPosterPage() {
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [theme, setTheme] = useState("terracotta");
  const [distance, setDistance] = useState(10000);
  const [status, setStatus] = useState<Status>("idle");
  const [image, setImage] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isLoading = status === "installing" || status === "generating";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim() || !country.trim() || isLoading) return;

    setStatus("installing");
    setError(null);
    setImage(null);

    const installTimer = setTimeout(() => setStatus("generating"), 3000);

    try {
      const res = await fetch("/api/map-poster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: city.trim(), country: country.trim(), theme, distance }),
      });

      clearTimeout(installTimer);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }

      const data = await res.json();
      setImage(`data:image/png;base64,${data.image}`);
      setFilename(data.filename);
      setStatus("done");
    } catch (err) {
      clearTimeout(installTimer);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  };

  const handleDownload = () => {
    if (!image || !filename) return;
    const a = document.createElement("a");
    a.href = image;
    a.download = filename;
    a.click();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Map Poster</h2>
        <p className="text-sm text-gray-500">
          Generate a beautiful minimalist map poster for any city using OpenStreetMap data.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Los Gatos"
              disabled={isLoading}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Country</label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. USA"
              disabled={isLoading}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Theme</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 bg-white"
            >
              {THEMES.map((t) => (
                <option key={t} value={t}>
                  {THEME_LABELS[t] || t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Radius: {(distance / 1000).toFixed(0)} km
            </label>
            <input
              type="range"
              min={2000}
              max={15000}
              step={1000}
              value={distance}
              onChange={(e) => setDistance(parseInt(e.target.value))}
              disabled={isLoading}
              className="w-full mt-2"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>2 km</span>
              <span>15 km</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!city.trim() || !country.trim() || isLoading}
          className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "Generating..." : "Generate Poster"}
        </button>
      </form>

      {/* Progress */}
      {isLoading && (
        <div className="mt-4 flex items-center gap-3 text-sm text-gray-500">
          <svg className="animate-spin h-4 w-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>
            {status === "installing"
              ? "Setting up dependencies..."
              : `Fetching OpenStreetMap data and rendering poster for ${city}...`}
          </span>
        </div>
      )}

      {/* Error */}
      {status === "error" && error && (
        <p className="mt-4 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>
      )}

      {/* Result */}
      {status === "done" && image && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-700">
              {city}, {country} — {THEME_LABELS[theme] || theme} theme
            </p>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PNG
            </button>
          </div>
          <img
            src={image}
            alt={`Map poster of ${city}`}
            className="w-full max-w-2xl rounded-2xl border border-gray-200 shadow-sm"
          />
        </div>
      )}
    </div>
  );
}
