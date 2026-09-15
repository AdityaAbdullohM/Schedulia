# Schedulia

> Sistem penjadwalan mata kuliah multi-role untuk membantu kampus mengelola jadwal, pengguna, kelas, ruangan, KRS, absensi, dan pengumuman dalam satu tempat.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?logo=postgresql&logoColor=white)
![License](https://img.shields.io/badge/license-private-lightgrey)

Schedulia dibangun untuk tiga jenis pengguna: **Admin**, **Dosen**, dan **Mahasiswa**. Setiap role mendapatkan dashboard dan alur kerja yang sesuai dengan kebutuhannya.

## Daftar Isi

- [Fitur](#fitur)
- [Teknologi](#teknologi)
- [Menjalankan Secara Lokal](#menjalankan-secara-lokal)
- [Menyiapkan Database](#menyiapkan-database)
- [Deployment ke Vercel](#deployment-ke-vercel)
- [Struktur Proyek](#struktur-proyek)
- [Perintah yang Tersedia](#perintah-yang-tersedia)
- [Troubleshooting](#troubleshooting)

## Fitur

### Admin

- Dashboard ringkasan akademik
- CRUD pengguna, program studi, mata kuliah, kelas, dan ruangan
- Pengelolaan dosen dan penugasan mata kuliah
- Pengelolaan jadwal kuliah
- Monitoring KRS dan data akademik

### Dosen

- Melihat jadwal mengajar
- Melihat kelas yang diampu
- Mengelola absensi
- Membuat pengumuman untuk kelas

### Mahasiswa

- Melihat jadwal kuliah
- Mengelola KRS
- Melihat absensi
- Membaca dan membalas pengumuman kelas

## Teknologi

- **Next.js 16** dengan App Router
- **React 19** dan **TypeScript**
- **Prisma ORM**
- **PostgreSQL** melalui Supabase
- **SweetAlert2** untuk notifikasi antarmuka
- **Vercel** untuk deployment

## Menjalankan Secara Lokal

### Prasyarat

- Node.js 20 atau lebih baru
- npm
- Project PostgreSQL, disarankan Supabase

### Instalasi

```bash
git clone https://github.com/AdityaAbdullohM/Schedulia.git
cd Schedulia
npm install
```

Buat file `.env` di root project:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/postgres?sslmode=require"
NEXT_PUBLIC_APP_NAME="Schedulia"
```

Jangan commit `.env` ke GitHub. File tersebut sudah masuk `.gitignore`.

Jalankan aplikasi:

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Menyiapkan Database

Cara paling mudah untuk database Supabase baru:

1. Buka project Supabase.
2. Pilih **SQL Editor**.
3. Buat query baru.
4. Salin seluruh isi [`supabase-setup.sql`](supabase-setup.sql).
5. Tempel dan klik **Run**.

Script tersebut bersifat idempotent untuk tabel dan data awal. Script akan membuat schema, relasi, index, akun admin, program studi, mata kuliah, dan ruangan contoh.

Verifikasi hasil setup:

```sql
SELECT "id", "name", "email", "role" FROM "User";
SELECT "id", "code", "title" FROM "Course";
SELECT "id", "name", "capacity" FROM "Classroom";
```

Untuk melihat database melalui antarmuka Prisma:

```bash
npx prisma studio
```

Buka [http://localhost:5555](http://localhost:5555).

> `DATABASE_URL` di `.env` menentukan database yang ditampilkan Prisma Studio. Pastikan URL tersebut menunjuk ke database yang sama dengan yang digunakan aplikasi.

## Deployment ke Vercel

1. Push project ke GitHub.
2. Import repository ke Vercel.
3. Di **Settings → Environment Variables**, tambahkan:

   ```text
   Name: DATABASE_URL
   Value: connection string PostgreSQL dari Supabase
   ```

4. Aktifkan variable untuk **Production**, **Preview**, dan **Development** sesuai kebutuhan.
5. Deploy atau redeploy project.

Untuk Vercel, gunakan connection string Supabase yang sesuai untuk serverless, misalnya **Session Pooler**. Jika password berisi karakter khusus seperti `@`, `#`, `%`, atau `/`, lakukan URL encoding terlebih dahulu.

Nilai environment variable di Vercel harus berupa URL saja, tanpa `DATABASE_URL=` dan tanpa tanda kutip:

```text
postgresql://postgres.PROJECT_REF:PASSWORD@POOLER_HOST:5432/postgres?sslmode=require
```

Script build sudah menjalankan `prisma generate` secara eksplisit agar kompatibel dengan cache dependency Vercel:

```bash
npm run build
```

## Struktur Proyek

```text
app/
  api/              Route API untuk autentikasi dan data akademik
  dashboard/        Dashboard dan manager berdasarkan role
  login/            Halaman login
  page.tsx          Halaman utama
lib/
  prisma.ts         Singleton Prisma Client
  mock-data.ts      Data pendukung antarmuka
prisma/
  schema.prisma     Schema database utama
  migrations/       SQL migrasi tambahan
supabase-setup.sql  Setup database lengkap untuk Supabase
```

## Perintah yang Tersedia

| Perintah | Kegunaan |
| --- | --- |
| `npm run dev` | Menjalankan server development |
| `npm run build` | Generate Prisma Client dan membuat production build |
| `npm run start` | Menjalankan production build |
| `npm run lint` | Menjalankan ESLint |
| `npx prisma studio` | Membuka browser database viewer |
| `npx prisma generate` | Generate Prisma Client |
| `npx prisma db push` | Sinkronisasi schema ke database |

## Troubleshooting

### `relation "User" does not exist`

Database belum memiliki schema. Jalankan seluruh [`supabase-setup.sql`](supabase-setup.sql) melalui Supabase SQL Editor.

### `PrismaClientInitializationError` di Vercel

Periksa hal berikut:

- `DATABASE_URL` sudah ditambahkan di Vercel.
- Variable aktif untuk environment deployment yang digunakan.
- Connection string menunjuk ke project Supabase yang benar.
- Password database masih valid.
- Deployment terbaru menggunakan commit terbaru.

### Login menghasilkan status `500`

Buka **Vercel → Logs**, lalu cari error dari `/api/login`. Status `500` biasanya menunjukkan masalah koneksi database atau environment variable, sedangkan status `401` berarti email atau password tidak cocok.

### Build Vercel memakai Prisma Client lama

Pastikan deployment menggunakan `main` terbaru dan script build tetap berisi:

```json
"build": "prisma generate && next build"
```

## Keamanan

- Jangan commit `.env`, connection string, atau password database.
- Reset password database jika pernah terekspos.
- Ganti akun demo sebelum aplikasi digunakan secara production.
- Simpan secret hanya di environment variable platform deployment.

## Status Proyek

Schedulia masih dalam tahap pengembangan aktif. Struktur API dan dashboard dapat berubah seiring penambahan fitur akademik.
