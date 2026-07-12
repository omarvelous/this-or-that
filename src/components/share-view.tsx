"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import QRCode from "react-qr-code";

const subscribe = () => () => {};
const getSnapshot = () => !!navigator.share;
const getServerSnapshot = () => false;

interface ShareViewProps {
  shortId: string;
  question: string;
}

export function ShareView({ shortId, question }: ShareViewProps) {
  const [copied, setCopied] = useState(false);
  const voterUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/p/${shortId}`
      : `/p/${shortId}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(voterUrl);
    } catch {
      const input = document.createElement("input");
      input.value = voterUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: question, url: voterUrl });
      } catch {
        /* cancelled */
      }
    }
  }

  const hasNativeShare = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return (
    <div className="w-full max-w-md space-y-8">
      {/* Success badge */}
      <div className="flex justify-center">
        <span className="animate-pop bg-option-a flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white">
          ✓
        </span>
      </div>

      {/* Heading */}
      <div className="space-y-2 text-center">
        <h1 className="font-display text-ink text-2xl font-bold tracking-tight">
          Your poll is live
        </h1>
        <p className="text-body text-sm">{question}</p>
      </div>

      {/* Short link + copy */}
      <div className="rounded-input border-line bg-surface flex items-center gap-2 border px-4 py-3">
        <span className="text-ink flex-1 truncate font-mono text-sm">
          {voterUrl.replace(/^https?:\/\//, "")}
        </span>
        <button
          onClick={handleCopy}
          className="rounded-input bg-option-a hover:bg-option-a-hover shrink-0 px-4 py-2 text-xs font-semibold text-white transition-colors"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* Action tiles */}
      <div className="flex gap-3">
        {/* QR */}
        <div className="rounded-card border-line bg-surface flex flex-1 flex-col items-center gap-2 border p-4">
          <div className="rounded-lg bg-white p-2">
            <QRCode value={voterUrl} size={80} level="M" />
          </div>
          <span className="text-muted text-xs">QR code</span>
        </div>

        {/* Share */}
        {hasNativeShare && (
          <button
            onClick={handleNativeShare}
            className="rounded-card border-line bg-surface hover:bg-bg-subtle flex flex-1 flex-col items-center justify-center gap-2 border p-4 transition-colors"
          >
            <span className="text-2xl">↗</span>
            <span className="text-muted text-xs">Share…</span>
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Link
          href={`/p/${shortId}`}
          className="rounded-input bg-option-a hover:bg-option-a-hover py-3.5 text-center text-sm font-semibold text-white transition-colors"
        >
          Preview the voter link →
        </Link>
        <Link
          href="/dashboard"
          className="rounded-input border-line text-ink hover:bg-bg-subtle border py-3.5 text-center text-sm font-semibold transition-colors"
        >
          Go to my polls
        </Link>
      </div>
    </div>
  );
}
