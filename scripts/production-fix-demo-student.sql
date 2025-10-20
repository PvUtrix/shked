-- SQL скрипт для назначения демо-студента в группу на production
-- Выполнить на production базе данных

-- 1. Находим ID группы "ТехПред МФТИ 2025-27"
-- 2. Обновляем демо-студента, назначая его в эту группу

UPDATE "User"
SET "groupId" = (
  SELECT id FROM "Group" 
  WHERE name = 'ТехПред МФТИ 2025-27' 
  LIMIT 1
)
WHERE email = 'student123@demo.com';

-- 3. Создаем или обновляем запись UserGroup для подгрупп
INSERT INTO "UserGroup" ("id", "userId", "groupId", "subgroupCommerce", "subgroupTutorial", "subgroupFinance", "subgroupSystemThinking", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  u.id,
  g.id,
  1,
  1,
  1,
  1,
  NOW(),
  NOW()
FROM "User" u
CROSS JOIN "Group" g
WHERE u.email = 'student123@demo.com'
  AND g.name = 'ТехПред МФТИ 2025-27'
ON CONFLICT ("userId", "groupId") 
DO UPDATE SET 
  "subgroupCommerce" = 1,
  "subgroupTutorial" = 1,
  "subgroupFinance" = 1,
  "subgroupSystemThinking" = 1,
  "updatedAt" = NOW();

-- Проверка результата
SELECT 
  u.email, 
  u."firstName", 
  u."lastName", 
  g.name as "groupName",
  ug."subgroupCommerce",
  ug."subgroupTutorial",
  ug."subgroupFinance",
  ug."subgroupSystemThinking"
FROM "User" u
LEFT JOIN "Group" g ON u."groupId" = g.id
LEFT JOIN "UserGroup" ug ON ug."userId" = u.id AND ug."groupId" = g.id
WHERE u.email = 'student123@demo.com';

