import { notFound, redirect } from "next/navigation";

import { VotingUI } from "@/components/voting-ui";
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

export default async function VoterPollPage({ params }: Props) {
  const { shortId } = await params;
  const poll = await fetchPoll(shortId);

  if (!poll) {
    notFound();
  }

  if (poll.deleted_at) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <h1 className="text-xl font-bold">This poll has been removed.</h1>
      </div>
    );
  }

  if (isPollClosed(poll)) {
    redirect(`/p/${shortId}/results`);
  }

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
      <div className="px-4 pt-8 pb-4 text-center">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          {poll.question}
        </h1>
      </div>

      <VotingUI
        shortId={shortId}
        matchupId={matchup.id}
        optionA={{
          id: optionA.id,
          label: optionA.label,
          imageUrl: optionA.image_url,
        }}
        optionB={{
          id: optionB.id,
          label: optionB.label,
          imageUrl: optionB.image_url,
        }}
      />
    </div>
  );
}
