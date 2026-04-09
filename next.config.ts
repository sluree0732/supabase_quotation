import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@react-pdf/renderer'],
  outputFileTracingIncludes: {
    '/api/pdf': ['./public/fonts/**/*'],
  },
};

export default nextConfig;
