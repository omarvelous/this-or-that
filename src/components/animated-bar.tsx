"use client";

import { useEffect, useState } from "react";

interface AnimatedBarProps {
  percentage: number;
  votes: number;
  label: string | null;
  side: "a" | "b";
  isWinner: boolean;
}

export function AnimatedBar({
  percentage,
  votes,
  label,
  side,
  isWinner,
}: AnimatedBarProps) {
  const [width, setWidth] = useState(0);

  // Animate from 0 to target on mount / update.
  useEffect(() => {
    const timer = setTimeout(() => setWidth(percentage), 50);
    return () => clearTimeout(timer);
  }, [percentage]);

  const bgColor = side === "a" ? "bg-option-a" : "bg-option-b";

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold">
          {label ?? "Option"}
          {isWinner && (
            <span className="text-success ml-2 text-xs font-bold tracking-wide uppercase">
              Winner
            </span>
          )}
        </span>
        <span className="text-text-secondary text-sm tabular-nums">
          {percentage}% ({votes})
        </span>
      </div>
      <div className="bg-bg-muted h-10 overflow-hidden rounded-lg">
        <div
          className={`${bgColor} flex h-full items-center rounded-lg transition-all duration-700 ease-out`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
