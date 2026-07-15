import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile packages that use ESM
  transpilePackages: ['reactflow', '@reactflow/core', '@reactflow/background', '@reactflow/controls', '@reactflow/minimap'],
  
  // Images configuration for placeholder avatars
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
