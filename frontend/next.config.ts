import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",          // any request to /api/... in Next.js
        destination: "http://127.0.0.1:8000/api/:path*/", // forward to Django with trailing slash
      },
    ];
  },
};

export default nextConfig;
