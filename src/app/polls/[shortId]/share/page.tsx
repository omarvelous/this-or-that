import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { SharePanel } from "@/components/share-panel";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

import type { Metadata } from "next";

type Props = {
  params: Promise<{ shortId: string }>;
};

export const metadata: Metadata = {
  title: "Your poll is live — this or that",
};

export default async function SharePage({ params }: Props) {
  const { shortId } = await params;

  const user = await getUser();
  if (!user) {
    redirect(`/login?next=/polls/${shortId}/share`);
  }

  const supabase = await createClient();
  const { data: poll } = await supabase
    .from("polls")
    .select("id, question, creator_id, short_id")
    .eq("short_id", shortId)
    .single();

  if (!poll) {
    notFound();
  }

  // Only the creator can see the share screen
  if (poll.creator_id !== user.id) {
    redirect(`/p/${shortId}`);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Success badge */}
        <div className="flex justify-center">
          <span className="bg-option-a flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white">
            ✓
          </span>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Your poll is live
          </h1>
          <p className="text-body text-sm">{poll.question}</p>
        </div>

        {/* Share panel */}
        <SharePanel shortId={shortId} />

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Link
            href={`/p/${shortId}`}
            className="rounded-card bg-option-a hover:bg-option-a-hover py-3 text-sm font-medium text-white transition-colors"
          >
            Preview the voter link →
          </Link>
          <Link
            href="/dashboard"
            className="rounded-card border-line text-ink hover:bg-bg-subtle border py-3 text-sm font-medium transition-colors"
          >
            Go to my polls
          </Link>
        </div>
      </div>
    </div>
  );
}
