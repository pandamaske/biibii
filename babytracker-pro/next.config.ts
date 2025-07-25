import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  outputFileTracing: false,
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma']
  }
};

export default nextConfig;
