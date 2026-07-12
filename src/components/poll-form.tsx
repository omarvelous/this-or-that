"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { IdentityModal } from "@/components/identity-modal";
import { OptionCard } from "@/components/option-card";
import { compressImage } from "@/lib/image-utils";

interface OptionState {
  label: string;
  imageFile: File | null;
  imagePreview: string | null;
}

const DEFAULT_OPTIONS: [OptionState, OptionState] = [
  { label: "", imageFile: null, imagePreview: null },
  { label: "", imageFile: null, imagePreview: null },
];

interface PollFormProps {
  isAuthenticated: boolean;
}

export function PollForm({ isAuthenticated }: PollFormProps) {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [options, setOptions] =
    useState<[OptionState, OptionState]>(DEFAULT_OPTIONS);
  const [status, setStatus] = useState<
    "idle" | "loading" | "uploading" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);

  function updateLabel(index: 0 | 1, label: string) {
    setOptions((prev) => {
      const next: [OptionState, OptionState] = [{ ...prev[0] }, { ...prev[1] }];
      next[index] = { ...next[index], label };
      return next;
    });
  }

  function handleImageSelect(index: 0 | 1, file: File) {
    const preview = URL.createObjectURL(file);
    setOptions((prev) => {
      const next: [OptionState, OptionState] = [{ ...prev[0] }, { ...prev[1] }];
      if (next[index].imagePreview) {
        URL.revokeObjectURL(next[index].imagePreview!);
      }
      next[index] = { ...next[index], imageFile: file, imagePreview: preview };
      return next;
    });
  }

  function removeImage(index: 0 | 1) {
    setOptions((prev) => {
      const next: [OptionState, OptionState] = [{ ...prev[0] }, { ...prev[1] }];
      if (next[index].imagePreview) {
        URL.revokeObjectURL(next[index].imagePreview!);
      }
      next[index] = { ...next[index], imageFile: null, imagePreview: null };
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // If not authenticated, show the email modal instead of submitting
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    await createPoll();
  }

  async function createPoll() {
    setStatus("loading");
    setErrorMsg("");

    // 1. Create the poll
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

    // 2. Upload images if any
    const imagesToUpload = options.filter((o) => o.imageFile);
    if (imagesToUpload.length > 0) {
      setStatus("uploading");

      const pollRes = await fetch(`/api/polls/${shortId}/results`);
      if (pollRes.ok) {
        const pollData = (await pollRes.json()) as {
          options: Array<{ id: string; position: number }>;
        };

        for (let i = 0; i < 2; i++) {
          const opt = options[i];
          if (!opt?.imageFile) continue;

          const matchingOption = pollData.options.find((o) => o.position === i);
          if (!matchingOption) continue;

          try {
            const compressed = await compressImage(opt.imageFile);
            const formData = new FormData();
            formData.append("file", compressed);
            formData.append("optionId", matchingOption.id);

            await fetch(`/api/polls/${shortId}/upload`, {
              method: "POST",
              body: formData,
            });
          } catch {
            console.error(`Failed to upload image for option ${i}`);
          }
        }
      }
    }

    router.push(`/polls/${shortId}/share`);
  }

  const isDisabled = status === "loading" || status === "uploading";

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Question */}
        <div>
          <input
            type="text"
            placeholder="What's the question?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            required
            maxLength={280}
            disabled={isDisabled}
            className="rounded-input bg-sand font-display text-ink placeholder:text-muted-2 w-full border-0 px-5 py-4 text-lg font-semibold outline-none disabled:opacity-50"
          />
          <p className="text-muted-2 mt-1.5 text-right text-xs">
            {question.length}/280
          </p>
        </div>

        {/* Option cards */}
        <div className="relative space-y-4">
          <OptionCard
            side="a"
            label={options[0].label}
            imagePreview={options[0].imagePreview}
            disabled={isDisabled}
            onLabelChange={(v) => updateLabel(0, v)}
            onImageSelect={(f) => handleImageSelect(0, f)}
            onImageRemove={() => removeImage(0)}
          />

          {/* VS badge */}
          <div className="flex items-center justify-center">
            <span className="bg-sand text-muted flex h-10 w-10 items-center justify-center rounded-full text-xs font-extrabold">
              VS
            </span>
          </div>

          <OptionCard
            side="b"
            label={options[1].label}
            imagePreview={options[1].imagePreview}
            disabled={isDisabled}
            onLabelChange={(v) => updateLabel(1, v)}
            onImageSelect={(f) => handleImageSelect(1, f)}
            onImageRemove={() => removeImage(1)}
          />
        </div>

        {errorMsg && <p className="text-error text-sm">{errorMsg}</p>}

        <button
          type="submit"
          disabled={isDisabled}
          className="rounded-input bg-option-a shadow-cta-glow hover:bg-option-a-hover w-full py-4 text-sm font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-50"
        >
          {status === "loading"
            ? "Creating…"
            : status === "uploading"
              ? "Uploading images…"
              : "Create poll →"}
        </button>
      </form>

      {/* Auth modal for unauthenticated users */}
      {showAuthModal && (
        <IdentityModal
          mode="create"
          redirectUrl="/polls/new"
          onClose={() => setShowAuthModal(false)}
          onSkip={() => {
            setShowAuthModal(false);
            // Skip auth — try creating anyway (will fail if API requires auth,
            // but allows future "anonymous poll" flow)
            createPoll();
          }}
          onAuthenticated={() => {
            setShowAuthModal(false);
            // After authenticating via magic link, the page will reload
            // with the session. The user can then submit again.
            router.refresh();
          }}
        />
      )}
    </>
  );
}
