import path from "node:path";

import type { NextConfig } from "next";
import { PRODUCT_IMAGE_HOSTS, securityHeaders } from "./lib/security-headers";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: { serverActions: { bodySizeLimit: "64kb" } },
  outputFileTracingRoot: path.join(__dirname, "../.."),
  outputFileTracingIncludes: {
    "/*": ["../../node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/*"],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders(
      process.env.NODE_ENV === "production", process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    ) }];
  },
  transpilePackages: ["@beauty-platform/database", "@beauty-platform/domain"],
  images: {
    remotePatterns: PRODUCT_IMAGE_HOSTS.map((hostname) => ({
      protocol: "https" as const,
      hostname,
    })),
  },
};

export default nextConfig;
