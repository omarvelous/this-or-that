import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

const isDev = process.env.NODE_ENV === "development";

/**
 * Build the composite fingerprint used for vote dedup.
 * In production: SHA-256(visitorId + IP + shortId) — ties the vote to
 * both the device and the network.
 * In development: SHA-256(visitorId + shortId) — skips IP so different
 * browsers/incognito windows can vote independently on localhost.
 */
async function buildCompositeFingerprint(
  visitorFingerprint: string,
  shortId: string,
  request: NextRequest,
): Promise<string> {
  let raw = `${visitorFingerprint}:${shortId}`;

  if (!isDev) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";
    raw = `${visitorFingerprint}:${ip}:${shortId}`;
  }

  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(raw));
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

interface VoteBody {
  optionId: string;
  matchupId: string;
  fingerprint: string;
  voterName?: string;
  voterEmail?: string;
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

  const { optionId, matchupId, fingerprint, voterName, voterEmail } = body;

  if (!optionId || !matchupId || !fingerprint) {
    return NextResponse.json(
      { error: "optionId, matchupId, and fingerprint are required" },
      { status: 422 },
    );
  }

  // 2. Build composite fingerprint for dedup
  const compositeFingerprint = await buildCompositeFingerprint(
    fingerprint,
    shortId,
    request,
  );

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
    voter_name: voterName?.trim() || null,
    voter_email: voterEmail?.trim() || null,
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
      fingerprint: compositeFingerprint,
      counts,
      totalVotes: voteCounts?.length ?? 0,
    },
    { status: 201 },
  );
}

// PATCH — update voter_name on an existing vote (post-vote name prompt).
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ shortId: string }> },
) {
  const { shortId } = await params;

  let body: { fingerprint: string; voterName: string };
  try {
    body = (await request.json()) as { fingerprint: string; voterName: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.fingerprint || !body.voterName?.trim()) {
    return NextResponse.json(
      { error: "fingerprint and voterName are required" },
      { status: 422 },
    );
  }

  const supabase = createAdminClient();

  // Look up the poll to get its ID.
  const { data: poll } = await supabase
    .from("polls")
    .select("id")
    .eq("short_id", shortId)
    .single();

  if (!poll) {
    return NextResponse.json({ error: "Poll not found" }, { status: 404 });
  }

  // Build the same composite fingerprint the POST handler used.
  const compositeFingerprint = await buildCompositeFingerprint(
    body.fingerprint,
    shortId,
    request,
  );

  // Update voter_name on the matching vote.
  const { error } = await supabase
    .from("votes")
    .update({ voter_name: body.voterName.trim() })
    .eq("poll_id", poll.id)
    .eq("fingerprint", compositeFingerprint);

  if (error) {
    console.error("voter_name update error", error);
    return NextResponse.json(
      { error: "Failed to update name" },
      { status: 500 },
    );
  }

  return NextResponse.json({ updated: true });
}
