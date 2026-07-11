"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

interface IdentityModalBase {
  onClose: () => void;
}

interface CreateModeProps extends IdentityModalBase {
  mode: "create";
  onSkip: () => void;
  onAuthenticated: () => void;
  redirectUrl: string;
}

interface VoteModeProps extends IdentityModalBase {
  mode: "vote";
  onSubmit: (name: string, email: string) => void;
  onSkip: () => void;
}

type IdentityModalProps = CreateModeProps | VoteModeProps;

export function IdentityModal(props: IdentityModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="bg-ink/50 absolute inset-0 backdrop-blur-sm"
        onClick={props.onClose}
      />

      {/* Modal */}
      <div className="animate-rise bg-bg shadow-card-float relative w-full max-w-[420px] rounded-[26px] p-7">
        {/* Close button */}
        <button
          onClick={props.onClose}
          className="text-muted hover:bg-sand hover:text-ink absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full transition-colors"
          aria-label="Close"
        >
          ✕
        </button>

        {props.mode === "create" ? (
          <CreateContent
            onSkip={props.onSkip}
            onAuthenticated={props.onAuthenticated}
            redirectUrl={props.redirectUrl}
          />
        ) : (
          <VoteContent onSubmit={props.onSubmit} onSkip={props.onSkip} />
        )}
      </div>
    </div>
  );
}

function CreateContent({
  onSkip,
  onAuthenticated,
  redirectUrl,
}: {
  onSkip: () => void;
  onAuthenticated: () => void;
  redirectUrl: string;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = useState("");

  const isEmailValid = /^.+@.+\..+$/.test(email);

  async function handleSendLink(e: React.FormEvent) {
    e.preventDefault();
    if (!isEmailValid) return;

    setStatus("loading");
    setErrorMsg("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectUrl)}`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    } else {
      setStatus("sent");
    }
  }

  if (status === "sent") {
    return (
      <div className="space-y-5">
        {/* Success icon */}
        <div className="rounded-icon bg-success-bg flex h-14 w-14 items-center justify-center text-2xl">
          ✦
        </div>

        <div className="space-y-2">
          <h2 className="font-display text-ink text-xl font-bold">
            Check your inbox
          </h2>
          <p className="text-body text-sm">
            We sent a magic link to <strong>{email}</strong>. Click it to
            publish your poll.
          </p>
        </div>

        {/* Mock inbox row */}
        <div className="rounded-input border-line flex items-center gap-3 border-2 border-dashed px-4 py-3">
          <span className="text-lg">✉</span>
          <div className="min-w-0 flex-1">
            <p className="text-ink truncate text-sm font-semibold">
              This or That
            </p>
            <p className="text-muted truncate text-xs">
              Confirm & publish your poll →
            </p>
          </div>
        </div>

        <button
          onClick={onAuthenticated}
          className="rounded-input bg-option-a hover:bg-option-a-hover w-full py-3.5 text-sm font-semibold text-white transition-colors"
        >
          Open the magic link →
        </button>

        <p className="text-muted-2 text-center text-xs">
          Didn&apos;t get it? Check your spam folder.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSendLink} className="space-y-5">
      {/* Icon */}
      <div className="rounded-icon bg-option-a-tint flex h-14 w-14 items-center justify-center text-2xl">
        ✉
      </div>

      <div className="space-y-2">
        <h2 className="font-display text-ink text-xl font-bold">
          Save your poll first
        </h2>
        <p className="text-body text-sm">
          Enter your email so you can manage, close, and view results for your
          poll.
        </p>
      </div>

      <input
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={status === "loading"}
        className="rounded-input border-line bg-sand text-ink placeholder:text-muted-2 focus:border-option-a w-full border px-4 py-3.5 text-sm outline-none disabled:opacity-50"
      />

      {errorMsg && <p className="text-error text-sm">{errorMsg}</p>}

      <button
        type="submit"
        disabled={!isEmailValid || status === "loading"}
        className="rounded-input bg-option-a hover:bg-option-a-hover w-full py-3.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
      >
        {status === "loading" ? "Sending…" : "Send me a magic link →"}
      </button>

      <button
        type="button"
        onClick={onSkip}
        className="text-muted hover:text-ink w-full text-center text-sm font-medium transition-colors"
      >
        No thanks — just give me the link
      </button>
    </form>
  );
}

function VoteContent({
  onSubmit,
  onSkip,
}: {
  onSubmit: (name: string, email: string) => void;
  onSkip: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    onSubmit(name.trim(), email.trim());
  }

  function handleSkip() {
    setSubmitting(true);
    onSkip();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Icon */}
      <div className="rounded-icon bg-option-b-tint flex h-14 w-14 items-center justify-center text-2xl">
        ☝
      </div>

      <div className="space-y-2">
        <h2 className="font-display text-ink text-xl font-bold">
          Add your name?
        </h2>
        <p className="text-body text-sm">Optional — show others who voted.</p>
      </div>

      <div className="space-y-3">
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          autoFocus
          disabled={submitting}
          className="rounded-input border-line bg-sand text-ink placeholder:text-muted-2 focus:border-option-b w-full border px-4 py-3.5 text-sm outline-none disabled:opacity-50"
        />
        <input
          type="email"
          placeholder="Email (optional — get notified when results change)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
          className="rounded-input border-line bg-sand text-ink placeholder:text-muted-2 focus:border-option-b w-full border px-4 py-3.5 text-sm outline-none disabled:opacity-50"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSkip}
          disabled={submitting}
          className="rounded-input border-line text-ink hover:bg-sand flex-1 border py-3 text-sm font-semibold transition-colors disabled:opacity-50"
        >
          Skip — just vote
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-input bg-option-b hover:bg-option-b-hover flex-1 py-3 text-sm font-semibold text-white transition-colors disabled:opacity-50"
        >
          {submitting ? "Voting…" : "Vote →"}
        </button>
      </div>
    </form>
  );
}
