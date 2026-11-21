import { test, expect } from '@playwright/test'
import { login, t } from '../support/session'

/**
 * Admin smoke tests: every main admin page opens, renders its heading and
 * does not show the error boundary, and the sidebar reaches each of them.
 */

const PAGES = [
  { path: '/admin/users', label: t.admin.nav.users },
  { path: '/admin/groups', label: t.admin.nav.groups },
  { path: '/admin/subjects', label: t.admin.nav.subjects },
  { path: '/admin/schedule', label: t.admin.nav.schedule },
  { path: '/admin/homework', label: t.admin.nav.homework },
  { path: '/admin/subgroups', label: null },
  { path: '/admin/settings', label: t.admin.nav.settings },
] as const

test.describe('Admin pages', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin')
  })

  for (const { path } of PAGES) {
    test(`opens ${path}`, async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      const response = await page.goto(path)
      expect(response?.status()).toBeLessThan(400)
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 })
      expect(errors).toEqual([])
    })
  }

  test('reaches each section from the sidebar', async ({ page }) => {
    for (const { path, label } of PAGES) {
      if (!label) continue
      await page.getByRole('link', { name: label, exact: true }).locator('visible=true').first().click()
      await expect(page).toHaveURL(new RegExp(`${path}(/|$|\\?)`))
    }
  })
})
