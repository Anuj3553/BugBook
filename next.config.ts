import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 30,
    },
  },
  // Describe in the lucia documentation
  serverExternalPackages: ["@node-rs/argon2"],
};

export default nextConfig;
