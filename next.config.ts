import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // deploy time ignore ESLint
  },
};

export default nextConfig;
