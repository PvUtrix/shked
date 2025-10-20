import { setupServer } from 'msw/node'
import { handlers } from './handlers'

/**
 * MSW сервер для Node.js окружения (Jest тесты)
 */
export const server = setupServer(...handlers)

