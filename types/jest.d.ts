// Расширение типов для Jest и @testing-library/jest-dom
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'

type CustomMatchers<R = unknown> = TestingLibraryMatchers<typeof expect.stringContaining, R>

declare global {
  namespace jest {
    interface Matchers<R = void, T = {}> extends CustomMatchers<R> {}
    interface Expect extends CustomMatchers {}
  }
}

// Также расширяем для @jest/globals
declare module '@jest/globals' {
  interface Matchers<R extends void | Promise<void> = void, T = {}> extends CustomMatchers<R> {}
}

