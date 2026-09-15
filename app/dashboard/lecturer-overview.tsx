"use client";

type LecturerUser = { name: string; email: string; status: string; nip: string | null; programStudy: { name: string } | null } | null;
type DashboardData = { stats: Array<{ label: string; value: string }>; schedules: Array<{ id: string; day: string; time: string; course: string; room: string; lecturer?: string; semester?: string; enrolledStudents: unknown[] }>; alerts: string[] };

export default function LecturerOverview({ data, user }: { data: DashboardData; user: LecturerUser; userId?: string }) {
  const today = new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(new Date());
  const todaySchedules = data.schedules.filter((schedule) => schedule.day.toLowerCase() === today.toLowerCase());

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <section style={{ position: "relative", overflow: "hidden", background: "linear-gradient(120deg, #312e81 0%, #4338ca 55%, #0891b2 145%)", borderRadius: 22, padding: "30px", color: "white", boxShadow: "0 18px 36px rgba(67,56,202,.2)" }}>
        <div style={{ position: "relative", zIndex: 1 }}><div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", opacity: .75 }}>Ruang kerja dosen</div><h2 style={{ fontSize: "clamp(1.8rem,4vw,2.7rem)", lineHeight: 1.05, margin: "12px 0 10px" }}>Selamat datang, {user?.name ?? "Dosen"}</h2><p style={{ margin: 0, opacity: .86 }}>Kelola jadwal mengajar dan validasi KRS mahasiswa dengan lebih cepat.</p></div>
        <div aria-hidden="true" style={{ position: "absolute", right: -45, bottom: -90, width: 260, height: 260, border: "38px solid rgba(255,255,255,.12)", borderRadius: "50%" }} />
      </section>
      <section style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) minmax(250px,.8fr)", gap: 20 }} className="lecturer-overview-grid"><div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 18, padding: 22 }}><h3 style={{ margin: "0 0 16px" }}>Jadwal Anda Hari Ini</h3><div style={{ display: "inline-flex", background: "#eef2ff", color: "#4338ca", borderRadius: 999, padding: "7px 10px", fontSize: 12, fontWeight: 800, marginBottom: 14 }}>{todaySchedules.length} jadwal</div>{todaySchedules.length ? <div style={{ display: "grid", gap: 10 }}>{todaySchedules.map((schedule) => <div key={schedule.id} style={{ border: "1px solid #eef2f7", borderRadius: 12, padding: 13 }}><div style={{ fontWeight: 800 }}>{schedule.course}</div><div style={{ color: "#64748b", fontSize: 13, marginTop: 5 }}>{schedule.time} • {schedule.room}</div></div>)}</div> : <div style={{ color: "#64748b", background: "#f8fafc", padding: 15, borderRadius: 12 }}>Tidak ada jadwal mengajar hari ini.</div>}</div><div style={{ background: "#0f172a", color: "white", borderRadius: 18, padding: 22 }}><div style={{ color: "#a5b4fc", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.2 }}>Profil pengajar</div><h3 style={{ margin: "6px 0 18px" }}>Data Anda</h3>{[["Email", user?.email ?? "-"], ["NIP", user?.nip ?? "-"], ["Program Studi", user?.programStudy?.name ?? "-"]].map(([label, value]) => <div key={label} style={{ borderBottom: "1px solid #334155", padding: "9px 0" }}><div style={{ color: "#94a3b8", fontSize: 11 }}>{label}</div><div style={{ marginTop: 4, fontWeight: 700, wordBreak: "break-word" }}>{value}</div></div>)}<div style={{ color: "#bbf7d0", fontSize: 12, fontWeight: 800, marginTop: 16 }}>● Status: {user?.status ?? "-"}</div></div></section>
      <section style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 18, padding: 22 }}><h3 style={{ margin: "0 0 12px" }}>Pemberitahuan</h3>{data.alerts.length ? data.alerts.map((alert) => <div key={alert} style={{ background: "#eef2ff", borderLeft: "3px solid #6366f1", padding: "10px 12px", color: "#312e81", fontSize: 13, marginTop: 8 }}>{alert}</div>) : <div style={{ color: "#64748b" }}>Belum ada pemberitahuan.</div>}</section>
      <style>{`@media (max-width: 760px) { .lecturer-overview-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
