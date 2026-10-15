import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  async redirects() {
    return [
      {
        source: "/tools",
        destination: "/resources",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;