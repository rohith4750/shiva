import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Hide the dev-mode route badge; it overlaps the top bar's theme toggle.
  // Compile/runtime errors are still shown.
  devIndicators: false,
};

export default nextConfig;
