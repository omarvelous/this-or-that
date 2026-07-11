import Link from "next/link";
import { redirect } from "next/navigation";

import { DashboardContent } from "@/components/dashboard-content";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your polls — this or that",
};

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const supabase = await createClient();

  // Fetch the user's polls, excluding soft-deleted ones.
  const { data: polls } = await supabase
    .from("polls")
    .select("*")
    .eq("creator_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // Fetch options for all polls
  const pollIds = (polls ?? []).map((p) => p.id);
  const optionsByPoll: Record<
    string,
    Array<{ id: string; label: string | null; position: number }>
  > = {};
  const voteCounts: Record<string, number> = {};
  const votesByOption: Record<string, Record<string, number>> = {};

  if (pollIds.length > 0) {
    const { data: options } = await supabase
      .from("options")
      .select("id, poll_id, label, position")
      .in("poll_id", pollIds)
      .order("position");

    for (const opt of options ?? []) {
      if (!optionsByPoll[opt.poll_id]) optionsByPoll[opt.poll_id] = [];
      optionsByPoll[opt.poll_id]!.push(opt);
    }

    const { data: votes } = await supabase
      .from("votes")
      .select("poll_id, option_id")
      .in("poll_id", pollIds);

    for (const v of votes ?? []) {
      voteCounts[v.poll_id] = (voteCounts[v.poll_id] ?? 0) + 1;
      if (!votesByOption[v.poll_id]) votesByOption[v.poll_id] = {};
      votesByOption[v.poll_id]![v.option_id] =
        (votesByOption[v.poll_id]![v.option_id] ?? 0) + 1;
    }
  }

  const pollsWithDetails = (polls ?? []).map((p) => {
    const totalVotes = voteCounts[p.id] ?? 0;
    const pollOptions = (optionsByPoll[p.id] ?? []).map((opt) => {
      const optVotes = votesByOption[p.id]?.[opt.id] ?? 0;
      return {
        ...opt,
        votes: optVotes,
        percentage:
          totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0,
      };
    });
    return { ...p, vote_count: totalVotes, options: pollOptions };
  });

  // Compute stats
  const totalPolls = pollsWithDetails.length;
  const activePolls = pollsWithDetails.filter(
    (p) =>
      p.published_at &&
      !p.closed_at &&
      (!p.closes_at || new Date(p.closes_at) >= new Date()),
  ).length;
  const totalVotes = Object.values(voteCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-bg min-h-screen">
      {/* Header */}
      <header className="border-line/50 bg-bg/80 sticky top-0 z-40 border-b backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1100px] items-center justify-between px-6">
          <Link
            href="/"
            className="font-display text-ink text-lg font-bold tracking-tight"
          >
            this or that
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/polls/new"
              className="rounded-input bg-option-a hover:bg-option-a-hover px-4 py-2 text-sm font-semibold text-white transition-colors"
            >
              ＋ New poll
            </Link>
            <span className="bg-sand text-muted flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold">
              {user.email?.[0]?.toUpperCase() ?? "?"}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-6 py-10">
        {/* Title */}
        <h1 className="font-display text-ink text-2xl font-bold tracking-tight">
          Your polls
        </h1>
        <p className="text-body mt-1 text-sm">
          Manage your polls, view results, and share links.
        </p>

        {/* Stat cards */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-card border-line bg-surface border p-4">
            <p className="font-display text-ink text-2xl font-bold tabular-nums">
              {totalPolls}
            </p>
            <p className="text-muted mt-0.5 text-xs">Total polls</p>
          </div>
          <div className="rounded-card border-line bg-surface border p-4">
            <p className="font-display text-option-b text-2xl font-bold tabular-nums">
              {activePolls}
            </p>
            <p className="text-muted mt-0.5 text-xs">Active</p>
          </div>
          <div className="rounded-card border-line bg-surface border p-4">
            <p className="font-display text-ink text-2xl font-bold tabular-nums">
              {totalVotes}
            </p>
            <p className="text-muted mt-0.5 text-xs">Votes collected</p>
          </div>
        </div>

        {/* Filterable poll grid (client component for filter state) */}
        <div className="mt-8">
          <DashboardContent polls={pollsWithDetails} />
        </div>
      </main>
    </div>
  );
}
