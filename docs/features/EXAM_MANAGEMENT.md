# 📝 Управление экзаменами и зачетами

## Обзор

Система управления экзаменами ШКЕД позволяет создавать зачеты и экзамены, вносить результаты студентов и формировать ведомости.

## Типы аттестации

- `EXAM` - Экзамен
- `CREDIT` - Зачет
- `DIFF_CREDIT` - Дифференцированный зачет

## Форматы проведения

- `ORAL` - Устный экзамен/зачет
- `WRITTEN` - Письменный экзамен/зачет
- `MIXED` - Смешанный формат

## Создание экзамена

### API Endpoint

**POST** `/api/exams`

**Тело запроса:**
```json
{
  "subjectId": "subject_id",
  "groupId": "group_id",
  "type": "EXAM",
  "format": "ORAL",
  "date": "2025-12-20T10:00:00Z",
  "location": "Аудитория 401",
  "description": "Устный экзамен по всем темам семестра"
}
```

**Права доступа:** admin, teacher

### Обязательные поля

- `subjectId` - ID предмета
- `groupId` - ID группы
- `type` - Тип аттестации
- `format` - Формат проведения
- `date` - Дата и время проведения

## Внесение результатов

### API Endpoint

**POST** `/api/exams/{examId}/results`

**Тело запроса:**
```json
{
  "userId": "user_id",
  "grade": "5",
  "status": "PASSED",
  "notes": "Отлично знает теорию"
}
```

**Статусы:**
- `NOT_TAKEN` - Не сдавал
- `PASSED` - Сдал
- `FAILED` - Не сдал

**Оценки:**
- Для экзаменов: "5", "4", "3", "2"
- Для зачетов: "ЗАЧЕТ", "НЕ ЗАЧЕТ"

## Просмотр результатов

### Ведомость экзамена

**GET** `/api/exams/{examId}/results`

**Ответ:**
```json
[
  {
    "id": "result_id",
    "examId": "exam_id",
    "userId": "user_id",
    "grade": "5",
    "status": "PASSED",
    "notes": "Примечание",
    "takenAt": "2025-12-20T10:30:00Z",
    "recordedBy": "teacher_id",
    "student": {
      "id": "user_id",
      "name": "Имя Фамилия",
      "email": "student@example.com"
    },
    "recorder": {
      "id": "teacher_id",
      "name": "Преподаватель"
    }
  }
]
```

### Список экзаменов

**GET** `/api/exams?groupId={groupId}&subjectId={subjectId}`

**Параметры запроса:**
- `groupId` - Фильтр по группе
- `subjectId` - Фильтр по предмету

## Обновление экзамена

### API Endpoint

**PATCH** `/api/exams/{examId}`

**Тело запроса:**
```json
{
  "date": "2025-12-21T10:00:00Z",
  "location": "Аудитория 402",
  "description": "Обновленное описание"
}
```

**Права доступа:** admin, teacher

## Удаление экзамена

### API Endpoint

**DELETE** `/api/exams/{examId}`

**Примечание:** Используется мягкое удаление (isActive = false)

**Права доступа:** admin

## Права доступа

| Роль | Создание | Редактирование | Внесение результатов | Просмотр | Удаление |
|------|----------|----------------|---------------------|----------|----------|
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| Teacher | ✅ | ✅ | ✅ | ✅ (свои предметы) | ❌ |
| Student | ❌ | ❌ | ❌ | ✅ (свои результаты) | ❌ |
| Department Admin | ❌ | ❌ | ❌ | ✅ | ❌ |
| Education Office | ❌ | ❌ | ❌ | ✅ | ❌ |

## Модель данных

```prisma
model Exam {
  id          String   @id @default(cuid())
  subjectId   String
  groupId     String
  type        String   // EXAM, CREDIT, DIFF_CREDIT
  format      String   // ORAL, WRITTEN, MIXED
  date        DateTime
  location    String?
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  
  subject     Subject  @relation(fields: [subjectId], references: [id], onDelete: Cascade)
  group       Group    @relation(fields: [groupId], references: [id], onDelete: Cascade)
  results     ExamResult[]
  
  @@map("exams")
}

model ExamResult {
  id         String    @id @default(cuid())
  examId     String
  userId     String
  grade      String?   // 5, 4, 3, 2, ЗАЧЕТ, НЕ ЗАЧЕТ
  status     String    @default("NOT_TAKEN") // NOT_TAKEN, PASSED, FAILED
  notes      String?
  takenAt    DateTime?
  recordedBy String    // userId teacher
  createdAt  DateTime  @default(now())
  
  exam       Exam      @relation(fields: [examId], references: [id], onDelete: Cascade)
  student    User      @relation("ExamStudent", fields: [userId], references: [id])
  recorder   User      @relation("ExamRecorder", fields: [recordedBy], references: [id])
  
  @@unique([examId, userId])
  @@map("exam_results")
}
```

## Сценарии использования

### Сценарий 1: Создание экзамена

1. Преподаватель создает экзамен для своего предмета
2. Указывает дату, время, место проведения
3. Выбирает тип (экзамен/зачет) и формат (устный/письменный)
4. Система создает экзамен и отображает его в календаре

### Сценарий 2: Проведение экзамена

1. В день экзамена преподаватель открывает ведомость
2. Принимает экзамен у студентов
3. Вносит оценки и статусы
4. Добавляет заметки при необходимости
5. Студенты сразу видят свои результаты

### Сценарий 3: Исправление результата

1. Преподаватель обнаруживает ошибку в ведомости
2. Открывает результат студента
3. Исправляет оценку или статус
4. Добавляет примечание о причине изменения
5. Изменения сохраняются с отметкой времени

## Best Practices

1. **Заблаговременное создание** - создавайте экзамены за 2-3 недели
2. **Точное расписание** - указывайте точное время и место
3. **Заметки** - добавляйте пояснения к результатам
4. **Своевременность** - вносите результаты сразу после экзамена
5. **Проверка** - проверяйте ведомость перед закрытием

## Уведомления

### Telegram уведомления (планируется)

- Студенты получают напоминание за неделю до экзамена
- Студенты получают напоминание за день до экзамена
- Студенты получают уведомление о внесенном результате
- Преподаватели получают напоминание о предстоящем экзамене

## Интеграция с учебным планом

Экзамены автоматически связываются:
- С предметом через `subjectId`
- С группой через `groupId`
- С расписанием через общую дату

---

*Документация обновлена: 30 октября 2025*
*Версия системы: 2.0.0*


