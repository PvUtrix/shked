import { test, expect } from '@playwright/test'
import { ACCOUNTS, fillLogin, login, logoutButton, t } from './support/session'

test.describe('Authentication', () => {
  test('shows the login form', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText(t.auth.login.title)).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('lists the demo accounts that the seed creates', async ({ page }) => {
    await page.goto('/login')
    for (const account of Object.values(ACCOUNTS)) {
      await expect(page.getByText(account.email, { exact: false }).first()).toBeVisible()
    }
  })

  for (const role of ['admin', 'student', 'lector', 'mentor'] as const) {
    test(`signs in the ${role} and opens their home page`, async ({ page }) => {
      await login(page, role)
    })
  }

  test('rejects wrong credentials and stays on the login page', async ({ page }) => {
    await fillLogin(page, 'wrong@example.com', 'wrongpassword')
    await page.locator('button[type="submit"]').click()
    await expect(page.getByText(t.auth.login.invalidCredentials).first()).toBeVisible({ timeout: 10000 })
    await expect(page).toHaveURL(/\/login/)
  })

  test('does not submit an empty form', async ({ page }) => {
    await page.goto('/login')
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL(/\/login/)
  })

  test('signs out back to the login page', async ({ page }) => {
    await login(page, 'admin')
    await Promise.all([page.waitForURL(/\/login/, { timeout: 15000 }), logoutButton(page).click()])
    await expect(page.getByText(t.auth.login.title)).toBeVisible()
  })

  test('redirects a signed-out visitor from a protected page to login', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForURL(/\/login/, { timeout: 15000 })
    await expect(page.getByText(t.auth.login.title)).toBeVisible()
  })

  test('keeps a student out of the admin pages', async ({ page }) => {
    await login(page, 'student')
    await page.goto('/admin')
    await expect(page).not.toHaveURL(/\/admin(\/|$)/, { timeout: 15000 })
  })

  test('keeps the session after a reload', async ({ page }) => {
    await login(page, 'admin')
    await page.reload()
    await expect(page).toHaveURL(/\/admin/)
  })
})
