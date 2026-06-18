import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the dev server to be accessed from other origins on the LAN
  // (e.g. http://192.168.x.x:3000). Without this, Next blocks dev-only
  // resources from non-localhost origins and client-side code won't run.
  allowedDevOrigins: ["192.168.29.89"],
};

export default nextConfig;
