import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['satori', 'sharp', 'pdf-lib'],
};

export default nextConfig;
