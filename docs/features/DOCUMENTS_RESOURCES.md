# 📚 Документы и ресурсы предметов

## Обзор

Система управления документами позволяет хранить и организовать учебные материалы, связанные с предметами.

## Типы документов

- `RPD` - Рабочая программа дисциплины
- `ANNOTATION` - Аннотация предмета
- `SYLLABUS` - Учебный план
- `MATERIALS` - Учебные материалы
- `OTHER` - Другие документы

## Типы внешних ресурсов

- `EOR` - Электронный образовательный ресурс
- `ZOOM` - Ссылка на Zoom встречу
- `CHAT` - Ссылка на чат (Telegram, Discord)
- `MIRO` - Доска Miro
- `GOOGLE_DOCS` - Google документы
- `OTHER` - Другое

## Загрузка документов

### API Endpoint

**POST** `/api/subjects/{subjectId}/documents`

**Content-Type:** `multipart/form-data`

**Параметры формы:**
```
file: [файл]
type: "RPD"
description: "Рабочая программа дисциплины на 2025/2026 учебный год"
```

**Права доступа:** admin, teacher

**Ответ:**
```json
{
  "id": "document_id",
  "subjectId": "subject_id",
  "type": "RPD",
  "filename": "rpd_matematika_2025.pdf",
  "originalName": "РПД Математика.pdf",
  "fileSize": 2048576,
  "mimeType": "application/pdf",
  "url": "/uploads/documents/rpd_matematika_2025.pdf",
  "description": "Рабочая программа дисциплины на 2025/2026 учебный год",
  "uploadedBy": "teacher_id",
  "uploadedAt": "2025-11-01T10:00:00Z"
}
```

## Просмотр документов

### Список документов предмета

**GET** `/api/subjects/{subjectId}/documents?type={type}`

**Параметры запроса:**
- `type` - Фильтр по типу документа (опционально)

**Ответ:**
```json
[
  {
    "id": "document_id",
    "type": "RPD",
    "filename": "rpd_matematika_2025.pdf",
    "originalName": "РПД Математика.pdf",
    "fileSize": 2048576,
    "mimeType": "application/pdf",
    "url": "/uploads/documents/rpd_matematika_2025.pdf",
    "description": "Рабочая программа дисциплины",
    "uploadedAt": "2025-11-01T10:00:00Z",
    "uploader": {
      "id": "teacher_id",
      "name": "Преподаватель"
    }
  }
]
```

## Удаление документов

### API Endpoint

**DELETE** `/api/subjects/{subjectId}/documents/{documentId}`

**Права доступа:** admin, teacher (загрузивший документ)

## Внешние ресурсы

### Добавление ресурса

**POST** `/api/subjects/{subjectId}/resources`

**Тело запроса:**
```json
{
  "type": "ZOOM",
  "title": "Zoom встреча - Лекция 5",
  "url": "https://zoom.us/j/123456789",
  "description": "Еженедельная лекция по понедельникам"
}
```

**Права доступа:** admin, teacher

### Привязка к занятию

Ресурсы можно привязать к конкретному занятию:

**POST** `/api/schedules/{scheduleId}/resources`

**Тело запроса:**
```json
{
  "type": "ZOOM",
  "title": "Zoom встреча - Семинар группы Б05-123",
  "url": "https://zoom.us/j/987654321"
}
```

### Просмотр ресурсов

**GET** `/api/subjects/{subjectId}/resources?type={type}`

**GET** `/api/schedules/{scheduleId}/resources`

**Ответ:**
```json
[
  {
    "id": "resource_id",
    "type": "ZOOM",
    "title": "Zoom встреча - Лекция 5",
    "url": "https://zoom.us/j/123456789",
    "description": "Еженедельная лекция",
    "createdAt": "2025-11-01T10:00:00Z",
    "creator": {
      "id": "teacher_id",
      "name": "Преподаватель"
    }
  }
]
```

### Обновление ресурса

**PATCH** `/api/resources/{resourceId}`

