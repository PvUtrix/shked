# OpenSSF Scorecard - Оценка безопасности проекта

## Что такое OpenSSF Scorecard?

**OpenSSF Scorecard** — это автоматизированный инструмент от [Open Source Security Foundation (OpenSSF)](https://openssf.org/) для оценки безопасности open source проектов. Он анализирует репозиторий GitHub и выставляет оценку (от 0 до 10) на основе соблюдения best practices безопасности.

## Зачем это нужно?

OpenSSF Scorecard помогает:
- 🔒 **Улучшить безопасность** — выявляет слабые места в практиках разработки
- 📊 **Демонстрировать качество** — показывает пользователям, что проект следует best practices
- 🎯 **Автоматизировать проверки** — регулярно сканирует проект на уязвимости
- 🏆 **Повысить доверие** — бейдж Scorecard сигнализирует о серьезном подходе к безопасности
- 📈 **Отслеживать прогресс** — показывает улучшения безопасности со временем

## Критерии оценки (Checks)

OpenSSF Scorecard проверяет следующие аспекты проекта:

### 1. **Branch Protection**
Проверяет, защищена ли основная ветка (main/master) от прямых коммитов.

**Как улучшить:**
- Включите branch protection rules в настройках GitHub
- Требуйте review перед слиянием PR
- Требуйте прохождения CI перед слиянием

### 2. **Code Review**
Проверяет, что все изменения проходят review перед слиянием.

**Как улучшить:**
- Всегда используйте Pull Requests
- Требуйте минимум 1 approving review
- Не делайте прямые коммиты в main

### 3. **CI Tests**
Проверяет наличие автоматических тестов в CI/CD.

**Как улучшить:**
- Настройте GitHub Actions для запуска тестов
- Убедитесь, что тесты запускаются при каждом PR
- Добавьте тесты для критичного кода

### 4. **Signed Commits**
Проверяет, подписаны ли коммиты GPG ключами.

**Как улучшить:**
- Настройте GPG подпись коммитов
- Требуйте подписанные коммиты в branch protection
- Используйте `git commit -S`

### 5. **Security Policy**
Проверяет наличие файла SECURITY.md с политикой безопасности.

**Как улучшить:**
- Создайте файл `SECURITY.md` в корне проекта
- Опишите процесс сообщения об уязвимостях
- Укажите поддерживаемые версии

### 6. **Dependency Updates**
Проверяет, регулярно ли обновляются зависимости.

**Как улучшить:**
- Настройте Dependabot или Renovate
- Регулярно проверяйте `npm audit`
- Обновляйте зависимости при обнаружении CVE

### 7. **SAST (Static Application Security Testing)**
Проверяет наличие статического анализа кода.

**Как улучшить:**
- Настройте CodeQL или другой SAST инструмент
- Запускайте анализ при каждом PR
- Исправляйте найденные уязвимости

### 8. **Vulnerability Alerts**
Проверяет, настроены ли уведомления об уязвимостях.

**Как улучшить:**
- Включите Dependabot alerts в настройках GitHub
- Регулярно проверяйте Security tab
- Быстро реагируйте на advisory

### 9. **Maintained**
Проверяет, активно ли поддерживается проект.

**Как улучшить:**
- Регулярно коммитьте в репозиторий
- Отвечайте на issues и PR
- Поддерживайте актуальность документации

### 10. **Dangerous Workflow**
Проверяет отсутствие опасных практик в GitHub Actions.

**Как улучшить:**
- Не используйте `pull_request_target` без необходимости
- Ограничивайте permissions в workflows
- Не выполняйте непроверенный код из PR

### 11. **Token Permissions**
Проверяет, что GitHub Actions используют минимальные разрешения.

**Как улучшить:**
- Явно указывайте `permissions` в workflows
- Используйте `read-all` по умолчанию
- Предоставляйте только необходимые права

### 12. **Binary Artifacts**
Проверяет отсутствие бинарных файлов в репозитории.

**Как улучшить:**
- Не коммитьте скомпилированные файлы
- Используйте `.gitignore`
- Храните артефакты в releases или registries

### 13. **Fuzzing**
Проверяет наличие фаззинг-тестов.

**Как улучшить:**
- Настройте OSS-Fuzz для фаззинг-тестирования
- Добавьте фаззинг в CI/CD
- Тестируйте обработку некорректных данных

### 14. **Pinned Dependencies**
Проверяет, закреплены ли версии зависимостей.

**Как улучшить:**
- Используйте хэши для GitHub Actions
- Закрепляйте версии в `package-lock.json`
- Избегайте `latest` тегов в Docker

## Как просмотреть результаты?

### 1. Через бейдж в README
Кликните на бейдж [![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/PvUtrix/shked/badge)](https://scorecard.dev/viewer/?uri=github.com/PvUtrix/shked)

### 2. Через GitHub Security Tab
- Перейдите в **Security** → **Code scanning alerts**
- Результаты Scorecard отображаются как SARIF файлы

### 3. Через API
```bash
curl https://api.scorecard.dev/projects/github.com/PvUtrix/shked
```

### 4. Через локальный запуск
```bash
# Установить Scorecard CLI
go install github.com/ossf/scorecard/v4/cmd/scorecard@latest

# Запустить проверку
scorecard --repo=github.com/PvUtrix/shked
```

## Как улучшить оценку?

### Шаг 1: Проверьте текущую оценку
Перейдите на страницу Scorecard: https://scorecard.dev/viewer/?uri=github.com/PvUtrix/shked

### Шаг 2: Найдите checks с низкой оценкой
Посмотрите, какие checks имеют оценку < 7

### Шаг 3: Исправьте по приоритету
1. **Критично** (Security Policy, Branch Protection, Code Review)
2. **Важно** (CI Tests, Dependency Updates, SAST)
3. **Желательно** (Signed Commits, Token Permissions, Pinned Dependencies)

### Шаг 4: Повторите проверку
Scorecard обновляется автоматически еженедельно или при каждом пуше в main

## Автоматизация в CI/CD

Проект **Шкед** уже имеет настроенный workflow для Scorecard:

```yaml
# .github/workflows/scorecard.yml
name: OpenSSF Scorecard

on:
  schedule:
    - cron: '0 2 * * 2'  # Еженедельно по вторникам
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  analysis:
    runs-on: ubuntu-latest
    permissions:
      security-events: write
      id-token: write
      contents: read
      actions: read

    steps:
      - uses: actions/checkout@v4
      
      - uses: ossf/scorecard-action@v2.4.0
        with:
          results_file: results.sarif
          results_format: sarif
          publish_results: true

      - uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: results.sarif
```

## Часто задаваемые вопросы (FAQ)

### Q: Как часто обновляется Scorecard?
**A:** Автоматически еженедельно по вторникам и при каждом пуше в main ветку.

### Q: Что делать, если оценка низкая?
**A:** Не паникуйте! Scorecard — это инструмент для улучшения. Постепенно исправляйте checks с низкой оценкой, начиная с критичных.

### Q: Можно ли игнорировать некоторые checks?
**A:** Технически можно, но не рекомендуется. Все checks важны для безопасности проекта.

### Q: Влияет ли Scorecard на работу проекта?
**A:** Нет, это только инструмент оценки. Он не блокирует работу и не изменяет код.

### Q: Нужно ли иметь 10/10 баллов?
**A:** Желательно, но не обязательно. Даже 7-8 баллов показывают хороший уровень безопасности.

## Дополнительные ресурсы

- 📚 [Официальная документация OpenSSF Scorecard](https://github.com/ossf/scorecard)
- 🔒 [OpenSSF Best Practices](https://bestpractices.coreinfrastructure.org/)
- 📊 [Scorecard Viewer](https://scorecard.dev/)
- 🎓 [OpenSSF Security Training](https://openssf.org/training/)
- 💬 [OpenSSF Community](https://openssf.org/community/)

## Контакты

Если у вас есть вопросы по Scorecard или безопасности проекта:
- 🐛 [Создать issue](https://github.com/PvUtrix/shked/issues)
- 📧 [Email автора](mailto:shershnev.pv@phystech.edu)
- 🔒 [Security Policy](../docs/meta/SECURITY.md)

---

**Сделано с ❤️ для образования и безопасности**

