# Dockerfile для Шкед

# Этап 1: Установка зависимостей
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Копирование файлов зависимостей
COPY package.json package-lock.json* ./
RUN npm install

# Этап 2: Сборка приложения
FROM node:18-alpine AS builder
WORKDIR /app

# Копирование зависимостей из предыдущего этапа
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Создание public директории если её нет
RUN mkdir -p public

# Генерация Prisma Client
RUN npx prisma generate

# Сборка Next.js приложения
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Этап 3: Production образ
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Установка wget для health check
RUN apk add --no-cache wget

# Создание пользователя для запуска приложения
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Копирование необходимых файлов
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Копирование build артефактов
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Копирование Prisma схемы и миграций
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
