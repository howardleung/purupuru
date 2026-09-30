/** Baseline CSP preserves Next's static shell and Clerk's CSS-in-JS/modal flow. */
export const PRODUCT_IMAGE_HOSTS = [
  "beautyofjoseon.com",
  "cdn.shopify.com",
  "japanesetaste.ca",
  "kiyoko.ca",
  "koreanbeauty.ca",
  "roundlab.co.kr",
  "roundlab.com",
  "sv5-cdn.stylevana.com",
  "thekshop.ca",
  "www.cosrx.com",
  "www.matsukiyococokara-online.com",
  "www.shiseido.co.jp",
] as const;

export function securityHeaders(production: boolean, publishableKey?: string) {
  let clerkOrigin = "";
  if (publishableKey && /^pk_(test|live)_/.test(publishableKey)) {
    const host = Buffer.from(publishableKey.replace(/^pk_(test|live)_/, ""), "base64")
      .toString("utf8").replace(/\$$/, "");
    if (/^[a-zA-Z0-9.-]+$/.test(host) && host.includes(".")) clerkOrigin = `https://${host}`;
  }
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' ${production ? "" : "'unsafe-eval'"} ${clerkOrigin} https://challenges.cloudflare.com https://*.protect.clerk.com`,
    "style-src 'self' 'unsafe-inline'",
    `connect-src 'self' ${clerkOrigin} https://clerk-telemetry.com https://*.clerk-telemetry.com https://*.protect.clerk.com:* ${production ? "" : "ws://localhost:* ws://127.0.0.1:*"}`,
    `img-src 'self' data: blob: https://img.clerk.com https://images.clerk.dev ${PRODUCT_IMAGE_HOSTS.map((host) => `https://${host}`).join(" ")}`,
    "font-src 'self' data:",
    "worker-src 'self' blob:",
    "frame-src 'self' https://challenges.cloudflare.com https://*.protect.clerk.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(production ? ["upgrade-insecure-requests"] : []),
  ].map((directive) => directive.trim().replace(/\s+/g, " ")).join("; ");
  return [
    { key: "Content-Security-Policy", value: csp },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ...(production ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }] : []),
  ];
}
