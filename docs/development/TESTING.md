# Руководство по тестированию SmartSchedule

## Содержание

1. [Обзор](#обзор)
2. [Настройка окружения](#настройка-окружения)
3. [Запуск тестов](#запуск-тестов)
4. [Структура тестов](#структура-тестов)
5. [Написание тестов](#написание-тестов)
6. [Best Practices](#best-practices)
7. [CI/CD интеграция](#cicd-интеграция)

## Обзор

Проект SmartSchedule использует комплексную систему тестирования, включающую:

- **Unit тесты** - для тестирования отдельных функций и утилит (Jest)
- **Integration тесты** - для тестирования API routes (Jest + MSW)
- **Component тесты** - для тестирования React компонентов (Jest + React Testing Library)
- **E2E тесты** - для тестирования пользовательских сценариев (Playwright)

### Технологии

- **Jest** - фреймворк для unit и integration тестов
- **React Testing Library** - для тестирования React компонентов
- **Playwright** - для E2E тестов
- **MSW (Mock Service Worker)** - для мокирования API запросов
- **@testing-library/user-event** - для симуляции действий пользователя

## Настройка окружения

### 1. Установка зависимостей

Все необходимые зависимости уже указаны в `package.json`. Установите их:

```bash
npm install
```

### 2. Установка Playwright браузеров

Для E2E тестов необходимо установить браузеры:

```bash
npm run playwright:install
```

### 3. Настройка переменных окружения

Для тестов используются переменные окружения из `jest.setup.js`. При необходимости их можно переопределить.

### 4. Настройка тестовой БД

Для integration тестов используется in-memory SQLite база данных, настроенная в `__tests__/utils/test-helpers.ts`.

## Запуск тестов

### Unit и Integration тесты

```bash
# Запуск всех Jest тестов
npm test

# Запуск в watch режиме (для разработки)
npm run test:watch

# Запуск только unit тестов
npm run test:unit

# Запуск только integration тестов
npm run test:integration

# Запуск с покрытием кода
npm run test:coverage
```

### E2E тесты

```bash
# Запуск всех E2E тестов
npm run test:e2e

# Запуск с UI интерфейсом Playwright
npm run test:e2e:ui

# Запуск с видимым браузером (headed mode)
npm run test:e2e:headed
```

### Все тесты

```bash
# Запуск всех типов тестов
npm run test:all
```

## Структура тестов

```
smartschedule/
├── __tests__/
│   ├── unit/                      # Unit тесты
│   │   ├── lib/
│   │   │   ├── auth.test.ts      # Тесты аутентификации
│   │   │   └── telegram/
│   │   │       └── bot.test.ts   # Тесты Telegram бота
│   ├── integration/               # Integration тесты
│   │   └── api/
│   │       ├── users.test.ts     # Тесты API пользователей
│   │       ├── homework.test.ts  # Тесты API домашних заданий
│   │       └── ...
│   ├── components/                # Тесты компонентов
│   │   ├── auth/
│   │   │   └── login-form.test.tsx
│   │   └── ...
│   ├── utils/                     # Утилиты для тестов
│   │   └── test-helpers.ts
│   ├── fixtures/                  # Фикстуры (тестовые данные)
│   │   └── index.ts
│   └── mocks/                     # MSW моки
│       ├── handlers.ts
│       └── server.ts
├── e2e/                           # E2E тесты
│   ├── auth.spec.ts              # Тесты аутентификации
│   └── admin/
│       └── crud.spec.ts          # Тесты админской панели
├── middleware.test.ts             # Тесты middleware
├── jest.config.js                 # Конфигурация Jest
├── jest.setup.js                  # Setup для Jest
└── playwright.config.ts           # Конфигурация Playwright
```

## Написание тестов

### Unit тесты

Unit тесты проверяют отдельные функции и утилиты изолированно.

```typescript
import { describe, it, expect } from '@jest/globals'
import { myFunction } from '@/lib/utils'

describe('myFunction', () => {
  it('должна вернуть правильный результат', () => {
    const result = myFunction('input')
    expect(result).toBe('expected output')
  })

  it('должна обработать ошибку', () => {
    expect(() => myFunction(null)).toThrow()
  })
})
```

### Integration тесты API

Integration тесты проверяют API routes с мокированием внешних зависимостей.

```typescript
import { describe, it, expect, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/users/route'
import { setupTestDb, cleanupTestDb, mockSession } from '../../utils/test-helpers'

// Мокаем getServerSession
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

describe('API /api/users', () => {
  beforeEach(async () => {
    await setupTestDb()
    await cleanupTestDb()
  })

  it('должен вернуть список пользователей', async () => {
    const { getServerSession } = require('next-auth/next')
    getServerSession.mockResolvedValue(mockSession('admin'))

    const request = new NextRequest('http://localhost:3000/api/users')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.users).toBeDefined()
  })
})
```

### Тесты React компонентов

Тесты компонентов проверяют рендеринг и взаимодействие пользователя.

```typescript
import { describe, it, expect } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MyComponent } from '@/components/MyComponent'

describe('MyComponent', () => {
  it('должен рендериться корректно', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('должен обрабатывать клик', async () => {
    const user = userEvent.setup()
    const onClick = jest.fn()
    
    render(<MyComponent onClick={onClick} />)
    await user.click(screen.getByRole('button'))
    
    expect(onClick).toHaveBeenCalled()
  })
})
```

### E2E тесты

E2E тесты проверяют полные пользовательские сценарии.

```typescript
import { test, expect } from '@playwright/test'

test.describe('User Flow', () => {
  test('должен выполнить полный сценарий', async ({ page }) => {
    // Переход на страницу
    await page.goto('/login')
    
    // Заполнение формы
    await page.getByPlaceholder('Email').fill('user@example.com')
    await page.getByPlaceholder('Пароль').fill('password')
    
    // Отправка формы
    await page.getByRole('button', { name: /войти/i }).click()
    
    // Проверка результата
    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByText('Добро пожаловать')).toBeVisible()
  })
})
```

## Best Practices

### 1. Именование тестов

- Используйте описательные названия на русском языке
- Формат: "должен/должна [ожидаемое поведение]"
- Примеры:
  - ✅ "должен вернуть список пользователей"
  - ✅ "должна отклонить невалидный email"
  - ❌ "test users"

### 2. Структура тестов

Используйте паттерн AAA (Arrange, Act, Assert):

```typescript
it('должен создать пользователя', async () => {
  // Arrange - подготовка
  const userData = { email: 'test@example.com', password: '123456' }
  
  // Act - действие
  const result = await createUser(userData)
  
  // Assert - проверка
  expect(result.email).toBe(userData.email)
})
```

### 3. Изоляция тестов

- Каждый тест должен быть независимым
- Используйте `beforeEach` для очистки данных
- Не полагайтесь на порядок выполнения тестов

```typescript
beforeEach(async () => {
  await cleanupTestDb()
})
```

### 4. Моки и фикстуры

- Используйте реалистичные тестовые данные из `fixtures`
- Мокируйте внешние зависимости (API, БД)
- Не мокируйте то, что тестируете

### 5. Async/Await

Всегда используйте `async/await` для асинхронных операций:

```typescript
// ✅ Правильно
it('должен загрузить данные', async () => {
  const data = await fetchData()
  expect(data).toBeDefined()
})

// ❌ Неправильно
it('должен загрузить данные', () => {
  fetchData().then(data => {
    expect(data).toBeDefined()
  })
})
```

### 6. Покрытие кода

Стремитесь к покрытию:
- **>80%** для критичного кода (auth, API routes)
- **>60%** для остального кода
- **100%** для утилит и хелперов

### 7. Тестирование ошибок

Всегда тестируйте error cases:

```typescript
it('должен выбросить ошибку при невалидных данных', () => {
  expect(() => validateEmail('invalid')).toThrow('Invalid email')
})

it('должен вернуть 400 при отсутствии обязательных полей', async () => {
  const response = await POST(invalidRequest)
  expect(response.status).toBe(400)
})
```

### 8. E2E тесты

- Используйте реалистичные сценарии
- Тестируйте happy path и важные error cases
- Используйте селекторы по role, text, label (не по классам)

```typescript
// ✅ Правильно
await page.getByRole('button', { name: /войти/i })
await page.getByPlaceholder('Email')

// ❌ Неправильно
await page.locator('.login-button')
await page.locator('#email-input')
```

## Тестовые утилиты

### test-helpers.ts

Утилиты для работы с тестовой БД и моками:

```typescript
import { setupTestDb, cleanupTestDb, createTestUser } from '@/__tests__/utils/test-helpers'

// Инициализация БД
await setupTestDb()

// Очистка БД
await cleanupTestDb()

// Создание тестового пользователя
const user = await createTestUser({
  email: 'test@example.com',
  password: 'password',
  role: 'student'
})

// Мок сессии
const session = mockSession('admin', 'user-id')
```

### fixtures/index.ts

Предопределенные тестовые данные:

```typescript
import { testUsers, testGroups, testHomework } from '@/__tests__/fixtures'

// Использование фикстур
const student = await createTestUser(testUsers.student)
const group = await createTestGroup(testGroups.group1)
```

## CI/CD интеграция

### GitHub Actions

Создайте файл `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run unit tests
      run: npm run test:unit
      
    - name: Run integration tests
      run: npm run test:integration
      
    - name: Generate coverage
      run: npm run test:coverage
      
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      
    - name: Install Playwright
      run: npm run playwright:install
      
    - name: Run E2E tests
      run: npm run test:e2e
      
    - name: Upload test results
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: test-results
        path: test-results/
```

## Отладка тестов

### Jest тесты

```bash
# Запуск конкретного теста
npm test -- auth.test.ts

# Запуск с подробным выводом
npm test -- --verbose

# Запуск в debug режиме
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Playwright тесты

```bash
# Запуск с UI
npm run test:e2e:ui

# Запуск в debug режиме
npx playwright test --debug

# Запуск конкретного теста
npx playwright test auth.spec.ts
```

## Часто задаваемые вопросы

**Q: Тесты падают с ошибкой БД?**  
A: Убедитесь, что вызываете `setupTestDb()` и `cleanupTestDb()` в `beforeEach`/`afterEach`.

**Q: Mock не работает?**  
A: Проверьте, что mock определен до импорта тестируемого модуля.

**Q: E2E тесты медленные?**  
A: Используйте параллельный запуск или запускайте только критичные тесты в CI.

**Q: Как тестировать приватные функции?**  
A: Тестируйте публичный API. Приватные функции тестируются косвенно.

## Полезные ссылки

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [MSW Documentation](https://mswjs.io/docs/)

## Контрибьюция

При добавлении нового функционала:

1. Напишите тесты **до** написания кода (TDD)
2. Убедитесь, что покрытие не уменьшилось
3. Запустите все тесты перед commit
4. Добавьте тесты в PR description

---

**Помните**: Хорошие тесты - это инвестиция в стабильность и поддерживаемость проекта! 🎯

