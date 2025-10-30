# MentorMeeting (Менторская встреча)

> Модель для управления встречами между менторами и студентами

## Обзор

Модель `MentorMeeting` хранит информацию о запланированных и проведенных встречах ментора со студентом.

**Файл**: `prisma/schema.prisma`

## Схема данных

```prisma
model MentorMeeting {
  id          String   @id @default(cuid())
  mentorId    String
  studentId   String
  scheduledAt DateTime
  duration    Int      // минуты
  status      String   @default("SCHEDULED") // SCHEDULED, COMPLETED, CANCELLED
  agenda      String?
  notes       String?  // MDX
  location    String?
  meetingType String?  // VKR, ACADEMIC, PERSONAL, OTHER
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  mentor      User     @relation("MentorMeetings", fields: [mentorId], references: [id])
  student     User     @relation("StudentMeetings", fields: [studentId], references: [id])
  
  @@map("mentor_meetings")
}
```

## Типы встреч

- `VKR` - По выпускной квалификационной работе
- `ACADEMIC` - Академическая встреча
- `PERSONAL` - Личная встреча
- `OTHER` - Другое

## Статусы

- `SCHEDULED` - Запланирована
- `COMPLETED` - Проведена
- `CANCELLED` - Отменена

## Связи

- `mentor` - Ментор [[User]]
- `student` - Студент [[User]]

## API

См. [docs/features/MENTOR_MEETINGS.md](../../docs/features/MENTOR_MEETINGS.md)

**Endpoints**:
- `GET /api/mentor-meetings`
- `POST /api/mentor-meetings`
- `PATCH /api/mentor-meetings/{id}`
- `DELETE /api/mentor-meetings/{id}`

---

#model #mentor-meeting #mentoring #prisma


