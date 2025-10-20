#!/bin/bash

# Скрипт для обновления приложения на production сервере
# Использование: bash scripts/deploy.sh

set -e  # Остановить при ошибке

echo "🚀 Начинаем обновление Шкед..."

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Проверяем, что мы в правильной директории
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Ошибка: package.json не найден. Запустите скрипт из корня проекта.${NC}"
    exit 1
fi

echo -e "${YELLOW}📥 Шаг 1: Получаем последние изменения из Git...${NC}"
git pull origin main

echo -e "${YELLOW}📦 Шаг 2: Устанавливаем зависимости...${NC}"
npm install

echo -e "${YELLOW}🗄️  Шаг 3: Применяем миграции базы данных...${NC}"
npx prisma generate
npx prisma migrate deploy

echo -e "${YELLOW}🔨 Шаг 4: Собираем приложение...${NC}"
npm run build

echo -e "${YELLOW}🔄 Шаг 5: Перезапускаем приложение...${NC}"

# Проверяем, какой менеджер процессов используется
if command -v pm2 &> /dev/null; then
    echo "Используется PM2..."
    pm2 restart shked || pm2 restart all
elif command -v docker-compose &> /dev/null && [ -f "docker-compose.yml" ]; then
    echo "Используется Docker Compose..."
    docker-compose up -d --build
else
    echo -e "${RED}⚠️  PM2 или Docker не найдены. Перезапустите приложение вручную.${NC}"
fi

echo -e "${GREEN}✅ Обновление завершено успешно!${NC}"
echo ""
echo "📊 Проверьте работу приложения:"
echo "   - Откройте https://shked.innovators.moscow"
echo "   - Проверьте логи: pm2 logs shked (если используется PM2)"
echo ""
echo "📝 Последние коммиты:"
git log --oneline -3

