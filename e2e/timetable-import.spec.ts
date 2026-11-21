import { test, expect } from '@playwright/test'
import { buildTimetableWorkbookBytes } from '../__tests__/fixtures/timetable-workbook'
import { login, logoutButton, t } from './support/session'

/**
 * The single-source-of-truth path, end to end: an admin imports the
 * programme workbook; a student then sees the deadlines with where to submit
 * them, and their personal calendar feed carries the imported classes.
 */

test.describe.configure({ mode: 'serial' })

const inDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10)

test('admin imports the timetable; the student gets deadlines and a calendar feed', async ({ page, request }) => {
  test.setTimeout(120000)

  // --- admin: read, preview, apply ------------------------------------------
  await login(page, 'admin')
  await page.goto('/admin/timetable')
  await page.locator('#timetable-file').setInputFiles({
    name: 'timetable.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: buildTimetableWorkbookBytes(inDays(7)),
  })
  await page.getByRole('button', { name: t.admin.timetable.read }).click()

  await expect(page.locator('#sheet-timetable')).toHaveValue('Timetable')
  await expect(page.locator('#sheet-deadlines')).toHaveValue('Deadlines')
  await expect(page.locator('#sheet-placement')).toHaveValue('Placement')
  const group = page.locator('#import-group')
  if (!(await group.inputValue())) await group.selectOption({ index: 1 })
  await page.locator('#semester-number').fill('3')
  await page.locator('#semester-title').fill('E2E semester')

  await page.getByRole('button', { name: t.admin.timetable.preview }).click()
  await expect(page.getByText(t.admin.timetable.resultTitle)).toBeVisible({ timeout: 30000 })
  await page.getByRole('button', { name: t.admin.timetable.apply, exact: true }).click()
  await expect(page.getByText(t.admin.timetable.applied).first()).toBeVisible({ timeout: 60000 })

  await Promise.all([page.waitForURL(/\/login/), logoutButton(page).click()])

  // --- student: deadlines page -------------------------------------------------
  await login(page, 'student')
  await page.goto('/student/deadlines')
  const deadline = page.getByTestId('deadline').filter({ hasText: 'Finance and investment' })
  await expect(deadline).toBeVisible({ timeout: 15000 })
  await expect(deadline.getByRole('link', { name: 'https://forms.gle/abc123' })).toBeVisible()

  // --- student: calendar feed -----------------------------------------------------
  // Wait for the card's own request, so the page is hydrated before clicking.
  await Promise.all([
    page.waitForResponse((r) => r.url().endsWith('/api/profile/calendar') && r.request().method() === 'GET'),
    page.goto('/student/calendar'),
  ])
  const card = page.getByTestId('calendar-subscription')
  const create = card.getByRole('button', { name: t.student.calendarFeed.create })
  if (await create.isVisible()) {
    await Promise.all([
      page.waitForResponse((r) => r.url().endsWith('/api/profile/calendar') && r.request().method() === 'POST'),
      create.click(),
    ])
  }
  const url = await card.getByRole('textbox').inputValue()
  expect(url).toMatch(/\/api\/calendar\/[A-Za-z0-9_-]{24,}$/)

  const feed = await request.get(new URL(url).pathname)
  expect(feed.status()).toBe(200)
  expect(feed.headers()['content-type']).toContain('text/calendar')
  const ics = await feed.text()
  expect(ics).toContain('BEGIN:VCALENDAR')
  // A whole-group class and a deadline the student must see.
  expect(ics).toContain('Tutorial. Topic 2')
  expect(ics).toContain('Finance and investment')
  for (const line of ics.split('\r\n')) expect(Buffer.byteLength(line)).toBeLessThanOrEqual(75)

  // An unknown token is not a feed.
  expect((await request.get('/api/calendar/not-a-real-token-but-long-enough')).status()).toBe(404)
})
