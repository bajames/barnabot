import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import {
  buildCrosswordPrompt,
  recomputeClueNumbers,
  CrosswordData,
} from "@/lib/crossword";

export const maxDuration = 60; // Vercel Pro: 60-second timeout

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const topic = (body.topic || "").trim();

  if (!topic || topic.length > 100) {
    return NextResponse.json({ error: "Invalid topic" }, { status: 400 });
  }

  const prompt = buildCrosswordPrompt(topic);

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-5-20251101",
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    });

    const rawText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Extract JSON block from response (handle any preamble/postamble)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in Claude response:", rawText.slice(0, 500));
      return NextResponse.json(
        { error: "Failed to parse crossword response" },
        { status: 500 }
      );
    }

    let crossword: CrosswordData;
    try {
      crossword = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr);
      return NextResponse.json(
        { error: "Invalid crossword format" },
        { status: 500 }
      );
    }

    // Validate basic structure
    if (
      !crossword.grid ||
      !Array.isArray(crossword.grid) ||
      !crossword.clues?.across ||
      !crossword.clues?.down
    ) {
      return NextResponse.json(
        { error: "Incomplete crossword structure" },
        { status: 500 }
      );
    }

    // Recompute clue numbers from grid layout for consistency
    const processed = recomputeClueNumbers(crossword);

    return NextResponse.json(processed);
  } catch (err) {
    console.error("Crossword generation error:", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
