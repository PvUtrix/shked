# Dockerfile для Шкед

# Этап 1: Установка зависимостей
FROM node:25-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Копирование файлов зависимостей
COPY package.json package-lock.json* ./
RUN npm ci --only=production --ignore-scripts && npm cache clean --force

# Этап 2: Сборка приложения  
FROM node:25-alpine AS builder
WORKDIR /app

# Установка OpenSSL для Prisma
RUN apk add --no-cache openssl libc6-compat

# Копирование package files для установки dev dependencies
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# Копирование всех файлов проекта
COPY . .

# Создание public директории если её нет
RUN mkdir -p public

# Генерация Prisma Client с правильной архитектурой
ENV PRISMA_CLI_BINARY_TARGETS=linux-musl-openssl-3.0.x
RUN npx prisma generate

# Сборка Next.js приложения
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Этап 3: Production образ
FROM node:25-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Установка wget для health check и openssl для Prisma
RUN apk add --no-cache wget openssl

# Создание пользователя для запуска приложения
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Копирование необходимых файлов
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Копирование build артефактов
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Копирование Prisma схемы и миграций
COPY --from=builder /app/prisma ./prisma

# Копирование Prisma Client и необходимых модулей
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Копирование prisma CLI для миграций
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Копирование скрипта запуска
COPY --from=builder /app/scripts ./scripts
RUN chmod +x ./scripts/start.sh

# Установка правильных прав доступа для всех файлов
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["./scripts/start.sh"]
