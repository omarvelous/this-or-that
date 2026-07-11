"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { getVisitorId } from "@/lib/fingerprint";

interface OptionData {
  id: string;
  label: string | null;
  imageUrl: string | null;
}

interface VotingUIProps {
  shortId: string;
  matchupId: string;
  optionA: OptionData;
  optionB: OptionData;
}

type VoteStatus = "idle" | "voting" | "voted" | "duplicate" | "error";

export function VotingUI({
  shortId,
  matchupId,
  optionA,
  optionB,
}: VotingUIProps) {
  const router = useRouter();
  const [status, setStatus] = useState<VoteStatus>("idle");
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleVote(optionId: string) {
    if (status === "voting" || status === "voted") return;

    setStatus("voting");
    setVotedOptionId(optionId);
    setErrorMsg("");

    try {
      const visitorId = await getVisitorId();

      const res = await fetch(`/api/polls/${shortId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          optionId,
          matchupId,
          fingerprint: visitorId,
        }),
      });

      if (res.status === 409) {
        setStatus("duplicate");
        return;
      }

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setErrorMsg(body.error ?? "Something went wrong");
        setStatus("error");
        setVotedOptionId(null);
        return;
      }

      setStatus("voted");

      // Redirect to results after a brief pause so the user sees feedback.
      setTimeout(() => {
        router.push(`/polls/${shortId}/results`);
      }, 1200);
    } catch {
      setErrorMsg("Network error — please try again");
      setStatus("error");
      setVotedOptionId(null);
    }
  }

  const isDisabled = status === "voting" || status === "voted";

  return (
    <div className="flex flex-1 flex-col">
      {/* Split-screen voting panels */}
      <div className="flex flex-1 flex-col gap-3 px-4 pb-4 sm:flex-row sm:gap-4">
        <VotePanel
          option={optionA}
          side="a"
          isSelected={votedOptionId === optionA.id}
          isDisabled={isDisabled}
          onVote={() => handleVote(optionA.id)}
        />
        <div className="flex items-center justify-center py-1 sm:py-0">
          <span className="text-text-muted text-xs font-bold tracking-widest uppercase">
            vs
          </span>
        </div>
        <VotePanel
          option={optionB}
          side="b"
          isSelected={votedOptionId === optionB.id}
          isDisabled={isDisabled}
          onVote={() => handleVote(optionB.id)}
        />
      </div>

      {/* Status messages */}
      <div className="px-4 pb-6 text-center">
        {status === "voting" && (
          <p className="text-text-muted text-sm">Casting your vote…</p>
        )}
        {status === "voted" && (
          <p className="text-success text-sm font-medium">
            Vote cast! Redirecting to results…
          </p>
        )}
        {status === "duplicate" && (
          <div className="space-y-2">
            <p className="text-text-secondary text-sm font-medium">
              You&apos;ve already voted on this poll.
            </p>
            <button
              onClick={() => router.push(`/polls/${shortId}/results`)}
              className="bg-primary text-text-inverse hover:bg-primary-hover rounded-lg px-6 py-2 text-sm font-medium transition-colors"
            >
              View results
            </button>
          </div>
        )}
        {status === "error" && <p className="text-error text-sm">{errorMsg}</p>}
      </div>
    </div>
  );
}

function VotePanel({
  option,
  side,
  isSelected,
  isDisabled,
  onVote,
}: {
  option: OptionData;
  side: "a" | "b";
  isSelected: boolean;
  isDisabled: boolean;
  onVote: () => void;
}) {
  const bgColor = side === "a" ? "bg-option-a" : "bg-option-b";
  const hoverBg =
    side === "a" ? "hover:bg-option-a-hover" : "hover:bg-option-b-hover";
  const ring = isSelected ? "ring-4 ring-white/50 scale-[0.97]" : "";

  return (
    <button
      onClick={onVote}
      disabled={isDisabled}
      className={`${bgColor} ${hoverBg} ${ring} flex flex-1 items-center justify-center rounded-2xl px-6 py-12 text-white transition-all sm:py-0 ${
        isDisabled && !isSelected ? "opacity-50" : ""
      }`}
    >
      <span className="text-center text-lg font-bold sm:text-xl">
        {option.label ?? "Option"}
      </span>
    </button>
  );
}
