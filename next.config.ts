import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cacheComponents / partialPrefetching are off: with them on, any Server Component page
  // (the auth-gated home page) sent the client router into an unbounded render loop that
  // exhausted browser memory ("Aw, Snap! Out of Memory"). Revisit after upgrading Next.js.
  // Hide the dev-mode route badge; it overlaps the top bar's theme toggle.
  // Compile/runtime errors are still shown.
  devIndicators: false,
};

export default nextConfig;
