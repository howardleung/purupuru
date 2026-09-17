/** Persisted source metadata is still untrusted at the browser navigation boundary. */
export function safeExternalUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 2048 || /[\u0000-\u0020\u007f]/.test(value)) {
    return undefined;
  }
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password
      ? url.href : undefined;
  } catch {
    return undefined;
  }
}
