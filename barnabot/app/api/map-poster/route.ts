import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

export const maxDuration = 120;

const execAsync = promisify(exec);

const MAPTOPOSTER_DIR = "/workspace/group/maptoposter";

export const THEMES = [
  "terracotta",
  "midnight_blue",
  "forest",
  "ocean",
  "blueprint",
  "noir",
  "sunset",
  "emerald",
  "autumn",
  "pastel_dream",
  "neon_cyberpunk",
  "japanese_ink",
  "monochrome_blue",
  "warm_beige",
  "copper_patina",
  "gradient_roads",
  "contrast_zones",
];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const city = (body.city || "").trim();
  const country = (body.country || "").trim();
  const theme = THEMES.includes(body.theme) ? body.theme : "terracotta";
  const distance = Math.min(Math.max(parseInt(body.distance) || 10000, 2000), 15000);

  if (!city || !country) {
    return NextResponse.json({ error: "City and country are required" }, { status: 400 });
  }

  // Sanitize inputs to prevent command injection
  const safeCity = city.replace(/[^a-zA-Z0-9 ,\-'\.]/g, "").slice(0, 60);
  const safeCountry = country.replace(/[^a-zA-Z0-9 ,\-'\.]/g, "").slice(0, 40);

  if (!safeCity || !safeCountry) {
    return NextResponse.json({ error: "Invalid city or country" }, { status: 400 });
  }

  try {
    // Ensure pip and dependencies are installed
    await execAsync(
      `cd ${MAPTOPOSTER_DIR} && python3 -c "import osmnx" 2>/dev/null || (curl -sS https://bootstrap.pypa.io/get-pip.py | python3 - --break-system-packages > /dev/null 2>&1 && python3 -m pip install --break-system-packages -q -r requirements.txt)`
    );

    const { stdout, stderr } = await execAsync(
      `cd ${MAPTOPOSTER_DIR} && python3 create_map_poster.py --city "${safeCity}" --country "${safeCountry}" --theme ${theme} --distance ${distance}`,
      { timeout: 100000 }
    );

    // Find the generated poster file
    const match = (stdout + stderr).match(/Saving to (.+\.png)/);
    if (!match) {
      console.error("No output file found. stdout:", stdout, "stderr:", stderr);
      return NextResponse.json({ error: "Poster generation failed" }, { status: 500 });
    }

    const posterPath = path.join(MAPTOPOSTER_DIR, match[1]);
    if (!fs.existsSync(posterPath)) {
      return NextResponse.json({ error: "Poster file not found" }, { status: 500 });
    }

    const imageBuffer = fs.readFileSync(posterPath);
    const base64 = imageBuffer.toString("base64");
    const filename = path.basename(posterPath);

    return NextResponse.json({ image: base64, filename });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Map poster error:", msg);
    return NextResponse.json({ error: "Generation failed: " + msg.slice(0, 200) }, { status: 500 });
  }
}
