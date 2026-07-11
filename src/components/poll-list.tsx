"use client";

import Link from "next/link";

import type { Tables } from "@/types/database";

type PollWithCounts = Tables<"polls"> & { vote_count: number };

interface PollListProps {
  polls: PollWithCounts[];
}

function getPollStatus(poll: PollWithCounts) {
  if (poll.deleted_at) return "deleted";
  if (poll.closed_at) return "closed";
  if (poll.closes_at && new Date(poll.closes_at) < new Date()) return "expired";
  if (poll.published_at) return "live";
  return "draft";
}

const STATUS_STYLES: Record<string, string> = {
  live: "bg-success/10 text-success",
  closed: "bg-text-muted/10 text-text-muted",
  expired: "bg-text-muted/10 text-text-muted",
  draft: "bg-primary/10 text-primary",
  deleted: "bg-error/10 text-error",
};

export function PollList({ polls }: PollListProps) {
  if (polls.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-text-secondary">No polls yet.</p>
        <Link
          href="/polls/new"
          className="text-primary hover:text-primary-hover mt-3 inline-block text-sm font-medium"
        >
          Create your first poll
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {polls.map((poll) => {
        const status = getPollStatus(poll);

        return (
          <Link
            key={poll.id}
            href={`/polls/${poll.short_id}/results`}
            className="border-border hover:bg-bg-subtle block rounded-xl border p-4 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold">
                  {poll.question}
                </h3>
                <p className="text-text-muted mt-1 text-xs">
                  {poll.vote_count} {poll.vote_count === 1 ? "vote" : "votes"}
                  {" · "}
                  {new Date(poll.created_at).toLocaleDateString()}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[status] ?? ""}`}
              >
                {status}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
