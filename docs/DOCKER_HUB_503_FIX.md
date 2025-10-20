# Решение проблемы Docker Hub 503

## Проблема
```
ERROR: failed to authorize: failed to fetch anonymous token: 
unexpected status from GET request to https://auth.docker.io/token: 
503 Service Unavailable
```

## Причина
Docker Hub временно недоступен. Это внешняя проблема, не связанная с кодом.

## Решения

### ✅ Решение 1: Подождать и повторить попытку (Рекомендуется)
Docker Hub обычно восстанавливается через 5-30 минут.
- Просто повторите деплой через несколько минут
- Проверить статус Docker Hub: https://status.docker.com/

### ✅ Решение 2: Использовать зеркало Docker (Для Coolify)

1. **На сервере с Coolify/Docker:**
```bash
# Создать или отредактировать конфиг Docker
sudo nano /etc/docker/daemon.json
```

2. **Добавить зеркало:**
```json
{
  "registry-mirrors": [
    "https://mirror.gcr.io",
    "https://dockerhub.azk8s.cn"
  ]
}
```

3. **Перезапустить Docker:**
```bash
sudo systemctl restart docker
```

4. **Проверить:**
```bash
docker info | grep "Registry Mirrors"
```

### ✅ Решение 3: Кэшировать образ локально

Если у вас уже есть успешная сборка:
```bash
# Сохранить образ
docker save node:18-alpine -o node-18-alpine.tar

# Загрузить на сервер
scp node-18-alpine.tar user@server:/tmp/

# На сервере загрузить образ
docker load -i /tmp/node-18-alpine.tar
```

### ✅ Решение 4: Использовать альтернативный registry

Измените Dockerfile, чтобы использовать GitHub Container Registry:
```dockerfile
# Вместо
FROM node:18-alpine AS deps

# Используйте
FROM ghcr.io/library/node:18-alpine AS deps
```

## Оптимизации Dockerfile

Мы уже оптимизировали Dockerfile:
- ✅ Использование `npm ci` для быстрой установки
- ✅ Улучшенное кэширование слоёв
- ✅ Очистка npm кэша для уменьшения размера
- ✅ Объединение RUN команд

## Проверка статуса Docker Hub

```bash
# Проверить доступность Docker Hub
curl -I https://hub.docker.com

# Проверить auth service
curl -I https://auth.docker.io/token
```

## Мониторинг

- Docker Hub Status: https://status.docker.com/
- Twitter: @DockerStatus
- Docker Community: https://www.docker.com/community/

## Если проблема сохраняется > 1 часа

1. Проверьте firewall/сетевые настройки вашего сервера
2. Попробуйте с другого IP адреса
3. Свяжитесь с поддержкой вашего хостинг-провайдера
4. Рассмотрите использование альтернативных registry (GitHub, GitLab, AWS ECR)

