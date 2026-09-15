import Link from "next/link";

const roles = [
  {
    name: "Admin",
    icon: "👨‍💼",
    description: "Mengelola jadwal, ruangan, dosen, dan validasi sistem secara menyeluruh.",
    href: "/login?role=ADMIN",
    color: "#3b82f6",
    bgGradient: "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)",
    features: ["Dashboard Analytics", "Manajemen Pengguna", "Validasi Jadwal"],
  },
  {
    name: "Dosen",
    icon: "👨‍🏫",
    description: "Melihat jadwal mengajar, absensi, dan data kelas yang diampu.",
    href: "/login?role=DOSEN",
    color: "#8b5cf6",
    bgGradient: "linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)",
    features: ["Jadwal Mengajar", "Absensi Kelas", "Nilai Mahasiswa"],
  },
  {
    name: "Mahasiswa",
    icon: "👨‍🎓",
    description: "Mengecek jadwal kuliah, KRS, dan aktivitas akademik per semester.",
    href: "/login?role=MAHASISWA",
    color: "#ec4899",
    bgGradient: "linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(236, 72, 153, 0.05) 100%)",
    features: ["Jadwal Kuliah", "KRS Online", "Tracking Akademik"],
  },
];

export default function HomePage() {
  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(37, 99, 235, 0.3); }
          50% { box-shadow: 0 0 40px rgba(37, 99, 235, 0.6); }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInDown {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .hero-section {
          animation: slideInDown 0.8s ease-out;
        }
        .role-card {
          animation: slideInUp 0.8s ease-out;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .role-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
        }
        .role-icon {
          display: inline-block;
          animation: float 3s ease-in-out infinite;
          font-size: 3rem;
          margin-bottom: 12px;
        }
        .cta-button {
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        .cta-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.2);
          transition: left 0.3s ease;
          border-radius: 999px;
        }
        .cta-button:hover::before {
          left: 100%;
        }
        .feature-badge {
          display: inline-block;
          font-size: 0.75rem;
          padding: 4px 8px;
          border-radius: 6px;
          margin-right: 6px;
          margin-bottom: 6px;
          opacity: 0;
          animation: slideInUp 0.6s ease-out forwards;
        }
        .header-button {
          position: relative;
          overflow: hidden;
        }
        .header-button:hover {
          box-shadow: 0 15px 35px rgba(37, 99, 235, 0.4);
          transform: translateY(-3px);
        }
        .header-button::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          transform: translate(-50%, -50%);
          animation: ripple 0.6s ease-out;
        }
        .header-button:active::after {
          animation: ripple 0.6s ease-out;
        }
        @keyframes ripple {
          to {
            width: 300px;
            height: 300px;
            opacity: 0;
          }
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 20px;
          margin: 40px 0;
        }
        .stat-item {
          text-align: center;
          animation: slideInUp 0.8s ease-out;
        }
        .stat-number {
          font-size: 2rem;
          font-weight: 800;
          color: #2563eb;
        }
        .stat-label {
          font-size: 0.875rem;
          color: #94a3b8;
          margin-top: 8px;
        }
      `}</style>

      <main style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f766e 100%)", color: "#f8fafc", padding: "40px 24px", position: "relative", overflow: "hidden" }}>
        {/* Animated background elements */}
        <div style={{ position: "absolute", top: "-100px", right: "-100px", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(37, 99, 235, 0.1) 0%, transparent 70%)", borderRadius: "50%", animation: "float 6s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "-50px", left: "-100px", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)", borderRadius: "50%", animation: "float 8s ease-in-out infinite" }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>
          {/* Header */}
          <div className="hero-section" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 60, gap: 24, flexWrap: "wrap" }}>
            <div>
              <p style={{ fontSize: 14, letterSpacing: 3, textTransform: "uppercase", color: "#2563eb", marginBottom: 12, fontWeight: 700 }}>✨ Schedulia Platform</p>
              <h1 style={{ fontSize: "clamp(2.2rem, 6vw, 4.5rem)", lineHeight: 1.1, margin: 0, marginBottom: 16, fontWeight: 900, background: "linear-gradient(135deg, #fff 0%, #93c5fd 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Penjadwalan Mata Kuliah Modern
              </h1>
              <p style={{ fontSize: "1.125rem", color: "#cbd5e1", maxWidth: 500, lineHeight: 1.8, margin: 0 }}>Solusi terintegrasi untuk mengelola jadwal akademik dengan efisien dan transparan</p>
            </div>
            <Link href="/login?role=ADMIN" className="header-button cta-button" style={{ background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)", color: "white", textDecoration: "none", borderRadius: 16, padding: "14px 28px", fontWeight: 700, fontSize: "1rem", whiteSpace: "nowrap", boxShadow: "0 10px 30px rgba(37, 99, 235, 0.3)", border: "1px solid rgba(255, 255, 255, 0.2)" }}>
              Masuk Sekarang →
            </Link>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">3</div>
              <div className="stat-label">Role Akses</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">∞</div>
              <div className="stat-label">Skalabilitas</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Ketersediaan</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">✓</div>
              <div className="stat-label">Real-time Sync</div>
            </div>
          </div>

          {/* Role Cards */}
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 28, marginTop: 48 }}>
            {roles.map((role, idx) => (
              <div
                key={role.name}
                className="role-card"
                style={{
                  background: role.bgGradient,
                  border: `2px solid ${role.color}`,
                  borderRadius: 24,
                  padding: 32,
                  backdropFilter: "blur(10px)",
                  animationDelay: `${idx * 0.1}s`,
                }}
              >
                <div className="role-icon">{role.icon}</div>
                <h3 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 12px 0", color: "#fff" }}>{role.name}</h3>
                <p style={{ color: "#cbd5e1", lineHeight: 1.8, marginBottom: 20, fontSize: "0.95rem" }}>{role.description}</p>

                {/* Features */}
                <div style={{ marginBottom: 24 }}>
                  {role.features.map((feature, i) => (
                    <span
                      key={feature}
                      className="feature-badge"
                      style={{
                        background: `${role.color}20`,
                        color: role.color,
                        animationDelay: `${0.1 + i * 0.1}s`,
                      }}
                    >
                      ✓ {feature}
                    </span>
                  ))}
                </div>

                <Link
                  href={role.href}
                  className="cta-button"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: role.color,
                    color: "white",
                    textDecoration: "none",
                    padding: "12px 24px",
                    borderRadius: 12,
                    fontWeight: 700,
                    width: "100%",
                    fontSize: "0.95rem",
                    border: "none",
                    transition: "all 0.3s ease",
                    boxShadow: `0 10px 25px ${role.color}40`,
                  }}
                >
                  Akses Sekarang
                </Link>
              </div>
            ))}
          </section>

          {/* Footer Info */}
          <div style={{ textAlign: "center", marginTop: 60, paddingTop: 40, borderTop: "1px solid rgba(148, 163, 184, 0.2)" }}>
            <p style={{ color: "#64748b", fontSize: "0.9rem", margin: 0 }}>
              🔐 Sistem kami menggunakan enkripsi end-to-end dan keamanan enterprise-grade
            </p>
            <p style={{ color: "#475569", fontSize: "0.8rem", marginTop: 12, margin: 0 }}>
              © 2026 Schedulia. Dibangun dengan ❤️ untuk akademik yang lebih baik.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
