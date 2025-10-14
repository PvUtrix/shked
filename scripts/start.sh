#!/bin/sh

# Установка правильных прав доступа
echo "Setting up permissions..."
chmod -R 755 /app/node_modules/.prisma 2>/dev/null || true
chmod -R 755 /app/prisma 2>/dev/null || true

# Запуск миграций базы данных
echo "Running database migrations..."
npx prisma migrate deploy

# Генерация Prisma Client
echo "Generating Prisma client..."
if [ ! -d "/app/node_modules/.prisma/client" ]; then
  echo "Prisma client not found, generating..."
  npx prisma generate
else
  echo "Prisma client exists, checking if regeneration is needed..."
  npx prisma generate
fi

# Запуск приложения
echo "Starting application..."
exec node server.js
