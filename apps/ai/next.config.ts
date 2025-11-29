import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  outputFileTracingRoot: __dirname + "/../..", // Point to the Monorepo root directory
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatar.vercel.sh",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true, // deploy time ignore ESLint
  },
};

export default nextConfig;
