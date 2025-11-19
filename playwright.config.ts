import { defineConfig, devices } from '@playwright/test'

/**
 * Конфигурация Playwright для e2e тестов
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Директория с тестами
  testDir: './e2e',
  
  // Запускать тесты последовательно в одном файле
  fullyParallel: true,
  
  // Не запускать тесты при наличии ошибок в CI
  forbidOnly: !!process.env.CI,
  
  // Количество повторов при провале
  retries: process.env.CI ? 2 : 0,
  
  // Количество параллельных воркеров
  workers: process.env.CI ? 1 : undefined,
  
  // Репортер для вывода результатов
  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  
  // Общие настройки для всех проектов
  use: {
    // Базовый URL для тестов
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    
    // Собирать trace при провале теста
    trace: 'on-first-retry',
    
    // Скриншот при провале
    screenshot: 'only-on-failure',
    
    // Видео при провале
    video: 'retain-on-failure',
  },

  // Настройка проектов (разные браузеры)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Мобильные браузеры (опционально)
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  // Веб-сервер для тестов (запускать автоматически)
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      // Используем тестовую БД или DATABASE_URL из окружения
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'test-secret-for-e2e-tests',
    },
  },
})

