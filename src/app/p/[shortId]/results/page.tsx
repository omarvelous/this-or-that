import { notFound } from "next/navigation";

import { ResultsView } from "@/components/results-view";
import { SharePanel } from "@/components/share-panel";
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 px-4 py-12">
      <ResultsView shortId={shortId} initialData={data} />
      <SharePanel shortId={shortId} />
    </div>
  );
}
