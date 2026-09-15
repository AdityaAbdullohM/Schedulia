import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Schedulia",
  description: "Sistem penjadwalan mata kuliah untuk admin, dosen, dan mahasiswa.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
