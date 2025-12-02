import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  outputFileTracingRoot: __dirname + "/../..", // Point to the Monorepo root directory
};

export default nextConfig;
