import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { SharePanel } from "@/components/share-panel";
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

  // Non-creator gets redirected to the voter view
  if (poll.creator_id !== user.id) {
    redirect(`/p/${shortId}`);
  }

  // Fetch options and vote counts
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

  const statusColor =
    status === "live"
      ? "bg-success-bg text-success-ink"
      : status === "closed"
        ? "bg-sand text-muted"
        : "bg-option-a-tint text-option-a";

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

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-12">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="text-muted hover:text-ink mb-6 inline-block text-sm font-medium"
      >
        ← All polls
      </Link>

      {/* Header */}
      <div className="mb-8 space-y-3">
        <div className="flex items-center gap-3">
          <span
            className={`rounded-pill px-3 py-1 text-xs font-semibold capitalize ${statusColor}`}
          >
            {status}
          </span>
          <span className="text-muted-2 text-xs">
            Created {new Date(poll.created_at).toLocaleDateString()}
          </span>
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          {poll.question}
        </h1>
      </div>

      {/* Short link */}
      <SharePanel shortId={shortId} />

      {/* Results */}
      <div className="mt-8 space-y-4">
        <h2 className="text-muted text-sm font-semibold">Results</h2>
        {(options ?? []).map((opt, i) => {
          const count = voteCounts[opt.id] ?? 0;
          const pct =
            totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const barColor = i === 0 ? "bg-option-a" : "bg-option-b";

          return (
            <div key={opt.id} className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold">{opt.label}</span>
                <span className="text-body text-sm tabular-nums">
                  {pct}% ({count})
                </span>
              </div>
              <div className="rounded-pill bg-sand h-3 overflow-hidden">
                <div
                  className={`${barColor} rounded-pill h-full transition-all duration-700 ease-out`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
        <p className="text-muted-2 text-xs">{totalVotes} total votes</p>
      </div>

      {/* Recent votes */}
      {recentVotes.length > 0 && (
        <div className="mt-8 space-y-3">
          <h2 className="text-muted text-sm font-semibold">Recent votes</h2>
          <div className="space-y-2">
            {recentVotes.map((v, i) => (
              <div
                key={i}
                className="rounded-card border-line flex items-center gap-3 border px-4 py-3"
              >
                <span className="bg-sand text-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                  {v.name[0]?.toUpperCase() ?? "?"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{v.name}</p>
                  <p className="text-muted-2 text-xs">
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
        </div>
      )}

      {/* Actions */}
      <div className="mt-10 flex flex-col gap-3">
        <Link
          href={`/p/${shortId}`}
          className="rounded-card bg-dark-panel py-3 text-center text-sm font-medium text-white transition-colors hover:opacity-90"
        >
          Open voter link →
        </Link>
        <Link
          href="/dashboard"
          className="rounded-card border-line text-ink hover:bg-bg-subtle border py-3 text-center text-sm font-medium transition-colors"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
