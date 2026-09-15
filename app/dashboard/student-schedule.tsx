"use client";

import { useEffect, useState } from "react";

type Schedule = {
  id: string;
  day: string;
  time: string;
  course: string;
  room: string;
  lecturer: string;
  semester: string;
  courseId?: string;
  enrollmentId?: string;
};

type AttendanceRecords = Record<string, Record<string, Record<string, string>>>;
type Announcement = { id: string; content: string; replies?: Array<{ id: string; content: string; student?: { name: string } }> };

const recapStatuses = ["Hadir", "Izin", "Sakit", "Alfa", "Belum diisi"];

export default function StudentSchedule({ schedules, studentId }: { schedules: Schedule[]; studentId?: string }) {
  const [selected, setSelected] = useState<Schedule | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecords>({});
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    if (!selected) return;
    const loadDetail = async () => {
      const [attendanceResponse, announcementResponse] = await Promise.all([
        fetch(`/api/attendance?scheduleId=${selected.id}&studentId=${studentId ?? ""}`),
        fetch(`/api/announcements?scheduleId=${selected.id}`),
      ]);
      if (attendanceResponse.ok) {
        const records = await attendanceResponse.json();
        const scheduleAttendance: Record<string, Record<string, string>> = {};
        records.forEach((record: { meeting: number; enrollmentId: string; status: string }) => {
          const meetingKey = String(record.meeting);
          scheduleAttendance[meetingKey] = { ...(scheduleAttendance[meetingKey] ?? {}), [record.enrollmentId]: record.status };
        });
        setAttendance((current) => ({ ...current, [selected.id]: scheduleAttendance }));
      }
      if (announcementResponse.ok) setAnnouncements(await announcementResponse.json());
    };
    void loadDetail();
  }, [selected, studentId]);

  const selectedAttendance = selected ? attendance[selected.id] ?? {} : {};
  const selectedCourseKey = selected?.courseId ?? selected?.id ?? "";
  const courseAnnouncements = announcements;

  const submitReply = async (announcementId: string) => {
    if (!selected || !replyText.trim()) return;
    const response = await fetch("/api/announcements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reply", announcementId, studentId, content: replyText.trim() }) });
    if (response.ok) {
      const reply = await response.json();
      setAnnouncements((current) => current.map((item) => item.id === announcementId ? { ...item, replies: [...(item.replies ?? []), reply] } : item));
      setReplyText("");
    }
  };

  return (
    <section style={{ display: "grid", gap: 24 }}>
      <div style={{ background: "white", borderRadius: 18, padding: 24, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)" }}>
        <div style={{ marginBottom: 18 }}><h2 style={{ margin: 0 }}>Jadwal Kuliah</h2><div style={{ color: "#64748b", marginTop: 6 }}>Jadwal yang sudah disetujui melalui KRS.</div></div>
        {schedules.length === 0 ? <div style={{ color: "#64748b", border: "1px dashed #cbd5e1", borderRadius: 14, padding: 20 }}>Belum ada jadwal KRS yang disetujui.</div> : <div style={{ display: "grid", gap: 12 }}>{schedules.map((schedule) => <div key={schedule.id} style={{ display: "grid", gridTemplateColumns: "90px 1fr auto", gap: 14, alignItems: "center", border: "1px solid #e2e8f0", borderRadius: 13, padding: 15 }}><div style={{ color: "#be185d", fontSize: 12, fontWeight: 800 }}>{schedule.day}<br /><span style={{ color: "#64748b", fontWeight: 600 }}>{schedule.time}</span></div><div><div style={{ fontWeight: 800, fontSize: 17 }}>{schedule.course}</div><div style={{ color: "#64748b", fontSize: 13 }}>{schedule.room} • {schedule.lecturer}</div></div><button type="button" onClick={() => setSelected(schedule)} style={{ border: 0, borderRadius: 9, background: "#be185d", color: "white", padding: "9px 12px", fontWeight: 800, cursor: "pointer" }}>Detail</button></div>)}</div>}
      </div>

      {selected && <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 30, background: "rgba(15, 23, 42, 0.58)", display: "grid", placeItems: "center", padding: 20 }}><div style={{ background: "white", width: "min(720px, 100%)", maxHeight: "90vh", overflowY: "auto", borderRadius: 18, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 20 }}><div><div style={{ color: "#be185d", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>Detail Mata Kuliah</div><h2 style={{ margin: "6px 0 4px" }}>{selected.course}</h2><div style={{ color: "#64748b", fontSize: 13 }}>{selected.day} • {selected.time} • {selected.room} • {selected.lecturer}</div></div><button type="button" onClick={() => setSelected(null)} aria-label="Tutup detail" style={{ border: 0, background: "#f1f5f9", borderRadius: 8, padding: "6px 11px", fontSize: 18, cursor: "pointer" }}>×</button></div>
        <h3 style={{ margin: "0 0 10px" }}>Rekap Absensi</h3><div style={{ display: "grid", gap: 8, marginBottom: 22 }}>{Object.keys(selectedAttendance).length === 0 ? <div style={{ color: "#64748b", background: "#f8fafc", padding: 14, borderRadius: 10 }}>Belum ada data absensi.</div> : Object.entries(selectedAttendance).sort(([a], [b]) => Number(a) - Number(b)).map(([meeting, records]) => { const status = records[selected.enrollmentId ?? ""] ?? "Belum diisi"; return <div key={meeting} style={{ border: "1px solid #e2e8f0", borderRadius: 11, padding: 12 }}><div style={{ fontWeight: 800, marginBottom: 8 }}>Pertemuan {meeting}</div><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{recapStatuses.map((item) => <span key={item} style={{ background: status === item ? (item === "Hadir" ? "#dcfce7" : item === "Belum diisi" ? "#e2e8f0" : "#fef3c7") : "#f8fafc", color: "#334155", borderRadius: 999, padding: "6px 9px", fontSize: 12, fontWeight: 700 }}>{item}: {status === item ? 1 : 0}</span>)}</div></div>; })}</div>
        <h3 style={{ margin: "0 0 10px" }}>Pengumuman</h3>{courseAnnouncements.length === 0 ? <div style={{ color: "#64748b", background: "#f8fafc", borderRadius: 10, padding: 14 }}>Belum ada pengumuman untuk mata kuliah ini.</div> : courseAnnouncements.map((item) => <div key={item.id} style={{ border: "1px solid #fbcfe8", borderRadius: 11, padding: 12, marginBottom: 10 }}><div style={{ color: "#831843", lineHeight: 1.5 }}>{item.content}</div>{(item.replies ?? []).map((reply) => <div key={reply.id} style={{ background: "#fdf2f8", color: "#9d174d", borderRadius: 8, padding: "7px 9px", marginTop: 8, fontSize: 13 }}>{reply.student?.name ?? "Balasan mahasiswa"}: {reply.content}</div>)}<div style={{ display: "flex", gap: 8, marginTop: 10 }}><input value={replyText} onChange={(event) => setReplyText(event.target.value)} placeholder="Tulis balasan..." style={{ flex: 1, border: "1px solid #cbd5e1", borderRadius: 8, padding: "8px 10px" }} /><button type="button" onClick={() => submitReply(item.id)} disabled={!replyText.trim()} style={{ border: 0, borderRadius: 8, background: "#be185d", color: "white", padding: "8px 11px", fontWeight: 700, cursor: "pointer", opacity: replyText.trim() ? 1 : 0.55 }}>Balas</button></div></div>)}
      </div></div>}
    </section>
  );
}