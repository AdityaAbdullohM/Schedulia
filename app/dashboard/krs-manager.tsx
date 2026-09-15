"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

type RoleType = "DOSEN" | "MAHASISWA";

type ScheduleOption = {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  semester: string;
  course: { id: string; title: string; code: string };
  lecturer: { id: string; name: string };
  classroom: { id: string; name: string };
  classGroup?: { id: string; code: string; name: string } | null;
  alreadySelected?: boolean;
};

type KrsRequest = {
  id: string;
  status: string;
  student: { id: string; name: string; nim: string | null };
  classSchedule: {
    id: string;
    day: string;
    startTime: string;
    endTime: string;
    semester: string;
    course: { id: string; title: string; code: string };
    lecturer: { id: string; name: string };
    classroom: { id: string; name: string };
  };
};

type AttendanceRecords = Record<string, Record<string, Record<string, string>>>;
type AnnouncementReplies = Record<string, string[]>;
const statusOptionsForRecap = ["Hadir", "Izin", "Sakit", "Alfa", "Belum diisi"];

export default function KrsManager({ role, userId }: { role: RoleType; userId?: string }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([]);
  const [availableSchedules, setAvailableSchedules] = useState<ScheduleOption[]>([]);
  const [requests, setRequests] = useState<KrsRequest[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<KrsRequest | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecords>({});
  const [announcements, setAnnouncements] = useState<Record<string, string[]>>({});
  const [replies, setReplies] = useState<AnnouncementReplies>({});
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    if (role !== "MAHASISWA") return;

    const attendance = window.localStorage.getItem("schedulia-lecturer-attendance");
    const announcementData = window.localStorage.getItem("schedulia-lecturer-announcements");
    const replyData = window.localStorage.getItem("schedulia-student-announcement-replies");

    try {
      if (attendance) setAttendanceRecords(JSON.parse(attendance) as AttendanceRecords);
      if (announcementData) setAnnouncements(JSON.parse(announcementData) as Record<string, string[]>);
      if (replyData) setReplies(JSON.parse(replyData) as AnnouncementReplies);
    } catch {
      setAttendanceRecords({});
      setAnnouncements({});
      setReplies({});
    }
  }, [role]);

  const fetchKrs = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/krs?role=${role}&userId=${userId}`);
      if (!response.ok) {
        throw new Error("Failed to load KRS data");
      }

      const data = await response.json();

      if (role === "MAHASISWA") {
        setAvailableSchedules(data.availableSchedules ?? []);
        setSelectedScheduleIds([]);
        setRequests(data.myEnrollments ?? []);
      } else {
        setRequests(data.requests ?? []);
      }
    } catch (error) {
      console.error("Error loading KRS data:", error);
    } finally {
      setLoading(false);
    }
  }, [role, userId]);

  useEffect(() => {
    void fetchKrs();
  }, [fetchKrs]);

  const toggleSchedule = (scheduleId: string) => {
    if (role !== "MAHASISWA") return;
    setSelectedScheduleIds((prev) =>
      prev.includes(scheduleId) ? prev.filter((id) => id !== scheduleId) : [...prev, scheduleId]
    );
  };

  const selectedCounts = useMemo(() => {
    return selectedScheduleIds.length;
  }, [selectedScheduleIds]);

  const submitKrs = async () => {
    if (!userId || role !== "MAHASISWA") return;

    if (!selectedScheduleIds.length) {
      alert("Pilih minimal satu mata kuliah untuk KRS.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/krs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          userId,
          scheduleIds: selectedScheduleIds,
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Gagal mengirim KRS");
      }

      await fetchKrs();
      await Swal.fire({
        title: "KRS Terkirim",
        text: "KRS berhasil dikirim dan menunggu konfirmasi dosen.",
        icon: "success",
        confirmButtonText: "Mengerti",
      });
    } catch (error) {
      console.error("Submit KRS failed:", error);
      alert(error instanceof Error ? error.message : "Gagal mengirim KRS");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecision = async (enrollmentId: string, status: "AKTIF" | "DITOLAK") => {
    if (!userId || role !== "DOSEN") return;

    try {
      const response = await fetch(`/api/krs/${enrollmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          userId,
          status,
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Gagal mengubah status KRS");
      }

      await fetchKrs();
      await Swal.fire({
        title: status === "AKTIF" ? "KRS Disetujui" : "KRS Ditolak",
        text: status === "AKTIF" ? "Pengajuan KRS mahasiswa berhasil disetujui." : "Pengajuan KRS mahasiswa berhasil ditolak.",
        icon: status === "AKTIF" ? "success" : "info",
        confirmButtonText: "Mengerti",
      });
    } catch (error) {
      console.error("Decision failed:", error);
      alert(error instanceof Error ? error.message : "Gagal mengubah status KRS");
    }
  };

  const getCourseKey = (course: KrsRequest["classSchedule"]) => course.course.id;

  const submitReply = (announcementIndex: number) => {
    if (!selectedCourse || !replyText.trim()) return;

    const courseKey = getCourseKey(selectedCourse.classSchedule);
    const replyKey = `${courseKey}:${announcementIndex}`;
    const nextReplies = {
      ...replies,
      [replyKey]: [...(replies[replyKey] ?? []), replyText.trim()],
    };
    setReplies(nextReplies);
    window.localStorage.setItem("schedulia-student-announcement-replies", JSON.stringify(nextReplies));
    setReplyText("");
  };

  const selectedCourseKey = selectedCourse ? getCourseKey(selectedCourse.classSchedule) : "";
  const courseAnnouncements = selectedCourse ? announcements[selectedCourseKey] ?? [] : [];
  const courseAttendance = selectedCourse ? attendanceRecords[selectedCourse.classSchedule.id] ?? {} : {};
  const meetingNumbers = Object.keys(courseAttendance).map(Number).filter(Boolean).sort((a, b) => a - b);

  if (!userId) {
    return (
      <div style={{ background: "white", borderRadius: 18, padding: 24 }}>
        <h2 style={{ marginTop: 0 }}>KRS</h2>
        <p style={{ color: "#64748b" }}>Silakan login untuk mengelola KRS.</p>
      </div>
    );
  }

  if (role === "MAHASISWA") {
    return (
      <div style={{ background: "white", borderRadius: 18, padding: 24, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0 }}>Kartu Rencana Studi</h2>
            <div style={{ color: "#64748b", marginTop: 6 }}>Pilih mata kuliah yang ingin diambil</div>
          </div>
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 999, padding: "8px 12px", fontWeight: 700, color: "#7c3aed" }}>
            {selectedCounts} terpilih
          </div>
        </div>

        {loading ? (
          <div style={{ color: "#64748b" }}>Memuat data KRS...</div>
        ) : (
          <>
            <div style={{ display: "grid", gap: 14, marginBottom: 24 }}>
              {availableSchedules.length === 0 ? (
                <div style={{ padding: 20, border: "1px dashed #cbd5e1", borderRadius: 14, color: "#64748b" }}>
                  Belum ada jadwal mata kuliah yang tersedia.
                </div>
              ) : (
                availableSchedules.map((schedule) => {
                  const isSelected = selectedScheduleIds.includes(schedule.id);
                  return (
                    <div
                      key={schedule.id}
                      style={{
                        border: `1px solid ${isSelected ? "#7c3aed" : "#e2e8f0"}`,
                        borderRadius: 14,
                        padding: 16,
                        background: isSelected ? "#f5f3ff" : "#fff",
                        display: "grid",
                        gap: 8,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 18 }}>{schedule.course.title}</div>
                          <div style={{ color: "#64748b", fontSize: 13 }}>{schedule.course.code}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleSchedule(schedule.id)}
                          style={{
                            background: isSelected ? "#7c3aed" : "#eef2ff",
                            color: isSelected ? "white" : "#4f46e5",
                            border: "none",
                            borderRadius: 10,
                            padding: "8px 12px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {isSelected ? "Dipilih" : "Ambil"}
                        </button>
                      </div>

                      <div style={{ color: "#334155", display: "grid", gap: 4 }}>
                        <div><strong>Hari:</strong> {schedule.day}</div>
                        <div><strong>Waktu:</strong> {schedule.startTime} - {schedule.endTime}</div>
                        <div><strong>Dosen:</strong> {schedule.lecturer.name}</div>
                        <div><strong>Ruangan:</strong> {schedule.classroom.name}</div>
                        <div><strong>Semester:</strong> {schedule.semester}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
              <button
                type="button"
                onClick={submitKrs}
                disabled={submitting || selectedScheduleIds.length === 0}
                style={{
                  background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: 12,
                  padding: "12px 18px",
                  fontWeight: 800,
                  cursor: submitting || selectedScheduleIds.length === 0 ? "not-allowed" : "pointer",
                  opacity: submitting || selectedScheduleIds.length === 0 ? 0.7 : 1,
                }}
              >
                {submitting ? "Mengirim..." : "Kirim KRS"}
              </button>
            </div>

            <div>
              <h3 style={{ marginBottom: 14 }}>Status KRS Saya</h3>
              <div style={{ display: "grid", gap: 12 }}>
                {requests.length === 0 ? (
                  <div style={{ color: "#64748b" }}>Belum ada pengajuan KRS.</div>
                ) : (
                  requests.map((request) => (
                    <div key={request.id} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 14, display: "grid", gap: 8 }}>
                      <div style={{ fontWeight: 700 }}>{request.classSchedule.course.title}</div>
                      <div style={{ color: "#64748b", fontSize: 13 }}>
                        {request.classSchedule.day} • {request.classSchedule.startTime} - {request.classSchedule.endTime}
                      </div>
                      <div style={{ color: "#64748b", fontSize: 13 }}>
                        Dosen: {request.classSchedule.lecturer.name} • Ruangan: {request.classSchedule.classroom.name}
                      </div>
                      <div>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "6px 10px",
                            borderRadius: 999,
                            background:
                              request.status === "AKTIF"
                                ? "#dcfce7"
                                : request.status === "PENDING"
                                  ? "#fef3c7"
                                  : "#fee2e2",
                            color:
                              request.status === "AKTIF"
                                ? "#166534"
                                : request.status === "PENDING"
                                  ? "#92400e"
                                  : "#991b1b",
                            fontWeight: 700,
                            fontSize: 12,
                          }}
                        >
                          {request.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {selectedCourse && (
              <div
                role="dialog"
                aria-modal="true"
                style={{ position: "fixed", inset: 0, zIndex: 30, background: "rgba(15, 23, 42, 0.58)", display: "grid", placeItems: "center", padding: 20 }}
              >
                <div style={{ background: "white", width: "min(720px, 100%)", maxHeight: "90vh", overflowY: "auto", borderRadius: 18, padding: 24, boxShadow: "0 24px 60px rgba(15, 23, 42, 0.25)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 20 }}>
                    <div>
                      <div style={{ color: "#be185d", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>Detail Mata Kuliah</div>
                      <h2 style={{ margin: "6px 0 4px" }}>{selectedCourse.classSchedule.course.title}</h2>
                      <div style={{ color: "#64748b", fontSize: 13 }}>{selectedCourse.classSchedule.course.code} • {selectedCourse.classSchedule.lecturer.name}</div>
                    </div>
                    <button type="button" onClick={() => setSelectedCourse(null)} aria-label="Tutup detail" style={{ border: 0, background: "#f1f5f9", borderRadius: 8, padding: "6px 11px", fontSize: 18, cursor: "pointer" }}>×</button>
                  </div>

                  <div style={{ display: "grid", gap: 8, marginBottom: 22 }}>
                    <h3 style={{ margin: 0 }}>Rekap Absensi</h3>
                    {meetingNumbers.length === 0 ? (
                      <div style={{ color: "#64748b", background: "#f8fafc", borderRadius: 10, padding: 14 }}>Belum ada data absensi.</div>
                    ) : meetingNumbers.map((meetingNumber) => {
                      const meetingAttendance = courseAttendance[String(meetingNumber)] ?? {};
                      const currentStatus = meetingAttendance[selectedCourse.id] ?? "Belum diisi";
                      return (
                        <div key={meetingNumber} style={{ border: "1px solid #e2e8f0", borderRadius: 11, padding: 12 }}>
                          <div style={{ fontWeight: 800, marginBottom: 8 }}>Pertemuan {meetingNumber}</div>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ background: currentStatus === "Hadir" ? "#dcfce7" : currentStatus === "Belum diisi" ? "#e2e8f0" : "#fef3c7", color: "#334155", borderRadius: 999, padding: "6px 9px", fontSize: 12, fontWeight: 700 }}>Status Anda: {currentStatus}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div>
                    <h3 style={{ margin: "0 0 10px" }}>Pengumuman</h3>
                    {courseAnnouncements.length === 0 ? <div style={{ color: "#64748b", background: "#f8fafc", borderRadius: 10, padding: 14 }}>Belum ada pengumuman untuk mata kuliah ini.</div> : courseAnnouncements.map((item, index) => {
                      const replyKey = `${selectedCourseKey}:${index}`;
                      return <div key={`${item}-${index}`} style={{ border: "1px solid #fbcfe8", borderRadius: 11, padding: 12, marginBottom: 10 }}><div style={{ color: "#831843", lineHeight: 1.5 }}>{item}</div>{(replies[replyKey] ?? []).map((reply, replyIndex) => <div key={`${reply}-${replyIndex}`} style={{ background: "#fdf2f8", color: "#9d174d", borderRadius: 8, padding: "7px 9px", marginTop: 8, fontSize: 13 }}>Balasan Anda: {reply}</div>)}<div style={{ display: "flex", gap: 8, marginTop: 10 }}><input value={replyText} onChange={(event) => setReplyText(event.target.value)} placeholder="Tulis balasan..." style={{ flex: 1, border: "1px solid #cbd5e1", borderRadius: 8, padding: "8px 10px" }} /><button type="button" onClick={() => submitReply(index)} disabled={!replyText.trim()} style={{ border: 0, borderRadius: 8, background: "#be185d", color: "white", padding: "8px 11px", fontWeight: 700, cursor: "pointer", opacity: replyText.trim() ? 1 : 0.55 }}>Balas</button></div></div>;
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div style={{ background: "white", borderRadius: 18, padding: 24, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Konfirmasi KRS</h2>
        <div style={{ color: "#64748b", marginTop: 6 }}>Meninjau pengajuan mata kuliah mahasiswa</div>
      </div>

      {loading ? (
        <div style={{ color: "#64748b" }}>Memuat data konfirmasi...</div>
      ) : requests.length === 0 ? (
        <div style={{ color: "#64748b", border: "1px dashed #cbd5e1", borderRadius: 14, padding: 20 }}>
          Belum ada pengajuan KRS untuk Anda.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {requests.map((request) => (
            <div key={request.id} style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 16, display: "grid", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>{request.classSchedule.course.title}</div>
                  <div style={{ color: "#64748b", fontSize: 13 }}>{request.classSchedule.course.code}</div>
                </div>
                <span
                  style={{
                    display: "inline-block",
                    padding: "6px 10px",
                    borderRadius: 999,
                    background: request.status === "PENDING" ? "#fef3c7" : request.status === "AKTIF" ? "#dcfce7" : "#fee2e2",
                    color: request.status === "PENDING" ? "#92400e" : request.status === "AKTIF" ? "#166534" : "#991b1b",
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  {request.status}
                </span>
              </div>

              <div style={{ color: "#334155", display: "grid", gap: 4 }}>
                <div><strong>Mahasiswa:</strong> {request.student.name}</div>
                <div><strong>NIM:</strong> {request.student.nim ?? "-"}</div>
                <div><strong>Hari:</strong> {request.classSchedule.day}</div>
                <div><strong>Waktu:</strong> {request.classSchedule.startTime} - {request.classSchedule.endTime}</div>
                <div><strong>Ruangan:</strong> {request.classSchedule.classroom.name}</div>
                <div><strong>Semester:</strong> {request.classSchedule.semester}</div>
              </div>

              {request.status === "PENDING" && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => handleDecision(request.id, "AKTIF")}
                    style={{ background: "#16a34a", color: "white", border: "none", borderRadius: 10, padding: "9px 14px", fontWeight: 700, cursor: "pointer" }}
                  >
                    Setujui
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecision(request.id, "DITOLAK")}
                    style={{ background: "#ef4444", color: "white", border: "none", borderRadius: 10, padding: "9px 14px", fontWeight: 700, cursor: "pointer" }}
                  >
                    Tolak
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
