"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

const STORAGE_KEY = "schedulia-schedules";

const parseTimeRange = (time: string) => {
  const match = time.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/i);

  if (!match) {
    return null;
  }

  const [, startHour, startMinute, endHour, endMinute] = match;
  const start = Number(startHour) * 60 + Number(startMinute);
  const end = Number(endHour) * 60 + Number(endMinute);

  return { start, end };
};

type ScheduleEntry = {
  id: string;
  day: string;
  time: string;
  course: string;
  room: string;
  lecturer: string;
  classGroup: string;
  programStudy: string;
  angkatan: string;
  semester: string;
  courseId?: string;
  classroomId?: string;
  lecturerId?: string;
  classGroupId?: string;
};

type ScheduleMode = "manual" | "automatic";

type CourseOption = {
  id: string;
  title: string;
  credits: number;
};

type RoomOption = {
  id: string;
  name: string;
};

type LecturerOption = {
  id: string;
  name: string;
  role?: string;
};

type ClassGroupOption = {
  id: string;
  code: string;
  name: string;
};

type ManualForm = {
  day: string;
  startTime: string;
  course: string;
  room: string;
  lecturer: string;
  classGroup: string;
  semester: string;
};

type CourseApiItem = {
  id: string;
  title: string;
  credits?: number | string;
};

type RoomApiItem = {
  id: string;
  name: string;
};

type UserApiItem = {
  id: string;
  name: string;
  role?: string;
};

type ClassGroupApiItem = {
  id: string;
  code: string;
  name: string;
};

type DosenCourseApiItem = {
  id: string;
  dosenCourses?: Array<{ courseId?: string }>;
};

const SKS_MINUTES = 50;

const initialSchedules: ScheduleEntry[] = [
  { id: "s1", day: "Senin", time: "08:00 - 10:00", course: "Pemrograman Web", room: "R.301", lecturer: "Dr. Siti Rahma", classGroup: "-", programStudy: "-", angkatan: "-", semester: "2026/2027 Ganjil" },
  { id: "s2", day: "Selasa", time: "10:00 - 12:00", course: "Basis Data", room: "Lab. DB", lecturer: "Prof. Rinaldi", classGroup: "-", programStudy: "-", angkatan: "-", semester: "2026/2027 Ganjil" },
  { id: "s3", day: "Rabu", time: "13:00 - 15:00", course: "Kecerdasan Buatan", room: "R.205", lecturer: "Dr. Agus Wijaya", classGroup: "-", programStudy: "-", angkatan: "-", semester: "2026/2027 Ganjil" },
];

const courses = ["Pemrograman Web", "Basis Data", "Kecerdasan Buatan", "Jaringan Komputer", "Sistem Operasi", "Rekayasa Perangkat Lunak", "Metode Numerik", "Interaksi Manusia dan Komputer"];
const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

const getCourseById = (courseId: string, courseList: CourseOption[]) =>
  courseList.find((course) => course.id === courseId) ?? courseList[0];

const getLecturerById = (lecturerId: string, lecturerList: LecturerOption[]) =>
  lecturerList.find((lecturer) => lecturer.id === lecturerId) ?? lecturerList[0];

const getRoomById = (roomId: string, roomList: RoomOption[]) =>
  roomList.find((room) => room.id === roomId) ?? roomList[0];

