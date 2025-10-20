#!/bin/sh

# Установка правильных прав доступа
echo "Настройка прав доступа..."
chmod -R 755 /app/node_modules/.prisma 2>/dev/null || true
chmod -R 755 /app/prisma 2>/dev/null || true

# Проверка наличия Prisma Client
if [ ! -d "/app/node_modules/.prisma/client" ]; then
  echo "ОШИБКА: Prisma Client не найден!"
  exit 1
fi

echo "Prisma Client найден, продолжаем..."

# Запуск миграций базы данных (только если DATABASE_URL установлен)
if [ -n "$DATABASE_URL" ]; then
  echo "Применение миграций базы данных..."
  npx prisma migrate deploy || echo "Предупреждение: миграции не удалось применить"
else
  echo "DATABASE_URL не установлен, пропускаем миграции..."
fi

# Запуск приложения
echo "Запуск приложения..."
exec node server.js
