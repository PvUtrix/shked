/**
 * Фикстуры для тестов - предопределенные тестовые данные
 */

// Тестовые пользователи
export const testUsers = {
  admin: {
    email: 'admin@test.com',
    password: 'Admin123!',
    role: 'admin' as const,
    name: 'Test Admin',
    firstName: 'Test',
    lastName: 'Admin',
  },
  student: {
    email: 'student@test.com',
    password: 'Student123!',
    role: 'student' as const,
    name: 'Test Student',
    firstName: 'Test',
    lastName: 'Student',
  },
  lector: {
    email: 'lector@test.com',
    password: 'Lector123!',
    role: 'lector' as const,
    name: 'Test Lector',
    firstName: 'Test',
    lastName: 'Lector',
  },
  mentor: {
    email: 'mentor@test.com',
    password: 'Mentor123!',
    role: 'mentor' as const,
    name: 'Test Mentor',
    firstName: 'Test',
    lastName: 'Mentor',
  },
}

// Тестовые группы
export const testGroups = {
  group1: {
    name: 'Б01-001',
    description: 'Тестовая группа 1',
    semester: '1',
    year: '2024',
  },
  group2: {
    name: 'Б01-002',
    description: 'Тестовая группа 2',
    semester: '1',
    year: '2024',
  },
  group3: {
    name: 'М01-001',
    description: 'Тестовая группа магистратуры',
    semester: '1',
    year: '2024',
  },
}

// Тестовые предметы
export const testSubjects = {
  math: {
    name: 'Математический анализ',
    description: 'Основы математического анализа',
    instructor: 'Профессор Иванов И.И.',
  },
  physics: {
    name: 'Общая физика',
    description: 'Курс общей физики',
    instructor: 'Профессор Петров П.П.',
  },
  programming: {
    name: 'Программирование',
    description: 'Основы программирования на Python',
    instructor: 'Доцент Сидоров С.С.',
  },
}

// Тестовые домашние задания
export const testHomework = {
  homework1: {
    title: 'Домашнее задание 1',
    description: 'Решить задачи по математическому анализу',
    content: '# Задание\n\nРешить интегралы:\n\n1. ∫x²dx\n2. ∫sin(x)dx',
    taskUrl: 'https://example.com/homework1.pdf',
    deadline: new Date('2024-12-31T23:59:59Z'),
    materials: [
      {
        name: 'Лекция 1',
        url: 'https://example.com/lecture1.pdf',
        type: 'document' as const,
      },
      {
        name: 'Видео урок',
        url: 'https://youtube.com/watch?v=123',
        type: 'video' as const,
      },
    ],
  },
  homework2: {
    title: 'Домашнее задание 2',
    description: 'Написать программу на Python',
    content: '# Задание\n\nНаписать функцию для сортировки массива',
    taskUrl: 'https://example.com/homework2.pdf',
    deadline: new Date('2024-12-31T23:59:59Z'),
    materials: [],
  },
}

// Тестовые расписания
export const testSchedules = {
  schedule1: {
    date: new Date('2024-10-20T10:00:00Z'),
    dayOfWeek: 1, // Понедельник
    startTime: '10:00',
    endTime: '11:30',
    location: 'Аудитория 101',
    eventType: 'Лекция',
    description: 'Лекция по математическому анализу',
  },
  schedule2: {
    date: new Date('2024-10-21T14:00:00Z'),
    dayOfWeek: 2, // Вторник
    startTime: '14:00',
    endTime: '15:30',
    location: 'Аудитория 202',
    eventType: 'Семинар',
    description: 'Семинар по физике',
  },
}

// Тестовые сдачи домашних заданий
export const testSubmissions = {
  submission1: {
    content: '# Решение\n\n1. ∫x²dx = x³/3 + C\n2. ∫sin(x)dx = -cos(x) + C',
    submissionUrl: 'https://example.com/my-solution.pdf',
    status: 'SUBMITTED' as const,
  },
  submission2: {
    content: '# Решение\n\n```python\ndef sort_array(arr):\n    return sorted(arr)\n```',
    submissionUrl: 'https://github.com/student/homework2',
    status: 'REVIEWED' as const,
    grade: 95,
    comment: 'Отличная работа!',
    feedback: '# Обратная связь\n\nРешение правильное, код чистый и читаемый.',
  },
}

// Тестовые настройки Telegram бота
export const testBotSettings = {
  default: {
    telegramBotToken: 'test-bot-token-123456',
    openaiApiKey: 'test-openai-key',
    webhookUrl: 'https://example.com/api/telegram/webhook',
    isActive: true,
    notificationsEnabled: true,
    reminderMinutes: 30,
    dailySummaryTime: '07:00',
  },
  inactive: {
    telegramBotToken: null,
    openaiApiKey: null,
    webhookUrl: null,
    isActive: false,
    notificationsEnabled: false,
    reminderMinutes: 30,
    dailySummaryTime: '07:00',
  },
}

// Тестовые Telegram updates
export const testTelegramUpdates = {
  textMessage: {
    update_id: 123456,
    message: {
      message_id: 1,
      from: {
        id: 987654321,
        is_bot: false,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
      },
      chat: {
        id: 987654321,
        type: 'private',
      },
      date: Math.floor(Date.now() / 1000),
      text: '/start',
    },
  },
  callbackQuery: {
    update_id: 123457,
    callback_query: {
      id: 'callback-123',
      from: {
        id: 987654321,
        is_bot: false,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
      },
      message: {
        message_id: 1,
        chat: {
          id: 987654321,
          type: 'private',
        },
      },
      data: 'action:test',
    },
  },
}

