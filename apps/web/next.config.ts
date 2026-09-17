import type { NextConfig } from "next";
import { securityHeaders } from "./lib/security-headers";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: { serverActions: { bodySizeLimit: "64kb" } },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders(
      process.env.NODE_ENV === "production", process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    ) }];
  },
  transpilePackages: ["@beauty-platform/database", "@beauty-platform/domain"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "roundlab.com",
        pathname: "/cdn/shop/files/**",
      },
      {
        protocol: "https",
        hostname: "www.shiseido.co.jp",
        pathname: "/anessa/products/suncare/**",
      },
    ],
  },
};

export default nextConfig;
