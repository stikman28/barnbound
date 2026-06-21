import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Slim, self-contained build for the production Docker image.
  output: "standalone",
  // Keep node-postgres out of the bundle (it has optional native bits).
  serverExternalPackages: ["pg"],
};

export default nextConfig;
