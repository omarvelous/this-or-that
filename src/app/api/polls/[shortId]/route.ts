import { NextResponse, type NextRequest } from "next/server";

import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

import type { TablesUpdate } from "@/types/database";

// PATCH — update poll metadata (question, closes_at).
// Content edits (question) are only allowed if no votes have been cast.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ shortId: string }> },
) {
  const { shortId } = await params;

  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  // Verify ownership
  const { data: poll } = await supabase
    .from("polls")
    .select("id, creator_id")
    .eq("short_id", shortId)
    .single();

  if (!poll) {
    return NextResponse.json({ error: "Poll not found" }, { status: 404 });
  }

  if (poll.creator_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    question?: string;
    closesAt?: string | null;
    closedAt?: string | null;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // If editing the question, verify no votes exist.
  if (body.question !== undefined) {
    const { count } = await supabase
      .from("votes")
      .select("id", { count: "exact", head: true })
      .eq("poll_id", poll.id);

    if (count && count > 0) {
      return NextResponse.json(
        { error: "Cannot edit question after votes have been cast" },
        { status: 422 },
      );
    }
  }

  const updates: TablesUpdate<"polls"> = {};
  if (body.question !== undefined) updates.question = body.question.trim();
  if (body.closesAt !== undefined) updates.closes_at = body.closesAt;
  if (body.closedAt !== undefined) updates.closed_at = body.closedAt;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 422 });
  }

  const { error } = await supabase
    .from("polls")
    .update(updates)
    .eq("id", poll.id);

  if (error) {
    console.error("poll update error", error);
    return NextResponse.json(
      { error: "Failed to update poll" },
      { status: 500 },
    );
  }

  return NextResponse.json({ updated: true });
}

// DELETE — soft-delete (set deleted_at = now).
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ shortId: string }> },
) {
  const { shortId } = await params;

  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  const { data: poll } = await supabase
    .from("polls")
    .select("id, creator_id")
    .eq("short_id", shortId)
    .single();

  if (!poll) {
    return NextResponse.json({ error: "Poll not found" }, { status: 404 });
  }

  if (poll.creator_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from("polls")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", poll.id);

  if (error) {
    console.error("poll soft-delete error", error);
    return NextResponse.json(
      { error: "Failed to delete poll" },
      { status: 500 },
    );
  }

  return NextResponse.json({ deleted: true });
}
