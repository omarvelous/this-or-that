"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

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

export function PollForm() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [options, setOptions] =
    useState<[OptionState, OptionState]>(DEFAULT_OPTIONS);
  const [status, setStatus] = useState<
    "idle" | "loading" | "uploading" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputARef = useRef<HTMLInputElement>(null);
  const fileInputBRef = useRef<HTMLInputElement>(null);

  function updateOptionLabel(index: 0 | 1, label: string) {
    setOptions((prev) => {
      const next: [OptionState, OptionState] = [{ ...prev[0] }, { ...prev[1] }];
      next[index] = { ...next[index], label };
      return next;
    });
  }

  function handleImageSelect(index: 0 | 1, file: File | null) {
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setOptions((prev) => {
      const next: [OptionState, OptionState] = [{ ...prev[0] }, { ...prev[1] }];
      // Revoke old preview URL to avoid memory leaks
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
    // Reset the file input
    const ref = index === 0 ? fileInputARef : fileInputBRef;
    if (ref.current) ref.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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

    // 2. Upload images if any were selected
    const imagesToUpload = options.filter((o) => o.imageFile);
    if (imagesToUpload.length > 0) {
      setStatus("uploading");

      // We need the option IDs — fetch the poll data
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
            // Image upload failure is non-fatal — poll is already created.
            console.error(`Failed to upload image for option ${i}`);
          }
        }
      }
    }

    router.push(`/polls/${shortId}`);
  }

  const isDisabled = status === "loading" || status === "uploading";
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
          disabled={isDisabled}
          className="border-border bg-surface placeholder:text-text-muted focus:border-primary w-full rounded-lg border px-4 py-3 text-sm outline-none disabled:opacity-50"
        />
      </div>

      {/* Options */}
      <div className="space-y-3">
        <p className="text-text text-sm font-medium">Options</p>

        <OptionInput
          side="a"
          label={optionA?.label ?? ""}
          imagePreview={optionA?.imagePreview ?? null}
          disabled={isDisabled}
          fileInputRef={fileInputARef}
          onLabelChange={(v) => updateOptionLabel(0, v)}
          onImageSelect={(f) => handleImageSelect(0, f)}
          onImageRemove={() => removeImage(0)}
        />

        <div className="flex items-center justify-center">
          <span className="text-text-muted text-xs font-medium tracking-widest uppercase">
            vs
          </span>
        </div>

        <OptionInput
          side="b"
          label={optionB?.label ?? ""}
          imagePreview={optionB?.imagePreview ?? null}
          disabled={isDisabled}
          fileInputRef={fileInputBRef}
          onLabelChange={(v) => updateOptionLabel(1, v)}
          onImageSelect={(f) => handleImageSelect(1, f)}
          onImageRemove={() => removeImage(1)}
        />
      </div>

      {errorMsg && <p className="text-error text-sm">{errorMsg}</p>}

      <button
        type="submit"
        disabled={isDisabled}
        className="bg-primary text-text-inverse hover:bg-primary-hover w-full rounded-lg py-3 text-sm font-medium transition-colors disabled:opacity-50"
      >
        {status === "loading"
          ? "Creating…"
          : status === "uploading"
            ? "Uploading images…"
            : "Create poll"}
      </button>
    </form>
  );
}

function OptionInput({
  side,
  label,
  imagePreview,
  disabled,
  fileInputRef,
  onLabelChange,
  onImageSelect,
  onImageRemove,
}: {
  side: "a" | "b";
  label: string;
  imagePreview: string | null;
  disabled: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onLabelChange: (value: string) => void;
  onImageSelect: (file: File | null) => void;
  onImageRemove: () => void;
}) {
  const badgeColor = side === "a" ? "bg-option-a" : "bg-option-b";
  const focusColor =
    side === "a" ? "focus:border-option-a" : "focus:border-option-b";
  const sideLabel = side === "a" ? "A" : "B";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <span
          className={`${badgeColor} flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white`}
        >
          {sideLabel}
        </span>
        <input
          type="text"
          placeholder={`Option ${sideLabel}`}
          value={label}
          onChange={(e) => onLabelChange(e.target.value)}
          required
          maxLength={140}
          disabled={disabled}
          className={`border-border bg-surface placeholder:text-text-muted ${focusColor} w-full rounded-lg border px-4 py-3 text-sm outline-none disabled:opacity-50`}
        />
      </div>

      {/* Image preview or upload button */}
      {imagePreview ? (
        <div className="relative ml-11 w-fit">
          <Image
            src={imagePreview}
            alt={`Option ${sideLabel} preview`}
            width={120}
            height={120}
            className="rounded-lg object-cover"
            unoptimized
          />
          <button
            type="button"
            onClick={onImageRemove}
            disabled={disabled}
            className="bg-error absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm hover:bg-red-600 disabled:opacity-50"
            aria-label="Remove image"
          >
            ×
          </button>
        </div>
      ) : (
        <div className="ml-11">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => onImageSelect(e.target.files?.[0] ?? null)}
            disabled={disabled}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="text-text-muted hover:text-text-secondary text-xs font-medium transition-colors disabled:opacity-50"
          >
            + Add image (optional)
          </button>
        </div>
      )}
    </div>
  );
}
