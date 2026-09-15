"use client";

import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

const STORAGE_KEY = "schedulia-attendance";

type AttendanceRecord = {
  id: string;
  scheduleId: string;
  studentName: string;
  studentNIM: string;
  date: string;
  status: "Hadir" | "Izin" | "Sakit" | "Alfa";
  notes?: string;
};

type ScheduleSession = {
  id: string;
  day: string;
  time: string;
  course: string;
  room: string;
  lecturer: string;
  students: Array<{ nim: string; name: string }>;
};

const defaultSchedules: ScheduleSession[] = [
  {
    id: "s1",
    day: "Senin",
    time: "08:00 - 10:00",
    course: "Pemrograman Web",
    room: "R.301",
    lecturer: "Dr. Siti Rahma",
    students: [
      { nim: "2023101001", name: "Rafi Pratama" },
      { nim: "2023101002", name: "Andi Kusuma" },
      { nim: "2023101003", name: "Siti Nurhaliza" },
      { nim: "2023101004", name: "Budi Santoso" },
      { nim: "2023101005", name: "Lina Wijaya" },
    ],
  },
  {
    id: "s2",
    day: "Selasa",
    time: "10:00 - 12:00",
    course: "Basis Data",
    room: "Lab. DB",
    lecturer: "Prof. Rinaldi",
    students: [
      { nim: "2023101001", name: "Rafi Pratama" },
      { nim: "2023101006", name: "Ahmad Hidayat" },
      { nim: "2023101007", name: "Dina Kartika" },
      { nim: "2023101008", name: "Eko Prasetyo" },
    ],
  },
  {
    id: "s3",
    day: "Kamis",
    time: "13:00 - 15:00",
    course: "Jaringan Komputer",
    room: "R.208",
    lecturer: "Dr. Fajar Hidayat",
    students: [
      { nim: "2023101002", name: "Andi Kusuma" },
      { nim: "2023101009", name: "Farah Amini" },
      { nim: "2023101010", name: "Gita Suhendra" },
      { nim: "2023101011", name: "Hendri Sutrisno" },
    ],
  },
];

