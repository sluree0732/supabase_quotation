import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@react-pdf/renderer'],
  outputFileTracingIncludes: {
    '/api/pdf': ['./public/fonts/**/*', './public/images/**/*'],
    '/api/contract-pdf': ['./public/fonts/**/*', './public/images/**/*'],
  },
};

export default nextConfig;
