
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
      { // Added new pattern for cleanpng.com
        protocol: 'https',
        hostname: 'icon2.cleanpng.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
