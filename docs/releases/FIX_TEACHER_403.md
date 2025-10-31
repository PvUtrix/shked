# Исправление ошибки 403 для роли teacher

## Проблема

При попытке доступа к странице `/teacher` пользователи с ролью `teacher` получали ошибку 403 (Forbidden).

## Причина

В `middleware.ts` не была добавлена поддержка старой роли `lector` для обратной совместимости, хотя в `app/teacher/layout.tsx` эта поддержка была реализована.

## Решение

### 1. Обновлен middleware.ts

Добавлена роль `lector` в список допустимых ролей для доступа к `/teacher`:

```typescript
// До
if (req.nextUrl.pathname.startsWith('/teacher') && 
    !['teacher', 'admin'].includes(role || '')) {
  return new Response('Forbidden', { status: 403 })
}

// После
if (req.nextUrl.pathname.startsWith('/teacher') && 
    !['teacher', 'lector', 'admin'].includes(role || '')) {
  return new Response('Forbidden', { status: 403 })
}
```

### 2. Обновлен scripts/seed.ts

Изменено создание демо-преподавателя с использованием новой роли `teacher` вместо устаревшей `lector`.

### 3. Создан скрипт миграции

Добавлен скрипт `scripts/migrate-lector-role.ts` для автоматической миграции существующих пользователей с роли `lector` на `teacher`.

**Использование:**
```bash
npx tsx scripts/migrate-lector-role.ts
```

### 4. Создан скрипт проверки

Добавлен скрипт `scripts/check-demo-users.ts` для быстрой проверки ролей демо-пользователей.

**Использование:**
```bash
npx tsx scripts/check-demo-users.ts
```

## Проверка

После применения исправлений:

1. Пользователи с ролью `teacher` имеют доступ к `/teacher` ✅
2. Пользователи с ролью `lector` (старая роль) также имеют доступ ✅
3. Администраторы имеют доступ ✅
4. Остальные роли не имеют доступа ✅

## Обратная совместимость

Система поддерживает обе роли (`teacher` и `lector`) для обеспечения плавного перехода и обратной совместимости со старыми данными.

## Демо-аккаунты

Все демо-аккаунты обновлены и работают корректно:

- **Преподаватель (новый):** `teacher@demo.com` / `teacher123` (роль: `teacher`)
- **Преподаватель (старый):** `lector@demo.com` / `lector123` (роль: `teacher` после миграции)

## Дата исправления

31 октября 2025 г.

## Связанные файлы

- `middleware.ts` - обновлена проверка доступа
- `scripts/seed.ts` - обновлено создание демо-пользователей
- `scripts/migrate-lector-role.ts` - скрипт миграции ролей
- `scripts/check-demo-users.ts` - скрипт проверки ролей
- `scripts/README.md` - обновлена документация скриптов

