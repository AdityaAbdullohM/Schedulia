-- Add angkatan column to User table if it doesn't exist
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "angkatan" INTEGER;

-- Insert admin user (password: password123, base64 encoded: cGFzc3dvcmQxMjM=)
INSERT INTO "User" (id, name, email, "passwordHash", role, nip, "createdAt", "updatedAt")
VALUES (
  'admin-001',
  'Budi Santoso',
  'admin@schedulia.id',
  'cGFzc3dvcmQxMjM=',
  'ADMIN',
  '198506152010121001',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Insert second admin user (password: adminPass456, base64 encoded: YWRtaW5QYXNzNDU2)
INSERT INTO "User" (id, name, email, "passwordHash", role, nip, "createdAt", "updatedAt")
VALUES (
  'admin-002',
  'Siti Rahmawati',
  'admin.siti@schedulia.id',
  'YWRtaW5QYXNzNDU2',
  'ADMIN',
  '198712302012101002',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Verify data was inserted
SELECT id, name, email, role FROM "User" WHERE role = 'ADMIN';
