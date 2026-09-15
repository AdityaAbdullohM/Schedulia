"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";

interface ProgramStudy {
  id: string;
  code: string;
  name: string;
  degree: string;
  createdAt: string;
  _count?: { courses: number; classGroups: number };
}

interface FormData {
  code: string;
  name: string;
  degree: string;
}

const initialFormData: FormData = {
  code: "",
  name: "",
  degree: "",
};

export default function ProgramStudiesManager() {
  const [studies, setStudies] = useState<ProgramStudy[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  useEffect(() => {
    fetchStudies();
  }, []);

  const fetchStudies = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/program-studies");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal mengambil data program studi");
      }

      const data = await response.json();
      setStudies(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching program studies:", error);
      setStudies([]);
      Swal.fire("Error", error instanceof Error ? error.message : "Gagal mengambil data program studi", "error");
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

    if (!formData.code || !formData.name || !formData.degree) {
      Swal.fire("Error", "Semua field harus diisi", "error");
      return;
    }

    try {
      setLoading(true);
      const url = editingId ? `/api/program-studies/${editingId}` : "/api/program-studies";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save program study");
      }

      await fetchStudies();
      setShowForm(false);
      setEditingId(null);
      setFormData(initialFormData);

      const message = editingId ? "Program studi berhasil diperbarui" : "Program studi berhasil ditambahkan";
      Swal.fire("Sukses", message, "success");
    } catch (error) {
      console.error("Error saving program study:", error);
      Swal.fire("Error", error instanceof Error ? error.message : "Gagal menyimpan program studi", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (study: ProgramStudy) => {
    setFormData({
      code: study.code,
      name: study.name,
      degree: study.degree,
    });
    setEditingId(study.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Konfirmasi",
      text: "Apakah Anda yakin ingin menghapus program studi ini?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/program-studies/${id}`, { method: "DELETE" });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete program study");
      }

      await fetchStudies();
      Swal.fire("Sukses", "Program studi berhasil dihapus", "success");
    } catch (error) {
      console.error("Error deleting program study:", error);
      Swal.fire("Error", error instanceof Error ? error.message : "Gagal menghapus program studi", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(initialFormData);
  };

  return (
    <div style={{ background: "white", borderRadius: 18, padding: 24, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)", marginTop: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2>Manajemen Program Studi</h2>
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
          + Tambah Program Studi
        </button>
      </div>

      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", borderRadius: 12, padding: 32, maxWidth: 500, width: "90%", boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ margin: 0 }}>{editingId ? "Edit Program Studi" : "Tambah Program Studi Baru"}</h3>
              <button type="button" onClick={handleCloseForm} style={{ background: "transparent", border: "none", fontSize: 24, cursor: "pointer", color: "#475569" }}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 600 }}>Kode Program Studi</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="Contoh: TI"
                  style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 600 }}>Nama Program Studi</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Contoh: Teknik Informatika"
                  style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 600 }}>Jenjang</label>
                <select
                  name="degree"
                  value={formData.degree}
                  onChange={handleInputChange}
                  style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" }}
                >
                  <option value="">Pilih jenjang</option>
                  <option value="D3">D3</option>
                  <option value="S1">S1</option>
                  <option value="S2">S2</option>
                  <option value="S3">S3</option>
                </select>
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
        {studies.length === 0 && !loading ? (
          <div style={{ background: "#f8fafc", borderRadius: 12, padding: 20, color: "#64748b", textAlign: "center" }}>
            Belum ada data program studi.
          </div>
        ) : (
          studies.map((study) => (
            <div key={study.id} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, display: "grid", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{study.name}</div>
                  <div style={{ color: "#64748b", fontSize: 13 }}>{study.code} • {study.degree}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" onClick={() => handleEdit(study)} style={{ background: "#dbeafe", color: "#1d4ed8", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 700, cursor: "pointer" }}>
                    Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(study.id)} style={{ background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 700, cursor: "pointer" }}>
                    Hapus
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", color: "#475569", fontSize: 13 }}>
                <span style={{ background: "#eff6ff", color: "#1d4ed8", borderRadius: 999, padding: "5px 10px", fontWeight: 700 }}>
                  {study._count?.courses ?? 0} mata kuliah
                </span>
                <span style={{ background: "#f5f3ff", color: "#6d28d9", borderRadius: 999, padding: "5px 10px", fontWeight: 700 }}>
                  {study._count?.classGroups ?? 0} kelas
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
