import { test, expect } from '@playwright/test'
import { login, t } from '../support/session'

/**
 * Admin smoke tests: every main admin page opens, renders its heading and
 * does not show the error boundary, and the sidebar reaches each of them.
 */

const PAGES = [
  '/admin',
  '/admin/users',
  '/admin/groups',
  '/admin/subjects',
  '/admin/schedule',
  '/admin/homework',
  '/admin/subgroups',
  '/admin/settings',
] as const

test.describe('Admin pages', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin')
  })

  for (const path of PAGES) {
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
    // The sidebar's schedule item is the admin home page.
    const SIDEBAR = [
      { label: t.admin.nav.users, url: /\/admin\/users(\/|$|\?)/ },
      { label: t.admin.nav.groups, url: /\/admin\/groups(\/|$|\?)/ },
      { label: t.admin.nav.subjects, url: /\/admin\/subjects(\/|$|\?)/ },
      { label: t.admin.nav.homework, url: /\/admin\/homework(\/|$|\?)/ },
      { label: t.admin.nav.settings, url: /\/admin\/settings(\/|$|\?)/ },
      { label: t.admin.nav.schedule, url: /\/admin(\?|$)/ },
    ]
    for (const { label, url } of SIDEBAR) {
      await page.getByRole('link', { name: label, exact: true }).locator('visible=true').first().click()
      await expect(page).toHaveURL(url)
    }
  })
})
