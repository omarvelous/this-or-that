import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { VoterVoteUI } from "@/components/voter-vote-ui";
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

  // Fetch creator name
  const { data: creator } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", poll.creator_id)
    .single();

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

  // Get total vote count
  const { count } = await supabase
    .from("votes")
    .select("id", { count: "exact", head: true })
    .eq("poll_id", poll.id);

  return {
    ...poll,
    options: options ?? [],
    matchups: matchups ?? [],
    voteCount: count ?? 0,
    makerName: creator?.display_name ?? null,
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
        <h1 className="font-display text-ink text-xl font-bold">
          This poll has been removed.
        </h1>
      </div>
    );
  }

  if (isPollClosed(poll)) {
    redirect(`/p/${shortId}/results`);
  }

  const matchup = poll.matchups[0];
  const optionA = matchup
    ? poll.options.find((o) => o.id === matchup.option_a_id)
    : null;
  const optionB = matchup
    ? poll.options.find((o) => o.id === matchup.option_b_id)
    : null;

  if (!matchup || !optionA || !optionB) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <h1 className="font-display text-ink text-xl font-bold">
          This poll is not available.
        </h1>
      </div>
    );
  }

  return (
    <div className="bg-bg flex min-h-screen flex-col">
      {/* Minimal top bar */}
      <header className="flex items-center justify-center px-6 py-4">
        <Link href="/" className="font-display text-ink text-sm font-bold">
          this or that
        </Link>
        <span className="text-line mx-3">·</span>
        <Link
          href="/polls/new"
          className="text-option-a hover:text-option-a-hover text-xs font-medium"
        >
          Create your own →
        </Link>
      </header>

      {/* Main content */}
      <main className="mx-auto flex w-full max-w-[1000px] flex-1 flex-col px-6 pb-8">
        {/* Attribution */}
        {poll.makerName && (
          <div className="flex items-center justify-center gap-2 py-2">
            <span className="bg-sand text-muted flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold">
              {poll.makerName[0]?.toUpperCase() ?? "?"}
            </span>
            <span className="text-muted text-xs">
              <span className="text-ink font-semibold">{poll.makerName}</span>{" "}
              asked
            </span>
          </div>
        )}

        {/* Question */}
        <h1 className="font-display text-ink mt-4 text-center text-[clamp(1.6rem,4.5vw,2.8rem)] leading-[1.1] font-bold tracking-tight">
          {poll.question}
        </h1>

        {/* Live count */}
        <p className="text-muted mt-3 flex items-center justify-center gap-2 text-sm">
          <span className="relative flex h-2 w-2">
            <span className="bg-option-b absolute inline-flex h-full w-full animate-ping rounded-full opacity-50" />
            <span className="bg-option-b relative inline-flex h-2 w-2 rounded-full" />
          </span>
          {poll.voteCount} {poll.voteCount === 1 ? "vote" : "votes"} · tap to
          add yours
        </p>

        {/* Voting panels */}
        <div className="mt-8 flex-1">
          <VoterVoteUI
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

        {/* Caption */}
        <p className="text-muted-2 mt-6 text-center text-xs">
          One tap to vote — completely anonymous, no sign-up.
        </p>
      </main>
    </div>
  );
}
