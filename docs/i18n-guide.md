# Руководство по интернационализации (i18n)

## Обзор

Проект SmartSchedule (Шкед) использует библиотеку `next-intl` для поддержки интернационализации. Текущая реализация поддерживает русский язык по умолчанию, но архитектура готова для легкого добавления новых языков.

## Текущее состояние

- ✅ Инфраструктура i18n настроена и готова
- ✅ Все ключевые компоненты переведены
- ✅ Файлы переводов организованы по функциональности
- ✅ Правила в `.cursorrules` обновлены

## Структура файлов

```
smartschedule/
├── i18n/
│   ├── config.ts          # Конфигурация локалей
│   └── request.ts         # Настройка для Server Components
├── lib/
│   └── i18n.ts           # Утилиты для работы с переводами
├── messages/
│   ├── ru.json           # Русские переводы (активен)
│   └── en.json           # Английские переводы (шаблон)
└── components/
    └── providers.tsx     # NextIntlClientProvider
```

## Использование переводов

### Client Components

```typescript
'use client'

import { useTranslations } from 'next-intl'

export function MyComponent() {
  const t = useTranslations()
  
  return (
    <div>
      <h1>{t('common.buttons.save')}</h1>
      <p>{t('admin.pages.users.title')}</p>
    </div>
  )
}
```

### Server Components

```typescript
import { getTranslations } from 'next-intl/server'

export default async function MyPage() {
  const t = await getTranslations()
  
  return (
    <div>
      <h1>{t('common.buttons.save')}</h1>
    </div>
  )
}
```

### Интерполяция переменных

```typescript
// В messages/ru.json:
{
  "greeting": "Привет, {name}!"
}

// В компоненте:
{t('greeting', { name: userName })}
```

## Добавление нового языка

### Шаг 1: Создание файла переводов

Скопируйте `messages/ru.json` и переведите все значения:

```bash
cp messages/ru.json messages/de.json
# Откройте messages/de.json и переведите все значения
```

### Шаг 2: Обновление конфигурации

Отредактируйте `i18n/config.ts`:

```typescript
// Было:
export const locales = ['ru'] as const

// Стало:
export const locales = ['ru', 'de'] as const
```

### Шаг 3: Реализация переключателя языков (опционально)

Если вы хотите дать пользователям возможность переключать язык:

1. **Создайте компонент переключателя**:

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { Select } from '@/components/ui/select'

export function LanguageSwitcher() {
  const router = useRouter()
  
  const handleChange = (locale: string) => {
    // Сохраните язык в localStorage/cookies
    localStorage.setItem('locale', locale)
    // Перезагрузите страницу
    router.refresh()
  }
  
  return (
    <Select onValueChange={handleChange}>
      <SelectItem value="ru">🇷🇺 Русский</SelectItem>
      <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
    </Select>
  )
}
```

2. **Обновите `i18n/request.ts`** для поддержки динамического языка:

```typescript
import { getRequestConfig } from 'next-intl/server'
import { defaultLocale, isValidLocale } from './config'

export default getRequestConfig(async () => {
  // Получаем язык из cookies/headers
  const locale = // ... ваша логика определения языка
  
  return {
    locale: isValidLocale(locale) ? locale : defaultLocale,
    messages: (await import(`../messages/${locale}.json`)).default
  }
})
```

### Шаг 4: URL-based routing (опционально)

Для URL-based языков (`/ru/admin`, `/de/admin`):

1. Обновите структуру папок в `app/`:
```
app/
├── [locale]/
│   ├── admin/
│   ├── student/
│   └── layout.tsx
```

2. Настройте middleware для обработки локалей в `middleware.ts`

## Организация ключей переводов

Ключи организованы по функциональности:

```
common.*          - Общие элементы (кнопки, лейблы, сообщения)
auth.*            - Аутентификация
admin.*           - Административная панель
  admin.nav.*     - Навигация
  admin.pages.*   - Страницы
student.*         - Интерфейс студента
lector.*          - Интерфейс преподавателя
mentor.*          - Интерфейс ментора
teacher.*         - Интерфейс учителя
ui.*              - UI компоненты
```

## Правила разработки

### ✅ Правильно:

```typescript
// Client Component
const t = useTranslations()
<Button>{t('common.buttons.save')}</Button>

// Server Component
const t = await getTranslations()
<Button>{t('common.buttons.save')}</Button>
```

### ❌ Неправильно:

```typescript
// Захардкоженные строки запрещены!
<Button>Сохранить</Button>
<Label>Имя</Label>
```

## Проверка перед коммитом

1. ✅ Все комментарии на русском языке
2. ✅ UI элементы используют ключи переводов
3. ✅ Сообщения об ошибках используют ключи переводов
4. ✅ Все новые строки добавлены в `messages/ru.json`
5. ✅ TypeScript ошибки исправлены
6. ✅ Client Components используют `useTranslations()`
7. ✅ Server Components используют `getTranslations()`

## Текущий статус перевода

### Полностью переведено:
- ✅ Все навигационные компоненты (admin, student, lector, mentor, teacher)
- ✅ Аутентификация (login, logout)
- ✅ UI компоненты (date-time-picker, confirm-dialog, gdpr-delete-dialog, file-uploader, markdown-editor, status-badge, attendance-badge, exam-grade-badge)
- ✅ Footer
- ✅ Layout metadata
- ✅ Страница управления пользователями (`app/admin/users/page.tsx`)

### Требуется перевод:
- ⏳ Остальные административные страницы (homework, documents, subgroups, resources)
- ⏳ Формы (user-form, homework-form, exam-form, attendance-form)
- ⏳ Студенческие страницы (attendance, meetings, forum)
- ⏳ Менторские страницы (students, meetings)
- ⏳ API routes (error messages)

## Инструменты для перевода

### Автоматический поиск захардкоженных строк:

```bash
# Поиск русских строк в TSX файлах
grep -r "[А-Яа-яЁё]{3,}" app/ --include="*.tsx"
grep -r "[А-Яа-яЁё]{3,}" components/ --include="*.tsx"
```

### Проверка использования переводов:

```bash
# Поиск компонентов без useTranslations/getTranslations
grep -L "useTranslations\|getTranslations" app/**/*.tsx
```

## Дополнительные ресурсы

- [Документация next-intl](https://next-intl-docs.vercel.app/)
- [Best practices для i18n в Next.js](https://nextjs.org/docs/app/building-your-application/routing/internationalization)
- Правила проекта: `.cursorrules` (секция "Интернационализация")

## Контакты

Если у вас есть вопросы по интернационализации:
1. Проверьте правила в `.cursorrules`
2. Изучите примеры в отрефакторенных компонентах
3. Следуйте паттернам, описанным в этом документе

