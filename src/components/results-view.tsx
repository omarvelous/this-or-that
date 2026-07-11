"use client";

import { useEffect, useState } from "react";

import { AnimatedBar } from "@/components/animated-bar";

interface OptionResult {
  id: string;
  label: string | null;
  imageUrl: string | null;
  position: number;
  votes: number;
  percentage: number;
}

interface ResultsData {
  question: string;
  options: OptionResult[];
  totalVotes: number;
  isClosed: boolean;
}

interface ResultsViewProps {
  shortId: string;
  initialData: ResultsData;
}

const POLL_INTERVAL = 2500; // 2.5 seconds

export function ResultsView({ shortId, initialData }: ResultsViewProps) {
  const [data, setData] = useState<ResultsData>(initialData);

  // Poll for live updates when the poll is still open.
  useEffect(() => {
    if (data.isClosed) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/polls/${shortId}/results`);
        if (res.ok) {
          const updated = (await res.json()) as ResultsData;
          setData(updated);
        }
      } catch {
        // Silently ignore — next tick will retry.
      }
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [shortId, data.isClosed]);

  const maxVotes = Math.max(...data.options.map((o) => o.votes), 0);
  const sorted = [...data.options].sort((a, b) => a.position - b.position);

  return (
    <div className="w-full max-w-lg space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          {data.question}
        </h1>
        <p className="text-text-secondary text-sm">
          {data.totalVotes} {data.totalVotes === 1 ? "vote" : "votes"}
          {data.isClosed ? " · Closed" : " · Live"}
        </p>
      </div>

      <div className="space-y-4">
        {sorted.map((opt, i) => (
          <AnimatedBar
            key={opt.id}
            percentage={opt.percentage}
            votes={opt.votes}
            label={opt.label}
            side={i === 0 ? "a" : "b"}
            isWinner={
              !data.isClosed ? false : opt.votes === maxVotes && maxVotes > 0
            }
          />
        ))}
      </div>

      {!data.isClosed && (
        <p className="text-text-muted text-center text-xs">
          Results update live every few seconds
        </p>
      )}
    </div>
  );
}
