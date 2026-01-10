/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  eslint: {
    // Désactive complètement les vérifications ESLint pendant le build
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
