"use client";

import { useEffect, useState } from "react";
import { BotStatus } from "@/app/api/status/route";

function StatusDot({ status }: { status: "connected" | "disconnected" }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${
        status === "connected" ? "bg-green-500" : "bg-gray-300"
      }`}
    />
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">
        {title}
      </h3>
      {children}
    </div>
  );
}

function timeAgo(isoString: string | null): string {
  if (!isoString) return "Unknown";
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

export default function StatusPage() {
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load status");
        return r.json();
      })
      .then((data) => {
        setStatus(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading status...
      </div>
    );
  }

  if (error || !status) {
    return <p className="text-red-500 text-sm">{error || "Failed to load"}</p>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Bot Status</h2>
        <p className="text-sm text-gray-500">
          Current state and activity of your Barnabot assistant.
        </p>
      </div>

      {/* Identity card */}
      <Card title="Identity">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
            🤖
          </div>
          <div>
            <p className="font-semibold text-gray-900">Claude (Barnabot)</p>
            <p className="text-sm text-gray-500">{status.botEmail}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Last active: {timeAgo(status.lastSeen)}
            </p>
          </div>
        </div>
      </Card>

      {/* Integrations */}
      <Card title="Integrations">
        <div className="grid grid-cols-2 gap-3">
          {status.integrations.map((integration) => (
            <div
              key={integration.name}
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 border border-gray-100"
            >
              <div className="flex items-center gap-2.5">
                <StatusDot status={integration.status} />
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {integration.name}
                  </p>
                  {integration.account && (
                    <p className="text-xs text-gray-400">{integration.account}</p>
                  )}
                </div>
              </div>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  integration.status === "connected"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {integration.status}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Capabilities */}
      <Card title="Capabilities">
        <ul className="grid grid-cols-2 gap-2">
          {status.capabilities.map((cap) => (
            <li key={cap} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
              {cap}
            </li>
          ))}
        </ul>
      </Card>

      {/* Recent activity */}
      <Card title="Recent Activity">
        {status.recentActivity.length === 0 ? (
          <p className="text-sm text-gray-400">No activity logged yet.</p>
        ) : (
          <div className="space-y-2">
            {status.recentActivity.slice(0, 10).map((activity, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-300 text-xs font-mono">
                    {activity.sessionId}
                  </span>
                  <span className="text-gray-600">
                    {timeAgo(activity.timestamp)}
                  </span>
                </div>
                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                  {activity.duration}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
