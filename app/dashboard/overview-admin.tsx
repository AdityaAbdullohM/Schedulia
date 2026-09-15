"use client";

import { useState } from "react";

interface OverviewData {
  stats: Array<{ label: string; value: string | number }>;
  schedules: Array<{
    day: string;
    time: string;
    course: string;
    room: string;
    lecturer?: string;
    students?: string;
  }>;
  alerts: string[];
  metrics: Array<{ title: string; value: string; accent: string }>;
}

export default function OverviewAdmin({ data }: { data: OverviewData }) {
  const [hoveredStat, setHoveredStat] = useState<string | null>(null);
  const [expandedAlert, setExpandedAlert] = useState<number | null>(null);

  const statIcons: Record<string, string> = {
    "Mata Kuliah": "📚",
    "Pengguna": "👥",
    "Jadwal": "🗓️",
    "Ruangan": "🏫",
    "Dosen": "👨‍🎓",
    "Mahasiswa": "👨‍🎓",
  };

  const alertIcons: Record<number, string> = {
    0: "⚠️",
    1: "🔔",
    2: "⏰",
  };

  const getStatIcon = (label: string): string => {
    for (const [key, icon] of Object.entries(statIcons)) {
      if (label.includes(key)) return icon;
    }
    return "📊";
  };

  return (
    <div style={{ display: "grid", gap: 32 }}>
      {/* Header Section */}
      <div style={{ display: "grid", gap: 8 }}>
        <h1 style={{ margin: 0, fontSize: "2.5rem", fontWeight: 900, color: "#0f172a" }}>
          Dashboard Admin
        </h1>
        <p style={{ margin: 0, color: "#64748b", fontSize: 16 }}>
          Selamat datang kembali! Berikut kondisi sistem Schedulia Anda.
        </p>
      </div>

      {/* Stats Cards - Modern Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 20,
        }}
      >
        {data.stats.map((item, index) => (
          <div
            key={item.label}
            onMouseEnter={() => setHoveredStat(item.label)}
            onMouseLeave={() => setHoveredStat(null)}
            style={{
              background:
                hoveredStat === item.label
                  ? "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)"
                  : "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
              borderRadius: 20,
              padding: 24,
              boxShadow:
                hoveredStat === item.label
                  ? "0 20px 40px rgba(37, 99, 235, 0.2)"
                  : "0 8px 24px rgba(15, 23, 42, 0.05)",
              border: hoveredStat === item.label ? "none" : "1px solid #e2e8f0",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              cursor: "pointer",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Background decoration */}
            <div
              style={{
                position: "absolute",
                top: -10,
                right: -10,
                fontSize: "80px",
                opacity: hoveredStat === item.label ? 0.15 : 0.05,
                transition: "opacity 0.3s",
              }}
            >
              {getStatIcon(item.label)}
            </div>

            <div style={{ position: "relative", zIndex: 2 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <span style={{ fontSize: 28 }}>
                  {getStatIcon(item.label)}
                </span>
                <div
                  style={{
                    color: hoveredStat === item.label ? "#e0e7ff" : "#64748b",
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: 0.5,
                  }}
                >
                  {item.label}
                </div>
              </div>
              <div
                style={{
                  fontSize: "2.5rem",
                  fontWeight: 900,
                  color: hoveredStat === item.label ? "#fff" : "#0f172a",
                  lineHeight: 1,
                }}
              >
                {item.value}
              </div>
              <div
                style={{
                  marginTop: 12,
                  height: 3,
                  borderRadius: 3,
                  background:
                    hoveredStat === item.label
                      ? "rgba(255, 255, 255, 0.3)"
                      : "#e2e8f0",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: "70%",
                    background: "#2563eb",
                    borderRadius: 3,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: 24 }}>
        {/* Schedules Section */}
        <div
          style={{
            background: "white",
            borderRadius: 24,
            padding: 28,
            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 24,
            }}
          >
            <span style={{ fontSize: 28 }}>📅</span>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>
                Jadwal Terbaru
              </h2>
              <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: 13 }}>
                {data.schedules.length} jadwal aktif
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {data.schedules.length === 0 ? (
              <div
                style={{
                  padding: 40,
                  textAlign: "center",
                  color: "#94a3b8",
                  borderRadius: 16,
                  background: "#f8fafc",
                  border: "2px dashed #e2e8f0",
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                <div>Tidak ada jadwal untuk ditampilkan</div>
              </div>
            ) : (
              data.schedules.map((schedule, index) => (
                <div
                  key={`${schedule.day}-${index}`}
                  style={{
                    background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                    borderRadius: 16,
                    padding: 18,
                    border: "1px solid #e2e8f0",
                    transition: "all 0.2s",
                    cursor: "pointer",
                    display: "grid",
                    gap: 12,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)";
                    (e.currentTarget as HTMLElement).style.borderColor = "#2563eb";
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      "0 8px 16px rgba(37, 99, 235, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)";
                    (e.currentTarget as HTMLElement).style.borderColor =
                      "#e2e8f0";
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start",
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 15,
                          color: "#0f172a",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "#10b981",
                          }}
                        />
                        {schedule.day}
                      </div>
                      <div
                        style={{
                          marginTop: 6,
                          color: "#0f172a",
                          fontWeight: 600,
                          fontSize: 14,
                        }}
                      >
                        {schedule.course}
                      </div>
                    </div>
                    <div
                      style={{
                        background: "#2563eb",
                        color: "white",
                        padding: "6px 12px",
                        borderRadius: 8,
                        fontWeight: 700,
                        fontSize: 12,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {schedule.time}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                      fontSize: 13,
                      color: "#64748b",
                    }}
                  >
                    <div>🏫 {schedule.room}</div>
                    {schedule.lecturer && <div>👨‍🏫 {schedule.lecturer}</div>}
                  </div>

                  {schedule.students && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        background: "rgba(37, 99, 235, 0.1)",
                        padding: "6px 10px",
                        borderRadius: 6,
                        display: "inline-block",
                        width: "fit-content",
                      }}
                    >
                      👥 {schedule.students}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: "grid", gap: 24, gridAutoRows: "max-content" }}>
          {/* Alerts Section */}
          <div
            style={{
              background: "white",
              borderRadius: 24,
              padding: 24,
              boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
              border: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <span style={{ fontSize: 24 }}>⚠️</span>
              <h3
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                Peringatan
              </h3>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {data.alerts.length === 0 ? (
                <div
                  style={{
                    padding: 16,
                    textAlign: "center",
                    color: "#10b981",
                    background: "#f0fdf4",
                    borderRadius: 12,
                    border: "1px solid #d1fae5",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  ✓ Semua baik-baik saja
                </div>
              ) : (
                data.alerts.map((alert, index) => (
                  <div
                    key={alert}
                    onClick={() =>
                      setExpandedAlert(
                        expandedAlert === index ? null : index
                      )
                    }
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      border: "1px solid #fee2e2",
                      background: "#fef2f2",
                      color: "#991b1b",
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "start",
                      gap: 8,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        "#fee2e2";
                      (e.currentTarget as HTMLElement).style.borderColor =
                        "#fca5a5";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        "#fef2f2";
                      (e.currentTarget as HTMLElement).style.borderColor =
                        "#fee2e2";
                    }}
                  >
                    <span style={{ marginTop: 2, lineHeight: 1 }}>
                      {alertIcons[index] || "ℹ️"}
                    </span>
                    <span>{alert}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Metrics Section */}
          <div
            style={{
              background: "white",
              borderRadius: 24,
              padding: 24,
              boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
              border: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <span style={{ fontSize: 24 }}>📊</span>
              <h3
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                Metrik Sistem
              </h3>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {data.metrics.map((metric) => (
                <div
                  key={metric.title}
                  style={{
                    display: "grid",
                    gap: 8,
                    padding: 12,
                    borderRadius: 12,
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        fontWeight: 600,
                      }}
                    >
                      {metric.title}
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: metric.accent,
                      }}
                    >
                      {metric.value}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 4,
                      background: "#e2e8f0",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: "75%",
                        background: metric.accent,
                        borderRadius: 2,
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div
        style={{
          background: "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)",
          borderRadius: 24,
          padding: 32,
          color: "white",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 32,
        }}
      >
        <div>
          <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 8 }}>
            Total Jadwal Aktif
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900 }}>
            {data.schedules.length}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 8 }}>
            Sistem Status
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>
            🟢 Operational
          </div>
        </div>
        <div>
          <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 8 }}>
            Keandalan Sistem
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>99.9%</div>
        </div>
      </div>
    </div>
  );
}
