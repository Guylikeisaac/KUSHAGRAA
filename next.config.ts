import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // a stray lockfile in the home folder confuses workspace-root detection
  turbopack: { root: process.cwd() },
  // hide the "N" dev-tools button while previewing locally (errors still surface)
  devIndicators: false,
};

export default nextConfig;
