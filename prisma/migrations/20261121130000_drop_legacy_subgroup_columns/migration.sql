-- Subgroup membership lives in subgroup_students (Subgroup/SubgroupStudent).
-- The four fixed columns on user_groups were a second, older model that
-- only fitted one cohort's four courses; drop them.
--
-- Guard: refuse to drop them while they still hold assignments for a student
-- who has no subgroup_students rows. Copy those first with
-- scripts/migrate-subgroups.ts from a release before this migration
-- (git show 498e197:scripts/migrate-subgroups.ts).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "user_groups" ug
    WHERE (ug."subgroupCommerce" IS NOT NULL
        OR ug."subgroupTutorial" IS NOT NULL
        OR ug."subgroupFinance" IS NOT NULL
        OR ug."subgroupSystemThinking" IS NOT NULL)
      AND NOT EXISTS (SELECT 1 FROM "subgroup_students" ss WHERE ss."userId" = ug."userId")
  ) THEN
    RAISE EXCEPTION 'user_groups still holds subgroup assignments that are missing from subgroup_students; copy them with scripts/migrate-subgroups.ts first';
  END IF;
END $$;

ALTER TABLE "user_groups"
  DROP COLUMN "subgroupCommerce",
  DROP COLUMN "subgroupTutorial",
  DROP COLUMN "subgroupFinance",
  DROP COLUMN "subgroupSystemThinking";
