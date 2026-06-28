import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Allows production builds to complete even if TypeScript errors exist.
    // TODO: Remove this once all type errors are resolved.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Allows production builds to complete even if ESLint errors exist.
    // TODO: Remove this once all lint errors are resolved.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
