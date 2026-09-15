"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

const STORAGE_KEY = "schedulia-users";

type RoleType = "ADMIN" | "DOSEN" | "MAHASISWA";

type ProgramStudy = {
  id: string;
  name: string;
  code: string;
  degree: string;
};

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  nip?: string;
  nim?: string;
  angkatan?: number | null;
  classGroupId?: string | null;
  classGroup?: {
    id: string;
    name: string;
    code: string;
    programStudy?: { id: string; name: string; code: string; degree: string } | null;
  } | null;
  programStudyId?: string | null;
  programStudy?: { id: string; name: string; code: string; degree: string } | null;
  status?: "Aktif" | "Nonaktif";
  hasPassword?: boolean;
  password?: string;
  createdAt: string;
};

type FormState = {
  name: string;
  email: string;
  password: string;
  role: RoleType;
  nip: string;
  nim: string;
  angkatan: string;
  classGroupId: string;
  dosenProgramStudyId: string;
  status: "Aktif" | "Nonaktif";
};

const initialFormState: FormState = {
  name: "",
  email: "",
  password: "",
  role: "MAHASISWA",
  nip: "",
  nim: "",
  angkatan: "",
  classGroupId: "",
  dosenProgramStudyId: "",
  status: "Aktif",
};

export default function UsersManager() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [programStudies, setProgramStudies] = useState<ProgramStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<RoleType | "">("");
  const [selectedUserDetail, setSelectedUserDetail] = useState<UserItem | null>(null);

  const fetchProgramStudies = useCallback(async () => {
    try {
      const res = await fetch("/api/program-studies");
      if (!res.ok) {
        console.warn("Program studies API unavailable, using empty list.");
        setProgramStudies([]);
        return;
      }

      const data = await res.json();
      const studies = Array.isArray(data) ? data : [];
      setProgramStudies(studies);
      if (!formData.classGroupId && studies.length > 0) {
        setFormData((prev) => ({ ...prev, classGroupId: studies[0].id }));
      }
    } catch (error) {
      console.error("Error fetching program studies:", error);
      setProgramStudies([]);
    }
  }, [formData.classGroupId]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/users");
      if (!res.ok) {
        console.warn("Users API unavailable, using empty list.");
        setUsers([]);
        return;
      }

      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await fetchProgramStudies();
      await fetchUsers();
    };

    void loadData();
  }, [fetchProgramStudies, fetchUsers]);

  const filteredUsers = useMemo(() => {
    let result = users;

    // Filter by role
    if (filterRole) {
      result = result.filter((user) => user.role === filterRole);
    }

    // Filter by search
    const query = search.trim().toLowerCase();
    if (query) {
      result = result.filter((user) => {
        const haystack = `${user.name} ${user.email} ${user.role} ${user.nip ?? ""} ${user.nim ?? ""}`.toLowerCase();
        return haystack.includes(query);
      });
    }

    return result;
  }, [search, filterRole, users]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === "angkatan") {
      const nimPrefix = value.slice(-2);
      setFormData((prev) => ({
        ...prev,
        angkatan: value,
        nim: prev.nim ? `${nimPrefix}${prev.nim.slice(2)}` : nimPrefix,
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNimSuffixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nimPrefix = formData.angkatan.slice(-2);
    const suffix = e.target.value.replace(/\D/g, "");
    setFormData((prev) => ({ ...prev, nim: `${nimPrefix}${suffix}` }));
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(initialFormState);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.role) {
      Swal.fire("Error", "Nama, email, dan role harus diisi.", "error");
      return;
    }

    if (!formData.password.trim() && !editingId) {
      Swal.fire("Error", "Password wajib diisi saat menambahkan pengguna baru.", "error");
      return;
    }

    if (formData.role === "ADMIN" && !formData.nip) {
      Swal.fire("Error", "NIP wajib diisi untuk role Admin.", "error");
      return;
    }

    if (formData.role === "DOSEN" && !formData.nip) {
      Swal.fire("Error", "NIP wajib diisi untuk role Dosen.", "error");
      return;
    }

    if (formData.role === "MAHASISWA" && formData.nim.length <= 2) {
      Swal.fire("Error", "Masukkan angka lanjutan NIM setelah awalan angkatan.", "error");
      return;
    }

    if (formData.role === "MAHASISWA" && !formData.nim.startsWith(formData.angkatan.slice(-2))) {
      Swal.fire("Error", "Dua angka awal NIM harus mengikuti angkatan.", "error");
      return;
    }

    if (formData.role === "MAHASISWA" && !formData.angkatan) {
      Swal.fire("Error", "Angkatan wajib diisi untuk role Mahasiswa.", "error");
      return;
    }

    if (formData.role === "MAHASISWA" && !formData.classGroupId) {
      Swal.fire("Error", "Program studi wajib dipilih untuk role Mahasiswa.", "error");
      return;
    }

    try {
      setLoading(true);

      if (editingId) {
        const res = await fetch(`/api/users/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            role: formData.role,
            nip: formData.role === "ADMIN" || formData.role === "DOSEN" ? formData.nip : undefined,
            nim: formData.role === "MAHASISWA" ? formData.nim : undefined,
            angkatan: formData.role === "MAHASISWA" ? Number(formData.angkatan) : undefined,
            programStudyId: formData.role === "MAHASISWA" ? formData.classGroupId : (formData.role === "DOSEN" && formData.dosenProgramStudyId ? formData.dosenProgramStudyId : undefined),
            classGroupId: formData.role === "MAHASISWA" ? formData.classGroupId : undefined,
            password: formData.password.trim() ? formData.password : undefined,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: "Failed to update user" }));
          throw new Error(errorData.error || "Failed to update user");
        }
        await fetchUsers();
        Swal.fire("Sukses", "Pengguna berhasil diperbarui.", "success");
      } else {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            role: formData.role,
            nip: formData.role === "ADMIN" || formData.role === "DOSEN" ? formData.nip : undefined,
            nim: formData.role === "MAHASISWA" ? formData.nim : undefined,
            angkatan: formData.role === "MAHASISWA" ? Number(formData.angkatan) : undefined,
            programStudyId: formData.role === "MAHASISWA" ? formData.classGroupId : (formData.role === "DOSEN" && formData.dosenProgramStudyId ? formData.dosenProgramStudyId : undefined),
            classGroupId: formData.role === "MAHASISWA" ? formData.classGroupId : undefined,
            password: formData.password,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: "Failed to create user" }));
          throw new Error(errorData.error || "Failed to create user");
        }
        await fetchUsers();
        Swal.fire("Sukses", "Pengguna berhasil ditambahkan.", "success");
      }

      resetForm();
    } catch (error) {
      console.error("Error:", error);
      Swal.fire("Error", error instanceof Error ? error.message : "Gagal menyimpan pengguna", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: UserItem) => {
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      nip: user.nip ?? "",
      nim: user.nim ?? "",
      angkatan: user.angkatan ? String(user.angkatan) : "",
      classGroupId: user.classGroupId ?? "",
      dosenProgramStudyId: "",
      status: user.status ?? "Aktif",
    });
    setEditingId(user.id);
    setShowForm(true);
  };

  const roleSpecificFields = formData.role === "MAHASISWA" ? (
    <div>
      <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 600 }}>Program Studi</label>
      <select
        name="classGroupId"
        value={formData.classGroupId}
        onChange={handleInputChange}
        style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}
      >
        <option value="">Pilih program studi</option>
        {programStudies.map((study) => (
          <option key={study.id} value={study.id}>{study.name} ({study.code})</option>
        ))}
      </select>
    </div>
  ) : formData.role === "DOSEN" ? (
    <div>
      <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 600 }}>Program Studi</label>
      <select
        name="dosenProgramStudyId"
        value={formData.dosenProgramStudyId}
        onChange={handleInputChange}
        style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}
      >
        <option value="">Pilih program studi</option>
        {programStudies.map((study) => (
          <option key={study.id} value={study.id}>{study.name} ({study.code})</option>
        ))}
      </select>
    </div>
  ) : null;

  const handleDelete = async (user: UserItem) => {
    const confirmed = await Swal.fire({
      title: "Konfirmasi",
      text: `Apakah Anda yakin ingin menghapus ${user.name}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
    });

    if (!confirmed.isConfirmed) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete user");
      await fetchUsers();
      Swal.fire("Sukses", "Pengguna berhasil dihapus.", "success");
    } catch (error) {
      console.error("Error:", error);
      Swal.fire("Error", "Gagal menghapus pengguna", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "white", borderRadius: 18, padding: 24, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0 }}>Pengelolaan Pengguna</h2>
          <div style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>{users.length} pengguna terdaftar</div>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(true)}
          style={{
            background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
            color: "white",
            border: "none",
            borderRadius: 12,
            padding: "10px 18px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          + Tambah Pengguna
        </button>
      </div>

      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, email, role, NIP, atau NIM"
              style={{
                width: "100%",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: "12px 14px",
                fontSize: 14,
                boxSizing: "border-box",
              }}
            />
          </div>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as RoleType | "")}
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: "12px 14px",
              fontSize: 14,
              boxSizing: "border-box",
              minWidth: 150,
            }}
          >
            <option value="">Semua Role</option>
            <option value="ADMIN">Admin</option>
            <option value="DOSEN">Dosen</option>
            <option value="MAHASISWA">Mahasiswa</option>
          </select>
        </div>
      </div>

      {showForm && (
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>{editingId ? "Edit Pengguna" : "Tambah Pengguna Baru"}</h3>
            <button type="button" onClick={resetForm} style={{ background: "transparent", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }}>
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Nama</label>
                <input name="name" value={formData.name} onChange={handleInputChange} style={inputStyle} />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Email</label>
                <input name="email" type="email" value={formData.email} onChange={handleInputChange} style={inputStyle} />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Password</label>
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  style={inputStyle}
                  placeholder={editingId ? "Kosongkan jika tidak ingin mengubah password" : "Masukkan password"}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Role</label>
                <select name="role" value={formData.role} onChange={handleInputChange} style={inputStyle}>
                  <option value="ADMIN">Admin</option>
                  <option value="DOSEN">Dosen</option>
                  <option value="MAHASISWA">Mahasiswa</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Status</label>
                <select name="status" value={formData.status} onChange={handleInputChange} style={inputStyle}>
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>

              {formData.role === "ADMIN" || formData.role === "DOSEN" ? (
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>NIP</label>
                  <input name="nip" value={formData.nip} onChange={handleInputChange} style={inputStyle} />
                </div>
              ) : null}

              {formData.role === "MAHASISWA" ? (
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Angkatan</label>
                  <select
                    name="angkatan"
                    value={formData.angkatan}
                    onChange={handleInputChange}
                    style={inputStyle}
                  >
                    <option value="">Pilih angkatan</option>
                    {Array.from({ length: 11 }, (_, index) => 2020 + index).map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              ) : null}

              {formData.role === "MAHASISWA" ? (
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>NIM</label>
                  <div style={{ display: "flex", alignItems: "center", border: "1px solid #cbd5e1", borderRadius: 10, overflow: "hidden", background: "white" }}>
                    <span style={{ padding: "10px 12px", background: "#f1f5f9", color: "#be185d", fontWeight: 800, borderRight: "1px solid #cbd5e1" }}>
                      {formData.angkatan ? formData.angkatan.slice(-2) : "--"}
                    </span>
                    <input
                      value={formData.angkatan ? formData.nim.slice(2) : ""}
                      onChange={handleNimSuffixChange}
                      inputMode="numeric"
                      placeholder="Nomor berikutnya"
                      disabled={!formData.angkatan}
                      style={{ ...inputStyle, border: "none", borderRadius: 0, flex: 1 }}
                    />
                  </div>
                  <div style={{ color: "#64748b", fontSize: 12, marginTop: 5 }}>Awalan NIM mengikuti dua angka terakhir angkatan.</div>
                </div>
              ) : null}

              {(formData.role === "MAHASISWA" || formData.role === "DOSEN") ? roleSpecificFields : null}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button type="button" onClick={resetForm} style={secondaryButtonStyle}>Batal</button>
              <button type="submit" style={primaryButtonStyle}>{editingId ? "Simpan Perubahan" : "Tambah Pengguna"}</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", color: "#334155" }}>
              <th style={thStyle}>Nama</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                <td style={tdStyle}>{user.name}</td>
                <td style={tdStyle}>{user.email}</td>
                <td style={tdStyle}>
                  <span style={{
                    display: "inline-block",
                    padding: "6px 10px",
                    borderRadius: 999,
                    background: user.role === "ADMIN" ? "#dbeafe" : user.role === "DOSEN" ? "#ede9fe" : "#fce7f3",
                    color: user.role === "ADMIN" ? "#1d4ed8" : user.role === "DOSEN" ? "#7c3aed" : "#be185d",
                    fontWeight: 700,
                    fontSize: 12,
                  }}>
                    {user.role}
                  </span>
                </td>
                <td style={tdStyle}>{user.nip ?? user.nim ?? "-"}</td>
                <td style={tdStyle}>
                  <span style={{
                    color: (user.status ?? "Aktif") === "Aktif" ? "#15803d" : "#b45309",
                    fontWeight: 700,
                  }}>
                    {user.status ?? "Aktif"}
                  </span>
                </td>
                <td style={tdStyle}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" onClick={() => setSelectedUserDetail(user)} style={smallButtonStyle}>Detail</button>
                    <button type="button" onClick={() => handleEdit(user)} style={smallButtonStyle}>Edit</button>
                    <button type="button" onClick={() => handleDelete(user)} style={{ ...smallButtonStyle, background: "#fee2e2", color: "#b91c1c" }}>Hapus</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div style={{ padding: "20px 0", textAlign: "center", color: "#64748b" }}>Tidak ada pengguna yang cocok dengan pencarian.</div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedUserDetail && (
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
            borderRadius: 16,
            padding: 32,
            maxWidth: 600,
            width: "90%",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            maxHeight: "80vh",
            overflowY: "auto"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ margin: 0 }}>Detail Pengguna</h3>
              <button
                type="button"
                onClick={() => setSelectedUserDetail(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 24,
                  cursor: "pointer",
                  color: "#64748b"
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: "grid", gap: 16 }}>
              <div style={detailFieldStyle}>
                <label style={{ color: "#64748b", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>Nama</label>
                <p style={{ margin: "6px 0 0 0", fontSize: 16, fontWeight: 600, color: "#0f172a" }}>{selectedUserDetail.name}</p>
              </div>

              <div style={detailFieldStyle}>
                <label style={{ color: "#64748b", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>Email</label>
                <p style={{ margin: "6px 0 0 0", fontSize: 16, fontWeight: 600, color: "#0f172a" }}>{selectedUserDetail.email}</p>
              </div>

              <div style={detailFieldStyle}>
                <label style={{ color: "#64748b", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>Role</label>
                <p style={{ margin: "6px 0 0 0" }}>
                  <span style={{
                    display: "inline-block",
                    padding: "6px 10px",
                    borderRadius: 999,
                    background: selectedUserDetail.role === "ADMIN" ? "#dbeafe" : selectedUserDetail.role === "DOSEN" ? "#ede9fe" : "#fce7f3",
                    color: selectedUserDetail.role === "ADMIN" ? "#1d4ed8" : selectedUserDetail.role === "DOSEN" ? "#7c3aed" : "#be185d",
                    fontWeight: 700,
                    fontSize: 12,
                  }}>
                    {selectedUserDetail.role}
                  </span>
                </p>
              </div>

              <div style={detailFieldStyle}>
                <label style={{ color: "#64748b", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>Status</label>
                <p style={{ margin: "6px 0 0 0", fontSize: 16, fontWeight: 600, color: (selectedUserDetail.status ?? "Aktif") === "Aktif" ? "#15803d" : "#b45309" }}>
                  {selectedUserDetail.status ?? "Aktif"}
                </p>
              </div>

              <div style={detailFieldStyle}>
                <label style={{ color: "#64748b", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>Password</label>
                <p style={{ margin: "6px 0 0 0", fontSize: 16, fontWeight: 600, color: selectedUserDetail.hasPassword ? "#15803d" : "#b45309" }}>
                  {selectedUserDetail.hasPassword ? selectedUserDetail.password : "Belum terdaftar"}
                </p>
              </div>

              {(selectedUserDetail.role === "ADMIN" || selectedUserDetail.role === "DOSEN") && selectedUserDetail.nip && (
                <div style={detailFieldStyle}>
                  <label style={{ color: "#64748b", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>NIP</label>
                  <p style={{ margin: "6px 0 0 0", fontSize: 16, fontWeight: 600, color: "#0f172a" }}>{selectedUserDetail.nip}</p>
                </div>
              )}

              {selectedUserDetail.role === "DOSEN" && selectedUserDetail.programStudy && (
                <div style={detailFieldStyle}>
                  <label style={{ color: "#64748b", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>Program Studi</label>
                  <p style={{ margin: "6px 0 0 0", fontSize: 16, fontWeight: 600, color: "#0f172a" }}>{selectedUserDetail.programStudy.name} ({selectedUserDetail.programStudy.code})</p>
                </div>
              )}

              {selectedUserDetail.role === "MAHASISWA" && (
                <>
                  {selectedUserDetail.nim && (
                    <div style={detailFieldStyle}>
                      <label style={{ color: "#64748b", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>NIM</label>
                      <p style={{ margin: "6px 0 0 0", fontSize: 16, fontWeight: 600, color: "#0f172a" }}>{selectedUserDetail.nim}</p>
                    </div>
                  )}

                  {selectedUserDetail.angkatan && (
                    <div style={detailFieldStyle}>
                      <label style={{ color: "#64748b", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>Angkatan</label>
                      <p style={{ margin: "6px 0 0 0", fontSize: 16, fontWeight: 600, color: "#0f172a" }}>{selectedUserDetail.angkatan}</p>
                    </div>
                  )}

                  {selectedUserDetail.classGroup && (
                    <div style={detailFieldStyle}>
                      <label style={{ color: "#64748b", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>Program Studi</label>
                      <p style={{ margin: "6px 0 0 0", fontSize: 16, fontWeight: 600, color: "#0f172a" }}>{selectedUserDetail.classGroup.programStudy?.name || "Tidak ada"}</p>
                    </div>
                  )}
                </>
              )}

              <div style={detailFieldStyle}>
                <label style={{ color: "#64748b", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>Tanggal Dibuat</label>
                <p style={{ margin: "6px 0 0 0", fontSize: 14, color: "#0f172a" }}>
                  {new Date(selectedUserDetail.createdAt).toLocaleDateString("id-ID", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
              <button
                type="button"
                onClick={() => setSelectedUserDetail(null)}
                style={secondaryButtonStyle}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
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
};

const primaryButtonStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
  color: "white",
  border: "none",
  borderRadius: 10,
  padding: "10px 16px",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  background: "#e2e8f0",
  color: "#0f172a",
  border: "none",
  borderRadius: 10,
  padding: "10px 16px",
  fontWeight: 700,
  cursor: "pointer",
};

const smallButtonStyle: React.CSSProperties = {
  background: "#dbeafe",
  color: "#1d4ed8",
  border: "none",
  borderRadius: 8,
  padding: "7px 10px",
  fontWeight: 700,
  cursor: "pointer",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px 10px",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 0.4,
};

const tdStyle: React.CSSProperties = {
  padding: "14px 10px",
  fontSize: 14,
  color: "#334155",
};

const detailFieldStyle: React.CSSProperties = {
  borderBottom: "1px solid #e2e8f0",
  paddingBottom: 12,
};
