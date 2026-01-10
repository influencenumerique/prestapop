/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  eslint: {
    // Ne bloque pas le build à cause des erreurs ESLint
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
