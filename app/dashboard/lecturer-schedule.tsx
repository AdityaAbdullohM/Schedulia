"use client";

import { useEffect, useMemo, useState } from "react";

type Student = { enrollmentId: string; name: string; nim: string | null; status: string };
type Schedule = { id: string; day: string; time: string; course: string; room: string; semester?: string; courseId?: string; enrolledStudents: Student[] };
type Status = "Hadir" | "Izin" | "Sakit" | "Alfa";
type Attendance = Record<string, Record<number, Record<string, Status>>>;
type Announcement = { id: string; content: string; replies?: Array<{ id: string; content: string }> };

const statusOptions: Status[] = ["Hadir", "Izin", "Sakit", "Alfa"];

export default function LecturerSchedule({ schedules, lecturerId }: { schedules: Schedule[]; lecturerId?: string }) {
  const [query, setQuery] = useState("");
  const [day, setDay] = useState("Semua hari");
  const [selected, setSelected] = useState<Schedule | null>(null);
  const [meeting, setMeeting] = useState(1);
  const [attendance, setAttendance] = useState<Attendance>({});
  const [announcement, setAnnouncement] = useState("");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    if (!selected) return;
    const loadDetail = async () => {
      const [attendanceResponse, announcementResponse] = await Promise.all([
        fetch(`/api/attendance?scheduleId=${selected.id}`),
        fetch(`/api/announcements?scheduleId=${selected.id}`),
      ]);
      if (attendanceResponse.ok) {
        const records = await attendanceResponse.json();
        const scheduleAttendance: Record<number, Record<string, Status>> = {};
        records.forEach((record: { meeting: number; enrollmentId: string; status: Status }) => {
          scheduleAttendance[record.meeting] = { ...(scheduleAttendance[record.meeting] ?? {}), [record.enrollmentId]: record.status };
        });
        setAttendance((current) => ({ ...current, [selected.id]: scheduleAttendance }));
      }
      if (announcementResponse.ok) setAnnouncements(await announcementResponse.json());
    };
    void loadDetail();
  }, [selected]);

  const days = ["Semua hari", ...Array.from(new Set(schedules.map((item) => item.day)))];
  const filteredSchedules = useMemo(() => schedules.filter((item) => {
    const text = `${item.course} ${item.room} ${item.day}`.toLowerCase();
    return (day === "Semua hari" || item.day === day) && (!query.trim() || text.includes(query.trim().toLowerCase()));
  }), [day, query, schedules]);

  const openDetail = (schedule: Schedule) => {
    setSelected(schedule);
    setMeeting(1);
  };

  const setStudentStatus = async (enrollmentId: string, status: Status) => {
    if (!selected) return;
    setAttendance((current) => ({
      ...current,
      [selected.id]: {
        ...(current[selected.id] ?? {}),
        [meeting]: { ...(current[selected.id]?.[meeting] ?? {}), [enrollmentId]: status },
      },
    }));
    await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enrollmentId, classScheduleId: selected.id, meeting, status, lecturerId }),
    });
  };

  const saveAnnouncement = async () => {
    if (!selected || !announcement.trim()) return;
    const response = await fetch("/api/announcements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ classScheduleId: selected.id, lecturerId, content: announcement.trim() }) });
    if (response.ok) {
      const createdAnnouncement = await response.json();
      setAnnouncements((current) => [createdAnnouncement, ...current]);
    }
    setAnnouncement("");
  };

  const selectedAttendance = selected ? attendance[selected.id]?.[meeting] ?? {} : {};
  const summary = selected?.enrolledStudents.reduce<Record<string, number>>((result, student) => {
    const status = selectedAttendance[student.enrollmentId] ?? "Belum diisi";
    result[status] = (result[status] ?? 0) + 1;
    return result;
  }, {}) ?? {};
  const courseAnnouncements = selected ? announcements : [];

  return (
    <section style={{ display: "grid", gap: 20 }}>
      <div style={{ background: "white", borderRadius: 18, padding: 24, boxShadow: "0 8px 24px rgba(15,23,42,.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
          <div><h2 style={{ margin: 0 }}>Jadwal Mengajar</h2><div style={{ color: "#64748b", marginTop: 6 }}>Pilih detail kelas untuk mengelola mahasiswa, absensi, dan pengumuman.</div></div>
          <span style={{ background: "#eef2ff", color: "#4338ca", borderRadius: 999, padding: "8px 12px", fontSize: 12, fontWeight: 800 }}>{filteredSchedules.length} jadwal</span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari mata kuliah atau ruangan" style={{ flex: "1 1 240px", padding: "11px 13px", border: "1px solid #e2e8f0", borderRadius: 10 }} /><select value={day} onChange={(event) => setDay(event.target.value)} style={{ padding: "11px 13px", border: "1px solid #e2e8f0", borderRadius: 10, background: "white" }}>{days.map((item) => <option key={item}>{item}</option>)}</select></div>
        <div style={{ display: "grid", gap: 12 }}>{filteredSchedules.length === 0 ? <div style={{ color: "#64748b", background: "#f8fafc", padding: 18, borderRadius: 12 }}>Tidak ada jadwal.</div> : filteredSchedules.map((schedule) => <div key={schedule.id} style={{ display: "grid", gridTemplateColumns: "90px 1fr auto", gap: 14, alignItems: "center", border: "1px solid #e2e8f0", borderRadius: 13, padding: 15 }}><div style={{ color: "#4338ca", fontSize: 12, fontWeight: 800 }}>{schedule.day}<br /><span style={{ color: "#64748b", fontWeight: 600 }}>{schedule.time}</span></div><div><div style={{ fontWeight: 800, fontSize: 17 }}>{schedule.course}</div><div style={{ color: "#64748b", fontSize: 13 }}>{schedule.room} • {schedule.enrolledStudents.length} mahasiswa</div></div><button type="button" onClick={() => openDetail(schedule)} style={{ border: 0, borderRadius: 9, background: "#4338ca", color: "white", padding: "9px 12px", fontWeight: 800, cursor: "pointer" }}>Detail</button></div>)}</div>
      </div>

      {selected && <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 30, background: "rgba(15,23,42,.58)", display: "grid", placeItems: "center", padding: 20 }}><div style={{ background: "white", width: "min(780px,100%)", maxHeight: "90vh", overflowY: "auto", borderRadius: 18, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 20 }}><div><div style={{ color: "#4338ca", fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>Detail kelas</div><h2 style={{ margin: "6px 0 4px" }}>{selected.course}</h2><div style={{ color: "#64748b", fontSize: 13 }}>{selected.day} • {selected.time} • {selected.room}</div></div><button type="button" onClick={() => setSelected(null)} aria-label="Tutup detail" style={{ border: 0, background: "#f1f5f9", borderRadius: 8, padding: "6px 11px", fontSize: 18, cursor: "pointer" }}>×</button></div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 16 }}><h3 style={{ margin: 0 }}>Pertemuan {meeting}</h3><select value={meeting} onChange={(event) => setMeeting(Number(event.target.value))} style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "7px 9px" }}>{Array.from({ length: Math.max(1, Math.max(meeting, 16)) }, (_, index) => <option key={index + 1} value={index + 1}>Pertemuan {index + 1}</option>)}</select><button type="button" onClick={() => setMeeting((current) => current + 1)} style={{ border: 0, borderRadius: 8, background: "#e0e7ff", color: "#3730a3", padding: "8px 10px", fontWeight: 800, cursor: "pointer" }}>+ Pertemuan</button></div>
        <h3 style={{ margin: "0 0 10px" }}>Absensi Mahasiswa ({selected.enrolledStudents.length})</h3><div style={{ display: "grid", gap: 8 }}>{selected.enrolledStudents.length === 0 ? <div style={{ color: "#64748b", background: "#f8fafc", padding: 12, borderRadius: 10 }}>Belum ada mahasiswa yang mengambil mata kuliah ini.</div> : selected.enrolledStudents.map((student) => <div key={student.enrollmentId} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "center", border: "1px solid #e2e8f0", borderRadius: 10, padding: 10 }}><div><div style={{ fontWeight: 700 }}>{student.name}</div><div style={{ color: "#64748b", fontSize: 12 }}>{student.nim ?? "NIM belum tersedia"}</div></div><select value={selectedAttendance[student.enrollmentId] ?? "Hadir"} onChange={(event) => setStudentStatus(student.enrollmentId, event.target.value as Status)} style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "7px 8px", fontSize: 12 }}>{statusOptions.map((status) => <option key={status}>{status}</option>)}</select></div>)}</div>
        <div style={{ marginTop: 18, padding: 14, background: "#f8fafc", borderRadius: 12 }}><h3 style={{ margin: "0 0 10px" }}>Rekap Pertemuan {meeting}</h3><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{["Hadir", "Izin", "Sakit", "Alfa", "Belum diisi"].map((status) => <span key={status} style={{ background: status === "Hadir" ? "#dcfce7" : status === "Belum diisi" ? "#e2e8f0" : "#fef3c7", color: "#334155", borderRadius: 999, padding: "7px 10px", fontSize: 12, fontWeight: 800 }}>{status}: {summary[status] ?? 0}</span>)}</div></div>
        <div style={{ marginTop: 20, borderTop: "1px solid #e2e8f0", paddingTop: 18 }}><h3 style={{ margin: "0 0 10px" }}>Pengumuman untuk mahasiswa mata kuliah ini</h3><div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}><textarea value={announcement} onChange={(event) => setAnnouncement(event.target.value)} placeholder="Tulis pengumuman..." rows={3} style={{ flex: 1, border: "1px solid #cbd5e1", borderRadius: 10, padding: 10, resize: "vertical", font: "inherit" }} /><button type="button" onClick={saveAnnouncement} disabled={!announcement.trim()} style={{ border: 0, borderRadius: 9, background: "#4338ca", color: "white", padding: "10px 12px", fontWeight: 800, cursor: "pointer", opacity: announcement.trim() ? 1 : .55 }}>Kirim</button></div>{courseAnnouncements.map((item) => <div key={item.id} style={{ background: "#eef2ff", borderLeft: "3px solid #6366f1", padding: "9px 11px", marginTop: 8, color: "#312e81", fontSize: 13 }}>{item.content}</div>)}</div>
      </div></div>}
    </section>
  );
}
