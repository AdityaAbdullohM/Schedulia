"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";

interface ProgramStudy {
  id: string;
  code: string;
  name: string;
  degree: string;
}

interface Course {
  id: string;
  code: string;
  title: string;
  credits: number;
  semester: number;
  angkatan?: number | null;
  programStudyId?: string;
  programStudy?: ProgramStudy;
  createdAt: string;
  _count?: { schedules: number };
}

interface FormData {
  code: string;
  title: string;
  credits: string;
  semester: string;
  angkatan: string;
  programStudyId: string;
}

const initialFormData: FormData = {
  code: "",
  title: "",
  credits: "",
  semester: "",
  angkatan: "",
  programStudyId: "",
};

export default function CoursesManager() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [programStudies, setProgramStudies] = useState<ProgramStudy[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  useEffect(() => {
    fetchProgramStudies();
    fetchCourses();
  }, []);

  const fetchProgramStudies = async () => {
    try {
      const response = await fetch("/api/program-studies");
      if (!response.ok) throw new Error("Failed to fetch program studies");
      const data = await response.json();
      const studies = Array.isArray(data) ? data : [];
      setProgramStudies(studies);
      if (!formData.programStudyId && studies.length > 0) {
        setFormData((prev) => ({ ...prev, programStudyId: studies[0].id }));
      }
    } catch (error) {
      console.error("Error fetching program studies:", error);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/courses");
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal mengambil data mata kuliah");
      }
      
      const data = await response.json();
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setCourses(data);
      } else {
        console.warn("API returned non-array data:", data);
        setCourses([]);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      setCourses([]); // Set empty array on error
      Swal.fire("Error", error instanceof Error ? error.message : "Gagal mengambil data mata kuliah", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.title || !formData.credits || !formData.semester || !formData.programStudyId) {
      Swal.fire("Error", "Semua field harus diisi", "error");
      return;
    }

    try {
      setLoading(true);
      const url = editingId ? `/api/courses/${editingId}` : "/api/courses";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save course");
      }

      await fetchCourses();
      setShowForm(false);
      setEditingId(null);
      setFormData(initialFormData);

      const message = editingId ? "Mata kuliah berhasil diperbarui" : "Mata kuliah berhasil ditambahkan";
      Swal.fire("Sukses", message, "success");
    } catch (error) {
      console.error("Error saving course:", error);
      Swal.fire("Error", error instanceof Error ? error.message : "Gagal menyimpan mata kuliah", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (course: Course) => {
    setFormData({
      code: course.code,
      title: course.title,
      credits: String(course.credits),
      semester: String(course.semester),
      angkatan: course.angkatan ? String(course.angkatan) : "",
      programStudyId: course.programStudyId || course.programStudy?.id || "",
    });
    setEditingId(course.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Konfirmasi",
      text: "Apakah Anda yakin ingin menghapus mata kuliah ini?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal"
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/courses/${id}`, { method: "DELETE" });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete course");
      }

      await fetchCourses();
      Swal.fire("Sukses", "Mata kuliah berhasil dihapus", "success");
    } catch (error) {
      console.error("Error deleting course:", error);
      Swal.fire("Error", error instanceof Error ? error.message : "Gagal menghapus mata kuliah", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ ...initialFormData, programStudyId: programStudies[0]?.id ?? "" });
  };

  return (
    <div style={{ background: "white", borderRadius: 18, padding: 24, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)", marginTop: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2>Manajemen Mata Kuliah</h2>
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
          + Tambah Mata Kuliah
        </button>
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
          zIndex: 1000
        }}>
          <div style={{
            background: "white",
            borderRadius: 12,
            padding: 32,
            maxWidth: 500,
            width: "90%",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)"
          }}>
            <h3 style={{ marginTop: 0, marginBottom: 24 }}>
              {editingId ? "Edit Mata Kuliah" : "Tambah Mata Kuliah Baru"}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 600 }}>
                  Kode Mata Kuliah
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="Contoh: MK001"
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

              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 600 }}>
                  Nama Mata Kuliah
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Contoh: Pemrograman Web"
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 600 }}>
                    SKS
                  </label>
                  <input
                    type="number"
                    name="credits"
                    value={formData.credits}
                    onChange={handleInputChange}
                    placeholder="Contoh: 3"
                    min="1"
                    max="6"
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

                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 600 }}>
                    Semester
                  </label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: 10,
                      borderRadius: 6,
                      border: "1px solid #e2e8f0",
                      fontSize: 14,
                      boxSizing: "border-box"
                    }}
                  >
                    <option value="">Pilih Semester</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                      <option key={sem} value={sem}>{sem}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 600 }}>
                  Angkatan (Opsional)
                </label>
                <input
                  type="number"
                  name="angkatan"
                  value={formData.angkatan}
                  onChange={handleInputChange}
                  placeholder="Contoh: 2024"
                  min="2000"
                  max="2100"
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

              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 600 }}>
                  Program Studi
                </label>
                <select
                  name="programStudyId"
                  value={formData.programStudyId}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 6,
                    border: "1px solid #e2e8f0",
                    fontSize: 14,
                    boxSizing: "border-box"
                  }}
                >
                  <option value="">Pilih program studi</option>
                  {programStudies.map((study) => (
                    <option key={study.id} value={study.id}>{study.name}</option>
                  ))}
                </select>
              </div>

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
                  disabled={loading}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    border: "none",
                    background: "#2563eb",
                    color: "white",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontSize: 14,
                    fontWeight: 600,
                    opacity: loading ? 0.5 : 1
                  }}
                >
                  {loading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Courses Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 14
        }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
              <th style={{ padding: 12, textAlign: "left", fontWeight: 600 }}>Kode</th>
              <th style={{ padding: 12, textAlign: "left", fontWeight: 600 }}>Nama Mata Kuliah</th>
              <th style={{ padding: 12, textAlign: "center", fontWeight: 600 }}>SKS</th>
              <th style={{ padding: 12, textAlign: "center", fontWeight: 600 }}>Semester</th>
              <th style={{ padding: 12, textAlign: "center", fontWeight: 600 }}>Angkatan</th>
              <th style={{ padding: 12, textAlign: "left", fontWeight: 600 }}>Program Studi</th>
              <th style={{ padding: 12, textAlign: "center", fontWeight: 600 }}>Jadwal</th>
              <th style={{ padding: 12, textAlign: "center", fontWeight: 600 }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {courses.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>
                  Belum ada mata kuliah
                </td>
              </tr>
            ) : (
              courses.map(course => (
                <tr key={course.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: 12, fontWeight: 600, color: "#2563eb" }}>{course.code}</td>
                  <td style={{ padding: 12 }}>{course.title}</td>
                  <td style={{ padding: 12, textAlign: "center" }}>{course.credits}</td>
                  <td style={{ padding: 12, textAlign: "center" }}>{course.semester}</td>
                  <td style={{ padding: 12, textAlign: "center", fontSize: 13, color: "#64748b" }}>{course.angkatan || "-"}</td>
                  <td style={{ padding: 12, fontSize: 13, color: "#64748b" }}>{course.programStudy?.name || "-"}</td>
                  <td style={{ padding: 12, textAlign: "center", color: "#64748b" }}>
                    {course._count?.schedules || 0}
                  </td>
                  <td style={{ padding: 12, textAlign: "center" }}>
                    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                      <button
                        onClick={() => handleEdit(course)}
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
                        onClick={() => handleDelete(course.id)}
                        disabled={loading || (course._count?.schedules || 0) > 0}
                        title={course._count && course._count.schedules > 0 ? "Tidak bisa dihapus (ada jadwal)" : ""}
                        style={{
                          background: "#ef4444",
                          color: "white",
                          border: "none",
                          borderRadius: 6,
                          padding: "6px 12px",
                          cursor: (loading || (course._count?.schedules || 0) > 0) ? "not-allowed" : "pointer",
                          fontSize: 12,
                          fontWeight: 600,
                          opacity: (loading || (course._count?.schedules || 0) > 0) ? 0.5 : 1
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
