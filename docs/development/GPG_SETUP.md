# 🔐 Настройка GPG подписей для Git

## 📋 Краткая инструкция (10-15 минут)

### ✅ Статус: GPG установлен (версия 2.4.8)
### 📁 Директория: `/Users/PvUtrix_1/.gnupg`

---

## 🚀 Шаги настройки

### Шаг 1: Создание GPG ключа

```bash
# Создайте новый GPG ключ
gpg --full-generate-key
```

**При запросе выберите:**
1. **Тип ключа:** `(1) RSA and RSA` (по умолчанию)
2. **Размер ключа:** `4096` (максимальная безопасность)
3. **Срок действия:** `0` (без срока) или `1y` (1 год, если хотите обновлять)
4. **Имя:** `Pavel Shershnev` (ваше имя как на GitHub)
5. **Email:** `shershnev.pv@phystech.edu` (тот же, что в git config)
6. **Комментарий:** можно оставить пустым или `GitHub signing key`
7. **Пароль:** придумайте надёжный пароль (будет спрашиваться при подписи)

---

### Шаг 2: Получение ID ключа

```bash
# Посмотрите список ключей
gpg --list-secret-keys --keyid-format=long

# Вывод будет примерно таким:
# sec   rsa4096/ABCD1234EFGH5678 2025-10-20 [SC]
#       1234567890ABCDEF1234567890ABCDEF12345678
# uid                 [ultimate] Pavel Shershnev <shershnev.pv@phystech.edu>
# ssb   rsa4096/IJKL9012MNOP3456 2025-10-20 [E]

# Вам нужен ID после "rsa4096/": ABCD1234EFGH5678
```

**Сохраните этот ID!** Он понадобится для следующих шагов.

---

### Шаг 3: Экспорт публичного ключа для GitHub

```bash
# Замените YOUR_KEY_ID на ваш реальный ID
gpg --armor --export YOUR_KEY_ID

# Скопируйте ВЕСЬ вывод, включая:
# -----BEGIN PGP PUBLIC KEY BLOCK-----
# ...
# -----END PGP PUBLIC KEY BLOCK-----
```

---

### Шаг 4: Добавление ключа на GitHub

1. Откройте: https://github.com/settings/keys
2. Нажмите **"New GPG key"**
3. Вставьте скопированный ключ
4. Нажмите **"Add GPG key"**

---

### Шаг 5: Настройка Git для автоподписи

```bash
# Установите ваш GPG ключ для git (замените YOUR_KEY_ID)
git config --global user.signingkey YOUR_KEY_ID

# Включите автоматическую подпись всех коммитов
git config --global commit.gpgsign true

# Включите автоматическую подпись всех тегов
git config --global tag.gpgsign true

# Для macOS: настройте программу для ввода пароля
git config --global gpg.program gpg

# Опционально: кэшируйте пароль на 8 часов (28800 секунд)
echo "default-cache-ttl 28800" >> ~/.gnupg/gpg-agent.conf
echo "max-cache-ttl 28800" >> ~/.gnupg/gpg-agent.conf
gpgconf --reload gpg-agent
```

---

### Шаг 6: Проверка настройки

```bash
# Проверьте конфигурацию git
git config --global --get user.signingkey
git config --global --get commit.gpgsign

# Должно вывести:
# YOUR_KEY_ID
# true
```

---

### Шаг 7: Тестовый коммит

```bash
# Создайте тестовый файл
echo "test" > test_gpg.txt
git add test_gpg.txt

# Сделайте подписанный коммит
git commit -m "test: verify GPG signature"

# Проверьте подпись
git log --show-signature -1

# Должно показать "Good signature from ..."
```

---

## 🎯 Упрощённая версия (автоматизированная)

Создайте скрипт для быстрой настройки:

```bash
#!/bin/bash
# setup-gpg.sh

echo "🔐 Настройка GPG подписей для Git"
echo ""

# Проверка существующих ключей
if gpg --list-secret-keys --keyid-format=long | grep -q "sec"; then
    echo "✅ GPG ключ уже существует"
    KEY_ID=$(gpg --list-secret-keys --keyid-format=long | grep sec | awk '{print $2}' | cut -d'/' -f2)
    echo "📌 ID ключа: $KEY_ID"
else
    echo "❌ GPG ключ не найден"
    echo "Запустите: gpg --full-generate-key"
    exit 1
fi

# Настройка git
echo ""
echo "⚙️ Настройка Git..."
git config --global user.signingkey $KEY_ID
git config --global commit.gpgsign true
git config --global tag.gpgsign true

echo ""
echo "✅ Настройка завершена!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Экспортируйте ключ: gpg --armor --export $KEY_ID"
echo "2. Добавьте его на GitHub: https://github.com/settings/keys"
echo ""
```

