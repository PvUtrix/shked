# ExternalResource (Внешний ресурс)

> Модель для хранения ссылок на внешние ресурсы (ЭОР, Zoom, чаты и т.д.)

## Обзор

Модель `ExternalResource` хранит ссылки на внешние образовательные ресурсы и инструменты.

**Файл**: `prisma/schema.prisma`

## Схема данных

```prisma
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

## Типы ресурсов

- `EOR` - Электронный образовательный ресурс
- `ZOOM` - Ссылка на Zoom встречу
- `CHAT` - Ссылка на чат (Telegram, Discord)
- `MIRO` - Доска Miro
- `GOOGLE_DOCS` - Google документы
- `OTHER` - Другое

## Привязка

Ресурс может быть привязан:
- К предмету (`subjectId`) - общий для всех занятий
- К занятию (`scheduleId`) - только для конкретного занятия

## Связи

- `subject` - Предмет [[Subject]] (опционально)
- `schedule` - Занятие [[Schedule]] (опционально)
- `creator` - Создатель [[User]]

## API

**Endpoints**:
- `GET /api/subjects/{subjectId}/resources`
- `POST /api/subjects/{subjectId}/resources`
- `GET /api/schedules/{scheduleId}/resources`
- `POST /api/schedules/{scheduleId}/resources`
- `PATCH /api/resources/{id}`
- `DELETE /api/resources/{id}`

---

#model #resource #external #prisma


