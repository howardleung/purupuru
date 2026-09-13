import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@beauty-platform/database", "@beauty-platform/domain"],
};

export default nextConfig;
