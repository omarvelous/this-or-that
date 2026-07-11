import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

interface VoteBody {
  optionId: string;
  matchupId: string;
  fingerprint: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shortId: string }> },
) {
  const { shortId } = await params;

  // 1. Parse body
  let body: VoteBody;
  try {
    body = (await request.json()) as VoteBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { optionId, matchupId, fingerprint } = body;

  if (!optionId || !matchupId || !fingerprint) {
    return NextResponse.json(
      { error: "optionId, matchupId, and fingerprint are required" },
      { status: 422 },
    );
  }

  // 2. Build composite fingerprint: hash(visitorId + hashedIP + pollShortId)
  // The client sends the FingerprintJS visitorId. We mix in the IP server-side
  // so it can't be spoofed from the browser.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const encoder = new TextEncoder();
  const data = encoder.encode(`${fingerprint}:${ip}:${shortId}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const compositeFingerprint = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Use the admin client to bypass RLS — the vote insert policy is open,
  // but we need to read the poll state without an auth session.
  const supabase = createAdminClient();

  // 3. Validate poll exists, is published, and is not closed/expired
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("id, deleted_at, closed_at, closes_at, published_at")
    .eq("short_id", shortId)
    .single();

  if (pollError || !poll) {
    return NextResponse.json({ error: "Poll not found" }, { status: 404 });
  }

  if (poll.deleted_at) {
    return NextResponse.json(
      { error: "This poll has been removed" },
      { status: 410 },
    );
  }

  if (!poll.published_at) {
    return NextResponse.json(
      { error: "This poll is not yet published" },
      { status: 403 },
    );
  }

  if (poll.closed_at) {
    return NextResponse.json({ error: "This poll is closed" }, { status: 403 });
  }

  if (poll.closes_at && new Date(poll.closes_at) < new Date()) {
    return NextResponse.json(
      { error: "This poll has expired" },
      { status: 403 },
    );
  }

  // 4. Validate matchup and option belong to this poll
  const { data: matchup } = await supabase
    .from("matchups")
    .select("id, option_a_id, option_b_id")
    .eq("id", matchupId)
    .eq("poll_id", poll.id)
    .single();

  if (!matchup) {
    return NextResponse.json({ error: "Invalid matchup" }, { status: 422 });
  }

  if (optionId !== matchup.option_a_id && optionId !== matchup.option_b_id) {
    return NextResponse.json(
      { error: "Option does not belong to this matchup" },
      { status: 422 },
    );
  }

  // 5. Insert vote — the UNIQUE(matchup_id, fingerprint) constraint
  // handles dedup at the DB level.
  const { error: voteError } = await supabase.from("votes").insert({
    poll_id: poll.id,
    option_id: optionId,
    matchup_id: matchupId,
    fingerprint: compositeFingerprint,
  });

  if (voteError) {
    // Unique constraint violation = duplicate vote
    if (voteError.code === "23505") {
      return NextResponse.json(
        { error: "You have already voted on this poll" },
        { status: 409 },
      );
    }

    console.error("vote insert error", voteError);
    return NextResponse.json({ error: "Failed to cast vote" }, { status: 500 });
  }

  // 6. Return updated vote counts for this matchup
  const { data: voteCounts } = await supabase
    .from("votes")
    .select("option_id")
    .eq("matchup_id", matchupId);

  const counts: Record<string, number> = {};
  for (const v of voteCounts ?? []) {
    counts[v.option_id] = (counts[v.option_id] ?? 0) + 1;
  }

  return NextResponse.json(
    {
      voted: true,
      counts,
      totalVotes: voteCounts?.length ?? 0,
    },
    { status: 201 },
  );
}
