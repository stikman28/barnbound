import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep node-postgres out of the bundle (it has optional native bits).
  serverExternalPackages: ["pg"],
};

export default nextConfig;
