import type { NextConfig } from "next";
  import path from "path";

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
  };

  export default nextConfig;