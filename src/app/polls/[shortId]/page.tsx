import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import type { Metadata, ResolvingMetadata } from "next";

type Props = {
  params: Promise<{ shortId: string }>;
};

export async function generateMetadata(
  { params }: Props,
  _parent: ResolvingMetadata,
): Promise<Metadata> {
  const { shortId } = await params;
  const poll = await fetchPoll(shortId);

  if (!poll) {
    return { title: "Poll not found" };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return {
    title: `${poll.question} — this or that`,
    description: `Vote: ${poll.options.map((o) => o.label).join(" vs ")}`,
    openGraph: {
      title: poll.question,
      description: "Tap to vote — this or that",
      images: [`${appUrl}/api/polls/${shortId}/og`],
    },
  };
}

async function fetchPoll(shortId: string) {
  const supabase = await createClient();

  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("*")
    .eq("short_id", shortId)
    .single();

  if (pollError || !poll) return null;

  const { data: options } = await supabase
    .from("options")
    .select("*")
    .eq("poll_id", poll.id)
    .order("position");

  const { data: matchups } = await supabase
    .from("matchups")
    .select("*")
    .eq("poll_id", poll.id)
    .order("round");

  return {
    ...poll,
    options: options ?? [],
    matchups: matchups ?? [],
  };
}

function isPollClosed(poll: {
  closed_at: string | null;
  closes_at: string | null;
}) {
  if (poll.closed_at) return true;
  if (poll.closes_at && new Date(poll.closes_at) < new Date()) return true;
  return false;
}

export default async function PollPage({ params }: Props) {
  const { shortId } = await params;
  const poll = await fetchPoll(shortId);

  if (!poll) {
    notFound();
  }

  // Soft-deleted polls show a removed message.
  if (poll.deleted_at) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <h1 className="text-xl font-bold">This poll has been removed.</h1>
      </div>
    );
  }

  // Closed or expired polls redirect to results.
  if (isPollClosed(poll)) {
    redirect(`/polls/${shortId}/results`);
  }

  // Active matchup (MVP: always round 1, the only matchup).
  const matchup = poll.matchups[0];
  if (!matchup) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <h1 className="text-xl font-bold">This poll is not available.</h1>
      </div>
    );
  }

  const optionA = poll.options.find((o) => o.id === matchup.option_a_id);
  const optionB = poll.options.find((o) => o.id === matchup.option_b_id);

  if (!optionA || !optionB) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <h1 className="text-xl font-bold">This poll is not available.</h1>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Question header */}
      <div className="px-4 pt-8 pb-4 text-center">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          {poll.question}
        </h1>
      </div>

      {/* Voting UI — client component rendered in Step 21 */}
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 pb-8">
        <p className="text-text-muted text-sm">Tap an option to vote</p>
        <pre className="text-text-secondary text-xs">
          {JSON.stringify(
            {
              shortId,
              matchupId: matchup.id,
              optionA: { id: optionA.id, label: optionA.label },
              optionB: { id: optionB.id, label: optionB.label },
            },
            null,
            2,
          )}
        </pre>
      </div>
    </div>
  );
}
