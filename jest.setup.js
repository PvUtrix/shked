// Подключаем matchers от @testing-library/jest-dom
import '@testing-library/jest-dom'

// Полифиллы для MSW (Mock Service Worker)
// MSW требует глобальные объекты fetch API
import { TextEncoder, TextDecoder } from 'util'
import { ReadableStream, TransformStream } from 'stream/web'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
global.ReadableStream = ReadableStream
global.TransformStream = TransformStream

// Полифиллы для fetch API (если не установлены)
if (typeof global.fetch === 'undefined') {
  global.fetch = require('node-fetch')
}

if (typeof global.Headers === 'undefined') {
  global.Headers = require('node-fetch').Headers
}

if (typeof global.Request === 'undefined') {
  global.Request = require('node-fetch').Request
}

if (typeof global.Response === 'undefined') {
  global.Response = require('node-fetch').Response
}

// Расширяем типы Jest для использования с testing-library
/// <reference types="@testing-library/jest-dom" />

// Мокаем Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Мокаем next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }) => children,
}))

// Мокаем переменные окружения для тестов
// Используем невалидный DATABASE_URL для предотвращения подключения к БД в юнит-тестах
// В юнит-тестах Prisma должен быть замокан через jest.mock в самих тестах
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-only'
process.env.NEXTAUTH_URL = 'http://localhost:3000'

// Глобальный timeout для тестов
jest.setTimeout(30000)

// Подавляем console.error в тестах (опционально)
// const originalError = console.error
// beforeAll(() => {
//   console.error = (...args) => {
//     if (
//       typeof args[0] === 'string' &&
//       args[0].includes('Warning: ReactDOM.render')
//     ) {
//       return
//     }
//     originalError.call(console, ...args)
//   }
// })

// afterAll(() => {
//   console.error = originalError
// })

