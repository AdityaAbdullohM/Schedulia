"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";

interface ProgramStudy {
  id: string;
  code: string;
  name: string;
}

interface ClassGroup {
  id: string;
  code: string;
  name: string;
  cohort: string;
  programStudyId: string;
  programStudy?: ProgramStudy;
  _count?: { students: number };
}

interface FormData {
  code: string;
  name: string;
  cohort: string;
  programStudyId: string;
}

const initialFormData: FormData = {
  code: "",
  name: "",
  cohort: "",
  programStudyId: "",
};

export default function ClassGroupsManager() {
  const [groups, setGroups] = useState<ClassGroup[]>([]);
  const [programStudies, setProgramStudies] = useState<ProgramStudy[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  useEffect(() => {
    fetchProgramStudies();
    fetchClassGroups();
  }, []);

  const fetchProgramStudies = async () => {
    try {
      const response = await fetch("/api/program-studies");
      if (!response.ok) throw new Error("Failed to fetch program studies");
      const data = await response.json();
      setProgramStudies(Array.isArray(data) ? data : []);
      if (!formData.programStudyId && Array.isArray(data) && data.length > 0) {
        setFormData((prev) => ({ ...prev, programStudyId: data[0].id }));
      }
    } catch (error) {
      console.error("Error fetching program studies:", error);
    }
  };

  const fetchClassGroups = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/class-groups");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal mengambil data kelas");
      }

      const data = await response.json();
      setGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching class groups:", error);
      setGroups([]);
      Swal.fire("Error", error instanceof Error ? error.message : "Gagal mengambil data kelas", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.name || !formData.cohort || !formData.programStudyId) {
      Swal.fire("Error", "Semua field harus diisi", "error");
      return;
    }

    try {
      setLoading(true);
      const url = editingId ? `/api/class-groups/${editingId}` : "/api/class-groups";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save class group");
      }

      await fetchClassGroups();
      setShowForm(false);
      setEditingId(null);
      setFormData({ ...initialFormData, programStudyId: programStudies[0]?.id ?? "" });

      const message = editingId ? "Kelas berhasil diperbarui" : "Kelas berhasil ditambahkan";
      Swal.fire("Sukses", message, "success");
    } catch (error) {
      console.error("Error saving class group:", error);
      Swal.fire("Error", error instanceof Error ? error.message : "Gagal menyimpan kelas", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (group: ClassGroup) => {
    setFormData({
      code: group.code,
      name: group.name,
      cohort: group.cohort,
      programStudyId: group.programStudyId,
    });
    setEditingId(group.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Konfirmasi",
      text: "Apakah Anda yakin ingin menghapus kelas ini?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/class-groups/${id}`, { method: "DELETE" });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete class group");
      }

      await fetchClassGroups();
      Swal.fire("Sukses", "Kelas berhasil dihapus", "success");
    } catch (error) {
      console.error("Error deleting class group:", error);
      Swal.fire("Error", error instanceof Error ? error.message : "Gagal menghapus kelas", "error");
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
        <h2>Manajemen Kelas</h2>
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
            opacity: loading ? 0.5 : 1,
          }}
        >
          + Tambah Kelas
        </button>
      </div>

      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", borderRadius: 12, padding: 32, maxWidth: 500, width: "90%", boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ margin: 0 }}>{editingId ? "Edit Kelas" : "Tambah Kelas Baru"}</h3>
              <button type="button" onClick={handleCloseForm} style={{ background: "transparent", border: "none", fontSize: 24, cursor: "pointer", color: "#475569" }}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 600 }}>Kode Kelas</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="Contoh: TI-2024-A"
                  style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 600 }}>Nama Kelas</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Contoh: Kelas A"
                  style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 600 }}>Program Studi</label>
                <select
                  name="programStudyId"
                  value={formData.programStudyId}
                  onChange={handleInputChange}
                  style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" }}
                >
                  <option value="">Pilih program studi</option>
                  {programStudies.map((study) => (
                    <option key={study.id} value={study.id}>{study.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 600 }}>Angkatan / Cohort</label>
                <input
                  type="text"
                  name="cohort"
                  value={formData.cohort}
                  onChange={handleInputChange}
                  placeholder="Contoh: 2024"
                  style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button type="button" onClick={handleCloseForm} style={{ background: "#e2e8f0", color: "#0f172a", border: "none", borderRadius: 8, padding: "10px 14px", cursor: "pointer", fontWeight: 600 }}>
                  Batal
                </button>
                <button type="submit" disabled={loading} style={{ background: "#2563eb", color: "white", border: "none", borderRadius: 8, padding: "10px 14px", cursor: loading ? "not-allowed" : "pointer", fontWeight: 600, opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Tambah"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {groups.length === 0 && !loading ? (
          <div style={{ background: "#f8fafc", borderRadius: 12, padding: 20, color: "#64748b", textAlign: "center" }}>
            Belum ada data kelas.
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.id} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, display: "grid", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{group.name}</div>
                  <div style={{ color: "#64748b", fontSize: 13 }}>{group.code} • {group.programStudy?.name ?? "Program Studi"} • {group.cohort}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" onClick={() => handleEdit(group)} style={{ background: "#dbeafe", color: "#1d4ed8", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 700, cursor: "pointer" }}>
                    Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(group.id)} style={{ background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 700, cursor: "pointer" }}>
                    Hapus
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", color: "#475569", fontSize: 13 }}>
                <span style={{ background: "#eff6ff", color: "#1d4ed8", borderRadius: 999, padding: "5px 10px", fontWeight: 700 }}>
                  {group._count?.students ?? 0} mahasiswa
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
