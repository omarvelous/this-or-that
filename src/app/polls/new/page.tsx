import { PollForm } from "@/components/poll-form";
import { getUser } from "@/lib/auth";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create a poll — this or that",
};

export default async function NewPollPage() {
  const user = await getUser();

  return (
    <div className="bg-bg min-h-screen py-[clamp(40px,6vw,80px)]">
      <div className="mx-auto max-w-[600px] px-6">
        {/* Eyebrow */}
        <p className="text-muted text-xs font-semibold tracking-widest uppercase">
          Step 1 · Create
        </p>

        <h1 className="font-display text-ink mt-3 text-[clamp(1.8rem,4vw,2.5rem)] font-bold tracking-tight">
          Set up your matchup
        </h1>

        <div className="mt-8">
          <PollForm isAuthenticated={!!user} />
        </div>
      </div>
    </div>
  );
}