**Тело запроса:**
```json
{
  "title": "Обновленный заголовок",
  "url": "https://new-url.com",
  "description": "Обновленное описание"
}
```

**Права доступа:** admin, teacher (создатель ресурса)

### Удаление ресурса

**DELETE** `/api/resources/{resourceId}`

**Права доступа:** admin, teacher (создатель ресурса)

## Права доступа

### Документы

| Роль | Загрузка | Просмотр | Удаление |
|------|----------|----------|----------|
| Admin | ✅ | ✅ | ✅ |
| Teacher | ✅ | ✅ | ✅ (свои) |
| Student | ❌ | ✅ | ❌ |
| Department Admin | ❌ | ✅ | ❌ |

### Внешние ресурсы

| Роль | Создание | Просмотр | Редактирование | Удаление |
|------|----------|----------|----------------|----------|
| Admin | ✅ | ✅ | ✅ | ✅ |
| Teacher | ✅ | ✅ | ✅ (свои) | ✅ (свои) |
| Student | ❌ | ✅ | ❌ | ❌ |

## Модели данных

```prisma
model SubjectDocument {
  id           String   @id @default(cuid())
  subjectId    String
  type         String   // RPD, ANNOTATION, SYLLABUS, MATERIALS, OTHER
  filename     String   // Имя файла на сервере
  originalName String   // Оригинальное имя файла
  fileSize     Int      // Размер в байтах
  mimeType     String
  url          String   // Путь к файлу
  description  String?
  uploadedBy   String
  uploadedAt   DateTime @default(now())
  
  subject      Subject  @relation(fields: [subjectId], references: [id], onDelete: Cascade)
  uploader     User     @relation(fields: [uploadedBy], references: [id])
  
  @@map("subject_documents")
}

model ExternalResource {
  id          String    @id @default(cuid())
  type        String    // EOR, ZOOM, CHAT, MIRO, GOOGLE_DOCS, OTHER
  title       String
  url         String
  description String?
  createdBy   String
  createdAt   DateTime  @default(now())
  subjectId   String?
  scheduleId  String?
  
  subject     Subject?  @relation(fields: [subjectId], references: [id], onDelete: Cascade)
  schedule    Schedule? @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
  creator     User      @relation(fields: [createdBy], references: [id])
  
  @@map("external_resources")
}
```

## Хранение файлов

### Структура директорий

```
/public/uploads/
  /documents/
    /rpd/
    /annotations/
    /syllabus/
    /materials/
    /other/
```

### Ограничения

- Максимальный размер файла: 10 МБ
- Поддерживаемые форматы: PDF, DOCX, XLSX, PPTX
- Имена файлов должны быть уникальными

## Сценарии использования

### Сценарий 1: Загрузка РПД

1. Преподаватель открывает страницу предмета
2. Переходит в раздел "Документы"
3. Выбирает тип "РПД"
4. Загружает PDF файл
5. Добавляет описание
6. Документ становится доступен всем студентам

### Сценарий 2: Добавление Zoom ссылки

1. Преподаватель создает занятие в расписании
2. Добавляет внешний ресурс типа "ZOOM"
3. Вставляет ссылку на встречу
4. Студенты видят ссылку в расписании
5. Могут перейти на встречу одним кликом

### Сценарий 3: Организация материалов

1. Преподаватель загружает презентации лекций
2. Добавляет ссылки на дополнительные материалы
3. Создает ссылку на чат группы
4. Все материалы организованы в одном месте
5. Студенты легко находят нужные ресурсы

## Best Practices

1. **Именование файлов** - используйте понятные имена
2. **Описания** - добавляйте описания к документам
3. **Версионность** - при обновлении документа указывайте версию в описании
4. **Актуальность** - удаляйте устаревшие документы
5. **Организация** - группируйте связанные ресурсы

## Будущие улучшения

### Планируется

- Версионность документов
- Возможность комментариев к документам
- Автоматическое создание превью
- Полнотекстовый поиск по документам
- Экспорт всех документов предмета
- Права на просмотр по подгруппам

---

*Документация обновлена: 30 октября 2025*
*Версия системы: 2.0.0*


