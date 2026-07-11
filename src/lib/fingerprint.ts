"use client";

import FingerprintJS from "@fingerprintjs/fingerprintjs";

let fpPromise: Promise<string> | null = null;

/**
 * Returns a stable visitor ID from FingerprintJS.
 * The agent is loaded lazily and cached for the lifetime of the page.
 */
export function getVisitorId(): Promise<string> {
  if (!fpPromise) {
    fpPromise = FingerprintJS.load()
      .then((fp) => fp.get())
      .then((result) => result.visitorId);
  }
  return fpPromise;
}
