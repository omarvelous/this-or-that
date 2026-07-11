"use client";

import Link from "next/link";
import { useState } from "react";

import { PollCard } from "@/components/poll-card";

import type { Tables } from "@/types/database";

type PollWithDetails = Tables<"polls"> & {
  vote_count: number;
  options: Array<{
    id: string;
    label: string | null;
    position: number;
    votes: number;
    percentage: number;
  }>;
};

type Filter = "all" | "active" | "closed";

interface DashboardContentProps {
  polls: PollWithDetails[];
}

function isPollActive(poll: Tables<"polls">) {
  if (poll.closed_at) return false;
  if (poll.closes_at && new Date(poll.closes_at) < new Date()) return false;
  return !!poll.published_at;
}

export function DashboardContent({ polls }: DashboardContentProps) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = polls.filter((poll) => {
    if (filter === "all") return true;
    if (filter === "active") return isPollActive(poll);
    return !isPollActive(poll);
  });

  return (
    <div>
      {/* Segmented filter */}
      <div className="rounded-pill bg-sand inline-flex p-1">
        {(["all", "active", "closed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-pill px-5 py-2 text-xs font-semibold capitalize transition-colors ${
              filter === f
                ? "bg-surface text-ink shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Poll grid */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-body">Nothing here yet.</p>
          <Link
            href="/polls/new"
            className="text-option-a hover:text-option-a-hover mt-3 inline-block text-sm font-semibold"
          >
            Create your first poll →
          </Link>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((poll) => (
            <PollCard key={poll.id} poll={poll} />
          ))}
        </div>
      )}
    </div>
  );
}