---

## 🤔 Часто задаваемые вопросы

### Q: Нужно ли вводить пароль при каждом коммите?
**A:** Зависит от настройки. По умолчанию — да, но можно настроить кэширование пароля на несколько часов.

### Q: Что если я забыл пароль от GPG ключа?
**A:** Придётся создать новый ключ. Сохраните пароль в менеджере паролей!

### Q: Можно ли использовать один ключ на нескольких компьютерах?
**A:** Да! Экспортируйте приватный ключ и импортируйте на другом компьютере. Но будьте осторожны с безопасностью.

### Q: Обязательно ли это для Scorecard?
**A:** Нет, необязательно. Это даёт дополнительные баллы, но не критично. Базовая оценка 7-8/10 достижима и без GPG.

### Q: Влияет ли это на работу в команде?
**A:** Нет! Другие разработчики могут работать без GPG. Это личная настройка.

### Q: Можно ли подписать старые коммиты?
**A:** Технически да, но это изменит историю (rebase). Не рекомендуется для публичных репозиториев.

---

## 💡 Рекомендации

### Минимальный вариант (проще)
- ✅ Оставьте GPG на потом
- ✅ Настройте Branch Protection
- ✅ Используйте Dependabot
- 🎯 **Получите ~7-8/10 баллов**

### Оптимальный вариант (рекомендуется)
- ✅ Настройте GPG (10-15 минут один раз)
- ✅ Branch Protection
- ✅ Dependabot
- ✅ Code Review
- 🎯 **Получите ~8-9/10 баллов**

### Максимальный вариант (для энтузиастов)
- ✅ GPG подписи
- ✅ Branch Protection с жёсткими правилами
- ✅ Dependabot + автомерж безопасных обновлений
- ✅ Обязательный Code Review
- ✅ SAST сканирование
- ✅ Фаззинг тесты
- 🎯 **Получите 9-10/10 баллов**

---

## 📊 Влияние на Scorecard

| Критерий | Без GPG | С GPG |
|----------|---------|-------|
| Signed Commits | ❌ 0/10 | ✅ 10/10 |
| Общая оценка | ~7/10 | ~8.5/10 |

**Вывод:** GPG добавляет ~1-1.5 балла к общей оценке

---

## 🔧 Устранение проблем

### Проблема: "gpg: signing failed: Inappropriate ioctl for device"
```bash
export GPG_TTY=$(tty)
echo 'export GPG_TTY=$(tty)' >> ~/.zshrc
```

### Проблема: "error: cannot run gpg: No such file or directory"
```bash
# Убедитесь, что gpg в PATH
which gpg

# Если нет, установите:
brew install gnupg
```

### Проблема: "gpg: signing failed: No secret key"
```bash
# Проверьте, что ключ существует
gpg --list-secret-keys --keyid-format=long

# Проверьте настройку git
git config --global user.signingkey
```

---

## 🎓 Полезные команды

```bash
# Список всех ключей
gpg --list-keys

# Список секретных ключей
gpg --list-secret-keys

# Удалить ключ (если нужно начать заново)
gpg --delete-secret-key YOUR_KEY_ID
gpg --delete-key YOUR_KEY_ID

# Экспорт приватного ключа (для резервной копии)
gpg --armor --export-secret-keys YOUR_KEY_ID > private-key-backup.asc

# Импорт ключа на другом компьютере
gpg --import private-key-backup.asc

# Обновить срок действия ключа
gpg --edit-key YOUR_KEY_ID
# В интерактивном режиме: expire
```

---

## 📞 Нужна помощь?

Если возникли сложности:
1. Запустите команды из инструкции по порядку
2. Сохраните вывод ошибок
3. Проверьте раздел "Устранение проблем"
4. Создайте issue на GitHub

---

**Время настройки:** 10-15 минут  
**Сложность:** 3/10  
**Влияние на работу:** Минимальное  
**Улучшение Scorecard:** +1-1.5 балла  
**Рекомендация:** Настоятельно рекомендуется для open source проектов

**Последнее обновление:** 20 октября 2025

