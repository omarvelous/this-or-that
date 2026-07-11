import { nanoid } from "nanoid";

/** Generates the 8-character URL-safe short ID used in poll URLs. */
export function generateShortId(): string {
  return nanoid(8);
}
