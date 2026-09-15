"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";

interface Room {
  id: string;
  name: string;
  capacity: number;
  createdAt: string;
  _count?: { schedules: number };
}

interface FormData {
  name: string;
  capacity: string;
}

const initialFormData: FormData = {
  name: "",
  capacity: ""
};

export default function RoomsManager() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/classrooms");
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal mengambil data ruangan");
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setRooms(data);
      } else {
        console.warn("API returned non-array data:", data);
        setRooms([]);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
      setRooms([]);
      Swal.fire("Error", error instanceof Error ? error.message : "Gagal mengambil data ruangan", "error");
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

    if (!formData.name || !formData.capacity) {
      Swal.fire("Error", "Semua field harus diisi", "error");
      return;
    }

    try {
      setLoading(true);
      const url = editingId ? `/api/classrooms/${editingId}` : "/api/classrooms";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save room");
      }

      await fetchRooms();
      setShowForm(false);
      setEditingId(null);
      setFormData(initialFormData);

      const message = editingId ? "Ruangan berhasil diperbarui" : "Ruangan berhasil ditambahkan";
      Swal.fire("Sukses", message, "success");
    } catch (error) {
      console.error("Error saving room:", error);
      Swal.fire("Error", error instanceof Error ? error.message : "Gagal menyimpan ruangan", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (room: Room) => {
    setFormData({
      name: room.name,
      capacity: String(room.capacity)
    });
    setEditingId(room.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Konfirmasi",
      text: "Apakah Anda yakin ingin menghapus ruangan ini?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal"
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/classrooms/${id}`, { method: "DELETE" });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete room");
      }

      await fetchRooms();
      Swal.fire("Sukses", "Ruangan berhasil dihapus", "success");
    } catch (error) {
      console.error("Error deleting room:", error);
      Swal.fire("Error", error instanceof Error ? error.message : "Gagal menghapus ruangan", "error");
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
        <h2>Manajemen Ruangan</h2>
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
          + Tambah Ruangan
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
              {editingId ? "Edit Ruangan" : "Tambah Ruangan Baru"}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 600 }}>
                  Nama Ruangan
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Contoh: Ruang A101"
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
                  Kapasitas
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  placeholder="Contoh: 40"
                  min="1"
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

      {/* Rooms Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 14
        }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
              <th style={{ padding: 12, textAlign: "left", fontWeight: 600 }}>Nama Ruangan</th>
              <th style={{ padding: 12, textAlign: "center", fontWeight: 600 }}>Kapasitas</th>
              <th style={{ padding: 12, textAlign: "center", fontWeight: 600 }}>Jadwal</th>
              <th style={{ padding: 12, textAlign: "center", fontWeight: 600 }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rooms.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>
                  Belum ada ruangan
                </td>
              </tr>
            ) : (
              rooms.map(room => (
                <tr key={room.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: 12, fontWeight: 600, color: "#2563eb" }}>{room.name}</td>
                  <td style={{ padding: 12, textAlign: "center" }}>{room.capacity} orang</td>
                  <td style={{ padding: 12, textAlign: "center", color: "#64748b" }}>
                    {room._count?.schedules || 0}
                  </td>
                  <td style={{ padding: 12, textAlign: "center" }}>
                    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                      <button
                        onClick={() => handleEdit(room)}
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
                        onClick={() => handleDelete(room.id)}
                        disabled={loading || (room._count?.schedules || 0) > 0}
                        title={room._count && room._count.schedules > 0 ? "Tidak bisa dihapus (ada jadwal)" : ""}
                        style={{
                          background: "#ef4444",
                          color: "white",
                          border: "none",
                          borderRadius: 6,
                          padding: "6px 12px",
                          cursor: (loading || (room._count?.schedules || 0) > 0) ? "not-allowed" : "pointer",
                          fontSize: 12,
                          fontWeight: 600,
                          opacity: (loading || (room._count?.schedules || 0) > 0) ? 0.5 : 1
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
