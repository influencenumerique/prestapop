/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  eslint: {
    // Désactive complètement ESLint pendant les builds
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
