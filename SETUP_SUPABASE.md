# Setup Database Supabase - Panduan Manual

Karena koneksi pooling kadang timeout, ikuti langkah ini untuk setup schema di Supabase dashboard:

## ✅ Langkah 1: Buka Supabase SQL Editor

1. Buka https://supabase.com/dashboard
2. Pilih project Anda (`tiltuqojweqbmhwgldiut`)
3. Di sidebar, klik **"SQL Editor"**
4. Klik **"New query"**

## ✅ Langkah 2: Copy & Paste SQL

1. Buka file: `prisma/schema.sql`
2. Copy SEMUA isi file
3. Paste ke Supabase SQL Editor
4. Klik tombol **"Run"** (atau `Ctrl+Enter`)

Tunggu sampai selesai ✅

## ✅ Langkah 3: Verifikasi Setup

Di SQL Editor, jalankan query ini untuk verifikasi:

```sql
SELECT * FROM "User";
SELECT * FROM "Course";
SELECT * FROM "Classroom";
```

Jika ada data, setup berhasil! ✅

## ✅ Langkah 4: Jalankan App

Kembali ke terminal, jalankan:

```bash
npm run dev
```

Akses: http://localhost:3000/dashboard?role=ADMIN

---

## ❓ Jika Gagal di Step 2

**Error: "table already exists"**
- Berarti ada schema lama, cukup skip bagian CREATE TABLE dan jalankan INSERT seed saja

**Error: "connection refused"**
- Coba refresh page Supabase, atau tunggu beberapa menit

**Error: "type already exists"**  
- Drop type dulu dengan:
  ```sql
  DROP TYPE IF EXISTS "Role" CASCADE;
  ```
  Lalu jalankan ulang seluruh SQL

---

## 🔧 Alternatif: Gunakan Connection String Langsung

Jika ingin migrasi via Prisma lagi, coba gunakan direct connection (tanpa pooling):

```
postgresql://postgres:[PASSWORD]@db.tifuqojweqbmhwgldiut.supabase.co:5432/postgres?sslmode=require
```

Update `.env`:
```
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
```

Lalu jalankan:
```bash
npx prisma migrate deploy
```

---

## ✨ Sudah Selesai!

Database Anda sekarang siap dengan:
- ✅ Schema lengkap (User, Course, Classroom, ClassSchedule, Enrollment)
- ✅ Admin user (admin@schedulia.local)
- ✅ Sample data (3 courses, 3 classrooms)

Sekarang Anda bisa:
- Login dengan email: `admin@schedulia.local`, password: `admin123`
- Menggunakan fitur CRUD Mata Kuliah di dashboard admin
- Menambah user/dosen/mahasiswa melalui database

Enjoy! 🎉
