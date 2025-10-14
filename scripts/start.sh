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
export PRISMA_CLI_BINARY_TARGETS=linux-musl-openssl-3.0.x

# Принудительная перегенерация для правильной архитектуры
echo "Force regenerating Prisma client for correct architecture..."
rm -rf /app/node_modules/.prisma/client 2>/dev/null || true
npx prisma generate

# Запуск приложения
echo "Starting application..."
exec node server.js
