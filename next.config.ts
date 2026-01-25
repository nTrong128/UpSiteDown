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
    // Configure body size limit for Server Actions to 4MB
    // This matches the MAX_FILE_SIZE used for client-side resizing
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
};

export default nextConfig;
