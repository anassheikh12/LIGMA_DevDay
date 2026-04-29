import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // If 'eslint' causes a red line, just comment it out like this:
  /*
  eslint: {
    ignoreDuringBuilds: true,
  },
  */
};

export default nextConfig;