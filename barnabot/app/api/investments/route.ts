import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const analysisDir = path.join(process.cwd(), "../AgenticInvestor/data/analysis");

    // Check if directory exists
    try {
      await fs.access(analysisDir);
    } catch {
      return NextResponse.json({ analyses: [] });
    }

    const files = await fs.readdir(analysisDir);
    const jsonFiles = files.filter(f => f.endsWith(".json"));

    const analyses = await Promise.all(
      jsonFiles.map(async (file) => {
        const filePath = path.join(analysisDir, file);
        const content = await fs.readFile(filePath, "utf-8");
        const data = JSON.parse(content);

        // Extract key info for the list view
        return {
          id: file.replace(".json", ""),
          fileName: file,
          type: data.type || "investment",
          title: data.company || data.paper_title || "Unknown",
          analyzedAt: data.analyzed_at,
          recommendation: data.investment_recommendation || data.recommendation,
          summary: data.investment_summary || data.paper_analysis?.analysis?.substring(0, 200),
          fullData: data
        };
      })
    );

    // Sort by date, newest first
    analyses.sort((a, b) => {
      const dateA = new Date(a.analyzedAt || 0).getTime();
      const dateB = new Date(b.analyzedAt || 0).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({ analyses });
  } catch (error) {
    console.error("Error fetching analyses:", error);
    return NextResponse.json(
      { error: "Failed to fetch analyses" },
      { status: 500 }
    );
  }
}