export default function AttendanceManager() {
  const [selectedSchedule, setSelectedSchedule] = useState<string>("s1");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    if (typeof window === "undefined") return [];

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    try {
      return JSON.parse(stored) as AttendanceRecord[];
    } catch {
      return [];
    }
  });
  const [viewMode, setViewMode] = useState<"input" | "report">("input");
  const [schedules] = useState<ScheduleSession[]>(defaultSchedules);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attendance));
    }
  }, [attendance]);

  const currentSchedule = useMemo(() => schedules.find((s) => s.id === selectedSchedule), [selectedSchedule, schedules]);

  const todayAttendance = useMemo(() => {
    if (!currentSchedule) return [];

    return currentSchedule.students.map((student) => {
      const record = attendance.find(
        (a) => a.scheduleId === selectedSchedule && a.studentNIM === student.nim && a.date === selectedDate,
      );

      return {
        ...student,
        status: (record?.status ?? "Hadir") as "Hadir" | "Izin" | "Sakit" | "Alfa",
        recordId: record?.id,
        notes: record?.notes ?? "",
      };
    });
  }, [attendance, selectedSchedule, selectedDate, currentSchedule]);

  const attendanceStats = useMemo(() => {
    const stats = { Hadir: 0, Izin: 0, Sakit: 0, Alfa: 0 };

    todayAttendance.forEach((item) => {
      stats[item.status]++;
    });

    return stats;
  }, [todayAttendance]);

  const handleStatusChange = (nim: string, newStatus: "Hadir" | "Izin" | "Sakit" | "Alfa") => {
    const existing = attendance.find(
      (a) => a.scheduleId === selectedSchedule && a.studentNIM === nim && a.date === selectedDate,
    );

    if (existing) {
      setAttendance((prev) =>
        prev.map((a) => (a.id === existing.id ? { ...a, status: newStatus } : a)),
      );
    } else {
      setAttendance((prev) => [
        ...prev,
        {
          id: `att-${Date.now()}-${nim}`,
          scheduleId: selectedSchedule,
          studentName: todayAttendance.find((s) => s.nim === nim)?.name ?? "",
          studentNIM: nim,
          date: selectedDate,
          status: newStatus,
        },
      ]);
    }
  };

  const handleNotesChange = (nim: string, notes: string) => {
    const existing = attendance.find(
      (a) => a.scheduleId === selectedSchedule && a.studentNIM === nim && a.date === selectedDate,
    );

    if (existing) {
      setAttendance((prev) =>
        prev.map((a) => (a.id === existing.id ? { ...a, notes } : a)),
      );
    }
  };

  const handleSaveAttendance = () => {
    Swal.fire("Sukses", "Data absensi untuk " + currentSchedule?.course + " telah disimpan.", "success");
  };

  const generateAttendanceReport = () => {
    if (!currentSchedule) return;

    const allDatesWithAttendance = Array.from(new Set(attendance.map((a) => a.date))).sort();
    const reportContent = `
LAPORAN ABSENSI: ${currentSchedule.course}
Ruangan: ${currentSchedule.room} | Dosen: ${currentSchedule.lecturer}
========================================

${currentSchedule.students
  .map((student) => {
    const records = attendance.filter(
      (a) => a.scheduleId === selectedSchedule && a.studentNIM === student.nim,
    );
    const stats = {
      Hadir: records.filter((r) => r.status === "Hadir").length,
      Izin: records.filter((r) => r.status === "Izin").length,
      Sakit: records.filter((r) => r.status === "Sakit").length,
      Alfa: records.filter((r) => r.status === "Alfa").length,
    };

    return `${student.name} (${student.nim})
  Hadir: ${stats.Hadir} | Izin: ${stats.Izin} | Sakit: ${stats.Sakit} | Alfa: ${stats.Alfa}`;
  })
  .join("\n")}
    `;

    const blob = new Blob([reportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `absensi-${currentSchedule.course}-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div style={{ background: "white", borderRadius: 18, padding: 24, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0 }}>Pengelolaan Absensi</h2>
            <div style={{ color: "#64748b", marginTop: 6 }}>Catat kehadiran mahasiswa untuk setiap kelas</div>
          </div>

          <div style={{ display: "inline-flex", background: "#f1f5f9", borderRadius: 12, padding: 6 }}>
            {(["input", "report"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                style={{
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: 10,
                  background: viewMode === mode ? "#2563eb" : "transparent",
                  color: viewMode === mode ? "white" : "#334155",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {mode === "input" ? "Input Absensi" : "Laporan"}
              </button>
            ))}
          </div>
        </div>

        {viewMode === "input" ? (
          <div style={{ display: "grid", gap: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Kelas</label>
                <select
                  value={selectedSchedule}
                  onChange={(e) => setSelectedSchedule(e.target.value)}
                  style={inputStyle}
                >
                  {schedules.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.course} ({s.day} {s.time})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Tanggal</label>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={inputStyle} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 12 }}>
              <div style={{ background: "#dcfce7", borderRadius: 12, padding: 16 }}>
                <div style={{ color: "#15803d", fontSize: 13, fontWeight: 600 }}>Hadir</div>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#15803d", marginTop: 6 }}>{attendanceStats.Hadir}</div>
              </div>
              <div style={{ background: "#fef3c7", borderRadius: 12, padding: 16 }}>
                <div style={{ color: "#b45309", fontSize: 13, fontWeight: 600 }}>Izin</div>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#b45309", marginTop: 6 }}>{attendanceStats.Izin}</div>
              </div>
              <div style={{ background: "#fecdd3", borderRadius: 12, padding: 16 }}>
                <div style={{ color: "#be123c", fontSize: 13, fontWeight: 600 }}>Sakit</div>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#be123c", marginTop: 6 }}>{attendanceStats.Sakit}</div>
              </div>
              <div style={{ background: "#f3f4f6", borderRadius: 12, padding: 16 }}>
                <div style={{ color: "#64748b", fontSize: 13, fontWeight: 600 }}>Alfa</div>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#64748b", marginTop: 6 }}>{attendanceStats.Alfa}</div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {todayAttendance.map((student) => (
                <div
                  key={student.nim}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    padding: 14,
                    display: "grid",
                    gridTemplateColumns: "1fr 150px 100px",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>{student.name}</div>
                    <div style={{ color: "#64748b", fontSize: 13 }}>NIM: {student.nim}</div>
                  </div>

                  <select
                    value={student.status}
                    onChange={(e) => handleStatusChange(student.nim, e.target.value as "Hadir" | "Izin" | "Sakit" | "Alfa")}
                    style={{
                      ...inputStyle,
                      background:
                        student.status === "Hadir"
                          ? "#dcfce7"
                          : student.status === "Izin"
                            ? "#fef3c7"
                            : student.status === "Sakit"
                              ? "#fecdd3"
                              : "#f3f4f6",
                      color:
                        student.status === "Hadir"
                          ? "#15803d"
                          : student.status === "Izin"
                            ? "#b45309"
                            : student.status === "Sakit"
                              ? "#be123c"
                              : "#64748b",
                      fontWeight: 700,
                    }}
                  >
                    <option value="Hadir">Hadir</option>
                    <option value="Izin">Izin</option>
                    <option value="Sakit">Sakit</option>
                    <option value="Alfa">Alfa</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Catatan"
                    value={student.notes}
                    onChange={(e) => handleNotesChange(student.nim, e.target.value)}
                    style={{
                      ...inputStyle,
                      fontSize: 12,
                    }}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button
                type="button"
                onClick={generateAttendanceReport}
                style={{
                  background: "#f1f5f9",
                  color: "#334155",
                  border: "none",
                  borderRadius: 12,
                  padding: "11px 18px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Download Laporan
              </button>
              <button
                type="button"
                onClick={handleSaveAttendance}
                style={{
                  background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: 12,
                  padding: "11px 18px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Simpan Absensi
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16, border: "1px solid #e2e8f0" }}>
              <div style={{ color: "#334155", marginBottom: 16 }}>
                <strong>{currentSchedule?.course}</strong>
                <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
                  {currentSchedule?.room} • {currentSchedule?.lecturer}
                </div>
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                {currentSchedule?.students.map((student) => {
                  const records = attendance.filter(
                    (a) => a.scheduleId === selectedSchedule && a.studentNIM === student.nim,
                  );
                  const stats = {
                    Hadir: records.filter((r) => r.status === "Hadir").length,
                    Izin: records.filter((r) => r.status === "Izin").length,
                    Sakit: records.filter((r) => r.status === "Sakit").length,
                    Alfa: records.filter((r) => r.status === "Alfa").length,
                  };
                  const total = records.length || 1;
                  const percentage = Math.round((stats.Hadir / total) * 100);

                  return (
                    <div
                      key={student.nim}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 200px",
                        gap: 12,
                        alignItems: "center",
                        borderBottom: "1px solid #e2e8f0",
                        paddingBottom: 10,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700 }}>{student.name}</div>
                        <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>
                          Hadir: {stats.Hadir} | Izin: {stats.Izin} | Sakit: {stats.Sakit} | Alfa: {stats.Alfa}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div
                          style={{
                            width: "100%",
                            height: 8,
                            background: "#e2e8f0",
                            borderRadius: 999,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${percentage}%`,
                              background: percentage >= 80 ? "#10b981" : percentage >= 70 ? "#f59e0b" : "#ef4444",
                              transition: "width 0.3s ease",
                            }}
                          />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 12, minWidth: 32 }}>{percentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  fontSize: 14,
  boxSizing: "border-box",
  background: "white",
};
