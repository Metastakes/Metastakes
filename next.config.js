/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // i18n configuration
  i18n: {
    locales: ['en', 'es'],
    defaultLocale: 'en',
  },

  // Image optimization
  images: {
    domains: ['storage.googleapis.com'], // GCS for patient photos, etc.
    formats: ['image/avif', 'image/webp'],
  },

  // Environment variables exposed to browser
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Add custom webpack config if needed
    return config
  },

  // Output configuration for Cloud Run
  output: 'standalone',
}

module.exports = nextConfig
