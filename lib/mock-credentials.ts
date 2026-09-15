/**
 * Mock Credentials untuk Testing
 * File ini berisi data login dummy untuk masing-masing role
 */

export interface UserCredential {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "DOSEN" | "MAHASISWA";
  nip?: string;
  nim?: string;
}

export const mockCredentials: UserCredential[] = [
  // Admin Users
  {
    name: "Budi Santoso",
    email: "admin@schedulia.id",
    password: "password123",
    role: "ADMIN",
    nip: "198506152010121001",
  },
  {
    name: "Siti Rahmawati",
    email: "admin.siti@schedulia.id",
    password: "adminPass456",
    role: "ADMIN",
    nip: "198712302012101002",
  },

  // Dosen (Lecturer) Users
  {
    name: "Dr. Siti Rahma",
    email: "siti.rahma@schedulia.id",
    password: "dosenPass123",
    role: "DOSEN",
    nip: "198203152008121001",
  },
  {
    name: "Prof. Rinaldi",
    email: "rinaldi@schedulia.id",
    password: "rinaldi2024",
    role: "DOSEN",
    nip: "196712101990031001",
  },
  {
    name: "Dr. Agus Wijaya",
    email: "agus.wijaya@schedulia.id",
    password: "agusPass789",
    role: "DOSEN",
    nip: "197905202002121001",
  },
  {
    name: "Dr. Fajar Hidayat",
    email: "fajar.hidayat@schedulia.id",
    password: "fajarPass321",
    role: "DOSEN",
    nip: "198401152015031001",
  },

  // Mahasiswa (Student) Users
  {
    name: "Ahmad Rizki",
    email: "ahmad.rizki@student.schedulia.id",
    password: "student123",
    role: "MAHASISWA",
    nim: "2301001001",
  },
  {
    name: "Nur Azizah",
    email: "nur.azizah@student.schedulia.id",
    password: "azizah456",
    role: "MAHASISWA",
    nim: "2301001002",
  },
  {
    name: "Budi Santoso",
    email: "budi.santoso@student.schedulia.id",
    password: "budi789",
    role: "MAHASISWA",
    nim: "2301001003",
  },
  {
    name: "Sinta Dewi",
    email: "sinta.dewi@student.schedulia.id",
    password: "sinta2024",
    role: "MAHASISWA",
    nim: "2301001004",
  },
  {
    name: "Reza Muhammad",
    email: "reza.muhammad@student.schedulia.id",
    password: "reza321",
    role: "MAHASISWA",
    nim: "2301001005",
  },
];

/**
 * Get credentials by role
 */
export function getCredentialsByRole(role: "ADMIN" | "DOSEN" | "MAHASISWA"): UserCredential[] {
  return mockCredentials.filter((cred) => cred.role === role);
}

/**
 * Get default credential for role
 */
export function getDefaultCredentialForRole(role: "ADMIN" | "DOSEN" | "MAHASISWA"): UserCredential | undefined {
  return mockCredentials.find((cred) => cred.role === role);
}

/**
 * Validate credentials
 */
export function validateCredentials(email: string, password: string): UserCredential | null {
  const user = mockCredentials.find((cred) => cred.email === email && cred.password === password);
  return user || null;
}
