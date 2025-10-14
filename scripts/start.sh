#!/bin/sh

# Запуск миграций базы данных
echo "Running database migrations..."
npx prisma migrate deploy

# Генерация Prisma Client
echo "Generating Prisma client..."
npx prisma generate

# Запуск приложения
echo "Starting application..."
exec node server.js
