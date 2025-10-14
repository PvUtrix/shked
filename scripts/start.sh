#!/bin/sh

# Запуск миграций базы данных
echo "Running database migrations..."
npx prisma migrate deploy

# Запуск приложения
echo "Starting application..."
exec node server.js
