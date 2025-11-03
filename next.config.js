const createNextIntlPlugin = require('next-intl/plugin')(
  './i18n/request.ts'
)

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Включаем детальные ошибки в development режиме
  reactStrictMode: true,
  // Отключаем строгую проверку типов в production build (ускоряет сборку)
  typescript: {
    // Предупреждение: Это отключает проверку типов во время production build
    // TypeScript должен проверяться в CI/CD pipeline отдельно
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
