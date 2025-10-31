import { test, expect } from '@playwright/test'

test.describe('Аутентификация', () => {
  test.beforeEach(async ({ page }) => {
    // Переходим на страницу логина перед каждым тестом
    await page.goto('/login')
  })

  test('должен показывать форму логина', async ({ page }) => {
    // Проверяем наличие элементов формы
    await expect(page.getByText('Вход в систему')).toBeVisible()
    await expect(page.getByPlaceholder('Email')).toBeVisible()
    await expect(page.getByPlaceholder('Пароль')).toBeVisible()
    await expect(page.getByRole('button', { name: /войти/i })).toBeVisible()
  })

  test('должен показывать демо аккаунты', async ({ page }) => {
    await expect(page.getByText('Демо аккаунты')).toBeVisible()
    await expect(page.getByText(/admin@shked.com/i)).toBeVisible()
    await expect(page.getByText(/student123@demo.com/i)).toBeVisible()
  })

  test('должен успешно логинить админа', async ({ page }) => {
    // Вводим credentials
    await page.getByPlaceholder('Email').fill('admin@shked.com')
    await page.getByPlaceholder('Пароль').fill('admin123')
    
    // Ждем навигации после клика с Promise.all для более надежного перехвата
    // Увеличиваем таймаут, так как нужно время на установку cookie сессии
    await Promise.all([
      page.waitForURL('/admin', { timeout: 20000 }),
      page.getByRole('button', { name: /войти/i }).click()
    ])
    
    // Проверяем, что мы на странице админа
    await expect(page.getByText(/админ/i)).toBeVisible({ timeout: 5000 })
  })

  test('должен успешно логинить студента', async ({ page }) => {
    await page.getByPlaceholder('Email').fill('student123@demo.com')
    await page.getByPlaceholder('Пароль').fill('student123')
    
    // Ждем навигации после клика с Promise.all для более надежного перехвата
    await Promise.all([
      page.waitForURL('/student', { timeout: 20000 }),
      page.getByRole('button', { name: /войти/i }).click()
    ])
    
    // Проверяем, что мы на странице студента
    await expect(page).toHaveURL(/\/student/)
  })

  test('должен успешно логинить преподавателя', async ({ page }) => {
    await page.getByPlaceholder('Email').fill('lector@demo.com')
    await page.getByPlaceholder('Пароль').fill('lector123')
    
    // Ждем навигации после клика с Promise.all для более надежного перехвата
    await Promise.all([
      page.waitForURL('/lector', { timeout: 20000 }),
      page.getByRole('button', { name: /войти/i }).click()
    ])
    
    await expect(page).toHaveURL(/\/lector/)
  })

  test('должен успешно логинить ментора', async ({ page }) => {
    await page.getByPlaceholder('Email').fill('mentor@demo.com')
    await page.getByPlaceholder('Пароль').fill('mentor123')
    
    // Ждем навигации после клика с Promise.all для более надежного перехвата
    await Promise.all([
      page.waitForURL('/mentor', { timeout: 20000 }),
      page.getByRole('button', { name: /войти/i }).click()
    ])
    
    await expect(page).toHaveURL(/\/mentor/)
  })

  test('должен показывать ошибку при неверных credentials', async ({ page }) => {
    await page.getByPlaceholder('Email').fill('wrong@example.com')
    await page.getByPlaceholder('Пароль').fill('wrongpassword')
    
    await page.getByRole('button', { name: /войти/i }).click()
    
    // Ждем toast с ошибкой
    await expect(page.getByText(/неверные учетные данные/i)).toBeVisible({ timeout: 5000 })
  })

  test('должен показывать состояние загрузки при логине', async ({ page }) => {
    await page.getByPlaceholder('Email').fill('admin@shked.com')
    await page.getByPlaceholder('Пароль').fill('admin123')
    
    await page.getByRole('button', { name: /войти/i }).click()
    
    // Проверяем состояние загрузки
    await expect(page.getByText('Входим...')).toBeVisible()
  })

  test('должен выходить из системы', async ({ page }) => {
    // Сначала логинимся
    await page.getByPlaceholder('Email').fill('admin@shked.com')
    await page.getByPlaceholder('Пароль').fill('admin123')
    
    await Promise.all([
      page.waitForURL('/admin', { timeout: 20000 }),
      page.getByRole('button', { name: /войти/i }).click()
    ])
    
    // Ищем кнопку выхода
    const logoutButton = page.getByRole('button', { name: /выход/i })
      .or(page.getByText(/выйти/i))
    
    // Ждем редиректа на страницу логина после выхода
    await Promise.all([
      page.waitForURL('/login', { timeout: 10000 }),
      logoutButton.click()
    ])
    
    await expect(page.getByText('Вход в систему')).toBeVisible()
  })

  test('должен блокировать доступ к защищенным страницам без авторизации', async ({ page }) => {
    // Пытаемся перейти на админскую страницу без логина
    await page.goto('/admin')
    
    // Должны быть перенаправлены на страницу логина
    await page.waitForURL('/login', { timeout: 10000 })
    await expect(page.getByText('Вход в систему')).toBeVisible()
  })

  test('должен блокировать доступ студента к админской панели', async ({ page }) => {
    // Логинимся как студент
    await page.getByPlaceholder('Email').fill('student123@demo.com')
    await page.getByPlaceholder('Пароль').fill('student123')
    
    await Promise.all([
      page.waitForURL('/student', { timeout: 20000 }),
      page.getByRole('button', { name: /войти/i }).click()
    ])
    
    // Пытаемся перейти на админскую страницу
    await page.goto('/admin')
    
    // Должны получить ошибку доступа или редирект
    await expect(page.getByText(/запрещен/i).or(page.getByText('Вход в систему'))).toBeVisible({ timeout: 5000 })
  })

  test('не должен отправлять форму с пустыми полями', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /войти/i })
    
    // Пытаемся отправить пустую форму
    await submitButton.click()
    
    // Форма не должна быть отправлена (останемся на странице логина)
    await expect(page).toHaveURL('/login')
  })

  test('должен сохранять сессию после перезагрузки страницы', async ({ page, context }) => {
    // Логинимся
    await page.getByPlaceholder('Email').fill('admin@shked.com')
    await page.getByPlaceholder('Пароль').fill('admin123')
    
    await Promise.all([
      page.waitForURL('/admin', { timeout: 20000 }),
      page.getByRole('button', { name: /войти/i }).click()
    ])
    
    // Перезагружаем страницу
    await page.reload()
    
    // Должны остаться на странице админа
    await expect(page).toHaveURL(/\/admin/)
  })
})

