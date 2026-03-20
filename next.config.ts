import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    // Keep a generous body size limit for metadata and other API routes.
    // Image files are uploaded directly to Cloudinary from the browser,
    // so they never pass through this serverless function.
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
