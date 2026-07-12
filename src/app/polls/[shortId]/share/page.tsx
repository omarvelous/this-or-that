import { notFound, redirect } from "next/navigation";

import { ShareView } from "@/components/share-view";
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
    .select("id, question, creator_id")
    .eq("short_id", shortId)
    .single();

  if (!poll) {
    notFound();
  }

  if (poll.creator_id !== user.id) {
    redirect(`/p/${shortId}`);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <ShareView shortId={shortId} question={poll.question} />
    </div>
  );
}
