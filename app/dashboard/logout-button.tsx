"use client";

import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Konfirmasi Logout",
      text: "Apakah Anda yakin ingin keluar dari aplikasi?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Logout",
      cancelButtonText: "Batal",
      backdrop: true,
      allowOutsideClick: false,
      allowEscapeKey: false,
    });

    if (result.isConfirmed) {
      // Hapus user data dari localStorage
      localStorage.removeItem("currentUser");

      // Tampilkan success message
      await Swal.fire({
        title: "Logout Berhasil",
        text: "Anda telah berhasil keluar dari aplikasi",
        icon: "success",
        confirmButtonColor: "#2563eb",
        timer: 1500,
        timerProgressBar: true,
      });

      // Redirect ke login page
      router.push("/login");
    }
  };

  return (
    <button
      onClick={handleLogout}
      style={{
        background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
        color: "white",
        border: "none",
        padding: "10px 24px",
        borderRadius: 12,
        fontWeight: 700,
        fontSize: "0.9rem",
        cursor: "pointer",
        transition: "all 0.3s ease",
        boxShadow: "0 4px 12px rgba(220, 38, 38, 0.3)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 16px rgba(220, 38, 38, 0.4)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(220, 38, 38, 0.3)";
      }}
    >
      🚪 Logout
    </button>
  );
}
