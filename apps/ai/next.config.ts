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
  // Suppress preload warnings in development
  // These warnings occur when Next.js preloads CSS for routes that aren't immediately accessed
  // This is harmless and part of Next.js's automatic optimization
  onDemandEntries: {
    // Keep pages in memory for longer to reduce unnecessary preloads
    maxInactiveAge: 60 * 1000, // 60 seconds
    pagesBufferLength: 5,
  },
};

export default nextConfig;
