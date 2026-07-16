"use client";

import FingerprintJS from "@fingerprintjs/fingerprintjs";

let fpPromise: Promise<string> | null = null;

/**
 * Returns a visitor ID for vote dedup.
 *
 * In production: stable FingerprintJS visitorId (same device = same ID,
 * even across incognito — this is intentional for anti-abuse).
 *
 * In development: FingerprintJS visitorId + a random session salt so each
 * browser window/tab can vote independently for testing.
 */
export function getVisitorId(): Promise<string> {
  if (!fpPromise) {
    fpPromise = FingerprintJS.load()
      .then((fp) => fp.get())
      .then((result) => {
        if (process.env.NODE_ENV === "development") {
          // Session-scoped random salt — unique per tab/window, survives
          // SPA navigations but resets on hard refresh or new tab.
          const sessionSalt =
            sessionStorage.getItem("__dev_fp_salt") ?? crypto.randomUUID();
          sessionStorage.setItem("__dev_fp_salt", sessionSalt);
          return `${result.visitorId}-${sessionSalt}`;
        }
        return result.visitorId;
      });
  }
  return fpPromise;
}
