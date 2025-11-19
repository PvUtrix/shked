# ✅ Система посещаемости

## Обзор

Система посещаемости ШКЕД позволяет преподавателям и администраторам отмечать присутствие студентов на занятиях и формировать отчеты.

## Статусы посещаемости

- `PRESENT` - Присутствовал
- `ABSENT` - Отсутствовал
- `LATE` - Опоздал
- `EXCUSED` - Отсутствовал по уважительной причине

## Источники данных

- `MANUAL` - Ручная отметка преподавателем
- `ZOOM_AUTO` - Автоматическая отметка по протоколу Zoom
- `VISUAL` - Визуальный контроль на очных занятиях

## Отметка посещаемости

### API Endpoint

**POST** `/api/schedules/{scheduleId}/attendance`

**Тело запроса:**
```json
{
  "attendanceList": [
    {
      "userId": "user_id_1",
      "status": "PRESENT",
      "source": "MANUAL",
      "notes": "Примечание"
    },
    {
      "userId": "user_id_2",
      "status": "ABSENT"
    }
  ]
}
```

**Права доступа:** admin, lector, assistant

### Массовая отметка

Система поддерживает массовую отметку - можно отметить всех студентов одним запросом. Если запись уже существует, она будет обновлена.

## Просмотр посещаемости

### Посещаемость занятия

**GET** `/api/schedules/{scheduleId}/attendance`

**Ответ:**
```json
[
  {
    "id": "attendance_id",
    "scheduleId": "schedule_id",
    "userId": "user_id",
    "status": "PRESENT",
    "source": "MANUAL",
    "notes": "Примечание",
    "markedBy": "lector_id",
    "markedAt": "2025-11-01T10:30:00Z",
    "student": {
      "id": "user_id",
      "name": "Имя Фамилия",
      "email": "student@example.com"
    },
    "marker": {
      "id": "lector_id",
      "name": "Преподаватель"
    }
  }
]
```

## Отчеты по посещаемости

### Формирование отчета

**GET** `/api/attendance/report`

**Параметры запроса:**
- `groupId` - Фильтр по группе
- `subjectId` - Фильтр по предмету
- `userId` - Фильтр по студенту
- `startDate` - Начало периода (ISO 8601)
- `endDate` - Конец периода (ISO 8601)

**Пример:**
```
GET /api/attendance/report?groupId=group_id&startDate=2025-11-01&endDate=2025-11-30
```

**Ответ:**
```json
{
  "attendance": [
    {
      "id": "attendance_id",
      "status": "PRESENT",
      "markedAt": "2025-11-01T10:30:00Z",
      "student": {
        "id": "user_id",
        "name": "Имя Фамилия"
      },
      "schedule": {
        "id": "schedule_id",
        "date": "2025-11-01",
        "startTime": "10:00",
        "subject": {
          "id": "subject_id",
          "name": "Название предмета"
        },
        "group": {
          "id": "group_id",
          "name": "Название группы"
        }
      }
    }
  ],
  "stats": {
    "total": 50,
    "present": 42,
    "absent": 5,
    "late": 2,
    "excused": 1
  }
}
```

**Права доступа:** admin, lector, department_admin, education_office_head

## Интеграция с Zoom

### Автоматическая отметка (планируется)

При интеграции с Zoom API система может автоматически:
1. Получать протокол участников встречи
2. Отмечать присутствующих со статусом `PRESENT`
3. Записывать источник как `ZOOM_AUTO`

## Права доступа

| Роль | Отметка | Просмотр своей | Просмотр всех | Отчеты |
|------|---------|----------------|---------------|--------|
| Admin | ✅ | ✅ | ✅ | ✅ |
| Lector | ✅ | ✅ | ✅ (свои предметы) | ✅ |
| Assistant | ❌ | ✅ | ✅ (предметы) | ❌ |
| Student | ❌ | ✅ | ❌ | ❌ |
| Mentor | ❌ | ✅ | ✅ (свои группы) | ❌ |
| Education Office | ❌ | ❌ | ✅ | ✅ |
| Department Admin | ❌ | ❌ | ✅ | ✅ |

## Модель данных

```prisma
model Attendance {
  id         String   @id @default(cuid())
  scheduleId String
  userId     String
  status     String   // PRESENT, ABSENT, LATE, EXCUSED
  source     String?  // MANUAL, ZOOM_AUTO, VISUAL
  notes      String?
  markedBy   String   // userId admin/lector
  markedAt   DateTime @default(now())
  
  schedule   Schedule @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
  student    User     @relation("AttendanceStudent", fields: [userId], references: [id])
  marker     User     @relation("AttendanceMarker", fields: [markedBy], references: [id])
  
  @@unique([scheduleId, userId])
  @@map("attendance")
}
```

## Сценарии использования

### Сценарий 1: Отметка на очном занятии

1. Преподаватель открывает список занятия
2. Визуально проверяет присутствующих
3. Отмечает статусы студентов
4. Добавляет заметки при необходимости
5. Сохраняет изменения

### Сценарий 2: Автоматическая отметка через Zoom

1. Занятие проводится в Zoom
2. Система получает протокол участников
3. Автоматически создает записи со статусом `PRESENT`
4. Отсутствующие не отмечаются автоматически
5. Преподаватель может вручную скорректировать

### Сценарий 3: Формирование отчета

1. Администратор выбирает период
2. Указывает фильтры (группа, предмет)
3. Получает отчет с статистикой
4. Экспортирует данные (планируется)

## Best Practices

1. **Своевременная отметка** - отмечайте посещаемость сразу после занятия
2. **Заметки** - добавляйте пояснения для нестандартных ситуаций
3. **Источник** - всегда указывайте источник данных
4. **Проверка** - проверяйте автоматические отметки Zoom
5. **Отчеты** - регулярно формируйте отчеты для анализа

## Уведомления

### Telegram уведомления (планируется)

- Студент получает уведомление при отметке отсутствия
- Ментор получает уведомление при систематических пропусках
- Администратор получает еженедельный отчет

---

*Документация обновлена: 30 октября 2025*
*Версия системы: 0.1.0-alpha*


