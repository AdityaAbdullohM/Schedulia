-- Add angkatan column to Course table
ALTER TABLE "Course"
  ADD COLUMN IF NOT EXISTS "angkatan" INTEGER;

-- Verify the column was added
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'Course'
  AND column_name = 'angkatan';
