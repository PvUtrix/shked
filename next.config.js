/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Включаем детальные ошибки в development режиме
  reactStrictMode: true,
  swcMinify: false,
  // Отключаем минификацию в development для лучшей отладки
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.optimization.minimize = false
    }
    return config
  },
}

module.exports = nextConfig
