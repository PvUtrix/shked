const createNextIntlPlugin = require('next-intl/plugin')(
  './i18n/request.ts'
)

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Включаем детальные ошибки в development режиме
  reactStrictMode: true,
  // Временно отключаем строгую проверку типов для постепенной миграции
  // TODO: Включить после исправления всех ошибок в TYPESCRIPT_FIXES_NEEDED.md
  typescript: {
    // See TYPESCRIPT_FIXES_NEEDED.md for list of errors to fix
    ignoreBuildErrors: true,
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
