"use client";

import { useEffect, useState } from "react";

import { OptionBadge } from "@/components/option-badge";

interface ResultRowProps {
  side: "a" | "b";
  label: string | null;
  votes: number;
  percentage: number;
  isWinner: boolean;
}

export function ResultRow({
  side,
  label,
  votes,
  percentage,
  isWinner,
}: ResultRowProps) {
  const [displayPct, setDisplayPct] = useState(0);
  const [displayVotes, setDisplayVotes] = useState(0);

  // Count-up animation: ~1s ease-out cubic
  useEffect(() => {
    const duration = 1000;
    const start = performance.now();
    const startPct = displayPct;
    const startVotes = displayVotes;

    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3); // cubic ease-out

      setDisplayPct(Math.round(startPct + (percentage - startPct) * ease));
      setDisplayVotes(Math.round(startVotes + (votes - startVotes) * ease));

      if (t < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [percentage, votes]);

  const barColor = side === "a" ? "bg-option-a" : "bg-option-b";

  return (
    <div className="space-y-3">
      {/* Top row: badge + label + winner + percentage */}
      <div className="flex items-center gap-3">
        <OptionBadge side={side} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-display text-ink truncate text-lg font-bold">
              {label ?? "Option"}
              {isWinner && (
                <span className="rounded-pill bg-sand text-ink ml-2 inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold">
                  ★ Winner
                </span>
              )}
            </span>
            <span className="font-display text-ink shrink-0 text-2xl font-bold tabular-nums">
              {displayPct}%
            </span>
          </div>
          <p className="text-muted text-xs tabular-nums">
            {displayVotes} {displayVotes === 1 ? "vote" : "votes"}
          </p>
        </div>
      </div>

      {/* Bar */}
      <div className="rounded-pill bg-sand h-3 overflow-hidden">
        <div
          className={`${barColor} rounded-pill h-full transition-all duration-700 ease-out`}
          style={{ width: `${displayPct}%` }}
        />
      </div>
    </div>
  );
}
