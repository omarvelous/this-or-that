"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const POLL_INTERVAL = 2500;

interface VoterResultsLiveProps {
  shortId: string;
}

// This component polls the results API and refreshes the server component
// when data changes, so the ResultRow components re-animate.
export function VoterResultsLive({ shortId }: VoterResultsLiveProps) {
  const router = useRouter();
  const disabled = process.env.NEXT_PUBLIC_DISABLE_POLLING === "true";

  useEffect(() => {
    if (disabled) return;

    const interval = setInterval(() => {
      router.refresh();
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [shortId, router, disabled]);

  return null;
}
