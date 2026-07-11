import Link from "next/link";
import { notFound } from "next/navigation";

import { ResultRow } from "@/components/result-row";
import { StatusPill } from "@/components/status-pill";
import { VoterResultsLive } from "@/components/voter-results-live";
import { createClient } from "@/lib/supabase/server";

import type { Metadata } from "next";

type Props = {
  params: Promise<{ shortId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shortId } = await params;
  const data = await fetchResults(shortId);

  if (!data) {
    return { title: "Results not found" };
  }

  return {
    title: `Results: ${data.question} — this or that`,
    description: `${data.totalVotes} votes — see who's winning`,
  };
}

async function fetchResults(shortId: string) {
  const supabase = await createClient();

  const { data: poll } = await supabase
    .from("polls")
    .select("id, question, closed_at, closes_at, deleted_at")
    .eq("short_id", shortId)
    .single();

  if (!poll || poll.deleted_at) return null;

  const { data: options } = await supabase
    .from("options")
    .select("id, label, image_url, position")
    .eq("poll_id", poll.id)
    .order("position");

  const { data: votes } = await supabase
    .from("votes")
    .select("option_id")
    .eq("poll_id", poll.id);

  const voteCounts: Record<string, number> = {};
  for (const v of votes ?? []) {
    voteCounts[v.option_id] = (voteCounts[v.option_id] ?? 0) + 1;
  }

  const totalVotes = votes?.length ?? 0;
  const isClosed =
    !!poll.closed_at ||
    (!!poll.closes_at && new Date(poll.closes_at) < new Date());

  return {
    question: poll.question,
    options: (options ?? []).map((opt) => {
      const count = voteCounts[opt.id] ?? 0;
      return {
        id: opt.id,
        label: opt.label,
        imageUrl: opt.image_url,
        position: opt.position,
        votes: count,
        percentage: totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0,
      };
    }),
    totalVotes,
    isClosed,
  };
}

export default async function VoterResultsPage({ params }: Props) {
  const { shortId } = await params;
  const data = await fetchResults(shortId);

  if (!data) {
    notFound();
  }

  const sorted = [...data.options].sort((a, b) => a.position - b.position);
  const maxVotes = Math.max(...data.options.map((o) => o.votes), 0);

  return (
    <div className="bg-bg flex min-h-screen flex-col">
      {/* Minimal header */}
      <header className="flex items-center justify-center px-6 py-4">
        <Link href="/" className="font-display text-ink text-sm font-bold">
          this or that
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-[560px] flex-1 flex-col px-6 pb-12">
        {/* Status */}
        <div className="flex justify-center">
          {data.isClosed ? (
            <StatusPill variant="closed" label="Voting closed" />
          ) : (
            <StatusPill
              variant="live"
              label={`Live · ${data.totalVotes} ${data.totalVotes === 1 ? "vote" : "votes"}`}
              pulse
            />
          )}
        </div>

        {/* Question */}
        <h1 className="font-display text-ink mt-6 text-center text-[clamp(1.4rem,4vw,2rem)] leading-tight font-bold tracking-tight">
          {data.question}
        </h1>

        {/* Result rows */}
        <div className="mt-8 space-y-6">
          {sorted.map((opt, i) => (
            <ResultRow
              key={opt.id}
              side={i === 0 ? "a" : "b"}
              label={opt.label}
              votes={opt.votes}
              percentage={opt.percentage}
              isWinner={data.isClosed && opt.votes === maxVotes && maxVotes > 0}
            />
          ))}
        </div>

        {/* Live polling (client component) */}
        {!data.isClosed && <VoterResultsLive shortId={shortId} />}

        {/* Note */}
        <p className="text-muted-2 mt-6 text-center text-xs">
          {data.isClosed
            ? "This poll is closed. Final results are shown above."
            : "Results update live every few seconds."}
        </p>

        {/* CTA */}
        <div className="mt-10">
          <Link
            href="/polls/new"
            className="rounded-input bg-option-a shadow-cta-glow hover:bg-option-a-hover block py-3.5 text-center text-sm font-bold text-white transition-all hover:-translate-y-0.5"
          >
            Create your own poll →
          </Link>
        </div>
      </main>
    </div>
  );
}
