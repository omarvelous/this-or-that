"use client";

import { useState } from "react";

interface NamePromptProps {
  shortId: string;
  fingerprint: string;
  onDone: () => void;
}

export function NamePrompt({ shortId, fingerprint, onDone }: NamePromptProps) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      onDone();
      return;
    }

    setSaving(true);
    await fetch(`/api/polls/${shortId}/vote`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fingerprint,
        voterName: name.trim(),
      }),
    });
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-surface w-full max-w-sm rounded-2xl p-6 shadow-xl">
        <h2 className="text-lg font-bold">Add your name?</h2>
        <p className="text-text-secondary mt-1 text-sm">
          Optional — show others who voted.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            autoFocus
            disabled={saving}
            className="border-border bg-bg placeholder:text-text-muted focus:border-primary w-full rounded-lg border px-4 py-3 text-sm outline-none disabled:opacity-50"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onDone}
              disabled={saving}
              className="border-border hover:bg-bg-subtle flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-primary text-text-inverse hover:bg-primary-hover flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
