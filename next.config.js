/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Включаем детальные ошибки в development режиме
  reactStrictMode: true,
  swcMinify: false,
  // Отключаем ESLint в production build (ускоряет сборку)
  eslint: {
    // Предупреждение: Это отключает линтинг во время production build
    // ESLint должен запускаться в CI/CD pipeline отдельно
    ignoreDuringBuilds: true,
  },
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

module.exports = nextConfig
