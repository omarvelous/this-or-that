"use client";

import { useState, useSyncExternalStore } from "react";
import QRCode from "react-qr-code";

const subscribe = () => () => {};
const getSnapshot = () => !!navigator.share;
const getServerSnapshot = () => false;

interface SharePanelProps {
  shortId: string;
}

export function SharePanel({ shortId }: SharePanelProps) {
  const [copied, setCopied] = useState(false);
  const pollUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/p/${shortId}`
      : `/p/${shortId}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(pollUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = pollUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Vote on this poll",
          url: pollUrl,
        });
      } catch {
        // User cancelled or share failed — ignore.
      }
    }
  }

  const hasNativeShare = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return (
    <div className="w-full max-w-sm space-y-5">
      <h2 className="text-text-muted text-center text-sm font-semibold tracking-wide uppercase">
        Share this poll
      </h2>

      {/* Copy link */}
      <button
        onClick={handleCopy}
        className="border-border hover:bg-bg-subtle flex w-full items-center justify-center gap-2 rounded-lg border py-3 text-sm font-medium transition-colors"
      >
        <CopyIcon />
        {copied ? "Copied!" : "Copy link"}
      </button>

      {/* Native share (mobile) */}
      {hasNativeShare && (
        <button
          onClick={handleNativeShare}
          className="border-border hover:bg-bg-subtle flex w-full items-center justify-center gap-2 rounded-lg border py-3 text-sm font-medium transition-colors"
        >
          <ShareIcon />
          Share
        </button>
      )}

      {/* QR Code */}
      <div className="flex flex-col items-center gap-3">
        <div className="rounded-xl bg-white p-4">
          <QRCode value={pollUrl} size={160} level="M" />
        </div>
        <p className="text-text-muted text-xs">Scan to vote</p>
      </div>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}
