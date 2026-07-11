import Link from "next/link";

import { StatusPill } from "@/components/status-pill";

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

interface PollCardProps {
  poll: PollWithDetails;
}

function getStatus(poll: Tables<"polls">) {
  if (poll.deleted_at) return "deleted" as const;
  if (poll.closed_at) return "closed" as const;
  if (poll.closes_at && new Date(poll.closes_at) < new Date())
    return "expired" as const;
  if (poll.published_at) return "live" as const;
  return "draft" as const;
}

function formatAge(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function PollCard({ poll }: PollCardProps) {
  const status = getStatus(poll);
  const sorted = [...poll.options].sort((a, b) => a.position - b.position);

  return (
    <Link
      href={`/polls/${poll.short_id}`}
      className="rounded-card border-line bg-surface hover:shadow-card-float block border p-5 transition-all hover:-translate-y-0.5"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <StatusPill
          variant={status === "expired" ? "closed" : status}
          pulse={status === "live"}
        />
        <span className="text-muted-2 text-xs">
          {formatAge(poll.created_at)}
        </span>
      </div>

      {/* Question */}
      <h3 className="font-display text-ink mt-3 text-base leading-snug font-bold">
        {poll.question}
      </h3>

      {/* Mini results */}
      <div className="mt-4 space-y-2">
        {sorted.map((opt, i) => {
          const barColor = i === 0 ? "bg-option-a" : "bg-option-b";
          return (
            <div key={opt.id} className="flex items-center gap-2">
              <span className="text-body w-24 truncate text-xs font-medium">
                {opt.label ?? "Option"}
              </span>
              <div className="rounded-pill bg-sand h-2 flex-1 overflow-hidden">
                <div
                  className={`${barColor} rounded-pill h-full`}
                  style={{ width: `${opt.percentage}%` }}
                />
              </div>
              <span className="text-muted w-8 text-right text-xs tabular-nums">
                {opt.percentage}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="border-line mt-4 flex items-center justify-between border-t pt-3">
        <span className="text-muted text-xs">
          {poll.vote_count} {poll.vote_count === 1 ? "vote" : "votes"}
        </span>
        <span className="text-option-a text-xs font-medium">View →</span>
      </div>
    </Link>
  );
}
