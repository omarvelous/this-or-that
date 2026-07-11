import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PollDetailActions } from "@/components/poll-detail-actions";
import { ResultRow } from "@/components/result-row";
import { SharePanel } from "@/components/share-panel";
import { StatusPill } from "@/components/status-pill";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

import type { Metadata } from "next";

type Props = {
  params: Promise<{ shortId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shortId } = await params;
  const supabase = await createClient();
  const { data: poll } = await supabase
    .from("polls")
    .select("question")
    .eq("short_id", shortId)
    .single();

  return {
    title: poll ? `${poll.question} — this or that` : "Poll not found",
  };
}

export default async function MakerPollDetailPage({ params }: Props) {
  const { shortId } = await params;

  const user = await getUser();
  if (!user) {
    redirect(`/login?next=/polls/${shortId}`);
  }

  const supabase = await createClient();

  const { data: poll } = await supabase
    .from("polls")
    .select("*")
    .eq("short_id", shortId)
    .single();

  if (!poll) {
    notFound();
  }

  if (poll.creator_id !== user.id) {
    redirect(`/p/${shortId}`);
  }

  // Fetch options and votes
  const { data: options } = await supabase
    .from("options")
    .select("id, label, image_url, position")
    .eq("poll_id", poll.id)
    .order("position");

  const { data: votes } = await supabase
    .from("votes")
    .select("option_id, voter_name, created_at")
    .eq("poll_id", poll.id)
    .order("created_at", { ascending: false });

  const voteCounts: Record<string, number> = {};
  for (const v of votes ?? []) {
    voteCounts[v.option_id] = (voteCounts[v.option_id] ?? 0) + 1;
  }
  const totalVotes = votes?.length ?? 0;

  const isClosed =
    !!poll.closed_at ||
    (!!poll.closes_at && new Date(poll.closes_at) < new Date());

  const status = poll.deleted_at
    ? "deleted"
    : isClosed
      ? "closed"
      : poll.published_at
        ? "live"
        : "draft";

  // Option results
  const optionResults = (options ?? []).map((opt, i) => {
    const count = voteCounts[opt.id] ?? 0;
    return {
      ...opt,
      side: (i === 0 ? "a" : "b") as "a" | "b",
      votes: count,
      percentage: totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0,
    };
  });

  const maxVotes = Math.max(...optionResults.map((o) => o.votes), 0);

  // Recent votes (last 10)
  const recentVotes = (votes ?? []).slice(0, 10).map((v) => {
    const opt = (options ?? []).find((o) => o.id === v.option_id);
    return {
      name: v.voter_name ?? "Anonymous",
      optionLabel: opt?.label ?? "Unknown",
      optionPosition: opt?.position ?? 0,
      createdAt: v.created_at,
    };
  });

  // Votes over time — bucket by day (last 7 days)
  const dayBuckets = bucketVotesByDay(votes ?? []);
  const maxBucket = Math.max(...dayBuckets, 1);

  return (
    <div className="bg-bg min-h-screen">
      {/* Header */}
      <header className="border-line/50 bg-bg/80 sticky top-0 z-40 border-b backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[900px] items-center justify-between px-6">
          <Link
            href="/"
            className="font-display text-ink text-lg font-bold tracking-tight"
          >
            this or that
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[900px] px-6 py-10">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="text-muted hover:text-ink text-sm font-medium"
        >
          ← All polls
        </Link>

        {/* Header */}
        <div className="mt-6 flex items-center gap-3">
          <StatusPill variant={status} pulse={status === "live"} />
          <span className="text-muted-2 text-xs">
            Created {new Date(poll.created_at).toLocaleDateString()}
          </span>
        </div>

        <h1 className="font-display text-ink mt-3 text-[clamp(1.5rem,3.5vw,2.2rem)] font-bold tracking-tight">
          {poll.question}
        </h1>

        {/* Short link */}
        <div className="mt-6">
          <SharePanel shortId={shortId} />
        </div>

        {/* Results card */}
        <div className="rounded-card border-line bg-surface mt-8 border p-6">
          <h2 className="text-muted text-sm font-semibold">Results</h2>
          <div className="mt-4 space-y-6">
            {optionResults.map((opt) => (
              <ResultRow
                key={opt.id}
                side={opt.side}
                label={opt.label}
                votes={opt.votes}
                percentage={opt.percentage}
                isWinner={isClosed && opt.votes === maxVotes && maxVotes > 0}
              />
            ))}
          </div>
          <p className="text-muted-2 mt-4 text-xs">
            {totalVotes} total {totalVotes === 1 ? "vote" : "votes"}
          </p>
        </div>

        {/* 2-column panel */}
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Votes over time */}
          <div className="rounded-card border-line bg-surface border p-5">
            <h3 className="text-muted text-sm font-semibold">
              Votes over time
            </h3>
            <div className="mt-4 flex items-end gap-1.5" style={{ height: 80 }}>
              {dayBuckets.map((count, i) => {
                const height = maxBucket > 0 ? (count / maxBucket) * 100 : 0;
                const isLast = i === dayBuckets.length - 1;
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-t ${isLast ? "bg-option-a" : "bg-sand"}`}
                    style={{ height: `${Math.max(height, 4)}%` }}
                    title={`${count} votes`}
                  />
                );
              })}
            </div>
            <div className="mt-2 flex justify-between">
              <span className="text-muted-2 text-[10px]">7d ago</span>
              <span className="text-muted-2 text-[10px]">Today</span>
            </div>
          </div>

          {/* Recent votes */}
          <div className="rounded-card border-line bg-surface border p-5">
            <h3 className="text-muted text-sm font-semibold">Recent votes</h3>
            {recentVotes.length === 0 ? (
              <p className="text-muted-2 mt-4 text-xs">No votes yet.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {recentVotes.slice(0, 5).map((v, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <span className="bg-sand text-muted flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                      {v.name === "Anonymous"
                        ? "?"
                        : (v.name[0]?.toUpperCase() ?? "?")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-ink truncate text-xs font-medium">
                        {v.name}
                      </p>
                      <p className="text-muted-2 text-[10px]">
                        Voted{" "}
                        <span
                          className={
                            v.optionPosition === 0
                              ? "text-option-a"
                              : "text-option-b"
                          }
                        >
                          {v.optionLabel}
                        </span>
                        {" · "}
                        {formatRelativeTime(v.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8">
          <PollDetailActions shortId={shortId} isClosed={isClosed} />
        </div>
      </main>
    </div>
  );
}

function bucketVotesByDay(votes: Array<{ created_at: string }>): number[] {
  const buckets: number[] = Array(7).fill(0) as number[];
  const now = Date.now();
  for (const v of votes) {
    const daysAgo = Math.floor(
      (now - new Date(v.created_at).getTime()) / 86400000,
    );
    if (daysAgo >= 0 && daysAgo < 7) {
      buckets[6 - daysAgo] = (buckets[6 - daysAgo] ?? 0) + 1;
    }
  }
  return buckets;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
