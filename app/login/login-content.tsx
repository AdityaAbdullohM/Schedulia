"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useState } from "react";

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  DOSEN: "Dosen",
  MAHASISWA: "Mahasiswa",
};

const roleColors: Record<string, { primary: string; gradient: string; icon: string }> = {
  ADMIN: { primary: "#3b82f6", gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", icon: "👨‍💼" },
  DOSEN: { primary: "#8b5cf6", gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)", icon: "👨‍🏫" },
  MAHASISWA: { primary: "#ec4899", gradient: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)", icon: "👨‍🎓" },
};

export default function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const role = (params.get("role") ?? "ADMIN") as keyof typeof roleLabels;
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const roleConfig = roleColors[role] || roleColors.ADMIN;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.email) {
        setError(data?.error || "Email atau password tidak sesuai!");
        setIsLoading(false);
        return;
      }

      if (data.role !== role) {
        setError(`User ini terdaftar sebagai ${data.role}, bukan ${role}`);
        setIsLoading(false);
        return;
      }

      localStorage.setItem(
        "currentUser",
        JSON.stringify({
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role,
          nip: data.nip,
          nim: data.nim,
        })
      );

      router.push(`/dashboard?role=${role}&userId=${data.id}`);
    } catch (err) {
      setError("Terjadi kesalahan saat login");
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInDown {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .login-container {
          animation: slideInUp 0.8s ease-out;
        }
        .logo-section {
          animation: slideInDown 0.6s ease-out;
        }
        .role-badge {
          animation: float 3s ease-in-out infinite;
        }
        
        .input-field {
          position: relative;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .input-field:focus-within {
          transform: translateY(-2px);
        }
        
        .input-wrapper {
          position: relative;
          overflow: hidden;
          border-radius: 12px;
          border: 2px solid #e2e8f0;
          transition: all 0.3s ease;
        }
        .input-wrapper:focus-within {
          border-color: ${roleConfig.primary};
          box-shadow: 0 0 0 3px ${roleConfig.primary}20;
        }
        
        .input-wrapper::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: ${roleConfig.gradient};
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s ease;
        }
        .input-wrapper:focus-within::before {
          transform: scaleX(1);
        }
        
        input {
          width: 100%;
          border: none;
          padding: 14px 16px;
          font-size: 1rem;
          background: transparent;
          outline: none;
          transition: all 0.3s ease;
        }
        input::placeholder {
          color: #cbd5e1;
        }
        
        .input-label {
          display: block;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 8px;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }
        .input-field:focus-within .input-label {
          color: ${roleConfig.primary};
          font-weight: 700;
        }
        
        .password-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1.2rem;
          color: #94a3b8;
          transition: all 0.3s ease;
          padding: 4px 8px;
          border-radius: 6px;
        }
        .password-toggle:hover:not(:disabled) {
          background: #f1f5f9;
          color: ${roleConfig.primary};
        }
        
        .submit-button {
          width: 100%;
          border: none;
          background: ${roleConfig.gradient};
          color: white;
          padding: 14px 20px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 10px 30px ${roleConfig.primary}30;
        }
        .submit-button:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 15px 40px ${roleConfig.primary}40;
        }
        .submit-button:active:not(:disabled) {
          transform: translateY(-1px);
        }
        .submit-button:disabled {
          opacity: 0.8;
          cursor: not-allowed;
        }
        
        .loading-spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .role-selector {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          justify-content: center;
        }
        .role-option {
          padding: 8px 16px;
          border-radius: 20px;
          border: 2px solid #e2e8f0;
          background: white;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 600;
          font-size: 0.9rem;
          color: #64748b;
          text-decoration: none;
          display: inline-block;
        }
        .role-option.active {
          background: ${roleConfig.primary};
          border-color: ${roleConfig.primary};
          color: white;
          transform: scale(1.05);
        }
        .role-option:hover:not(.active) {
          border-color: #cbd5e1;
        }
        
        .background-orb {
          position: absolute;
          border-radius: 50%;
          opacity: 0.1;
          filter: blur(40px);
        }
        
        .error-message {
          background: #fee2e2;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 10px;
          border-left: 4px solid #dc2626;
          font-size: 0.9rem;
          animation: slideInDown 0.3s ease-out;
          margin-bottom: 20px;
        }
      `}</style>

      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
          padding: 24,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Animated background orbs */}
        <div
          className="background-orb"
          style={{
            position: "absolute",
            top: "-200px",
            right: "-200px",
            width: "600px",
            height: "600px",
            background: roleConfig.primary,
            animation: "float 8s ease-in-out infinite",
          }}
        />
        <div
          className="background-orb"
          style={{
            position: "absolute",
            bottom: "-300px",
            left: "-300px",
            width: "700px",
            height: "700px",
            background: roleConfig.primary,
            animation: "float 10s ease-in-out infinite",
            animationDelay: "2s",
          }}
        />

        {/* Login Card */}
        <div
          className="login-container"
          style={{
            width: "100%",
            maxWidth: 480,
            background: "white",
            borderRadius: 28,
            boxShadow: "0 25px 60px rgba(15, 23, 42, 0.12)",
            padding: 40,
            position: "relative",
            zIndex: 1,
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.8)",
          }}
        >
          {/* Logo & Title Section */}
          <div className="logo-section" style={{ textAlign: "center", marginBottom: 32 }}>
            <Image
              src="/schedulia-logo.svg"
              alt="Logo Schedulia"
              width={124}
              height={124}
              className="role-badge"
              style={{ width: 124, height: 124, objectFit: "contain", marginBottom: 10 }}
              priority
            />
            <p
              style={{
                color: roleConfig.primary,
                textTransform: "uppercase",
                letterSpacing: 2,
                fontWeight: 700,
                fontSize: 12,
                margin: "0 0 12px 0",
              }}
            >
              Schedulia
            </p>
            <h1
              style={{
                fontSize: "1.75rem",
                fontWeight: 800,
                margin: 0,
                marginBottom: 8,
                color: "#0f172a",
              }}
            >
              Masuk sebagai
            </h1>
            <p
              style={{
                fontSize: "1.25rem",
                color: roleConfig.primary,
                fontWeight: 700,
                margin: 0,
              }}
            >
              {roleLabels[role] ?? "Admin"}
            </p>
          </div>

          {/* Role Selector */}
          <div className="role-selector">
            {(Object.entries(roleLabels) as Array<[keyof typeof roleLabels, string]>).map(([r, label]) => (
              <a
                key={r}
                href={`/login?role=${r}`}
                className={`role-option ${r === role ? "active" : ""}`}
              >
                {label}
              </a>
            ))}
          </div>

          {/* Error Message */}
          {error && <div className="error-message">⚠️ {error}</div>}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 20 }}>
            {/* Email Field */}
            <div className="input-field">
              <label className="input-label">📧 Email Address</label>
              <div className="input-wrapper">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                   placeholder="Masukan email"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="input-field">
              <label className="input-label">🔐 Password</label>
              <div className="input-wrapper" style={{ display: "flex", alignItems: "center" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  style={{ flex: 1, paddingRight: 44 }}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                  disabled={isLoading}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="submit-button"
              disabled={isLoading}
              style={{ marginTop: 8 }}
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          {/* Remember & Forgot Section */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 20,
              fontSize: "0.9rem",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                color: "#64748b",
                transition: "color 0.3s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = roleConfig.primary)}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
            >
              <input type="checkbox" style={{ cursor: "pointer" }} />
              Ingat saya
            </label>
            <a
              href="#"
              style={{
                color: roleConfig.primary,
                textDecoration: "none",
                fontWeight: 600,
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
            >
              Lupa password?
            </a>
          </div>

          {/* Divider */}
          <div
            style={{
              margin: "24px 0",
              height: "1px",
              background: "linear-gradient(90deg, transparent 0%, #e2e8f0 50%, transparent 100%)",
            }}
          />

          {/* Footer Info */}
          <p
            style={{
              textAlign: "center",
              fontSize: "0.85rem",
              color: "#94a3b8",
              margin: 0,
            }}
          >
            🔒 Data Anda dilindungi dengan enkripsi end-to-end
          </p>
        </div>
      </main>
    </>
  );
}
