"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

interface Instructor {
  id: string;
  name: string;
  email: string;
  role: string;
  nip?: string;
  createdAt: string;
  dosenCourses?: Array<{ course: { id: string; title: string; code: string } }>;
}

interface Course {
  id: string;
  code: string;
  title: string;
  credits: number;
  semester: number;
  department: string;
}

interface FormState {
  dosenId: string;
  courseIds: string[];
}

interface DosenApiResponse {
  id: string;
  role?: string;
  dosenCourses?: Array<{ course: { id: string; title: string; code: string } }>;
}

const initialFormState: FormState = {
  dosenId: "",
  courseIds: []
};

export default function InstructorsManager() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [availableDosen, setAvailableDosen] = useState<Instructor[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [search, setSearch] = useState("");
  const [selectedDosenData, setSelectedDosenData] = useState<Instructor | null>(null);

  const fetchCourses = useCallback(async () => {
    try {
      const response = await fetch("/api/courses");

      if (!response.ok) {
        console.warn("Courses API unavailable, using empty list.");
        setCourses([]);
        return;
      }

      const data = await response.json();
      setCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching courses:", error);
      setCourses([]);
    }
  }, []);

  const fetchInstructors = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/dosen-courses");
      
      if (!response.ok) {
        // Fallback ke /api/users jika dosen-courses tidak tersedia
        const userResponse = await fetch("/api/users");
        if (!userResponse.ok) {
          console.warn("Users API unavailable while loading instructors.");
          setInstructors([]);
          setAvailableDosen([]);
          return;
        }

        const data = await userResponse.json();
        if (Array.isArray(data)) {
          const dosenList = data.filter((user: DosenApiResponse) => user.role === "DOSEN");
          setInstructors([]);
          setAvailableDosen(dosenList);
        }
        return;
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        // Filter only dosen with courses assigned
        const dosenWithCourses = data.filter(
          (user: DosenApiResponse) => user.dosenCourses && user.dosenCourses.length > 0
        );
        setInstructors(dosenWithCourses);

        // All dosen for dropdown
        const allDosen = data.filter((user: DosenApiResponse) => user.role === "DOSEN");
        setAvailableDosen(allDosen);
      } else {
        console.warn("API returned non-array data:", data);
        setInstructors([]);
      }
    } catch (error) {
      console.error("Error fetching instructors:", error);
      setInstructors([]);
      // Don't show error, just silently fail and show empty list
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await fetchInstructors();
      await fetchCourses();
    };

    void loadData();
  }, [fetchInstructors, fetchCourses]);

  const filteredInstructors = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return instructors;

    return instructors.filter((instructor) => {
      const haystack = `${instructor.name} ${instructor.email} ${instructor.nip ?? ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [search, instructors]);

  const handleDosenSelect = (dosenId: string) => {
    setFormData(prev => ({ ...prev, dosenId }));
    
    const selected = availableDosen.find(d => d.id === dosenId);
    setSelectedDosenData(selected || null);
    
    // If editing, set the courseIds
    if (editingId) {
      const existing = instructors.find(i => i.id === dosenId);
      if (existing?.dosenCourses) {
        setFormData(prev => ({
          ...prev,
          courseIds: existing.dosenCourses!.map(dc => dc.course.id)
        }));
      }
    }
  };

  const handleCourseToggle = (courseId: string) => {
    setFormData(prev => {
      const courseIds = prev.courseIds.includes(courseId)
        ? prev.courseIds.filter(id => id !== courseId)
        : [...prev.courseIds, courseId];
      return { ...prev, courseIds };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.dosenId || formData.courseIds.length === 0) {
      Swal.fire("Error", "Pilih dosen dan minimal satu mata kuliah", "error");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/dosen-courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dosenId: formData.dosenId,
          courseIds: formData.courseIds
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save instructor courses");
      }

      await fetchInstructors();
      setShowForm(false);
      setEditingId(null);
      setFormData(initialFormState);
      setSelectedDosenData(null);

      Swal.fire("Sukses", "Penugasan mata kuliah berhasil disimpan", "success");
    } catch (error) {
      console.error("Error saving instructor:", error);
      Swal.fire("Error", error instanceof Error ? error.message : "Gagal menyimpan penugasan", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (instructor: Instructor) => {
    setFormData({
      dosenId: instructor.id,
      courseIds: instructor.dosenCourses?.map(dc => dc.course.id) || []
    });
    setSelectedDosenData(instructor);
    setEditingId(instructor.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Konfirmasi",
      text: "Apakah Anda yakin ingin menghapus dosen ini?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal"
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/users/${id}`, { method: "DELETE" });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete instructor");
      }

      await fetchInstructors();
      Swal.fire("Sukses", "Dosen berhasil dihapus", "success");
    } catch (error) {
      console.error("Error deleting instructor:", error);
      Swal.fire("Error", error instanceof Error ? error.message : "Gagal menghapus dosen", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(initialFormState);
    setSelectedDosenData(null);
  };

  return (
    <div style={{ background: "white", borderRadius: 18, padding: 24, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)", marginTop: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2>Manajemen Dosen Pengampu</h2>
        <button
          onClick={() => setShowForm(true)}
          disabled={loading}
          style={{
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: 8,
            padding: "10px 16px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: 14,
            fontWeight: 600,
            opacity: loading ? 0.5 : 1
          }}
        >
          + Tambah Dosen
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Cari berdasarkan nama, email, atau NIP..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 6,
            border: "1px solid #e2e8f0",
            fontSize: 14,
            boxSizing: "border-box"
          }}
        />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          overflow: "auto",
          padding: "20px"
        }}>
          <div style={{
            background: "white",
            borderRadius: 12,
            padding: 32,
            maxWidth: 600,
            width: "100%",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            maxHeight: "90vh",
            overflow: "auto"
          }}>
            <h3 style={{ marginTop: 0, marginBottom: 24 }}>
              {editingId ? "Edit Penugasan Dosen" : "Penugasan Dosen Pengampu"}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 600 }}>
                  Pilih Dosen
                </label>
                <select
                  value={formData.dosenId}
                  onChange={(e) => handleDosenSelect(e.target.value)}
                  disabled={editingId !== null}
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 6,
                    border: "1px solid #e2e8f0",
                    fontSize: 14,
                    boxSizing: "border-box",
                    opacity: editingId ? 0.6 : 1,
                    cursor: editingId ? "not-allowed" : "pointer"
                  }}
                >
                  <option value="">-- Pilih Dosen --</option>
                  {availableDosen.map(dosen => (
                    <option key={dosen.id} value={dosen.id}>
                      {dosen.name} ({dosen.email})
                    </option>
                  ))}
                </select>
              </div>

              {selectedDosenData && (
                <>
                  <div style={{ 
                    background: "#f0f9ff", 
                    border: "1px solid #bfdbfe", 
                    borderRadius: 8, 
                    padding: 12,
                    display: "grid",
                    gap: 8
                  }}>
                    <div style={{ fontSize: 12, color: "#0369a1", fontWeight: 600 }}>INFO DOSEN</div>
                    <div style={{ fontSize: 13 }}>
                      <strong>Nama:</strong> {selectedDosenData.name}
                    </div>
                    <div style={{ fontSize: 13 }}>
                      <strong>Email:</strong> {selectedDosenData.email}
                    </div>
                    <div style={{ fontSize: 13 }}>
                      <strong>NIP:</strong> {selectedDosenData.nip || "-"}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
                      Mata Kuliah (Pilih Minimal 1)
                    </label>
                    <div style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: 6,
                      maxHeight: 300,
                      overflow: "auto",
                      display: "grid",
                      gap: 0
                    }}>
                      {courses.length === 0 ? (
                        <div style={{ padding: 12, color: "#64748b", textAlign: "center" }}>
                          Tidak ada mata kuliah tersedia
                        </div>
                      ) : (
                        courses.map(course => (
                          <label
                            key={course.id}
                            style={{
                              padding: 12,
                              borderBottom: "1px solid #e2e8f0",
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              cursor: "pointer",
                              background: formData.courseIds.includes(course.id) ? "#f0f9ff" : "white",
                              transition: "background 0.2s"
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={formData.courseIds.includes(course.id)}
                              onChange={() => handleCourseToggle(course.id)}
                              style={{ cursor: "pointer" }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>
                                {course.code} - {course.title}
                              </div>
                              <div style={{ fontSize: 12, color: "#64748b" }}>
                                {course.credits} SKS - Semester {course.semester}
                              </div>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                    {formData.courseIds.length > 0 && (
                      <div style={{ marginTop: 8, fontSize: 12, color: "#0369a1" }}>
                        Dipilih: {formData.courseIds.length} mata kuliah
                      </div>
                    )}
                  </div>
                </>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  disabled={loading}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    background: "white",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontSize: 14,
                    fontWeight: 600,
                    opacity: loading ? 0.5 : 1
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.dosenId || formData.courseIds.length === 0}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    border: "none",
                    background: "#2563eb",
                    color: "white",
                    cursor: (loading || !formData.dosenId || formData.courseIds.length === 0) ? "not-allowed" : "pointer",
                    fontSize: 14,
                    fontWeight: 600,
                    opacity: (loading || !formData.dosenId || formData.courseIds.length === 0) ? 0.5 : 1
                  }}
                >
                  {loading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Instructors Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 14
        }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
              <th style={{ padding: 12, textAlign: "left", fontWeight: 600 }}>Nama Dosen</th>
              <th style={{ padding: 12, textAlign: "left", fontWeight: 600 }}>Email</th>
              <th style={{ padding: 12, textAlign: "left", fontWeight: 600 }}>Mata Kuliah</th>
              <th style={{ padding: 12, textAlign: "center", fontWeight: 600 }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredInstructors.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>
                  {search ? "Tidak ada dosen yang cocok" : "Belum ada dosen dengan mata kuliah"}
                </td>
              </tr>
            ) : (
              filteredInstructors.map(instructor => (
                <tr key={instructor.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: 12, fontWeight: 600, color: "#2563eb" }}>{instructor.name}</td>
                  <td style={{ padding: 12 }}>{instructor.email}</td>
                  <td style={{ padding: 12 }}>
                    <div style={{ display: "grid", gap: 4 }}>
                      {instructor.dosenCourses && instructor.dosenCourses.length > 0 ? (
                        instructor.dosenCourses.map(dc => (
                          <div key={dc.course.id} style={{ fontSize: 12, background: "#f0f9ff", padding: "4px 8px", borderRadius: 4 }}>
                            {dc.course.code} - {dc.course.title}
                          </div>
                        ))
                      ) : (
                        <span style={{ color: "#64748b" }}>-</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: 12, textAlign: "center" }}>
                    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                      <button
                        onClick={() => handleEdit(instructor)}
                        disabled={loading}
                        style={{
                          background: "#3b82f6",
                          color: "white",
                          border: "none",
                          borderRadius: 6,
                          padding: "6px 12px",
                          cursor: loading ? "not-allowed" : "pointer",
                          fontSize: 12,
                          fontWeight: 600,
                          opacity: loading ? 0.5 : 1
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(instructor.id)}
                        disabled={loading}
                        style={{
                          background: "#ef4444",
                          color: "white",
                          border: "none",
                          borderRadius: 6,
                          padding: "6px 12px",
                          cursor: loading ? "not-allowed" : "pointer",
                          fontSize: 12,
                          fontWeight: 600,
                          opacity: loading ? 0.5 : 1
                        }}
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
