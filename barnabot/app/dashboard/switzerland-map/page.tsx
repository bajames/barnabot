"use client";

export default function SwitzerlandMapPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Switzerland Vacation Map</h1>
        <p className="text-sm text-gray-600 mt-1">
          Interactive topographic map showing recommended towns for June 2026 trip
        </p>
      </div>

      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <iframe
          src="/switzerland_vacation_map.html"
          className="w-full h-full border-0"
          title="Switzerland Vacation Map"
        />
      </div>
    </div>
  );
}
