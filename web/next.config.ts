import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'}/:path*`
      },
      {
        source: '/media/:path*',
        destination: 'http://127.0.0.1:8000/media/:path*'
      }
    ];
  }
};

export default nextConfig;
