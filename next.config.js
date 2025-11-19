const createNextIntlPlugin = require('next-intl/plugin')(
  './i18n/request.ts'
)

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Включаем детальные ошибки в development режиме
  reactStrictMode: true,
  // TypeScript strict checking enabled - all technical debt resolved!
  typescript: {
    // Strict type checking enabled after resolving technical debt
    ignoreBuildErrors: false,
  },
  // Security headers
  async headers() {
    return [
      {
        // Apply security headers to all routes
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
            value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
          },
        ],
      },
    ]
  },
  // Отключаем минификацию в development для лучшей отладки
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.optimization.minimize = false
    }
    return config
  },
}

module.exports = createNextIntlPlugin(nextConfig)