const formatTime = (totalMinutes: number) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const normalizedHours = hours % 24;
  return `${String(normalizedHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const getTimeRangeFromCourse = (startTime: string, credits: number) => {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = startTotalMinutes + credits * SKS_MINUTES;

  return `${startTime} - ${formatTime(endTotalMinutes)}`;
};

const initialForm: ManualForm = {
  day: "Senin",
  startTime: "08:00",
  course: "",
  room: "",
  lecturer: "",
  classGroup: "",
  semester: "2026/2027 Ganjil",
};

export default function ScheduleManager() {
  const [mode, setMode] = useState<ScheduleMode>("manual");
  const [manualForm, setManualForm] = useState<ManualForm>(initialForm);
  const [generatedCount, setGeneratedCount] = useState(3);
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [courseOptions, setCourseOptions] = useState<CourseOption[]>([]);
  const [roomOptions, setRoomOptions] = useState<RoomOption[]>([]);
  const [lecturerOptions, setLecturerOptions] = useState<LecturerOption[]>([]);
  const [classGroupOptions, setClassGroupOptions] = useState<ClassGroupOption[]>([]);
  const [dosenCourseMap, setDosenCourseMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const selectedCourse = courseOptions.find((course) => course.id === manualForm.course) ?? courseOptions[0];
  const availableCourseOptions = manualForm.lecturer && dosenCourseMap[manualForm.lecturer]?.length
    ? courseOptions.filter((course) => dosenCourseMap[manualForm.lecturer]?.includes(course.id))
    : courseOptions;
  const computedTimeRange = selectedCourse ? getTimeRangeFromCourse(manualForm.startTime, selectedCourse.credits) : "08:00 - 08:00";

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/schedules");
      if (!res.ok) throw new Error("Failed to fetch schedules");
      const data = await res.json();
      setSchedules(data);
    } catch (error) {
      console.error("Error:", error);
      Swal.fire("Error", "Failed to load schedules", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMasterData = useCallback(async () => {
    try {
      const responses = await Promise.allSettled([
        fetch("/api/courses"),
        fetch("/api/classrooms"),
        fetch("/api/users"),
        fetch("/api/dosen-courses"),
        fetch("/api/class-groups"),
      ]);

      const [coursesResult, roomsResult, usersResult, dosenCoursesResult, classGroupsResult] = responses;

      const coursesData = coursesResult.status === "fulfilled" && coursesResult.value.ok
        ? await coursesResult.value.json().catch(() => [])
        : [];

      const roomsData = roomsResult.status === "fulfilled" && roomsResult.value.ok
        ? await roomsResult.value.json().catch(() => [])
        : [];

      const usersData = usersResult.status === "fulfilled" && usersResult.value.ok
        ? await usersResult.value.json().catch(() => [])
        : [];

      const dosenCoursesData = dosenCoursesResult.status === "fulfilled" && dosenCoursesResult.value.ok
        ? await dosenCoursesResult.value.json().catch(() => [])
        : [];
      const classGroupsData = classGroupsResult.status === "fulfilled" && classGroupsResult.value.ok
        ? await classGroupsResult.value.json().catch(() => [])
        : [];

      const normalizedCourses: CourseOption[] = Array.isArray(coursesData)
        ? (coursesData as CourseApiItem[]).map((course) => ({
            id: course.id,
            title: course.title,
            credits: Number(course.credits ?? 0),
          }))
        : [];

      const normalizedRooms: RoomOption[] = Array.isArray(roomsData)
        ? (roomsData as RoomApiItem[]).map((room) => ({
            id: room.id,
            name: room.name,
          }))
        : [];

      const normalizedLecturers: LecturerOption[] = Array.isArray(usersData)
        ? (usersData as UserApiItem[])
            .filter((user) => user.role === "DOSEN")
            .map((user) => ({
              id: user.id,
              name: user.name,
              role: user.role,
            }))
        : [];

      const courseMap: Record<string, string[]> = {};
      if (Array.isArray(dosenCoursesData)) {
        (dosenCoursesData as DosenCourseApiItem[]).forEach((dosen) => {
          courseMap[dosen.id] = (dosen.dosenCourses ?? []).map((item) => item.courseId ?? "").filter(Boolean);
        });
      }

      setCourseOptions(normalizedCourses);
      setRoomOptions(normalizedRooms);
      setLecturerOptions(normalizedLecturers);
      setDosenCourseMap(courseMap);
      setClassGroupOptions(Array.isArray(classGroupsData)
        ? (classGroupsData as ClassGroupApiItem[]).map((group) => ({ id: group.id, code: group.code, name: group.name }))
        : []);

      setManualForm((prev) => {
        const next = { ...prev };

        if (!next.course && normalizedCourses.length > 0) {
          next.course = normalizedCourses[0].id;
        }

        if (!next.room && normalizedRooms.length > 0) {
          next.room = normalizedRooms[0].id;
        }

        if (!next.lecturer && normalizedLecturers.length > 0) {
          next.lecturer = normalizedLecturers[0].id;
        }

        if (!next.classGroup && Array.isArray(classGroupsData) && classGroupsData.length > 0) {
          next.classGroup = (classGroupsData[0] as ClassGroupApiItem).id;
        }

        return next;
      });

      if (!normalizedCourses.length && !normalizedRooms.length && !normalizedLecturers.length) {
        console.warn("Master data API unavailable; keeping empty schedule options.");
      }
    } catch (error) {
      console.error("Error fetching master data:", error);
      Swal.fire("Warning", "Beberapa data master belum tersedia, jadwal tetap bisa ditampilkan dengan opsi kosong.", "warning");
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await fetchMasterData();
      await fetchSchedules();
    };

    void loadData();
  }, [fetchMasterData, fetchSchedules]);

  const summary = useMemo(() => {
    return {
      total: schedules.length,
      uniqueCourses: new Set(schedules.map((item) => item.course)).size,
      roomsUsed: new Set(schedules.map((item) => item.room)).size,
    };
  }, [schedules]);

  const handleManualSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!manualForm.day || !manualForm.startTime || !manualForm.course || !manualForm.room || !manualForm.lecturer) {
      Swal.fire("Error", "Semua field wajib diisi sebelum menambahkan jadwal manual.", "error");
      return;
    }

    const courseCredits = selectedCourse?.credits ?? 0;
    const startMinutes = Number(manualForm.startTime.split(":")[0]) * 60 + Number(manualForm.startTime.split(":")[1]);
    const endMinutes = startMinutes + courseCredits * SKS_MINUTES;
    const endHour = Math.floor(endMinutes / 60);
    const endMinute = endMinutes % 60;
    const endTime = `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`;
    const entryTime = `${manualForm.startTime} - ${endTime}`;

    const entry: Omit<ScheduleEntry, "id"> = {
      day: manualForm.day,
      time: entryTime,
      course: selectedCourse?.title ?? manualForm.course,
      room: getRoomById(manualForm.room, roomOptions)?.name ?? manualForm.room,
      lecturer: getLecturerById(manualForm.lecturer, lecturerOptions)?.name ?? manualForm.lecturer,
      classGroup: classGroupOptions.find((group) => group.id === manualForm.classGroup)?.code ?? "-",
      programStudy: "-",
      angkatan: "-",
      semester: manualForm.semester,
      courseId: manualForm.course,
      classroomId: manualForm.room,
      lecturerId: manualForm.lecturer,
    };

    const payload = {
      day: manualForm.day,
      startTime: manualForm.startTime,
      endTime,
      course: manualForm.course,
      room: manualForm.room,
      lecturer: manualForm.lecturer,
      classGroup: manualForm.classGroup,
      semester: manualForm.semester,
      time: entryTime,
    };

    const assignedCourseIds = dosenCourseMap[manualForm.lecturer] ?? [];
    if (!assignedCourseIds.includes(manualForm.course)) {
      Swal.fire("Tidak dapat menambahkan", "Dosen hanya dapat mengajar mata kuliah yang diampunya.", "warning");
      return;
    }

    const lecturerAlreadyScheduled = schedules.some((schedule) =>
      schedule.lecturerId === manualForm.lecturer && schedule.id !== editingId
    );
    if (lecturerAlreadyScheduled) {
      Swal.fire("Tidak dapat menambahkan", "Dosen ini sudah memiliki jadwal. Dosen tidak dapat dijadwalkan di hari lain.", "warning");
      return;
    }

    if (hasConflict({ ...entry, id: editingId ?? undefined }, editingId ?? undefined)) {
      Swal.fire(
        "Konflik Jadwal",
        "Jadwal bentrok karena ruangan atau dosen sudah dipakai di hari dan waktu yang sama.",
        "warning",
      );
      return;
    }

    try {
      setLoading(true);

      if (editingId) {
        const res = await fetch(`/api/schedules/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to update schedule");
        }
        await fetchSchedules();
        Swal.fire("Sukses", "Jadwal berhasil diperbarui.", "success");
      } else {
        const res = await fetch("/api/schedules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to create schedule");
        }
        await fetchSchedules();
        Swal.fire("Sukses", "Jadwal berhasil ditambahkan secara manual.", "success");
      }

      resetForm();
    } catch (error) {
      console.error("Error:", error);
      Swal.fire("Tidak dapat menyimpan", error instanceof Error ? error.message : "Gagal menyimpan jadwal", "warning");
    } finally {
      setLoading(false);
    }
  };

  const hasConflict = (candidate: Omit<ScheduleEntry, "id"> & { id?: string }, currentId?: string) => {
    return schedules.some((entry) => {
      if (currentId && entry.id === currentId) return false;

      const sameDay = entry.day === candidate.day;
      const sameRoom = entry.classroomId === candidate.room || entry.room === candidate.room;
      const sameLecturer = entry.lecturerId === candidate.lecturer || entry.lecturer === candidate.lecturer;

      if (!sameDay || !(sameRoom || sameLecturer)) {
        return false;
      }

      const candidateRange = parseTimeRange(candidate.time);
      const entryRange = parseTimeRange(entry.time);

      if (!candidateRange || !entryRange) {
        return entry.time === candidate.time && (sameRoom || sameLecturer);
      }

      const overlaps = candidateRange.start < entryRange.end && entryRange.start < candidateRange.end;
      return overlaps;
    });
  };

  const handleManualInput = (field: keyof ManualForm, value: string) => {
    setManualForm((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "lecturer") {
        const lecturerCourses = dosenCourseMap[value] ?? [];
        const candidateCourses = lecturerCourses.length ? lecturerCourses : courseOptions.map((course) => course.id);

        if (!candidateCourses.includes(next.course)) {
          next.course = candidateCourses[0] ?? "";
        }
      }

      return next;
    });
  };

  const getCourseCredits = (courseId: string) =>
    courseOptions.find((course) => course.id === courseId)?.credits ?? 0;

  const getScheduleStatus = (schedule: ScheduleEntry) => {
    const todayName = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][new Date().getDay()];
    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
    const parsed = parseTimeRange(schedule.time);

    if (!parsed) {
      return { label: "Terjadwal", color: "#64748b", bg: "#f1f5f9" };
    }

    if (schedule.day === todayName) {
      if (parsed.start <= nowMinutes && nowMinutes <= parsed.end) {
        return { label: "Berlangsung", color: "#047857", bg: "#ecfdf5" };
      }

      if (nowMinutes < parsed.start) {
        return { label: "Terjadwal", color: "#2563eb", bg: "#eff6ff" };
      }
    }

    const dayOrder = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
    const currentIndex = dayOrder.indexOf(todayName);
    const scheduleIndex = dayOrder.indexOf(schedule.day);

    if (scheduleIndex > currentIndex || (scheduleIndex === currentIndex && parsed.start > nowMinutes)) {
      return { label: "Terjadwal", color: "#2563eb", bg: "#eff6ff" };
    }

    return { label: "Selesai", color: "#7c2d12", bg: "#fff7ed" };
  };

  const getEndTimeFromSchedule = (schedule: ScheduleEntry) => {
    const parsed = parseTimeRange(schedule.time);
    if (!parsed) return "-";

    const end = parsed.end;
    const hours = Math.floor(end / 60);
    const minutes = end % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  };

  const generateStartTimeOptions = () => {
    const times: string[] = [];
    for (let hour = 7; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 18 && minute > 0) continue;
        times.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
      }
    }
    return times;
  };

  const resetForm = () => {
    setEditingId(null);
    setManualForm(initialForm);
  };

  const handleAutoGenerate = async () => {
    const generated: ScheduleEntry[] = [];
    const existing = [...schedules];

    if (!courseOptions.length || !roomOptions.length || !lecturerOptions.length) {
      Swal.fire("Warning", "Data mata kuliah, ruangan, atau dosen belum tersedia. Silakan muat data master terlebih dahulu.", "warning");
      return;
    }

    try {
      const availableLecturers = lecturerOptions.filter((lecturer) =>
        (dosenCourseMap[lecturer.id] ?? []).some((courseId) => courseOptions.some((course) => course.id === courseId)) &&
        !existing.some((schedule) => schedule.lecturerId === lecturer.id)
      );

      for (let index = 0; index < Math.min(generatedCount, availableLecturers.length); index++) {
        const lecturerOption = availableLecturers[index];
        const assignedCourseIds = dosenCourseMap[lecturerOption.id] ?? [];
        const matchingCourse = courseOptions.find((course) => assignedCourseIds.includes(course.id));
        const courseName = matchingCourse?.title ?? "";
        const courseCredits = matchingCourse?.credits ?? 3;
        const roomOption = roomOptions[index % roomOptions.length];
        const lecturer = lecturerOption?.name ?? "Dosen";
        const room = roomOption?.name ?? "R.101";
        const day = days[index % days.length];
        const startTime = ["08:00", "09:00", "10:00", "13:00", "14:00", "16:00"][index % 6];
        const endTime = getTimeRangeFromCourse(startTime, courseCredits).match(/\d{2}:\d{2}\s*-\s*(\d{2}:\d{2})/)?.[1] ?? startTime;
        const time = getTimeRangeFromCourse(startTime, courseCredits);

        const courseId = matchingCourse?.id;
        const roomId = roomOption?.id;
        const lecturerId = lecturerOption?.id;

        if (!courseId || !roomId || !lecturerId) {
          console.warn("Skipping auto-schedule generation because a required master record is missing.", { courseId, roomId, lecturerId });
          continue;
        }

        const candidate = {
          id: `auto-${Date.now()}-${index}`,
          day,
          time,
          course: courseName,
          room,
          lecturer,
          semester: "2026/2027 Ganjil",
          classGroup: classGroupOptions.length ? classGroupOptions[index % classGroupOptions.length]?.id : undefined,
          courseId,
          classroomId: roomId,
          lecturerId,
        };

        const conflict = existing.some((entry) => {
          return entry.day === candidate.day && entry.time === candidate.time && (entry.room === candidate.room || entry.lecturer === candidate.lecturer);
        });

        if (conflict) {
          continue;
        }

        const res = await fetch("/api/schedules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            day,
            startTime,
            endTime,
            course: courseId,
            room: roomId,
            lecturer: lecturerId,
            classGroup: classGroupOptions.length ? classGroupOptions[index % classGroupOptions.length]?.id : null,
            semester: "2026/2027 Ganjil",
          }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error("Automatic schedule API error:", res.status, errorText);
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to create automatic schedule");
        }

        const created = await res.json();
        generated.push({
          id: created.id,
          day: created.day,
          time: `${created.startTime} - ${created.endTime}`,
          course: created.course?.title ?? courseName,
          room: created.classroom?.name ?? room,
          lecturer: created.lecturer?.name ?? lecturer,
          programStudy: created.programStudy ?? "-",
          angkatan: created.angkatan ?? "-",
          semester: created.semester,
          courseId: created.courseId,
          classroomId: created.classroomId,
          lecturerId: created.lecturerId,
          classGroupId: created.classGroupId,
          classGroup: created.classGroup ? `${created.classGroup.code} - ${created.classGroup.name}` : "-",
        });
        existing.push(generated[generated.length - 1]);
      }

      if (generated.length === 0) {
        Swal.fire("Informasi", "Tidak ada jadwal otomatis yang valid dibuat karena semua slot sudah bentrok.", "info");
        return;
      }

      await fetchSchedules();
      Swal.fire("Sukses", `${generated.length} jadwal berhasil dibuat secara otomatis.`, "success");
    } catch (error) {
      console.error("Error auto generating schedules:", error);
      Swal.fire("Tidak dapat membuat jadwal", error instanceof Error ? error.message : "Gagal membuat jadwal otomatis.", "warning");
    }
  };

  const removeSchedule = async (id: string) => {
    if (id.startsWith("auto-")) {
      setSchedules((prev) => prev.filter((schedule) => schedule.id !== id));
      Swal.fire("Sukses", "Jadwal otomatis berhasil dihapus dari daftar.", "success");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/schedules/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete schedule");
      await fetchSchedules();
      Swal.fire("Sukses", "Jadwal berhasil dihapus.", "success");
    } catch (error) {
      console.error("Error:", error);
      Swal.fire("Error", "Gagal menghapus jadwal", "error");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (schedule: ScheduleEntry) => {
    const parsed = parseTimeRange(schedule.time);
    const startTime = parsed ? `${String(Math.floor(parsed.start / 60)).padStart(2, "0")}:${String(parsed.start % 60).padStart(2, "0")}` : "08:00";

    setMode("manual");
    setEditingId(schedule.id);
    setManualForm({
      day: schedule.day,
      startTime,
      course: schedule.courseId ?? "",
      room: schedule.classroomId ?? "",
      lecturer: schedule.lecturerId ?? "",
      classGroup: schedule.classGroupId ?? "",
      semester: schedule.semester,
    });
  };

  const exportScheduleToPdf = () => {
    if (typeof window === "undefined") {
      return;
    }

    const printWindow = window.open("", "_blank", "width=1200,height=900");
    if (!printWindow) {
      Swal.fire("Info", "Popup diblokir. Izinkan popup lalu coba lagi.", "info");
      return;
    }

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const rows = schedules
      .map((schedule) => `
        <tr>
          <td>${escapeHtml(schedule.day)}</td>
          <td>${escapeHtml(schedule.course)}</td>
          <td>${escapeHtml(schedule.time)}</td>
          <td>${escapeHtml(schedule.room)}</td>
          <td>${escapeHtml(schedule.lecturer)}</td>
          <td>${escapeHtml(schedule.programStudy)}</td>
          <td>${escapeHtml(schedule.angkatan)}</td>
          <td>${escapeHtml(schedule.classGroup || "-")}</td>
          <td>${escapeHtml(schedule.semester)}</td>
        </tr>
      `)
      .join("");

    const generatedAt = new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());

    const totalSchedules = schedules.length;
    const uniqueCourses = new Set(schedules.map((item) => item.course)).size;
    const roomsUsed = new Set(schedules.map((item) => item.room)).size;

    printWindow.document.write(`<!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="UTF-8" />
          <title>Jadwal Kuliah</title>
          <style>
            :root {
              --bg-soft: #f8fafc;
              --primary: #2563eb;
              --primary-dark: #1d4ed8;
              --accent: #dbeafe;
              --text: #0f172a;
              --muted: #475569;
              --line: #dfe7f3;
              --card: #ffffff;
              --success: #10b981;
            }

            * { box-sizing: border-box; }

            body {
              margin: 0;
              font-family: "Segoe UI", Arial, sans-serif;
              background: linear-gradient(180deg, #eef6ff 0%, #f8fafc 100%);
              color: var(--text);
            }

            .report {
              width: 100%;
              min-height: 100vh;
              padding: 28px;
            }

            .header {
              background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
              color: white;
              border-radius: 22px;
              padding: 26px 28px;
              box-shadow: 0 16px 36px rgba(37, 99, 235, 0.22);
            }

            .eyebrow {
              font-size: 11px;
              letter-spacing: 1.5px;
              text-transform: uppercase;
              opacity: 0.85;
              margin: 0 0 8px;
              font-weight: 700;
            }

            h1 {
              margin: 0;
              font-size: 30px;
              line-height: 1.2;
            }

            .header-row {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 16px;
              margin-top: 12px;
            }

            .date-badge {
              background: rgba(255,255,255,0.15);
              border: 1px solid rgba(255,255,255,0.2);
              border-radius: 999px;
              padding: 8px 12px;
              font-size: 12px;
              font-weight: 600;
            }

            .summary {
              display: grid;
              grid-template-columns: repeat(3, minmax(140px, 1fr));
              gap: 16px;
              margin: 22px 0 24px;
            }

            .stat-card {
              background: rgba(255,255,255,0.9);
              border: 1px solid var(--line);
              border-radius: 16px;
              padding: 16px 18px;
              box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);
            }

            .label {
              display: block;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              color: var(--muted);
              margin-bottom: 8px;
              font-weight: 700;
            }

            .value {
              font-size: 28px;
              font-weight: 800;
              color: var(--text);
            }

            table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 0;
              overflow: hidden;
              border-radius: 18px;
              background: var(--card);
              border: 1px solid var(--line);
              box-shadow: 0 10px 22px rgba(15, 23, 42, 0.04);
            }

            th, td {
              padding: 12px 14px;
              border-bottom: 1px solid var(--line);
              text-align: left;
              font-size: 12px;
              vertical-align: top;
            }

            th {
              background: linear-gradient(180deg, #eff6ff 0%, #e0edff 100%);
              color: #1e3a8a;
              font-size: 11px;
              font-weight: 800;
              letter-spacing: 0.08em;
              text-transform: uppercase;
            }

            td {
              color: var(--text);
            }

            tbody tr:nth-child(even) td {
              background: #fafcff;
            }

            tbody tr:last-child td {
              border-bottom: none;
            }

            .muted {
              color: var(--muted);
            }

            @media print {
              body { background: white; }
              .report { padding: 10mm; }
              .header { border-radius: 14px; }
              .summary { margin-top: 16px; }
            }
          </style>
        </head>
        <body>
          <div class="report">
            <div class="header">
              <div class="eyebrow">Sistem Akademik</div>
              <div class="header-row">
                <h1>Jadwal Kuliah</h1>
                <span class="date-badge">${escapeHtml(generatedAt)}</span>
              </div>
            </div>

            <div class="summary">
              <div class="stat-card">
                <span class="label">Total Jadwal</span>
                <div class="value">${totalSchedules}</div>
              </div>
              <div class="stat-card">
                <span class="label">Mata Kuliah</span>
                <div class="value">${uniqueCourses}</div>
              </div>
              <div class="stat-card">
                <span class="label">Ruangan</span>
                <div class="value">${roomsUsed}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Hari</th>
                  <th>Mata Kuliah</th>
                  <th>Waktu</th>
                  <th>Ruangan</th>
                  <th>Dosen</th>
                  <th>Program Studi</th>
                  <th>Angkatan</th>
                  <th>Kelas</th>
                  <th>Semester</th>
                </tr>
              </thead>
              <tbody>
                ${rows || '<tr><td colspan="9" class="muted">Tidak ada data jadwal.</td></tr>'}
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  };

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div style={{ background: "white", borderRadius: 18, padding: 24, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0 }}>Kelola Jadwal</h2>
            <div style={{ color: "#64748b", marginTop: 6 }}>Tambah jadwal secara manual atau otomatis</div>
          </div>

          <div style={{ display: "inline-flex", background: "#f1f5f9", borderRadius: 12, padding: 6 }}>
            {(["manual", "automatic"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMode(item)}
                style={{
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: 10,
                  background: mode === item ? "#2563eb" : "transparent",
                  color: mode === item ? "white" : "#334155",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {item === "manual" ? "Manual" : "Otomatis"}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 20 }}>
          <div style={{ background: "#eff6ff", borderRadius: 14, padding: 16 }}>
            <div style={{ color: "#64748b", fontSize: 13 }}>Total Jadwal</div>
            <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "#2563eb", marginTop: 8 }}>{summary.total}</div>
          </div>
          <div style={{ background: "#f5f3ff", borderRadius: 14, padding: 16 }}>
            <div style={{ color: "#64748b", fontSize: 13 }}>Mata Kuliah</div>
            <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "#7c3aed", marginTop: 8 }}>{summary.uniqueCourses}</div>
          </div>
          <div style={{ background: "#ecfeff", borderRadius: 14, padding: 16 }}>
            <div style={{ color: "#64748b", fontSize: 13 }}>Ruangan Dipakai</div>
            <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "#0f766e", marginTop: 8 }}>{summary.roomsUsed}</div>
          </div>
        </div>

        {mode === "manual" ? (
          <form onSubmit={handleManualSubmit} style={{ display: "grid", gap: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Hari</label>
                <select value={manualForm.day} onChange={(e) => handleManualInput("day", e.target.value)} style={inputStyle}>
                  {days.map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Jam Mulai</label>
                <select value={manualForm.startTime} onChange={(e) => handleManualInput("startTime", e.target.value)} style={inputStyle}>
                  {generateStartTimeOptions().map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
                <div style={{ marginTop: 8, color: "#2563eb", fontSize: 12, fontWeight: 700 }}>
                  {selectedCourse ? `${selectedCourse.credits} SKS = ${selectedCourse.credits * SKS_MINUTES} menit` : "Pilih mata kuliah"}
                </div>
                <div style={{ marginTop: 4, color: "#64748b", fontSize: 12 }}>
                  Durasi: {computedTimeRange}
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Dosen</label>
                <select value={manualForm.lecturer} onChange={(e) => handleManualInput("lecturer", e.target.value)} style={inputStyle}>
                  {lecturerOptions.map((lecturer) => (
                    <option key={lecturer.id} value={lecturer.id}>{lecturer.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Mata Kuliah</label>
                <select value={manualForm.course} onChange={(e) => handleManualInput("course", e.target.value)} style={inputStyle}>
                  {availableCourseOptions.map((course) => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
                </select>
                <div style={{ marginTop: 8, color: "#64748b", fontSize: 12 }}>
                  {manualForm.lecturer && dosenCourseMap[manualForm.lecturer]?.length
                    ? `Dosen ini memiliki ${dosenCourseMap[manualForm.lecturer].length} mata kuliah yang tersedia.`
                    : "Semua mata kuliah tersedia untuk dosen ini."}
                </div>
                <div style={{ marginTop: 4, color: "#64748b", fontSize: 12 }}>
                  Waktu otomatis: {computedTimeRange}
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>SKS</label>
                <div style={{
                  ...inputStyle,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 42,
                  background: "#f8fafc",
                  color: "#0f172a",
                  fontWeight: 700,
                }}>
                  {getCourseCredits(manualForm.course)} SKS
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Ruangan</label>
                <select value={manualForm.room} onChange={(e) => handleManualInput("room", e.target.value)} style={inputStyle}>
                  {roomOptions.map((room) => (
                    <option key={room.id} value={room.id}>{room.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Kelas</label>
                <select value={manualForm.classGroup} onChange={(e) => handleManualInput("classGroup", e.target.value)} style={inputStyle}>
                  <option value="">Pilih kelas</option>
                  {classGroupOptions.map((group) => (
                    <option key={group.id} value={group.id}>{group.code} - {group.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Semester</label>
                <input
                  value={manualForm.semester}
                  onChange={(e) => handleManualInput("semester", e.target.value)}
                  style={inputStyle}
                  placeholder="2026/2027 Ganjil"
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              {editingId && (
                <button type="button" onClick={resetForm} style={secondaryButtonStyle}>Batal Edit</button>
              )}
              <button type="submit" style={primaryButtonStyle}>{editingId ? "Simpan Perubahan" : "Tambahkan Jadwal"}</button>
            </div>
          </form>
        ) : (
          <div style={{ display: "grid", gap: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(180px, 220px) 1fr", gap: 16, alignItems: "center" }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Jumlah Jadwal</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={generatedCount}
                  onChange={(e) => setGeneratedCount(Number(e.target.value) || 1)}
                  style={inputStyle}
                />
              </div>

              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, color: "#334155" }}>
                Sistem akan otomatis membuat jadwal berdasarkan kombinasi mata kuliah, dosen, ruangan, hari, dan sesi yang tersedia.
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="button" onClick={handleAutoGenerate} style={primaryButtonStyle}>Buat Jadwal Otomatis</button>
            </div>
          </div>
        )}
      </div>

      <div style={{ background: "white", borderRadius: 18, padding: 24, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
          <h3 style={{ margin: 0 }}>Daftar Jadwal</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ color: "#64748b", fontSize: 13 }}>Terbaru diurutkan dari atas</span>
            <button
              type="button"
              onClick={exportScheduleToPdf}
              style={{
                background: "#10b981",
                color: "white",
                border: "none",
                borderRadius: 10,
                padding: "9px 14px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Export PDF
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          {schedules.map((schedule) => {
            const status = getScheduleStatus(schedule);
            const endTime = getEndTimeFromSchedule(schedule);

            return (
              <div key={schedule.id} style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 16, display: "grid", gap: 8, background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <strong style={{ fontSize: 18 }}>{schedule.day}</strong>
                  <span
                    style={{
                      fontWeight: 700,
                      color: status.color,
                      background: status.bg,
                      borderRadius: 999,
                      padding: "6px 10px",
                      fontSize: 12,
                    }}
                  >
                    {status.label}
                  </span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{schedule.course}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ background: "#ede9fe", color: "#6d28d9", borderRadius: 999, padding: "6px 10px", fontSize: 12, fontWeight: 700 }}>
                    SKS: {getCourseCredits(schedule.courseId ?? "")} 
                  </span>
                  <span style={{ background: "#eff6ff", color: "#1d4ed8", borderRadius: 999, padding: "6px 10px", fontSize: 12, fontWeight: 700 }}>
                    ⏰ {schedule.time}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", background: "#f8fafc", borderRadius: 10, padding: "8px 10px", color: "#1d4ed8", fontWeight: 700 }}>
                  <span>Durasi sesi</span>
                  <span style={{ fontSize: 12, opacity: 0.9 }}>Selesai {endTime}</span>
                </div>
                <div style={{ color: "#64748b" }}>Ruangan: {schedule.room}</div>
                <div style={{ color: "#64748b" }}>Program Studi: {schedule.programStudy}</div>
                <div style={{ color: "#64748b" }}>Angkatan: {schedule.angkatan}</div>
                <div style={{ color: "#64748b" }}>Kelas: {schedule.classGroup || "-"}</div>
                <div style={{ color: "#64748b" }}>Dosen: {schedule.lecturer}</div>
                <div style={{ color: "#64748b" }}>Semester: {schedule.semester}</div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <button type="button" onClick={() => startEdit(schedule)} style={{ background: "#dbeafe", color: "#1d4ed8", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 700, cursor: "pointer" }}>
                    Edit
                  </button>
                  <button type="button" onClick={() => removeSchedule(schedule.id)} style={{ background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 700, cursor: "pointer" }}>
                    Hapus
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const secondaryButtonStyle: React.CSSProperties = {
  background: "#e2e8f0",
  color: "#0f172a",
  border: "none",
  borderRadius: 12,
  padding: "11px 18px",
  fontWeight: 700,
  cursor: "pointer",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  fontSize: 14,
  boxSizing: "border-box",
  background: "white",
};

const primaryButtonStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
  color: "white",
  border: "none",
  borderRadius: 12,
  padding: "11px 18px",
  fontWeight: 700,
  cursor: "pointer",
};
