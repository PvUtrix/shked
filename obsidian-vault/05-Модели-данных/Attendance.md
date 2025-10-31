# Attendance (Посещаемость)

> Модель для отслеживания посещаемости студентов на занятиях

## Обзор

Модель `Attendance` хранит информацию о присутствии студентов на конкретных занятиях.

**Файл**: `prisma/schema.prisma`

## Схема данных

```prisma
model Attendance {
  id         String   @id @default(cuid())
  scheduleId String
  userId     String
  status     String   // PRESENT, ABSENT, LATE, EXCUSED
  source     String?  // MANUAL, ZOOM_AUTO, VISUAL
  notes      String?
  markedBy   String   // userId преподавателя/админа
  markedAt   DateTime @default(now())
  
  schedule   Schedule @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
  student    User     @relation("AttendanceStudent", fields: [userId], references: [id])
  marker     User     @relation("AttendanceMarker", fields: [markedBy], references: [id])
  
  @@unique([scheduleId, userId])
  @@map("attendance")
}
```

## Поля

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | String | Уникальный идентификатор |
| `scheduleId` | String | ID занятия [[Schedule]] |
| `userId` | String | ID студента [[User]] |
| `status` | String | Статус посещаемости |
| `source` | String? | Источник данных (опционально) |
| `notes` | String? | Заметки (опционально) |
| `markedBy` | String | ID отметившего ([[Teacher]], [[Admin]]) |
| `markedAt` | DateTime | Дата и время отметки |

## Статусы

- `PRESENT` - Присутствовал
- `ABSENT` - Отсутствовал
- `LATE` - Опоздал
- `EXCUSED` - Отсутствовал по уважительной причине

## Источники данных

- `MANUAL` - Ручная отметка преподавателем
- `ZOOM_AUTO` - Автоматическая отметка по протоколу Zoom
- `VISUAL` - Визуальный контроль на очных занятиях

## Связи

### Основные связи
- `schedule` - Занятие ([[Schedule]])
- `student` - Студент ([[User]])
- `marker` - Отметивший посещаемость ([[User]])

### Обратные связи
- `Schedule.attendance[]` - Посещаемость занятия
- `User.studentAttendance[]` - Посещаемость студента
- `User.markedAttendance[]` - Отметки, сделанные пользователем

## Ограничения

- `@@unique([scheduleId, userId])` - Студент может быть отмечен только один раз на занятии

## API

См. [[Attendance API]] и [docs/features/ATTENDANCE_TRACKING.md](../../docs/features/ATTENDANCE_TRACKING.md)

### Endpoints

- `POST /api/schedules/{scheduleId}/attendance` - Отметить посещаемость
- `GET /api/schedules/{scheduleId}/attendance` - Получить посещаемость занятия
- `GET /api/attendance/report` - Сформировать отчет

## Примеры использования

### Отметка посещаемости

```typescript
await prisma.attendance.createMany({
  data: [
    {
      scheduleId: scheduleId,
      userId: student1Id,
      status: 'PRESENT',
      source: 'MANUAL',
      markedBy: teacherId
    },
    {
      scheduleId: scheduleId,
      userId: student2Id,
      status: 'ABSENT',
      source: 'MANUAL',
      markedBy: teacherId
    }
  ],
  skipDuplicates: true
})
```

### Получение посещаемости студента

```typescript
const studentAttendance = await prisma.attendance.findMany({
  where: {
    userId: studentId,
    schedule: {
      subjectId: subjectId,
      date: {
        gte: startDate,
        lte: endDate
      }
    }
  },
  include: {
    schedule: {
      include: {
        subject: true,
        group: true
      }
    }
  },
  orderBy: {
    markedAt: 'desc'
  }
})

const stats = {
  total: studentAttendance.length,
  present: studentAttendance.filter(a => a.status === 'PRESENT').length,
  absent: studentAttendance.filter(a => a.status === 'ABSENT').length,
  late: studentAttendance.filter(a => a.status === 'LATE').length,
  excused: studentAttendance.filter(a => a.status === 'EXCUSED').length
}
```

### Обновление отметки

```typescript
await prisma.attendance.update({
  where: {
    scheduleId_userId: {
      scheduleId: scheduleId,
      userId: studentId
    }
  },
  data: {
    status: 'EXCUSED',
    notes: 'Справка от врача'
  }
})
```

## Права доступа

| Роль | Создание | Просмотр | Редактирование |
|------|----------|----------|----------------|
| Admin | ✅ | ✅ | ✅ |
| Teacher | ✅ | ✅ (свои предметы) | ✅ (свои) |
| Assistant | ❌ | ✅ (свои предметы) | ❌ |
| Student | ❌ | ✅ (своя) | ❌ |
| Education Office | ❌ | ✅ | ❌ |
| Department Admin | ❌ | ✅ | ❌ |

## Интеграции

### Zoom интеграция (планируется)

```typescript
// Автоматическая отметка по протоколу Zoom
async function syncZoomAttendance(scheduleId: string, zoomParticipants: string[]) {
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    include: {
      group: {
        include: {
          userGroups: {
            include: {
              user: true
            }
          }
        }
      }
    }
  })
  
  const students = schedule.group.userGroups.map(ug => ug.user)
  
  await prisma.attendance.createMany({
    data: students.map(student => ({
      scheduleId: scheduleId,
      userId: student.id,
      status: zoomParticipants.includes(student.email) ? 'PRESENT' : 'ABSENT',
      source: 'ZOOM_AUTO',
      markedBy: schedule.subjectId  // или ID админа
    })),
    skipDuplicates: true
  })
}
```

## Связанные заметки

### Модели
- [[Schedule]] - занятие
- [[User]] - студент и отметивший
- [[Subject]] - предмет
- [[Group]] - группа

### Функции
- [[Система посещаемости]] - полное описание системы

### API
- [[Attendance API]] - API endpoints

---

#model #attendance #tracking #prisma


