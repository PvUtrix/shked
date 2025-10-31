const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Путь к Next.js приложению для загрузки next.config.js и .env файлов
  dir: './',
})

// Кастомная конфигурация Jest
const customJestConfig = {
  // Setup файл для настройки тестового окружения
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Тестовое окружение
  testEnvironment: 'jest-environment-jsdom',
  
  // Паттерны для поиска тестов
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  
  // Игнорируемые папки
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/e2e/'
  ],
  
  // Маппинг путей (соответствует tsconfig.json)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  
  // Покрытие кода
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/jest.config.js',
  ],
  
  // Порог покрытия (можно настроить позже)
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  
  // Трансформация файлов
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
      },
    }],
  },
  
  // Поддержка ESM модулей
  transformIgnorePatterns: [
    'node_modules/(?!(@mswjs|msw|until-async|react-markdown|remark-gfm|unified|bail|is-plain-obj|trough|vfile|unist-.*|mdast-.*|micromark.*|decode-named-character-reference|character-entities|property-information|hast-.*|space-separated-tokens|comma-separated-tokens|pretty-bytes|ccount|escape-string-regexp|markdown-table)/)',
  ],
}

// createJestConfig экспортируется таким образом, чтобы next/jest мог загрузить Next.js config
module.exports = createJestConfig(customJestConfig)

