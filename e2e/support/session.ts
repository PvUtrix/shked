import { expect, type Page } from '@playwright/test'
import ru from '../../messages/ru.json'

/**
 * Shared E2E helpers. UI text comes from the same message catalogue the app
 * renders (messages/ru.json), so the specs never hard-code interface text.
 */

export const t = ru

/** Demo accounts created by scripts/seed.ts, with the page each lands on. */
export const ACCOUNTS = {
  admin: { email: 'admin@shked.com', password: 'admin123', home: '/admin' },
  student: { email: 'student@demo.com', password: 'student123', home: '/student' },
  lector: { email: 'lector@demo.com', password: 'lector123', home: '/lector' },
  mentor: { email: 'mentor@demo.com', password: 'mentor123', home: '/mentor' },
} as const

export type Role = keyof typeof ACCOUNTS

export async function fillLogin(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
}

/** Sign in as a demo account and wait for its home page. */
export async function login(page: Page, role: Role) {
  const account = ACCOUNTS[role]
  await fillLogin(page, account.email, account.password)
  await Promise.all([
    page.waitForURL((url) => url.pathname.startsWith(account.home), { timeout: 30000 }),
    page.locator('button[type="submit"]').click(),
  ])
  await expect(page).toHaveURL(new RegExp(`${account.home}(/|$)`))
}

/** The visible logout button (layouts render one per breakpoint). */
export function logoutButton(page: Page) {
  return page.getByTestId('logout-button').locator('visible=true').first()
}
