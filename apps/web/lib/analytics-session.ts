export const ANALYTICS_SESSION_IDLE_MS = 30 * 60 * 1000;
export const ANALYTICS_SESSION_MAX_MS = 24 * 60 * 60 * 1000;

/** RFC 9562 UUIDv7: 48-bit Unix milliseconds, version 7, RFC variant, 74 random bits.
 * PostHog requires the embedded timestamp to start the session's event window.
 */
export function analyticsSessionId(timestamp: number, entropy = crypto.getRandomValues(new Uint8Array(16))) {
  if (!Number.isSafeInteger(timestamp) || timestamp < 0 || timestamp > 0xffffffffffff || entropy.length !== 16) {
    throw new Error("Invalid analytics session timestamp or entropy.");
  }
  const bytes = new Uint8Array(entropy);
  let milliseconds = timestamp;
  for (let index = 5; index >= 0; index--) {
    bytes[index] = milliseconds % 256;
    milliseconds = Math.floor(milliseconds / 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
