import { NextResponse } from "next/server";

import { getUser } from "@/lib/auth";
import { generateShortId } from "@/lib/nanoid";
import { createClient } from "@/lib/supabase/server";

import type { TablesInsert } from "@/types/database";

interface CreatePollBody {
  question: string;
  options: Array<{ label?: string; imageUrl?: string }>;
}

export async function POST(request: Request) {
  // 1. Auth check
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse + validate body
  let body: CreatePollBody;
  try {
    body = (await request.json()) as CreatePollBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { question, options } = body;

  if (!question?.trim()) {
    return NextResponse.json(
      { error: "Question is required" },
      { status: 422 },
    );
  }

  if (!Array.isArray(options) || options.length !== 2) {
    return NextResponse.json(
      { error: "Exactly 2 options are required" },
      { status: 422 },
    );
  }

  for (const opt of options) {
    if (!opt.label?.trim() && !opt.imageUrl?.trim()) {
      return NextResponse.json(
        { error: "Each option must have a label or image" },
        { status: 422 },
      );
    }
  }

  const supabase = await createClient();
  const shortId = generateShortId();
  const now = new Date();
  const closesAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // +3 days

  // 3. Insert poll
  const pollInsert: TablesInsert<"polls"> = {
    short_id: shortId,
    creator_id: user.id,
    question: question.trim(),
    published_at: now.toISOString(),
    closes_at: closesAt.toISOString(),
  };

  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .insert(pollInsert)
    .select("id")
    .single();

  if (pollError || !poll) {
    console.error("poll insert error", pollError);
    return NextResponse.json(
      { error: "Failed to create poll" },
      { status: 500 },
    );
  }

  // 4. Insert options
  const optionInserts: TablesInsert<"options">[] = options.map((opt, i) => ({
    poll_id: poll.id,
    label: opt.label?.trim() ?? null,
    image_url: opt.imageUrl?.trim() ?? null,
    position: i,
  }));

  const { data: insertedOptions, error: optionsError } = await supabase
    .from("options")
    .insert(optionInserts)
    .select("id, position");

  if (optionsError || !insertedOptions || insertedOptions.length !== 2) {
    console.error("options insert error", optionsError);
    return NextResponse.json(
      { error: "Failed to create options" },
      { status: 500 },
    );
  }

  // Sort by position so option A and B are deterministic
  const sorted = [...insertedOptions].sort((a, b) => a.position - b.position);
  const optionA = sorted[0];
  const optionB = sorted[1];

  if (!optionA || !optionB) {
    return NextResponse.json(
      { error: "Failed to resolve options" },
      { status: 500 },
    );
  }

  // 5. Insert the single matchup (MVP: 2 options = 1 matchup, round 1)
  const { error: matchupError } = await supabase.from("matchups").insert({
    poll_id: poll.id,
    round: 1,
    option_a_id: optionA.id,
    option_b_id: optionB.id,
  });

  if (matchupError) {
    console.error("matchup insert error", matchupError);
    return NextResponse.json(
      { error: "Failed to create matchup" },
      { status: 500 },
    );
  }

  return NextResponse.json({ shortId }, { status: 201 });
}
