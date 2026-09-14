import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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