import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

import type { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ shortId: string }> },
) {
  const { shortId } = await params;
  const supabase = createAdminClient();

  // 1. Look up the poll
  const { data: poll } = await supabase
    .from("polls")
    .select("id, question, closed_at, closes_at, deleted_at")
    .eq("short_id", shortId)
    .single();

  if (!poll || poll.deleted_at) {
    return NextResponse.json({ error: "Poll not found" }, { status: 404 });
  }

  // 2. Get options
  const { data: options } = await supabase
    .from("options")
    .select("id, label, image_url, position")
    .eq("poll_id", poll.id)
    .order("position");

  // 3. Count votes per option
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

  const results = (options ?? []).map((opt) => {
    const count = voteCounts[opt.id] ?? 0;
    return {
      id: opt.id,
      label: opt.label,
      imageUrl: opt.image_url,
      position: opt.position,
      votes: count,
      percentage: totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0,
    };
  });

  return NextResponse.json({
    question: poll.question,
    options: results,
    totalVotes,
    isClosed,
  });
}
