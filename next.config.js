const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/.well-known/:path*',
        destination: '/api/well-known/:path*',
      },
    ]
  },
  webpack: (config) => {
    // Shim @react-native-async-storage/async-storage for @metamask/sdk
    config.resolve.alias['@react-native-async-storage/async-storage'] = path.resolve(
      __dirname,
      'src/lib/async-storage-shim.js'
    )
    return config
  },
}

module.exports = nextConfig
