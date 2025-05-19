
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co', // Keep existing
        port: '',
        pathname: '/**',
      },
      { // Add new hostname for the logo
        protocol: 'https',
        hostname: 'icon2.cleanpng.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
