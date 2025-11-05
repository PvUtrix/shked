const createNextIntlPlugin = require('next-intl/plugin')(
  './i18n/request.ts'
)

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Включаем детальные ошибки в development режиме
  reactStrictMode: true,
  // Включаем проверку типов TypeScript в production build
  typescript: {
    // TypeScript errors will now fail the build
    // This ensures type safety in production
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
