import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ["localhost"],
    unoptimized: process.env.NODE_ENV === "production", // Disable optimization in production
  },
  // Ensure static files are properly served
  trailingSlash: false,
  output: process.env.NODE_ENV === "production" ? "standalone" : undefined,
};

export default nextConfig;
