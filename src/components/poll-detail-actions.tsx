"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface PollDetailActionsProps {
  shortId: string;
  isClosed: boolean;
}

export function PollDetailActions({
  shortId,
  isClosed,
}: PollDetailActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggleClose() {
    setLoading(true);
    await fetch(`/api/polls/${shortId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        closedAt: isClosed ? null : new Date().toISOString(),
      }),
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <Link
        href={`/p/${shortId}`}
        className="rounded-input bg-dark-panel py-3.5 text-center text-sm font-semibold text-white transition-colors hover:opacity-90"
      >
        Open voter link →
      </Link>
      <button
        onClick={handleToggleClose}
        disabled={loading}
        className="rounded-input border-line text-ink hover:bg-bg-subtle border py-3.5 text-sm font-semibold transition-colors disabled:opacity-50"
      >
        {loading ? "Updating…" : isClosed ? "Reopen poll" : "Close poll"}
      </button>
      <Link
        href="/dashboard"
        className="rounded-input border-line text-ink hover:bg-bg-subtle border py-3.5 text-center text-sm font-semibold transition-colors"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
