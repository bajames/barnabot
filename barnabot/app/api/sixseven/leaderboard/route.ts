import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { google } from "googleapis";

const SHEET_ID = "1xTdvnYONsLpAVi0bzsa-L3-AG7FKpuOF8qxNdiT4bIk";

function getAuth() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({
    refresh_token: process.env.GOOGLE_SHEETS_REFRESH_TOKEN,
  });
  return auth;
}

export interface LeaderboardEntry {
  email: string;
  name: string;
  played: number;
  won: number;
  winRate: number;
  avgGuesses: number;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Games!A2:G",
    });

    const rows = res.data.values || [];

    // Aggregate by email
    const stats: Record<string, { name: string; played: number; won: number; totalGuesses: number }> = {};

    for (const row of rows) {
      const [, email, name, , , wonVal, guessesVal] = row;
      if (!email) continue;
      if (!stats[email]) stats[email] = { name: name || email, played: 0, won: 0, totalGuesses: 0 };
      stats[email].played++;
      if (String(wonVal) === "1") stats[email].won++;
      stats[email].totalGuesses += parseInt(guessesVal) || 0;
    }

    const leaderboard: LeaderboardEntry[] = Object.entries(stats)
      .map(([email, s]) => ({
        email,
        name: s.name,
        played: s.played,
        won: s.won,
        winRate: s.played > 0 ? Math.round((s.won / s.played) * 100) : 0,
        avgGuesses: s.won > 0 ? Math.round((s.totalGuesses / s.won) * 10) / 10 : 0,
      }))
      .sort((a, b) => b.winRate - a.winRate || b.played - a.played);

    return NextResponse.json(leaderboard);
  } catch (err) {
    console.error("Leaderboard fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
