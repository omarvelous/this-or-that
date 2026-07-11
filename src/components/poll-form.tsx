"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface OptionState {
  label: string;
}

const DEFAULT_OPTIONS: [OptionState, OptionState] = [
  { label: "" },
  { label: "" },
];

export function PollForm() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [options, setOptions] =
    useState<[OptionState, OptionState]>(DEFAULT_OPTIONS);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function updateOption(index: 0 | 1, label: string) {
    setOptions((prev) => {
      const next: [OptionState, OptionState] = [{ ...prev[0] }, { ...prev[1] }];
      next[index] = { label };
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const res = await fetch("/api/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: question.trim(),
        options: options.map((o) => ({ label: o.label.trim() })),
      }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setStatus("error");
      setErrorMsg(body.error ?? "Something went wrong. Please try again.");
      return;
    }

    const { shortId } = (await res.json()) as { shortId: string };
    router.push(`/polls/${shortId}`);
  }

  const optionA = options[0];
  const optionB = options[1];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Question */}
      <div className="space-y-2">
        <label
          htmlFor="question"
          className="text-text block text-sm font-medium"
        >
          Question
        </label>
        <input
          id="question"
          type="text"
          placeholder="Which is better?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
          maxLength={280}
          disabled={status === "loading"}
          className="border-border bg-surface placeholder:text-text-muted focus:border-primary w-full rounded-lg border px-4 py-3 text-sm outline-none disabled:opacity-50"
        />
      </div>

      {/* Options */}
      <div className="space-y-3">
        <p className="text-text text-sm font-medium">Options</p>

        <div className="flex items-center gap-3">
          <span className="bg-option-a flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
            A
          </span>
          <input
            type="text"
            placeholder="Option A"
            value={optionA?.label ?? ""}
            onChange={(e) => updateOption(0, e.target.value)}
            required
            maxLength={140}
            disabled={status === "loading"}
            className="border-border bg-surface placeholder:text-text-muted focus:border-option-a w-full rounded-lg border px-4 py-3 text-sm outline-none disabled:opacity-50"
          />
        </div>

        <div className="flex items-center justify-center">
          <span className="text-text-muted text-xs font-medium tracking-widest uppercase">
            vs
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="bg-option-b flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
            B
          </span>
          <input
            type="text"
            placeholder="Option B"
            value={optionB?.label ?? ""}
            onChange={(e) => updateOption(1, e.target.value)}
            required
            maxLength={140}
            disabled={status === "loading"}
            className="border-border bg-surface placeholder:text-text-muted focus:border-option-b w-full rounded-lg border px-4 py-3 text-sm outline-none disabled:opacity-50"
          />
        </div>
      </div>

      {errorMsg && <p className="text-error text-sm">{errorMsg}</p>}

      <button
        type="submit"
        disabled={status === "loading"}
        className="bg-primary text-text-inverse hover:bg-primary-hover w-full rounded-lg py-3 text-sm font-medium transition-colors disabled:opacity-50"
      >
        {status === "loading" ? "Creating…" : "Create poll"}
      </button>
    </form>
  );
}
