import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const outDir = path.join(__dirname, '../docs/tutorials/assets');

test.describe('Generate Screenshots for Tutorials', () => {
  // Увеличим таймаут
  test.setTimeout(60000);

  test.beforeAll(() => {
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
  });

  const takeScreenshot = async (page: any, filename: string) => {
    await page.waitForTimeout(2000); 
    await page.screenshot({ path: path.join(outDir, filename), fullPage: true });
  };

  test('Public Pages', async ({ page }) => {
    await page.goto('/');
    await takeScreenshot(page, 'homepage_1766511236627.png');
    
    await page.goto('/login');
    await takeScreenshot(page, 'login_page_1766511327251.png');
  });

  test('Student Screenshots', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="Email"]', 'student123@demo.com');
    await page.fill('input[placeholder="Пароль"]', 'student123');
    await Promise.all([
      page.waitForURL('**/student**', { timeout: 20000 }),
      page.click('button:has-text("Войти")')
    ]);

    await takeScreenshot(page, 'student_progress_stats.png');

    await page.goto('/student');
    await takeScreenshot(page, 'student_schedule_view.png');

    await page.goto('/student/calendar');
    await takeScreenshot(page, 'student_calendar_view.png');

    await page.goto('/student/homework');
    await takeScreenshot(page, 'student_homework_list.png');

    try {
      const hwLocator = page.locator('a[href*="/student/homework/"]').first();
      await hwLocator.waitFor({ state: 'visible', timeout: 5000 });
      const hwLink = await hwLocator.getAttribute('href');
      if (hwLink) {
        await page.goto(hwLink);
        await takeScreenshot(page, 'student_homework_submit.png');
      }
    } catch(e) { console.log('No homework found'); }
    
    try {
      await page.goto('/student/homework');
      await page.click('button:has-text("Проверенные"), a:has-text("Проверенные")');
      await page.waitForTimeout(2000);
      const hwLocator = page.locator('a[href*="/student/homework/"]').first();
      await hwLocator.waitFor({ state: 'visible', timeout: 5000 });
      const reviewedHwLink = await hwLocator.getAttribute('href');
      if (reviewedHwLink) {
        await page.goto(reviewedHwLink);
        await takeScreenshot(page, 'student_homework_feedback.png');
      }
    } catch(e) { console.log('No reviewed homework found'); }

    await page.goto('/student/profile');
    await takeScreenshot(page, 'student_telegram_link.png');
  });

  test('Teacher Screenshots', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="Email"]', 'lector@demo.com');
    await page.fill('input[placeholder="Пароль"]', 'lector123');
    await Promise.all([
      page.waitForURL('**/lector**', { timeout: 20000 }),
      page.click('button:has-text("Войти")')
    ]);

    await page.goto('/lector');
    await takeScreenshot(page, 'teacher_schedule_overview.png');

    await page.goto('/lector/attendance');
    await takeScreenshot(page, 'teacher_attendance_mark.png');

    await page.goto('/lector/homework');
    await takeScreenshot(page, 'teacher_homework_create.png');

    try {
      await page.click('button:has-text("На проверке"), a:has-text("На проверке")');
      await page.waitForTimeout(2000);
      const subLocator = page.locator('a[href*="/submissions/"]').first();
      await subLocator.waitFor({ state: 'visible', timeout: 5000 });
      const submissionLink = await subLocator.getAttribute('href');
      if (submissionLink) {
        await page.goto(submissionLink);
        await takeScreenshot(page, 'teacher_homework_review.png');
      }
    } catch(e) { console.log('No submissions found'); }

    await page.goto('/lector/exams');
    await takeScreenshot(page, 'teacher_exam_management.png');

    await page.goto('/lector/profile');
    await takeScreenshot(page, 'teacher_telegram_link.png');
  });

  test('Admin Screenshots', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="Email"]', 'admin@shked.com');
    await page.fill('input[placeholder="Пароль"]', 'admin123');
    await Promise.all([
      page.waitForURL('**/admin**', { timeout: 20000 }),
      page.click('button:has-text("Войти")')
    ]);

    await page.goto('/admin');
    await takeScreenshot(page, 'admin_dashboard_stats.png');

    await page.goto('/admin/users');
    await takeScreenshot(page, 'admin_users_management.png');

    await page.goto('/admin/groups');
    await takeScreenshot(page, 'admin_group_create.png');

    await page.goto('/admin/subjects');
    await takeScreenshot(page, 'admin_subject_lector.png');

    await page.goto('/admin/schedule');
    await takeScreenshot(page, 'admin_schedule_manage.png');

    await page.goto('/admin/settings');
    await takeScreenshot(page, 'admin_telegram_config.png');
  });

  test('Mentor Screenshots', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="Email"]', 'mentor@demo.com');
    await page.fill('input[placeholder="Пароль"]', 'mentor123');
    await Promise.all([
      page.waitForURL('**/mentor**', { timeout: 20000 }),
      page.click('button:has-text("Войти")')
    ]);

    await page.goto('/mentor');
    await takeScreenshot(page, 'mentor_attention_needed.png');

    await page.goto('/mentor/students');
    await takeScreenshot(page, 'mentor_students_list.png');

    await page.goto('/mentor/homework');
    await takeScreenshot(page, 'mentor_homework_tracking.png');

    try {
      const subLocator = page.locator('a[href*="/submissions/"]').first();
      await subLocator.waitFor({ state: 'visible', timeout: 5000 });
      const submissionLink = await subLocator.getAttribute('href');
      if (submissionLink) {
        await page.goto(submissionLink);
        await takeScreenshot(page, 'mentor_homework_view.png');
      }
    } catch(e) { console.log('No submissions found'); }

    await page.goto('/mentor/schedule');
    await takeScreenshot(page, 'mentor_schedule_view.png');

    await page.goto('/mentor/profile').catch(() => {});
    await takeScreenshot(page, 'mentor_telegram_alerts.png');
  });

  test('Department Head Screenshots', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="Email"]', 'head@demo.com');
    await page.fill('input[placeholder="Пароль"]', 'head123');
    await Promise.all([
      page.waitForURL('**/department**', { timeout: 20000 }),
      page.click('button:has-text("Войти")')
    ]);

    await page.goto('/department');
    await takeScreenshot(page, 'dept_head_dashboard.png');

    await page.goto('/department/subjects');
    await takeScreenshot(page, 'dept_head_subjects_lectors.png');

    await page.goto('/department/reports');
    await takeScreenshot(page, 'dept_head_reports.png');
  });
});
