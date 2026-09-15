-- Seed default admin account for Schedulia
-- Login credentials:
--   email: admin@schedulia.id
--   password: password123
--
-- Note: passwordHash is Base64 of the plaintext password because auth compares:
--   Buffer.from(password).toString("base64")

INSERT INTO "User" (
  id,
  name,
  email,
  "passwordHash",
  role,
  nip,
  "createdAt",
  "updatedAt"
)
VALUES (
  'admin-schedulia-001',
  'Budi Santoso',
  'admin@schedulia.id',
  'cGFzc3dvcmQxMjM=',
  'ADMIN',
  '198506152010121001',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET
  name = EXCLUDED.name,
  "passwordHash" = EXCLUDED."passwordHash",
  role = EXCLUDED.role,
  nip = EXCLUDED.nip,
  "updatedAt" = NOW();

-- Optional second admin account if needed
INSERT INTO "User" (
  id,
  name,
  email,
  "passwordHash",
  role,
  nip,
  "createdAt",
  "updatedAt"
)
VALUES (
  'admin-schedulia-002',
  'Siti Rahmawati',
  'admin.siti@schedulia.id',
  'YWRtaW5QYXNzNDU2',
  'ADMIN',
  '198712302012101002',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET
  name = EXCLUDED.name,
  "passwordHash" = EXCLUDED."passwordHash",
  role = EXCLUDED.role,
  nip = EXCLUDED.nip,
  "updatedAt" = NOW();

SELECT * FROM "User" WHERE role = 'ADMIN';
