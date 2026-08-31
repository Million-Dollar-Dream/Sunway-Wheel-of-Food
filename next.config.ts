import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev server is bound to 0.0.0.0 so preview and local Chrome
  // (127.0.0.1) are not treated as the same origin as the listen host.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
