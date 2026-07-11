import Link from "next/link";

import { LayoutShell } from "@/components/layout-shell";

const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Create",
    description: "Type your question, add two options. Done in seconds.",
    side: "a" as const,
  },
  {
    step: 2,
    title: "Share",
    description: "Send the link anywhere — texts, stories, group chats.",
    side: "b" as const,
  },
  {
    step: 3,
    title: "Vote",
    description: "One tap. No sign-up. Completely anonymous.",
    side: "a" as const,
  },
  {
    step: 4,
    title: "Results",
    description: "Watch the votes come in live. See who's winning.",
    side: "b" as const,
  },
];

export default function HomePage() {
  return (
    <LayoutShell>
      {/* ============================================================
          Hero
          ============================================================ */}
      <section className="mx-auto flex max-w-[1180px] flex-col-reverse items-center gap-10 px-6 pt-[clamp(48px,7vw,90px)] pb-[clamp(40px,6vw,72px)] md:flex-row md:gap-16">
        {/* Copy */}
        <div className="flex-1 space-y-6 text-center md:text-left">
          {/* Eyebrow */}
          <span className="rounded-pill bg-option-b-tint text-option-b inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="bg-option-b absolute inline-flex h-full w-full animate-ping rounded-full opacity-50" />
              <span className="bg-option-b relative inline-flex h-2 w-2 rounded-full" />
            </span>
            Live polls, real-time results
          </span>

          <h1 className="font-display text-ink text-[clamp(2.2rem,5.5vw,4rem)] leading-[1.05] font-extrabold tracking-[-1.5px]">
            Settle it in
            <br />
            one tap
          </h1>

          <p className="text-body max-w-md text-lg leading-relaxed">
            Create a head-to-head poll, share the link, and watch the votes pour
            in. No accounts needed for voters — just tap and go.
          </p>

          {/* CTAs */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/polls/new"
              className="rounded-input bg-option-a shadow-cta-glow hover:bg-option-a-hover inline-flex items-center justify-center px-7 py-3.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
            >
              Create a poll →
            </Link>
            <Link
              href="#how-it-works"
              className="rounded-input border-line text-ink hover:bg-bg-subtle inline-flex items-center justify-center border px-7 py-3.5 text-sm font-bold transition-colors"
            >
              See how it works
            </Link>
          </div>
        </div>

        {/* Preview card (static — structured for future interactivity) */}
        <div className="w-full max-w-sm flex-shrink-0">
          <div className="rounded-card border-line bg-surface shadow-card-float border p-5">
            <p className="text-muted text-center text-sm font-semibold">
              Which vibe?
            </p>

            <div className="mt-4 flex gap-3">
              {/* Option A preview */}
              <div className="rounded-input bg-option-a-tint hover:shadow-vote-hover-a flex flex-1 flex-col items-center gap-2 p-4 transition-all hover:-translate-y-0.5">
                <span className="bg-option-a flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white">
                  A
                </span>
                <span className="font-display text-ink text-sm font-bold">
                  Midnight
                </span>
              </div>

              {/* VS */}
              <div className="flex items-center">
                <span className="bg-sand text-muted flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-extrabold">
                  VS
                </span>
              </div>

              {/* Option B preview */}
              <div className="rounded-input bg-option-b-tint hover:shadow-vote-hover-b flex flex-1 flex-col items-center gap-2 p-4 transition-all hover:-translate-y-0.5">
                <span className="bg-option-b flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white">
                  B
                </span>
                <span className="font-display text-ink text-sm font-bold">
                  Daybreak
                </span>
              </div>
            </div>

            {/* Mock result bars */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-body w-16 text-xs font-medium">
                  Midnight
                </span>
                <div className="rounded-pill bg-sand h-2 flex-1 overflow-hidden">
                  <div className="rounded-pill bg-option-a h-full w-[62%]" />
                </div>
                <span className="text-muted w-8 text-right text-xs tabular-nums">
                  62%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-body w-16 text-xs font-medium">
                  Daybreak
                </span>
                <div className="rounded-pill bg-sand h-2 flex-1 overflow-hidden">
                  <div className="rounded-pill bg-option-b h-full w-[38%]" />
                </div>
                <span className="text-muted w-8 text-right text-xs tabular-nums">
                  38%
                </span>
              </div>
            </div>

            <p className="text-muted-2 mt-3 text-center text-xs">
              247 votes · live
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================
          How it works
          ============================================================ */}
      <section
        id="how-it-works"
        className="border-line/50 bg-bg-subtle border-t py-[clamp(48px,7vw,80px)]"
      >
        <div className="mx-auto max-w-[1180px] px-6">
          <h2 className="font-display text-ink text-center text-[clamp(1.5rem,3.5vw,2.2rem)] font-bold tracking-tight">
            How it works
          </h2>
          <p className="text-body mx-auto mt-2 max-w-md text-center text-sm">
            Four steps. Zero friction. Results in real time.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map(({ step, title, description, side }) => {
              const badgeBg = side === "a" ? "bg-option-a" : "bg-option-b";
              return (
                <div
                  key={step}
                  className="rounded-card border-line bg-surface border p-5"
                >
                  <span
                    className={`${badgeBg} inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white`}
                  >
                    {step}
                  </span>
                  <h3 className="font-display text-ink mt-3 text-lg font-bold">
                    {title}
                  </h3>
                  <p className="text-body mt-1 text-sm leading-relaxed">
                    {description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================
          Value band (dark)
          ============================================================ */}
      <section className="bg-dark-panel py-[clamp(40px,6vw,72px)]">
        <div className="mx-auto max-w-[1180px] px-6 text-center">
          <h2 className="font-display text-[clamp(1.5rem,3.5vw,2.2rem)] font-bold tracking-tight text-white">
            Built for the group chat
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/60">
            No downloads, no sign-ups for voters, no BS. Just a link that
            settles the debate.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-8 sm:gap-14">
            <div>
              <p className="font-display text-3xl font-bold text-white">2s</p>
              <p className="mt-1 text-xs text-white/50">To create a poll</p>
            </div>
            <div>
              <p className="font-display text-3xl font-bold text-white">0</p>
              <p className="mt-1 text-xs text-white/50">
                Sign-ups needed to vote
              </p>
            </div>
            <div>
              <p className="font-display text-3xl font-bold text-white">1</p>
              <p className="mt-1 text-xs text-white/50">Tap to cast a vote</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          Closing CTA
          ============================================================ */}
      <section className="py-[clamp(48px,7vw,90px)]">
        <div className="mx-auto max-w-[600px] px-6 text-center">
          <h2 className="font-display text-ink text-[clamp(1.8rem,4vw,2.8rem)] font-bold tracking-tight">
            What&apos;s it gonna be?
          </h2>
          <p className="text-body mt-2 text-sm">
            Create your first poll in seconds. It&apos;s free.
          </p>
          <Link
            href="/polls/new"
            className="rounded-input bg-option-a shadow-cta-glow hover:bg-option-a-hover mt-6 inline-flex items-center justify-center px-8 py-4 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
          >
            Create a poll →
          </Link>
        </div>
      </section>
    </LayoutShell>
  );
}
