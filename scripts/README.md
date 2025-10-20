# Скрипты для управления базой данных

Этот каталог содержит утилиты для работы с базой данных проекта SmartSchedule.

## 📁 Список скриптов

### `seed.ts`
**Назначение:** Заполнение базы данных тестовыми данными.

**Использование:**
```bash
npx prisma db seed
# или
npm run seed
```

**Что создает:**
- Демо-пользователей (админ, студент, преподаватель, ментор)
- Группу "ТехПред МФТИ 2025-27"
- Предметы из Excel файла
- Студентов с распределением по подгруппам
- Расписание занятий
- Домашние задания
- Тестовые сдачи

---

### `fix-demo-student-group.ts`
**Назначение:** Исправление демо-студента - назначение в группу и подгруппы.

**Использование:**
```bash
npm run fix:demo-student
# или
npx tsx scripts/fix-demo-student-group.ts
```

**Что делает:**
- Находит группу "ТехПред МФТИ 2025-27"
- Назначает демо-студента (`student123@demo.com`) в эту группу
- Создает запись UserGroup с подгруппами (1, 1, 1, 1)

**Когда использовать:**
- После первичного seed, если демо-студент не может видеть ДЗ
- На production сервере после деплоя
- При миграции существующих данных

---

### `check-homework-access.ts`
**Назначение:** Проверка доступа студента к домашнему заданию.

**Использование:**
```bash
npx tsx scripts/check-homework-access.ts
```

**Что делает:**
- Проверяет информацию о демо-студенте
- Проверяет информацию о конкретном ДЗ
- Анализирует, почему есть или нет доступа
- Выводит детальную диагностику

**Для кастомной проверки:**
Отредактируйте в файле:
```typescript
const homeworkId = 'your-homework-id'
const studentEmail = 'your-student@email.com'
```

---

### `production-fix-demo-student.sql`
**Назначение:** SQL миграция для исправления демо-студента на production.

**Использование:**
```bash
# Вариант 1: Через psql
psql $DATABASE_URL -f scripts/production-fix-demo-student.sql

# Вариант 2: Копировать команды вручную
psql $DATABASE_URL
# затем скопировать содержимое файла
```

**Что делает:**
- Назначает демо-студента в группу
- Создает/обновляет запись UserGroup
- Выводит результат для проверки

**Когда использовать:**
- На production сервере, если нет доступа к Node.js
- Для ручного выполнения SQL команд

---

## 🚀 Быстрый старт

### Локальная разработка

```bash
# 1. Применить миграции
npx prisma migrate dev

# 2. Заполнить базу тестовыми данными
npx prisma db seed

# 3. Если демо-студент не видит ДЗ
npm run fix:demo-student

# 4. Проверить доступ
npx tsx scripts/check-homework-access.ts
```

### Production деплой

```bash
# После git push и деплоя через Coolify:

# 1. Подключитесь к серверу
ssh your-user@shked.innovators.moscow

# 2. Перейдите в директорию проекта
cd /path/to/smartschedule

# 3. Исправьте демо-студента
npm run fix:demo-student

# ИЛИ через SQL
psql $DATABASE_URL -f scripts/production-fix-demo-student.sql
```

---

## 🔍 Диагностика проблем

### Проблема: Студент не видит домашние задания (403 ошибка)

**Проверка:**
```bash
npx tsx scripts/check-homework-access.ts
```

**Возможные причины:**
1. **Студент не в группе** → `groupId: null`
   - Решение: `npm run fix:demo-student`

2. **ДЗ для другой группы** → `homework.groupId !== student.groupId`
   - Решение: Назначить студента в правильную группу ИЛИ изменить `groupId` задания на `null`

3. **Студент не авторизован** → Проверить сессию

### Проблема: Студент не видит расписание

**Проверка:**
```bash
# В Prisma Studio
npx prisma studio

# Проверить:
# 1. User.groupId - должен быть заполнен
# 2. UserGroup - должна быть запись с подгруппами
# 3. Schedule - должны быть записи для группы студента
```

**Решение:**
```bash
npm run fix:demo-student
```

---

## 📝 Создание новых скриптов

### Шаблон скрипта

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔧 Начало работы скрипта...')

    // Ваш код здесь

    console.log('✅ Скрипт выполнен успешно!')

  } catch (error) {
    console.error('❌ Ошибка:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
```

### Запуск нового скрипта

```bash
# Через tsx
npx tsx scripts/your-script.ts

# Добавить в package.json
"scripts": {
  "your-command": "tsx scripts/your-script.ts"
}

# Использовать
npm run your-command
```

---

## 🔒 Безопасность

⚠️ **ВАЖНО:**
- Никогда не коммитьте скрипты с хардкод ID или паролями
- Используйте переменные окружения для чувствительных данных
- Тестируйте скрипты на локальной базе перед production
- Делайте бэкап перед запуском на production

---

## 📚 Дополнительная информация

- [Prisma Client API](https://www.prisma.io/docs/concepts/components/prisma-client)
- [Prisma Schema](https://www.prisma.io/docs/concepts/components/prisma-schema)
- [Документация проекта](../docs/README.md)

