import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import rehypeHighlight from "rehype-highlight";

// 配置 MDX
const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    rehypePlugins: [rehypeHighlight],
  },
});

// 基础 Next 配置
const nextConfig: NextConfig = {
  // pageExtensions: ["ts", "tsx", "mdx"],
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
  // 如果之前有别的配置（如 experimental、images 等），也加在这里
};

export default withMDX(nextConfig);
