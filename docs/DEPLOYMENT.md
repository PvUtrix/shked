# Руководство по развертыванию SmartSchedule

## 🚀 Автоматический деплой через Coolify (основной способ)

Проект настроен на автоматический деплой через [Coolify](https://coolify.io/).

### Как это работает:

1. Вы делаете изменения локально
2. Коммитите и пушите в GitHub:
   ```bash
   git add .
   git commit -m "ваше описание изменений"
   git push origin main
   ```
3. **Coolify автоматически:**
   - ✅ Обнаруживает новый коммит
   - ✅ Клонирует изменения
   - ✅ Устанавливает зависимости
   - ✅ Применяет миграции БД (если настроено)
   - ✅ Собирает приложение
   - ✅ Перезапускает контейнер
   - ✅ Проверяет health endpoint

### Проверка статуса деплоя:

- Откройте панель Coolify
- Найдите проект `smartschedule` или `shked`
- Смотрите логи деплоя в реальном времени
- Проверьте статус: должен быть "Running" 🟢

### Время деплоя:

Обычно деплой занимает **2-5 минут** в зависимости от размера изменений.

---

## 📋 Ручное обновление (если Coolify недоступен)

### Автоматическое обновление на сервере

```bash
# На сервере выполните:
cd /path/to/smartschedule
bash scripts/deploy.sh
```

Скрипт автоматически:
1. ✅ Получит последние изменения из Git
2. ✅ Установит зависимости
3. ✅ Применит миграции базы данных
4. ✅ Соберет приложение
5. ✅ Перезапустит сервис

---

## Ручное обновление

### Шаг 1: Подключитесь к серверу

```bash
ssh user@shked.innovators.moscow
# или
ssh user@your-server-ip
```

### Шаг 2: Перейдите в директорию проекта

```bash
cd /path/to/smartschedule
# Обычно это:
# cd /var/www/smartschedule
# или
# cd /home/user/apps/smartschedule
```

### Шаг 3: Получите последние изменения

```bash
git pull origin main
```

Должны увидеть:
```
dd340e5 fix: исправлен доступ студентов к просмотру домашних заданий
db30f83 feat: интеграция MDXEditor и система управления подгруппами
```

### Шаг 4: Установите зависимости

```bash
npm install
```

### Шаг 5: Примените миграции базы данных

```bash
npx prisma generate
npx prisma migrate deploy
```

Вы должны увидеть миграцию:
```
✔ Applied migration 20251016174824_add_mdx_support_to_homework
```

### Шаг 6: Соберите приложение

```bash
npm run build
```

### Шаг 7: Перезапустите приложение

#### Если используется PM2:
```bash
pm2 restart shked
# или
pm2 restart all

# Проверить статус
pm2 status

# Просмотреть логи
pm2 logs shked
```

#### Если используется Docker:
```bash
docker-compose down
docker-compose up -d --build

# Проверить статус
docker-compose ps

# Просмотреть логи
docker-compose logs -f
```

#### Если используется systemd:
```bash
sudo systemctl restart smartschedule

# Проверить статус
sudo systemctl status smartschedule

# Просмотреть логи
sudo journalctl -u smartschedule -f
```

---

## Проверка работы

### 1. Проверьте health endpoint

```bash
curl https://shked.innovators.moscow/api/health
```

Должен вернуть:
```json
{
  "status": "healthy",
  "timestamp": "2024-10-16T...",
  "database": "connected"
}
```

### 2. Откройте приложение в браузере

```
https://shked.innovators.moscow
```

### 3. Проверьте функционал

- ✅ Вход под студентом
- ✅ Открытие домашнего задания (не должно быть 403 ошибки)
- ✅ Сдача задания с MDX редактором
- ✅ Просмотр расписания с фильтрацией по подгруппам

---

## Откат изменений (если что-то пошло не так)

### Вернуться к предыдущему коммиту:

```bash
# Посмотреть историю коммитов
git log --oneline -10

# Вернуться к предыдущему коммиту (например, db30f83)
git reset --hard db30f83

# Пересобрать и перезапустить
npm run build
pm2 restart shked
```

### Откатить конкретную миграцию:

```bash
# Откатить последнюю миграцию
npx prisma migrate resolve --rolled-back 20251016174824_add_mdx_support_to_homework
```

---

## Часто встречающиеся проблемы

### ❌ Ошибка: "Port 3000 already in use"

```bash
# Найти процесс на порту 3000
lsof -i :3000

# Убить процесс
kill -9 <PID>

# Или использовать PM2
pm2 delete shked
pm2 start npm --name "shked" -- start
```

### ❌ Ошибка: "ECONNREFUSED" (база данных недоступна)

Проверьте подключение к базе данных:
```bash
# Проверьте переменные окружения
cat .env | grep DATABASE_URL

# Проверьте, запущен ли PostgreSQL
sudo systemctl status postgresql
```

### ❌ Ошибка: "Module not found"

```bash
# Очистите кэш и переустановите зависимости
rm -rf node_modules package-lock.json .next
npm install
npm run build
```

### ❌ Ошибка 403 Forbidden все еще есть

Проверьте, что изменения действительно применены:
```bash
# Проверьте текущий коммит
git log --oneline -1

# Должно быть:
# dd340e5 fix: исправлен доступ студентов к просмотру домашних заданий

# Если нет, сделайте git pull еще раз
git pull origin main --rebase
```

---

## Мониторинг после обновления

### Просмотр логов в реальном времени:

```bash
# PM2
pm2 logs shked --lines 100

# Docker
docker-compose logs -f --tail=100

# Systemd
sudo journalctl -u smartschedule -f -n 100
```

### Проверка использования ресурсов:

```bash
# PM2
pm2 monit

# Docker
docker stats

# Системные ресурсы
htop
```

---

## Контакты поддержки

Если возникли проблемы:
1. Проверьте логи приложения
2. Проверьте логи базы данных
3. Создайте issue на GitHub: https://github.com/PvUtrix/shked/issues
4. Свяжитесь с администратором: shershnev.pv@phystech.edu

---

**Последнее обновление:** 16 октября 2024  
**Версия:** 1.1.0+

