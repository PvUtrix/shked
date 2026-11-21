import { test, expect } from '@playwright/test'
import { login } from './support/session'
import ru from '../messages/ru.json'

test('education office opens the student list from its dashboard', async ({ page }) => {
  await login(page, 'eduoffice')
  await page.getByRole('link', { name: ru.educationOffice.dashboard.studentsTitle }).first().click()
  await expect(page).toHaveURL(/\/education-office\/students$/)
  await expect(page.getByRole('heading', { level: 1, name: ru.educationOffice.students.title })).toBeVisible({ timeout: 15000 })
  // The seed has at least one student.
  await expect(page.getByText('student@demo.com')).toBeVisible()
})
