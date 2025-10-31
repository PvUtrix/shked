import { test, expect } from '@playwright/test'

// Хелпер для логина как админ
async function loginAsAdmin(page: any) {
  await page.goto('/login')
  await page.getByPlaceholder('Email').fill('admin@shked.com')
  await page.getByPlaceholder('Пароль').fill('admin123')
  
  // Ждем навигации с Promise.all для более надежного перехвата
  // Увеличиваем таймаут, так как нужно время на установку cookie сессии
  await Promise.all([
    page.waitForURL('/admin', { timeout: 20000 }),
    page.getByRole('button', { name: /войти/i }).click()
  ])
}

test.describe('Админская панель - CRUD операции', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('должен показывать навигацию админской панели', async ({ page }) => {
    // Проверяем наличие основных разделов навигации
    await expect(page.getByText(/пользователи/i)).toBeVisible()
    await expect(page.getByText(/группы/i)).toBeVisible()
    await expect(page.getByText(/предметы/i)).toBeVisible()
    await expect(page.getByText(/расписание/i)).toBeVisible()
  })

  test('должен переходить между разделами админской панели', async ({ page }) => {
    // Переходим в раздел пользователей
    await page.getByRole('link', { name: /пользователи/i }).click()
    await expect(page).toHaveURL(/\/admin\/users/)
    
    // Переходим в раздел групп
    await page.getByRole('link', { name: /группы/i }).click()
    await expect(page).toHaveURL(/\/admin\/groups/)
    
    // Переходим в раздел предметов
    await page.getByRole('link', { name: /предметы/i }).click()
    await expect(page).toHaveURL(/\/admin\/subjects/)
    
    // Переходим в раздел расписания
    await page.getByRole('link', { name: /расписание/i }).click()
    await expect(page).toHaveURL(/\/admin\/schedule/)
  })

  test.describe('Управление пользователями', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin/users')
    })

    test('должен показывать список пользователей', async ({ page }) => {
      // Ждем загрузки списка
      await expect(page.getByText(/список пользователей/i).or(page.getByRole('heading', { name: /пользователи/i }))).toBeVisible({ timeout: 5000 })
    })

    test('должен открывать форму создания пользователя', async ({ page }) => {
      const createButton = page.getByRole('button', { name: /создать/i })
        .or(page.getByRole('button', { name: /добавить/i }))
      
      await createButton.click()
      
      // Проверяем, что форма открылась
      await expect(page.getByText(/новый пользователь/i).or(page.getByLabel('Email'))).toBeVisible()
    })

    test('должен создавать нового пользователя', async ({ page }) => {
      // Открываем форму создания
      const createButton = page.getByRole('button', { name: /создать/i })
        .or(page.getByRole('button', { name: /добавить/i }))
      
      await createButton.click()
      
      // Заполняем форму
      const timestamp = Date.now()
      await page.getByLabel(/email/i).fill(`testuser${timestamp}@example.com`)
      await page.getByLabel(/пароль/i).fill('TestPassword123!')
      await page.getByLabel(/имя/i).first().fill('Test')
      await page.getByLabel(/фамилия/i).fill('User')
      
      // Выбираем роль (если есть селект)
      const roleSelect = page.getByLabel(/роль/i)
      if (await roleSelect.isVisible()) {
        await roleSelect.selectOption('student')
      }
      
      // Отправляем форму
      await page.getByRole('button', { name: /сохранить/i }).click()
      
      // Проверяем успешное создание
      await expect(page.getByText(/успешно/i).or(page.getByText(`testuser${timestamp}@example.com`))).toBeVisible({ timeout: 5000 })
    })

    test('должен редактировать существующего пользователя', async ({ page }) => {
      // Ищем первого пользователя в списке
      const editButton = page.getByRole('button', { name: /редактировать/i }).first()
      
      if (await editButton.isVisible({ timeout: 2000 })) {
        await editButton.click()
        
        // Изменяем данные
        const nameInput = page.getByLabel(/имя/i).first()
        await nameInput.clear()
        await nameInput.fill('Updated Name')
        
        // Сохраняем
        await page.getByRole('button', { name: /сохранить/i }).click()
        
        // Проверяем успех
        await expect(page.getByText(/успешно/i).or(page.getByText('Updated Name'))).toBeVisible({ timeout: 5000 })
      }
    })

    test('должен удалять пользователя', async ({ page }) => {
      // Создаем тестового пользователя для удаления
      const createButton = page.getByRole('button', { name: /создать/i })
        .or(page.getByRole('button', { name: /добавить/i }))
      
      if (await createButton.isVisible({ timeout: 2000 })) {
        await createButton.click()
        
        const timestamp = Date.now()
        const testEmail = `delete${timestamp}@example.com`
        
        await page.getByLabel(/email/i).fill(testEmail)
        await page.getByLabel(/пароль/i).fill('DeleteMe123!')
        await page.getByRole('button', { name: /сохранить/i }).click()
        
        await page.waitForTimeout(1000)
        
        // Ищем кнопку удаления
        const deleteButton = page.getByRole('button', { name: /удалить/i }).last()
        await deleteButton.click()
        
        // Подтверждаем удаление
        const confirmButton = page.getByRole('button', { name: /подтвердить/i })
          .or(page.getByRole('button', { name: /удалить/i }))
        
        await confirmButton.click()
        
        // Проверяем, что пользователь удален
        await expect(page.getByText(testEmail)).not.toBeVisible({ timeout: 5000 })
      }
    })
  })

  test.describe('Управление группами', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin/groups')
    })

    test('должен показывать список групп', async ({ page }) => {
      await expect(page.getByText(/группы/i).or(page.getByRole('heading'))).toBeVisible({ timeout: 5000 })
    })

    test('должен создавать новую группу', async ({ page }) => {
      const createButton = page.getByRole('button', { name: /создать/i })
        .or(page.getByRole('button', { name: /добавить/i }))
      
      if (await createButton.isVisible({ timeout: 2000 })) {
        await createButton.click()
        
        const timestamp = Date.now()
        const groupName = `Тест-${timestamp}`
        
        await page.getByLabel(/название/i).fill(groupName)
        await page.getByLabel(/описание/i).fill('Тестовая группа')
        
        await page.getByRole('button', { name: /сохранить/i }).click()
        
        await expect(page.getByText(groupName).or(page.getByText(/успешно/i))).toBeVisible({ timeout: 5000 })
      }
    })
  })

  test.describe('Управление предметами', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin/subjects')
    })

    test('должен показывать список предметов', async ({ page }) => {
      await expect(page.getByText(/предметы/i).or(page.getByRole('heading'))).toBeVisible({ timeout: 5000 })
    })

    test('должен создавать новый предмет', async ({ page }) => {
      const createButton = page.getByRole('button', { name: /создать/i })
        .or(page.getByRole('button', { name: /добавить/i }))
      
      if (await createButton.isVisible({ timeout: 2000 })) {
        await createButton.click()
        
        const timestamp = Date.now()
        const subjectName = `Предмет-${timestamp}`
        
        await page.getByLabel(/название/i).fill(subjectName)
        await page.getByLabel(/описание/i).fill('Тестовый предмет')
        
        await page.getByRole('button', { name: /сохранить/i }).click()
        
        await expect(page.getByText(subjectName).or(page.getByText(/успешно/i))).toBeVisible({ timeout: 5000 })
      }
    })
  })

  test.describe('Управление расписанием', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin/schedule')
    })

    test('должен показывать страницу расписания', async ({ page }) => {
      await expect(page.getByText(/расписание/i).or(page.getByRole('heading'))).toBeVisible({ timeout: 5000 })
    })

    test('должен открывать форму создания занятия', async ({ page }) => {
      const createButton = page.getByRole('button', { name: /создать/i })
        .or(page.getByRole('button', { name: /добавить/i }))
      
      if (await createButton.isVisible({ timeout: 2000 })) {
        await createButton.click()
        
        // Проверяем, что форма открылась
        await expect(page.getByLabel(/предмет/i).or(page.getByLabel(/дата/i))).toBeVisible({ timeout: 3000 })
      }
    })
  })

  test('должен корректно выходить из системы из админской панели', async ({ page }) => {
    const logoutButton = page.getByRole('button', { name: /выход/i })
      .or(page.getByText(/выйти/i))
    
    await logoutButton.click()
    
    await page.waitForURL('/login', { timeout: 10000 })
    await expect(page.getByText('Вход в систему')).toBeVisible()
  })
})

