import type { NextConfig } from "next";
  import path from "path";

  const BACKEND_URL = process.env.BACKEND_URL ?? "https://amueci.ddns.net";

  const nextConfig: NextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: "http",
          hostname: "localhost",
          port: "8080",
        },
        {
          protocol: "https",
          hostname: "**",
        },
      ],
    },
    outputFileTracingRoot: path.join(__dirname),
    async rewrites() {
      return [
        {
          source: "/api/:path*",
          destination: `${BACKEND_URL}/api/:path*`,
        },
        {
          source: "/uploads/:path*",
          destination: `${BACKEND_URL}/uploads/:path*`,
        },
      ];
    },
  };