import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 允许从 /tmp 读取日报文件（仅服务端 API routes）
  serverExternalPackages: [],
  // 图片域名配置
  images: {
    remotePatterns: [],
  },
  // 生产构建优化
  compress: true,
};

export default nextConfig;
