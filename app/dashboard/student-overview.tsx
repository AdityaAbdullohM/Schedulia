"use client";

import { useMemo, useState } from "react";

type StudentUser = {
  name: string;
  email: string;
  status: string;
  nim: string | null;
  angkatan: number | null;
  classGroup: { programStudy: { name: string } | null } | null;
} | null;

type DashboardData = {
  stats: Array<{ label: string; value: string }>;
  schedules: Array<{
    day: string;
    time: string;
    course: string;
    room: string;
    lecturer?: string;
    semester?: string;
  }>;
  alerts: string[];
};

export default function StudentOverview({
  data,
  user,
  userId,
}: {
  data: DashboardData;
  user: StudentUser;
  userId?: string;
}) {
  const [scheduleSearch, setScheduleSearch] = useState("");
  const today = new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(new Date());

  const todaySchedules = useMemo(() => {
    const schedules = data.schedules.filter((schedule) => schedule.day.toLowerCase() === today.toLowerCase());
    const query = scheduleSearch.trim().toLowerCase();
    if (!query) return schedules;

    return schedules.filter((schedule) =>
      `${schedule.course} ${schedule.day} ${schedule.room} ${schedule.lecturer ?? ""}`.toLowerCase().includes(query)
    );
  }, [data.schedules, scheduleSearch, today]);

  const dashboardLink = (section: string) =>
    userId ? `/dashboard?role=MAHASISWA&userId=${userId}&section=${section}` : `/dashboard?role=MAHASISWA&section=${section}`;

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(120deg, #831843 0%, #be185d 52%, #f97316 140%)",
          borderRadius: 22,
          padding: "28px 30px",
          color: "white",
          boxShadow: "0 18px 36px rgba(190, 24, 93, 0.2)",
        }}
      >
        <div style={{ position: "relative", zIndex: 1, maxWidth: 620 }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", opacity: 0.78 }}>Portal Mahasiswa</div>
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.7rem)", lineHeight: 1.05, margin: "12px 0 10px", letterSpacing: 0 }}>
            Halo, {user?.name ?? "Mahasiswa"}
          </h2>
          <p style={{ margin: 0, opacity: 0.86, lineHeight: 1.6 }}>Pantau jadwal kuliah dan rencana studi Anda dalam satu tempat.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 22 }}>
            <a href={dashboardLink("krs")} style={{ background: "white", color: "#9d174d", borderRadius: 10, padding: "10px 14px", fontWeight: 800 }}>Kelola KRS</a>
            <a href={dashboardLink("jadwal")} style={{ background: "rgba(255,255,255,0.14)", color: "white", border: "1px solid rgba(255,255,255,0.35)", borderRadius: 10, padding: "10px 14px", fontWeight: 800 }}>Lihat Jadwal</a>
          </div>
        </div>
        <div aria-hidden="true" style={{ position: "absolute", right: -35, bottom: -70, width: 230, height: 230, border: "34px solid rgba(255,255,255,0.12)", borderRadius: "50%" }} />
        <div aria-hidden="true" style={{ position: "absolute", right: 65, top: -75, width: 150, height: 150, border: "1px solid rgba(255,255,255,0.22)", borderRadius: "50%" }} />
      </section>

      <section className="student-overview-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.5fr) minmax(260px, 0.8fr)", gap: 20 }}>
        <div style={{ background: "white", border: "1px solid #f1d8e4", borderRadius: 18, padding: 22, boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
            <div>
              <div style={{ color: "#be185d", fontSize: 12, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase" }}>Agenda hari ini</div>
              <h3 style={{ margin: "6px 0 0", fontSize: 21 }}>Jadwal {today}</h3>
            </div>
          </div>

          <input value={scheduleSearch} onChange={(event) => setScheduleSearch(event.target.value)} placeholder="Cari mata kuliah atau ruangan hari ini" style={{ width: "100%", padding: "11px 13px", border: "1px solid #e2e8f0", borderRadius: 10, marginBottom: 12, outlineColor: "#db2777" }} />
          <div style={{ display: "grid", gap: 10, maxHeight: 290, overflowY: "auto" }}>
            {todaySchedules.length === 0 ? <div style={{ color: "#64748b", background: "#fff7ed", borderRadius: 12, padding: 16 }}>Tidak ada jadwal kuliah hari ini.</div> : todaySchedules.map((schedule, index) => (
              <div key={`${schedule.course}-${index}`} style={{ display: "grid", gridTemplateColumns: "82px 1fr", gap: 12, alignItems: "center", padding: 12, border: "1px solid #f1f5f9", borderRadius: 12 }}>
                <div style={{ color: "#be185d", fontSize: 12, fontWeight: 800 }}>{schedule.day}<br /><span style={{ color: "#64748b", fontWeight: 600 }}>{schedule.time}</span></div>
                <div><div style={{ fontWeight: 800 }}>{schedule.course}</div><div style={{ color: "#64748b", fontSize: 12 }}>{schedule.room}{schedule.lecturer ? ` • ${schedule.lecturer}` : ""}</div></div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "#111827", color: "white", borderRadius: 18, padding: 22, boxShadow: "0 10px 24px rgba(15, 23, 42, 0.12)" }}>
          <div style={{ color: "#f9a8d4", fontSize: 12, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase" }}>Profil akademik</div>
          <h3 style={{ margin: "6px 0 18px", fontSize: 21 }}>Data Anda</h3>
          <div style={{ display: "grid", gap: 13 }}>
            {[
              ["Email", user?.email ?? "-"],
              ["NIM", user?.nim ?? "-"],
              ["Angkatan", user?.angkatan ? String(user.angkatan) : "-"],
              ["Program Studi", user?.classGroup?.programStudy?.name ?? "-"],
            ].map(([label, value]) => <div key={label} style={{ borderBottom: "1px solid #374151", paddingBottom: 10 }}><div style={{ color: "#9ca3af", fontSize: 11 }}>{label}</div><div style={{ marginTop: 4, fontWeight: 700, wordBreak: "break-word" }}>{value}</div></div>)}
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 18, color: "#bbf7d0", fontSize: 12, fontWeight: 800 }}><span style={{ width: 8, height: 8, background: "#4ade80", borderRadius: "50%" }} /> Status: {user?.status ?? "-"}</div>
        </div>
      </section>

      <section style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 18, padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14 }}><h3 style={{ margin: 0 }}>Pengingat</h3><span style={{ color: "#be185d", fontSize: 12, fontWeight: 800 }}>{data.alerts.length} catatan</span></div>
        {data.alerts.length ? <div style={{ display: "grid", gap: 9 }}>{data.alerts.map((alert) => <div key={alert} style={{ background: "#fff7ed", borderLeft: "3px solid #f97316", padding: "10px 12px", color: "#7c2d12", fontSize: 13 }}>{alert}</div>)}</div> : <div style={{ color: "#64748b" }}>Belum ada pengingat.</div>}
      </section>

      <style>{`@media (max-width: 760px) { .student-overview-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}