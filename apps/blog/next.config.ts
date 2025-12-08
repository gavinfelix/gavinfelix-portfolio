import type { NextConfig } from "next";
import createMDX from "@next/mdx";

// 配置 MDX
const withMDX = createMDX({
  extension: /\.mdx?$/,
});

// 基础 Next 配置
const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "mdx"],
  // 如果之前有别的配置（如 experimental、images 等），也加在这里
};

export default withMDX(nextConfig);
