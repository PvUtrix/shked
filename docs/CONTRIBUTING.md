# Руководство по внесению вклада в Шкед

Прежде всего, спасибо за то, что рассматриваете возможность внести вклад в Шкед! Именно такие люди, как вы, делают Шкед отличным инструментом для управления университетским расписанием.

## 📋 Содержание

- [Кодекс поведения](#кодекс-поведения)
- [Как я могу внести вклад?](#как-я-могу-внести-вклад)
- [Настройка окружения разработки](#настройка-окружения-разработки)
- [Процесс Pull Request](#процесс-pull-request)
- [Стандарты кодирования](#стандарты-кодирования)
- [Руководство по сообщениям коммитов](#руководство-по-сообщениям-коммитов)

## 📜 Кодекс поведения

Этот проект и все участвующие в нем регулируются нашим Кодексом поведения. Участвуя, вы обязуетесь соблюдать этот кодекс. Пожалуйста, сообщайте о неприемлемом поведении, создав issue.

## 🤝 Как я могу внести вклад?

### Сообщение об ошибках

Перед созданием отчета об ошибке проверьте существующие issues, чтобы избежать дубликатов. При создании отчета об ошибке включите как можно больше деталей:

- **Используйте четкий и описательный заголовок**
- **Опишите точные шаги для воспроизведения проблемы**
- **Приведите конкретные примеры для демонстрации шагов**
- **Опишите наблюдаемое поведение и то, что вы ожидали**
- **Включите скриншоты, если возможно**
- **Укажите детали вашего окружения** (ОС, версия Node, браузер и т.д.)

### Предложение улучшений

Предложения по улучшению отслеживаются как GitHub issues. При создании предложения по улучшению включите:

- **Используйте четкий и описательный заголовок**
- **Предоставьте подробное описание предлагаемого улучшения**
- **Объясните, почему это улучшение будет полезным**
- **Перечислите похожие функции в других приложениях, если применимо**

### Ваш первый вклад в код

Не знаете, с чего начать? Вы можете начать с просмотра issues с метками `good-first-issue` и `help-wanted`:

- **Good first issues** - задачи, которые должны требовать всего несколько строк кода
- **Help wanted issues** - задачи, которые требуют более глубокого вовлечения

### Pull Requests

- Заполните требуемый шаблон
- Следуйте стандартам кодирования
- Включите соответствующие тестовые случаи, если применимо
- Обновите документацию по мере необходимости
- Завершайте все файлы переводом строки

## 🛠️ Настройка окружения разработки

### Предварительные требования

- Node.js 18.x или выше
- PostgreSQL 12.x или выше
- npm, yarn или pnpm

### Шаги настройки

1. **Форкните и клонируйте репозиторий**
   ```bash
   git clone https://github.com/PvUtrix/shked.git
   cd shked
   ```

2. **Установите зависимости**
   ```bash
   npm install
   ```

3. **Настройте переменные окружения**
   ```bash
   cp .env.example .env
   # Отредактируйте .env с вашей конфигурацией
   ```

4. **Настройте базу данных**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   npx prisma db seed
   ```

5. **Запустите сервер разработки**
   ```bash
   npm run dev
   ```

6. **Создайте новую ветку**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 🔄 Процесс Pull Request

1. **Update your fork** with the latest changes from the main repository
   ```bash
   git remote add upstream https://github.com/ORIGINAL-OWNER/shked.git
   git fetch upstream
   git merge upstream/main
   ```

2. **Make your changes** in your feature branch

3. **Test your changes** thoroughly
   ```bash
   npm run lint
   npm run build
   ```

4. **Commit your changes** following our commit message guidelines

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request** with a clear title and description

7. **Wait for review** - maintainers will review your PR and may request changes

8. **Make requested changes** if any, and push them to your branch

9. **Once approved**, your PR will be merged!

## 💻 Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid using `any` type unless absolutely necessary
- Use meaningful variable and function names

### React/Next.js

- Use functional components with hooks
- Follow React best practices
- Use proper component composition
- Implement proper error boundaries
- Use Next.js App Router conventions

### Styling

- Use Tailwind CSS utility classes
- Follow the existing design system
- Ensure responsive design for all screen sizes
- Maintain accessibility standards (WCAG 2.1)

### Code Organization

- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper file and folder structure
- Group related files together

### Database

- Use Prisma ORM for all database operations
- Write proper migrations
- Include seed data for testing
- Document schema changes

## 📝 Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that don't affect code meaning (formatting, etc.)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Changes to build process or auxiliary tools

### Examples

```
feat(schedule): add weekly view for student schedule

Implemented a new weekly view that shows all classes for the week
in a calendar format. Includes filtering by subgroup.

Closes #123
```

```
fix(auth): resolve login redirect issue

Fixed an issue where users were not redirected to the correct page
after successful login.

Fixes #456
```

## 🧪 Тестирование

- Пишите тесты для новых функций
- Убедитесь, что все тесты проходят перед отправкой PR
- Поддерживайте или улучшайте покрытие кода
- Тестируйте в разных браузерах и устройствах

## 📚 Documentation

- Update README.md if needed
- Add JSDoc comments for complex functions
- Update API documentation for new endpoints
- Include inline comments for complex logic

## 🎯 Project Structure

Please maintain the existing project structure:

```
shked/
├── app/              # Next.js App Router pages
├── components/       # React components
├── lib/             # Utilities and configurations
├── hooks/           # Custom React hooks
├── prisma/          # Database schema and migrations
├── public/          # Static assets
└── types/           # TypeScript type definitions
```

## ❓ Questions?

Feel free to create an issue with the `question` label if you have any questions about contributing.

## 🙏 Thank You!

Your contributions to open source, large or small, make projects like this possible. Thank you for taking the time to contribute!

---

**Happy Coding! 🚀**
