import Link from "next/link";
import { redirect } from "next/navigation";

import { PollList } from "@/components/poll-list";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

import type { Tables } from "@/types/database";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — this or that",
};

type PollWithCounts = Tables<"polls"> & { vote_count: number };

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

  // Get vote counts for all polls in one query.
  const pollIds = (polls ?? []).map((p) => p.id);
  const voteCounts: Record<string, number> = {};

  if (pollIds.length > 0) {
    const { data: votes } = await supabase
      .from("votes")
      .select("poll_id")
      .in("poll_id", pollIds);

    for (const v of votes ?? []) {
      voteCounts[v.poll_id] = (voteCounts[v.poll_id] ?? 0) + 1;
    }
  }

  const pollsWithCounts: PollWithCounts[] = (polls ?? []).map((p) => ({
    ...p,
    vote_count: voteCounts[p.id] ?? 0,
  }));

  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Your polls</h1>
        <Link
          href="/polls/new"
          className="bg-primary text-text-inverse hover:bg-primary-hover rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        >
          New poll
        </Link>
      </div>

      <div className="mt-6">
        <PollList polls={pollsWithCounts} />
      </div>
    </div>
  );
}
