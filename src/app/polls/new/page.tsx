import { redirect } from "next/navigation";

import { PollForm } from "@/components/poll-form";
import { getUser } from "@/lib/auth";

export const metadata = {
  title: "New poll — this or that",
};

export default async function NewPollPage() {
  const user = await getUser();
  if (!user) {
    redirect("/login?next=/polls/new");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">New poll</h1>
          <p className="text-text-secondary text-sm">
            Ask a question. Give two options. Share the link.
          </p>
        </div>
        <PollForm />
      </div>
    </div>
  );
}
