"use client";

import { OptionBadge } from "@/components/option-badge";

interface MatchupPanelProps {
  side: "a" | "b";
  label: string | null;
  imageUrl: string | null;
  isSelected: boolean;
  isDisabled: boolean;
  onVote: () => void;
}

export function MatchupPanel({
  side,
  label,
  imageUrl,
  isSelected,
  isDisabled,
  onVote,
}: MatchupPanelProps) {
  const hasImage = !!imageUrl;

  const baseColors =
    side === "a"
      ? "border-option-a/20 hover:border-option-a hover:shadow-vote-hover-a"
      : "border-option-b/20 hover:border-option-b hover:shadow-vote-hover-b";

  const selectedRing =
    side === "a"
      ? "ring-4 ring-option-a/40 border-option-a"
      : "ring-4 ring-option-b/40 border-option-b";

  const bgFallback = side === "a" ? "bg-surface" : "bg-sand";

  return (
    <button
      onClick={onVote}
      disabled={isDisabled}
      className={`group rounded-card relative flex flex-1 items-end justify-center overflow-hidden border-2 transition-all duration-200 ${baseColors} ${
        isSelected ? `scale-[0.97] ${selectedRing}` : "hover:-translate-y-1"
      } ${isDisabled && !isSelected ? "opacity-40" : ""} ${
        hasImage
          ? "min-h-[200px] sm:min-h-[300px]"
          : `${bgFallback} min-h-[160px] sm:min-h-[260px]`
      }`}
    >
      {/* Badge */}
      <div className="absolute top-4 left-4 z-10">
        <OptionBadge side={side} size="sm" />
      </div>

      {hasImage ? (
        <>
          {/* Photo background */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          {/* Label over photo */}
          <span className="font-display relative z-10 px-5 pb-5 text-center text-xl font-bold text-white sm:text-2xl">
            {label ?? "Option"}
          </span>
        </>
      ) : (
        /* Label centered */
        <span className="font-display text-ink absolute inset-0 flex items-center justify-center px-5 text-center text-xl font-bold sm:text-2xl">
          {label ?? "Option"}
        </span>
      )}
    </button>
  );
}
