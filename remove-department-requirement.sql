-- Make department column optional in Course table
ALTER TABLE "Course"
  ALTER COLUMN "department" DROP NOT NULL;

-- Set existing department values that are NULL to a default value or leave as NULL
-- This query shows the impact - run if needed
-- UPDATE "Course" SET "department" = NULL WHERE "department" = '';

-- Verify the change
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'Course'
  AND column_name = 'department';
