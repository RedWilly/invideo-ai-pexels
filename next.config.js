/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'output: export' to support API routes
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  // Add rewrites to proxy backend requests without exposing the backend URL
  async rewrites() {
    return [
      {
        source: '/api/process',
        destination: 'http://localhost:3001/process-script',
      },
    ];
  },
};

module.exports = nextConfig;
