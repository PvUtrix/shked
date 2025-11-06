// Расширение типов для Jest и @testing-library/jest-dom
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'
import '@jest/globals'

type CustomMatchers<R = unknown> = TestingLibraryMatchers<string, R>

declare global {
  namespace jest {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
    interface Matchers<R = void, _T = unknown> extends CustomMatchers<R> {}
    interface Expect extends CustomMatchers {}
  }
}

// Также расширяем для @jest/globals
declare module '@jest/globals' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
  interface Matchers<R extends void | Promise<void> = void, _T = unknown> extends CustomMatchers<R> {}
}

