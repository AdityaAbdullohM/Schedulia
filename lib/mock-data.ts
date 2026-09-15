export type RoleKey = "ADMIN" | "DOSEN" | "MAHASISWA";

export const summaryStats: Record<RoleKey, { label: string; value: string }[]> = {
  ADMIN: [
    { label: "Total Mata Kuliah", value: "42" },
    { label: "Ruangan Aktif", value: "18" },
    { label: "Dosen Terjadwal", value: "27" },
    { label: "Mahasiswa Terdaftar", value: "540" },
  ],
  DOSEN: [
    { label: "Kelas Saya", value: "6" },
    { label: "Jam Mengajar", value: "18 jam" },
    { label: "Ruangan", value: "4" },
    { label: "Mahasiswa", value: "180" },
  ],
  MAHASISWA: [
    { label: "SKS Terdaftar", value: "20" },
    { label: "Kelas Hari Ini", value: "3" },
    { label: "Jadwal Kosong", value: "2 slot" },
    { label: "IP Semester", value: "3.72" },
  ],
};

export const schedulesByRole: Record<RoleKey, Array<{ day: string; time: string; course: string; room: string; lecturer?: string; students?: string }>> = {
  ADMIN: [
    { day: "Senin", time: "08:00 - 10:00", course: "Pemrograman Web", room: "R.301", lecturer: "Dr. Siti Rahma" },
    { day: "Selasa", time: "10:00 - 12:00", course: "Basis Data", room: "Lab. DB", lecturer: "Prof. Rinaldi" },
    { day: "Rabu", time: "13:00 - 15:00", course: "Kecerdasan Buatan", room: "R.205", lecturer: "Dr. Agus Wijaya" },
  ],
  DOSEN: [
    { day: "Senin", time: "08:00 - 10:00", course: "Pemrograman Web", room: "R.301", students: "36 mahasiswa" },
    { day: "Selasa", time: "10:00 - 12:00", course: "Basis Data", room: "Lab. DB", students: "42 mahasiswa" },
    { day: "Kamis", time: "13:00 - 15:00", course: "Jaringan Komputer", room: "R.208", students: "30 mahasiswa" },
  ],
  MAHASISWA: [
    { day: "Senin", time: "08:00 - 10:00", course: "Pemrograman Web", room: "R.301", lecturer: "Dr. Siti Rahma" },
    { day: "Selasa", time: "10:00 - 12:00", course: "Basis Data", room: "Lab. DB", lecturer: "Prof. Rinaldi" },
    { day: "Kamis", time: "13:00 - 15:00", course: "Jaringan Komputer", room: "R.208", lecturer: "Dr. Fajar Hidayat" },
  ],
};

export const alertsByRole: Record<RoleKey, string[]> = {
  ADMIN: [
    "3 ruangan memerlukan pengecekan perangkat laboratorium.",
    "Pengajuan jadwal baru menunggu persetujuan akhir.",
    "2 mata kuliah overlap di semester ganjil.",
  ],
  DOSEN: [
    "Jadwal ujian tengah semester perlu dikonfirmasi.",
    "Anda memiliki 2 kelas yang membutuhkan absensi harian.",
    "Kelas Basis Data baru dibuka untuk daftar ulang.",
  ],
  MAHASISWA: [
    "Kelas Pemrograman Web dibuka untuk pengajuan cuti kelas.",
    "Deadline pengisian KRS: 31 Agustus 2026.",
    "Jadwal konsultasi dosen tersedia hari Jumat pukul 09:00.",
  ],
};

export const metricsByRole: Record<RoleKey, { title: string; value: string; accent: string }[]> = {
  ADMIN: [
    { title: "Ketersediaan Ruangan", value: "87%", accent: "#10b981" },
    { title: "Kapasitas Kelas", value: "94%", accent: "#2563eb" },
    { title: "Persetujuan Jadwal", value: "12 menunggu", accent: "#f59e0b" },
  ],
  DOSEN: [
    { title: "Presensi Masuk", value: "96%", accent: "#22c55e" },
    { title: "Nilai Tersimpan", value: "142", accent: "#3b82f6" },
    { title: "Konsultasi", value: "8", accent: "#a855f7" },
  ],
  MAHASISWA: [
    { title: "Kehadiran", value: "92%", accent: "#10b981" },
    { title: "SKS Sisa", value: "6", accent: "#3b82f6" },
    { title: "Konsultasi", value: "2", accent: "#f59e0b" },
  ],
};
