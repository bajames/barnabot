"use client";

import { useEffect, useState } from "react";

interface Analysis {
  id: string;
  fileName: string;
  type: string;
  title: string;
  analyzedAt: string;
  recommendation: string;
  summary?: string;
  fullData: any;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">{title}</h3>
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

function AnalysisDetail({ analysis }: { analysis: Analysis }) {
  const data = analysis.fullData;

  if (analysis.type === "research_paper" && data.paper_analysis) {
    const paperData = data.paper_analysis;

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{paperData.paper_title || analysis.title}</h2>
          <p className="text-sm text-gray-500">
            Research Paper Analysis • {new Date(analysis.analyzedAt).toLocaleDateString()}
          </p>
          {paperData.paper_url && (
            <a href={paperData.paper_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
              View Paper →
            </a>
          )}
        </div>

        {data.investment_summary && (
          <Card title="Investment Summary">
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-gray-700">{data.investment_summary}</div>
            </div>
          </Card>
        )}

        <Card title="Detailed Analysis">
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-gray-700">{paperData.analysis}</div>
          </div>
        </Card>
      </div>
    );
  }

  // Investment opportunity analysis
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{data.company || analysis.title}</h2>
        <p className="text-sm text-gray-500">
          Investment Analysis • {new Date(analysis.analyzedAt).toLocaleDateString()}
        </p>
      </div>

      {data.recommendation && (
        <Card title="Recommendation">
          <div className="flex items-center gap-3 mb-4">
            <span className={`px-4 py-2 rounded-full font-semibold text-sm ${
              data.recommendation === "INVEST"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}>
              {data.recommendation}
            </span>
            {data.confidence && (
              <span className="text-sm text-gray-600">
                Confidence: {(data.confidence * 100).toFixed(0)}%
              </span>
            )}
          </div>
          {data.suggested_allocation && (
            <p className="text-sm text-gray-700">
              Suggested Allocation: ${data.suggested_allocation.toLocaleString()}
            </p>
          )}
        </Card>
      )}

      {data.reasoning && (
        <>
          {data.reasoning.strengths && data.reasoning.strengths.length > 0 && (
            <Card title="Strengths">
              <ul className="space-y-2">
                {data.reasoning.strengths.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {data.reasoning.concerns && data.reasoning.concerns.length > 0 && (
            <Card title="Concerns">
              <ul className="space-y-2">
                {data.reasoning.concerns.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-yellow-500 mt-0.5 flex-shrink-0">⚠</span>
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}

      {data.follow_up_questions && data.follow_up_questions.length > 0 && (
        <Card title="Follow-up Questions">
          <ul className="space-y-2">
            {data.follow_up_questions.map((q: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-blue-400 mt-0.5 flex-shrink-0">?</span>
                {q}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {data.investment_summary && (
        <Card title="Executive Summary">
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-gray-700">{data.investment_summary}</div>
          </div>
        </Card>
      )}
    </div>
  );
}

export default function InvestmentsPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/investments?t=${Date.now()}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load analyses");
        return r.json();
      })
      .then((data) => {
        setAnalyses(data.analyses);
        if (data.analyses.length > 0) {
          setSelectedAnalysis(data.analyses[0]);
        }
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
        Loading investment analyses...
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500 text-sm">{error}</p>;
  }

  if (analyses.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Investment Analyses</h2>
        <p className="text-gray-500">No investment analyses found yet.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-6">
      {/* List view */}
      <div className="w-80 flex-shrink-0 space-y-3 overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Investment Analyses</h2>
        {analyses.map((analysis) => (
          <button
            key={analysis.id}
            onClick={() => setSelectedAnalysis(analysis)}
            className={`w-full text-left p-4 rounded-xl border transition-all ${
              selectedAnalysis?.id === analysis.id
                ? "bg-blue-50 border-blue-200"
                : "bg-white border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{analysis.title}</h3>
              <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{timeAgo(analysis.analyzedAt)}</span>
            </div>
            <p className="text-xs text-gray-500 mb-2">
              {analysis.type === "research_paper" ? "Research Paper" : "Investment Pitch"}
            </p>
            {analysis.recommendation && (
              <p className="text-xs text-gray-600 line-clamp-2">{analysis.recommendation.substring(0, 100)}</p>
            )}
          </button>
        ))}
      </div>

      {/* Detail view */}
      <div className="flex-1 overflow-y-auto">
        {selectedAnalysis && <AnalysisDetail analysis={selectedAnalysis} />}
      </div>
    </div>
  );
}
