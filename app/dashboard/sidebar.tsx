"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const roleStyles = {
  ADMIN: { accent: "#2563eb", surface: "rgba(37, 99, 235, 0.12)", gradient: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)" },
  DOSEN: { accent: "#7c3aed", surface: "rgba(124, 58, 237, 0.12)", gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)" },
  MAHASISWA: { accent: "#db2777", surface: "rgba(219, 39, 119, 0.12)", gradient: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)" },
} as const;

const sidebarItems = {
  ADMIN: [
    { id: "overview", label: "Overview", icon: "🏠" },
    { id: "jadwal", label: "Jadwal", icon: "🗓️" },
    { id: "courses", label: "Mata Kuliah", icon: "📚" },
    { id: "prodi", label: "Program Studi", icon: "🎓" },
    { id: "kelas", label: "Kelas", icon: "🏫" },
    { id: "users", label: "Pengguna", icon: "👥" },
    { id: "ruangan", label: "Ruangan", icon: "🏫" },
    { id: "dosen", label: "Dosen Pengampu", icon: "👨‍🎓" },
  ],
  DOSEN: [
    { id: "overview", label: "Overview", icon: "🏠" },
    { id: "jadwal", label: "Jadwal", icon: "👨‍🏫" },
    { id: "krs", label: "Validasi KRS", icon: "📝" },
  ],
  MAHASISWA: [
    { id: "overview", label: "Overview", icon: "🏠" },
    { id: "jadwal", label: "Kelas", icon: "📚" },
    { id: "krs", label: "KRS", icon: "📝" },
  ],
} as const;

type SidebarItemId = (typeof sidebarItems)[keyof typeof sidebarItems][number]["id"];

export default function DashboardSidebar({
  role,
  activeSection,
  userId,
}: {
  role: keyof typeof roleStyles;
  activeSection: SidebarItemId;
  userId?: string;
}) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const style = roleStyles[role];

  useEffect(() => {
    const applyMobileState = () => {
      setCollapsed(window.innerWidth <= 900);
    };

    applyMobileState();
    window.addEventListener("resize", applyMobileState);

    return () => window.removeEventListener("resize", applyMobileState);
  }, []);

  const handleNavigate = (itemId: SidebarItemId) => {
    const query = userId ? `?role=${role}&userId=${userId}&section=${itemId}` : `?role=${role}&section=${itemId}`;
    router.push(`/dashboard${query}`);
  };

  return (
    <aside
      style={{
        width: collapsed ? 88 : 260,
        minWidth: collapsed ? 88 : 260,
        background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
        border: "1px solid #e2e8f0",
        borderRadius: 24,
        boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
        padding: collapsed ? 12 : 20,
        position: "sticky",
        top: 24,
        transition: "all 0.2s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          gap: 12,
          padding: collapsed ? "8px 0 18px" : "8px 10px 18px",
          borderBottom: "1px solid #e2e8f0",
          marginBottom: 18,
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            background: style.gradient,
            display: "grid",
            placeItems: "center",
            color: "white",
            fontSize: 20,
            boxShadow: `0 10px 20px ${style.accent}33`,
          }}
        >
          {role === "ADMIN" ? "A" : role === "DOSEN" ? "D" : "M"}
        </div>

        {!collapsed && (
          <div>
            <div style={{ fontSize: 12, color: "#64748b", letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700 }}>
              Schedulia
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
              {role === "ADMIN" ? "Admin" : role === "DOSEN" ? "Dosen" : "Mahasiswa"}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            border: "1px solid #e2e8f0",
            background: "#f8fafc",
            color: "#334155",
            cursor: "pointer",
            fontSize: 16,
            fontWeight: 700,
            display: "grid",
            placeItems: "center",
          }}
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>

      <nav style={{ display: "grid", gap: 8 }}>
        {sidebarItems[role].map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              title={item.label}
              onClick={() => handleNavigate(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: collapsed ? "center" : "flex-start",
                gap: 12,
                padding: collapsed ? "12px 8px" : "12px 14px",
                borderRadius: 12,
                background: isActive ? style.surface : "transparent",
                color: isActive ? style.accent : "#334155",
                border: isActive ? `1px solid ${style.accent}33` : "1px solid transparent",
                fontWeight: isActive ? 700 : 600,
                textDecoration: "none",
                transition: "all 0.2s ease",
                cursor: "pointer",
                width: "100%",
                textAlign: collapsed ? "center" : "left",
                fontSize: 15,
              }}
            >
              <span aria-hidden="true" style={{ fontSize: 18 }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {!collapsed && (
        <div
          style={{
            marginTop: 24,
            padding: 16,
            borderRadius: 16,
            background: style.surface,
            border: `1px solid ${style.accent}22`,
            color: "#0f172a",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.3, textTransform: "uppercase", color: style.accent }}>
            Status
          </div>
          <div style={{ marginTop: 8, fontWeight: 700, fontSize: 16 }}>{role === "ADMIN" ? "Panel Administrator" : role === "DOSEN" ? "Dashboard Dosen" : "Portal Mahasiswa"}</div>
        </div>
      )}
    </aside>
  );
}
