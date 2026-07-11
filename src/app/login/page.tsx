"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  // `searchParams` is a Promise in Next.js 16 — unwrap with React.use() or
  // read it in the action. We pass `next` through the form instead.
  return <LoginForm searchParams={searchParams} />;
}

function LoginForm({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = useState("");

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    // Resolve `next` for the redirect after login.
    const params = await searchParams;
    const next = params.next ?? "/dashboard";

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    } else {
      setStatus("sent");
    }
  }

  async function handleGoogle() {
    setStatus("loading");
    const params = await searchParams;
    const next = params.next ?? "/dashboard";

    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
          <p className="text-text-secondary text-sm">
            Create and manage your polls.
          </p>
        </div>

        {status === "sent" ? (
          <p className="bg-bg-subtle rounded-lg px-4 py-3 text-center text-sm">
            Check your email — we sent a magic link to <strong>{email}</strong>.
          </p>
        ) : (
          <form onSubmit={handleMagicLink} className="space-y-3">
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={status === "loading"}
              className="border-border bg-surface placeholder:text-text-muted focus:border-primary w-full rounded-lg border px-4 py-3 text-sm outline-none disabled:opacity-50"
            />
            {errorMsg && <p className="text-error text-sm">{errorMsg}</p>}
            <button
              type="submit"
              disabled={status === "loading"}
              className="bg-primary text-text-inverse hover:bg-primary-hover w-full rounded-lg py-3 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {status === "loading" ? "Sending…" : "Send magic link"}
            </button>
          </form>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="border-border w-full border-t" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-bg text-text-muted px-2 text-xs">or</span>
          </div>
        </div>

        <button
          onClick={handleGoogle}
          disabled={status === "loading"}
          className="border-border hover:bg-bg-subtle flex w-full items-center justify-center gap-3 rounded-lg border py-3 text-sm font-medium transition-colors disabled:opacity-50"
        >
          <GoogleIcon />
          Continue with Google
        </button>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.583c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.583 9 3.583Z"
      />
    </svg>
  );
}
