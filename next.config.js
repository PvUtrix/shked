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
  // Отключаем минификацию в development для лучшей отладки
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.optimization.minimize = false
    }
    return config
  },
}

module.exports = createNextIntlPlugin(nextConfig)
