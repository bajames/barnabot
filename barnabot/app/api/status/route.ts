import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";
import type { Integration, RecentActivity, BotStatus } from "@/lib/bot-status";

const WORKSPACE = "/workspace/group";
const LOGS_DIR = path.join(WORKSPACE, "logs");
const TOKEN_PATH = path.join(
  WORKSPACE,
  "google_integration/integrations/google/token_bot.json"
);

function getIntegrations(): Integration[] {
  const integrations: Integration[] = [];

  // Check Google integration token
  let googleAccount: string | undefined;
  let googleScopes: string[] = [];
  try {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
    // Decode the id_token or use the known account
    googleAccount = "thebarnabybot@gmail.com";
    googleScopes = (token.scopes || "").split(" ").map((s: string) =>
      s.replace("https://www.googleapis.com/auth/", "")
    );
  } catch {
    // token doesn't exist
  }

  integrations.push({
    name: "Google Drive",
    status: googleAccount ? "connected" : "disconnected",
    account: googleAccount,
  });
  integrations.push({
    name: "Gmail",
    status: googleAccount ? "connected" : "disconnected",
    account: googleAccount,
  });
  integrations.push({
    name: "Google Calendar",
    status: googleAccount ? "connected" : "disconnected",
    account: googleAccount,
  });
  integrations.push({
    name: "Google Sheets",
    status: googleAccount ? "connected" : "disconnected",
    account: googleAccount,
  });

  return integrations;
}

function getRecentActivity(): RecentActivity[] {
  try {
    const files = fs
      .readdirSync(LOGS_DIR)
      .filter((f) => f.endsWith(".log"))
      .sort()
      .reverse()
      .slice(0, 20);

    const activities: RecentActivity[] = [];

    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(LOGS_DIR, file), "utf-8");
        const timestampMatch = content.match(/Timestamp:\s*(.+)/);
        const durationMatch = content.match(/Duration:\s*(.+)/);
        const sessionMatch = content.match(/Session ID:\s*(.+)/);

        if (timestampMatch) {
          const durationMs = parseInt(
            (durationMatch?.[1] || "0").replace("ms", "")
          );
          const durationSec = (durationMs / 1000).toFixed(1);

          activities.push({
            timestamp: timestampMatch[1].trim(),
            duration: `${durationSec}s`,
            sessionId: (sessionMatch?.[1] || "").trim().slice(0, 8),
          });
        }
      } catch {
        // skip unreadable files
      }
    }

    return activities;
  } catch {
    return [];
  }
}

function getLastSeen(): string | null {
  try {
    const files = fs
      .readdirSync(LOGS_DIR)
      .filter((f) => f.endsWith(".log"))
      .sort()
      .reverse();

    if (files.length === 0) return null;

    const content = fs.readFileSync(
      path.join(LOGS_DIR, files[0]),
      "utf-8"
    );
    const match = content.match(/Timestamp:\s*(.+)/);
    return match ? match[1].trim() : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status: BotStatus = {
    botEmail: "thebarnabybot@gmail.com",
    lastSeen: getLastSeen(),
    integrations: getIntegrations(),
    recentActivity: getRecentActivity(),
    capabilities: [
      "Send & receive emails (Gmail)",
      "Read & write Google Drive files",
      "Create & manage Google Calendar events",
      "Read & write Google Sheets",
      "Generate map posters from OpenStreetMap data",
      "Generate AI crossword puzzles",
      "Search the web",
      "Schedule recurring tasks",
      "Read & parse PDFs",
    ],
  };

  return NextResponse.json(status);
}
