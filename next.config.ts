import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },
  pageExtensions: ["tsx", "ts", "jsx", "js"],
};

// Wraps the app as an installable PWA: generates a service worker at build
// time (public/sw.js + workbox chunks, git-ignored -- see .gitignore) that
// precaches the app shell and serves it offline. Disabled in development so
// `next dev` behaves normally and a stale cached bundle never masks live
// edits during local work.
const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    disableDevLogs: true,
  },
});

export default withPWA(nextConfig);
