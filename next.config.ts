import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@unicitylabs/sphere-sdk", "ws"],
};

export default nextConfig;
