"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { IdentityModal } from "@/components/identity-modal";
import { MatchupPanel } from "@/components/matchup-panel";
import { getVisitorId } from "@/lib/fingerprint";

interface OptionData {
  id: string;
  label: string | null;
  imageUrl: string | null;
}

interface VoterVoteUIProps {
  shortId: string;
  matchupId: string;
  optionA: OptionData;
  optionB: OptionData;
}

type VoteStatus = "idle" | "selected" | "voting" | "duplicate" | "error";

export function VoterVoteUI({
  shortId,
  matchupId,
  optionA,
  optionB,
}: VoterVoteUIProps) {
  const router = useRouter();
  const [status, setStatus] = useState<VoteStatus>("idle");
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  function handleOptionTap(optionId: string) {
    if (status === "voting") return;

    // Store the selection and show the identity modal
    setSelectedOptionId(optionId);
    setStatus("selected");
  }

  async function castVote(voterName: string, voterEmail: string) {
    if (!selectedOptionId) return;

    setStatus("voting");
    setErrorMsg("");

    try {
      const visitorId = await getVisitorId();

      const res = await fetch(`/api/polls/${shortId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          optionId: selectedOptionId,
          matchupId,
          fingerprint: visitorId,
          voterName: voterName || undefined,
          voterEmail: voterEmail || undefined,
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
        setSelectedOptionId(null);
        return;
      }

      // Vote cast — redirect to results
      router.push(`/p/${shortId}/results`);
    } catch {
      setErrorMsg("Network error — please try again");
      setStatus("error");
      setSelectedOptionId(null);
    }
  }

  const isDisabled = status === "voting";

  return (
    <>
      {/* Matchup panels */}
      <div className="flex flex-1 flex-col gap-4 md:flex-row md:gap-5">
        <MatchupPanel
          side="a"
          label={optionA.label}
          imageUrl={optionA.imageUrl}
          isSelected={selectedOptionId === optionA.id}
          isDisabled={isDisabled}
          onVote={() => handleOptionTap(optionA.id)}
        />

        <div className="flex items-center justify-center py-1 md:py-0">
          <span className="bg-sand text-muted flex h-10 w-10 items-center justify-center rounded-full text-xs font-extrabold">
            VS
          </span>
        </div>

        <MatchupPanel
          side="b"
          label={optionB.label}
          imageUrl={optionB.imageUrl}
          isSelected={selectedOptionId === optionB.id}
          isDisabled={isDisabled}
          onVote={() => handleOptionTap(optionB.id)}
        />
      </div>

      {/* Status messages */}
      <div className="mt-4 text-center">
        {status === "voting" && (
          <p className="text-muted text-sm">Casting your vote…</p>
        )}
        {status === "duplicate" && (
          <div className="space-y-3">
            <p className="text-body text-sm font-medium">
              You&apos;ve already voted on this poll.
            </p>
            <button
              onClick={() => router.push(`/p/${shortId}/results`)}
              className="rounded-input bg-option-a hover:bg-option-a-hover px-6 py-2.5 text-sm font-semibold text-white transition-colors"
            >
              View results
            </button>
          </div>
        )}
        {status === "error" && <p className="text-error text-sm">{errorMsg}</p>}
      </div>

      {/* Pre-vote identity modal */}
      {status === "selected" && (
        <IdentityModal
          mode="vote"
          onSubmit={(name, email) => castVote(name, email)}
          onSkip={() => castVote("", "")}
          onClose={() => {
            setStatus("idle");
            setSelectedOptionId(null);
          }}
        />
      )}
    </>
  );
}
