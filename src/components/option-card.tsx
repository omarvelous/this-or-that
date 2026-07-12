"use client";

import { useRef } from "react";

import { OptionBadge } from "@/components/option-badge";

interface OptionCardProps {
  side: "a" | "b";
  label: string;
  imagePreview: string | null;
  disabled?: boolean;
  onLabelChange: (value: string) => void;
  onImageSelect: (file: File) => void;
  onImageRemove: () => void;
}

export function OptionCard({
  side,
  label,
  imagePreview,
  disabled,
  onLabelChange,
  onImageSelect,
  onImageRemove,
}: OptionCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const focusBorder =
    side === "a" ? "focus:border-option-a" : "focus:border-option-b";

  return (
    <div className="rounded-card border-line bg-surface border p-5">
      {/* Badge + Label */}
      <div className="flex items-center gap-3">
        <OptionBadge side={side} />
        <input
          type="text"
          placeholder={`Option ${side.toUpperCase()}`}
          value={label}
          onChange={(e) => onLabelChange(e.target.value)}
          required
          maxLength={140}
          disabled={disabled}
          className={`${focusBorder} rounded-input bg-sand font-display text-ink placeholder:text-muted-2 w-full border-0 px-4 py-3 text-lg font-semibold outline-none disabled:opacity-50`}
        />
      </div>

      {/* Photo control */}
      <div className="mt-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImageSelect(file);
          }}
          disabled={disabled}
          className="hidden"
        />

        {imagePreview ? (
          <div className="rounded-input relative overflow-hidden">
            <div
              className="aspect-[16/10] w-full bg-cover bg-center"
              style={{ backgroundImage: `url(${imagePreview})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="rounded-input text-ink absolute bottom-3 left-3 bg-white/90 px-3 py-1.5 text-xs font-medium backdrop-blur-sm transition-colors hover:bg-white disabled:opacity-50"
            >
              Change photo
            </button>
            <button
              type="button"
              onClick={onImageRemove}
              disabled={disabled}
              className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-sm font-bold text-white transition-colors hover:bg-black/70 disabled:opacity-50"
              aria-label="Remove photo"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="rounded-input border-line text-muted hover:border-muted hover:text-ink flex w-full items-center justify-center border-2 border-dashed py-6 text-sm font-medium transition-colors disabled:opacity-50"
          >
            + Add a photo · optional
          </button>
        )}
      </div>
    </div>
  );
}
