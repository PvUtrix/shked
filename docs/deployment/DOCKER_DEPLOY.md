# Инструкция по деплою Docker контейнера

## Исправленные проблемы

Исправлена критическая ошибка с Prisma Client в production контейнере:
- ✅ Добавлено копирование всех необходимых Prisma модулей
- ✅ Установлен OpenSSL в production образе
- ✅ Оптимизирован скрипт запуска
- ✅ Добавлен postinstall скрипт для автоматической генерации Prisma Client
- ✅ Создан .dockerignore для оптимизации сборки

## Сборка образа

```bash
# Локальная сборка
docker build -t shked:latest .

# Сборка с тегом версии
docker build -t shked:1.0.0 .
```

## Тестирование локально

```bash
# Запуск контейнера с переменными окружения
docker run -d \
  --name shked \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:password@host:5432/database" \
  -e NEXTAUTH_SECRET="your-secret-here" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  shked:latest

# Проверка логов
docker logs -f shked

# Проверка health check
curl http://localhost:3000/api/health
```

## Деплой на Coolify

### Вариант 1: Через Git
1. Закоммитьте изменения:
   ```bash
   git add Dockerfile scripts/start.sh package.json .dockerignore
   git commit -m "fix: исправлена проблема с Prisma Client в Docker"
   git push
   ```

2. В Coolify перезапустите деплой из вашего репозитория

### Вариант 2: Через Docker Registry
1. Соберите и запушьте образ:
   ```bash
   docker build -t your-registry/shked:latest .
   docker push your-registry/shked:latest
   ```

2. Обновите образ в Coolify

## Переменные окружения

Убедитесь, что в Coolify установлены следующие переменные:

```env
DATABASE_URL=postgresql://user:password@host:5432/database
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-domain.com
NODE_ENV=production
```

## Проверка работоспособности

После деплоя проверьте:

1. Health check endpoint:
   ```bash
   curl https://your-domain.com/api/health
   ```

2. Логи контейнера должны показывать:
   ```
   Настройка прав доступа...
   Prisma Client найден, продолжаем...
   Применение миграций базы данных...
   Запуск приложения...
   ```

## Устранение проблем

### Если Prisma Client не найден:
```bash
# Проверьте наличие файлов в контейнере
docker exec -it shked ls -la /app/node_modules/.prisma/client
docker exec -it shked ls -la /app/node_modules/@prisma/client
```

### Если миграции не применяются:
```bash
# Проверьте DATABASE_URL
docker exec -it shked printenv DATABASE_URL

# Примените миграции вручную
docker exec -it shked npx prisma migrate deploy
```

### Если приложение не запускается:
```bash
# Проверьте полные логи
docker logs shked --tail 100

# Проверьте процессы
docker exec -it shked ps aux
```

## Архитектура Docker образа

Образ состоит из трёх этапов:

1. **deps** - установка зависимостей
2. **builder** - сборка приложения и генерация Prisma Client
3. **runner** - минимальный production образ с только необходимыми файлами

Финальный образ содержит:
- Standalone сборку Next.js
- Prisma Client и необходимые модули (@prisma/client, .prisma/client)
- Prisma CLI для миграций
- OpenSSL для работы Prisma
- Скрипт запуска с проверками

## Безопасность

- Приложение запускается от непривилегированного пользователя `nextjs`
- Используется минимальный Alpine Linux образ
- Health check настроен для мониторинга
- Порт 3000 по умолчанию (стандарт Coolify)

