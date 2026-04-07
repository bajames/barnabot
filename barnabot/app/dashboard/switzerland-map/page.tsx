"use client";

export default function SwitzerlandMapPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Switzerland Vacation Planner</h1>
        <p className="text-sm text-gray-600 mt-1">
          June 2-12, 2026 | Complete itinerary with hotels, rail connections, and activities
        </p>
      </div>

      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <iframe
          src="/switzerland_vacation_planner.html"
          className="w-full h-full border-0"
          title="Switzerland Vacation Planner"
        />
      </div>
    </div>
  );
}
