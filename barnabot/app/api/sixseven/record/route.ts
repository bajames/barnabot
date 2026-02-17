import { NextRequest, NextResponse } from "next/server";
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

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { word, won, guessesUsed } = await req.json();
  if (!word || typeof won !== "boolean" || typeof guessesUsed !== "number") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const email = session.user.email;
  const name = session.user.name || email.split("@")[0];
  const timestamp = new Date().toISOString();

  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "Games!A:G",
      valueInputOption: "RAW",
      requestBody: {
        values: [[timestamp, email, name, word, word.length, won ? 1 : 0, guessesUsed]],
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Sheet append error:", err);
    return NextResponse.json({ error: "Failed to record" }, { status: 500 });
  }
}
