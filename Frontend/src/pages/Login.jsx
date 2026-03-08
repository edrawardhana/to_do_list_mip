// src/pages/Login.jsx

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

// ─────────────────────────────────────────────────────────────────────────────
// DUMMY CREDENTIALS (hapus/comment blok ini saat mau connect ke backend)
// email    : pegawai@mcc.com
// password : pegawai123
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN TERHUBUNG KE BACKEND
// • pastikan file .env (di root Frontend) berisi
//     VITE_API_URL=http://localhost:8000/api
//   (sesuaikan port/backend address). 
// • AuthContext.login sudah menggunakan fetch ke
//   `${import.meta.env.VITE_API_URL}/auth/login`.
//   hasilnya akan disimpan ke localStorage dan response /auth/me
//   diambil untuk mengisi data user.
// • handleSubmit tidak perlu diubah; ia memanggil login()
//   dari context dan menavigasi jika success.
// ─────────────────────────────────────────────────────────────────────────────

/* Floating particle */
function Particle({ style }) {
  return <span className="particle" style={style} aria-hidden />;
}

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  size: Math.random() * 5 + 2,
  left: `${Math.random() * 100}%`,
  animDelay: `${Math.random() * 8}s`,
  animDuration: `${Math.random() * 10 + 8}s`,
  opacity: Math.random() * 0.25 + 0.05,
}));

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // example modeled after registration snippet
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/login`,
        { email, password },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      const token = response.data.access_token || response.data.token;
      if (token) {
        localStorage.setItem("token", token);
        // optionally update context user via login()
        await login(email, password);
        navigate("/");
      } else {
        setError("Token tidak ditemukan di respons");
      }
    } catch (err) {
      if (err.response && err.response.status === 422) {
        // validation errors from backend
        const msgs = Object.values(err.response.data).flat().join(" ");
        setError(msgs || "Data tidak valid");
      } else if (err.response) {
        setError(err.response.data.error || err.response.data.message || "Login gagal");
      } else {
        setError(err.message || "Terjadi kesalahan");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Outfit:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --navy:     #0b1a3d;
          --blue-mid: #0f2d6b;
          --blue-glow:#1a5cff;
          --accent:   #f5c842;
          --sky:      #4db6f7;
          --white:    #ffffff;
          --glass:    rgba(255,255,255,0.045);
          --border:   rgba(255,255,255,0.10);
          --text-dim: rgba(255,255,255,0.45);
        }

        body { font-family: 'Outfit', sans-serif; }

        /* ── Page ── */
        .page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(ellipse 80% 70% at 50% -10%, #1a4ccc 0%, #0b1a3d 60%, #060e22 100%);
          overflow: hidden;
          position: relative;
        }

        /* ── Grid overlay ── */
        .page::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        /* ── Glow orbs ── */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          pointer-events: none;
        }
        .orb-1 {
          width: 520px; height: 520px;
          background: radial-gradient(circle, rgba(26,92,255,0.35) 0%, transparent 70%);
          top: -120px; left: -100px;
        }
        .orb-2 {
          width: 380px; height: 380px;
          background: radial-gradient(circle, rgba(77,182,247,0.2) 0%, transparent 70%);
          bottom: -80px; right: -80px;
        }
        .orb-3 {
          width: 200px; height: 200px;
          background: radial-gradient(circle, rgba(245,200,66,0.12) 0%, transparent 70%);
          top: 40%; left: 60%;
        }

        /* ── Particles ── */
        .particle {
          position: absolute;
          border-radius: 50%;
          background: rgba(255,255,255,0.6);
          animation: floatUp linear infinite;
        }
        @keyframes floatUp {
          0%   { transform: translateY(100vh) scale(0); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(-20vh) scale(1); opacity: 0; }
        }

        /* ── Card ── */
        .card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 420px;
          margin: 1rem;
          background: rgba(11, 26, 61, 0.75);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid var(--border);
          border-radius: 28px;
          padding: 2.5rem 2.25rem 2rem;
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.04) inset,
            0 32px 80px rgba(0,0,0,0.55),
            0 0 60px rgba(26,92,255,0.12);
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.7s cubic-bezier(.22,1,.36,1), transform 0.7s cubic-bezier(.22,1,.36,1);
        }
        .card.visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* ── Top stripe ── */
        .card::before {
          content: '';
          position: absolute;
          top: 0; left: 10%; right: 10%;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--blue-glow), var(--sky), transparent);
          border-radius: 0 0 4px 4px;
        }

        /* ── Heading ── */
        .brand {
          text-align: center;
          margin-bottom: 2rem;
        }
        .brand-mip {
          font-family: 'Caveat', cursive;
          font-size: 2.6rem;
          color: var(--accent);
          line-height: 1;
          letter-spacing: -0.5px;
          text-shadow: 0 0 30px rgba(245,200,66,0.45);
        }
        .brand-activity {
          font-size: 1.65rem;
          font-weight: 700;
          color: var(--white);
          letter-spacing: -0.5px;
          margin-top: -4px;
        }
        .brand-sub {
          font-size: 0.78rem;
          color: var(--text-dim);
          margin-top: 6px;
          font-weight: 300;
          letter-spacing: 0.5px;
        }

        /* ── Divider ── */
        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--border), transparent);
          margin-bottom: 1.75rem;
        }

        /* ── Error ── */
        .error-box {
          background: rgba(255,80,80,0.1);
          border: 1px solid rgba(255,80,80,0.3);
          color: #ff9090;
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 0.82rem;
          margin-bottom: 1.1rem;
          display: flex;
          align-items: center;
          gap: 8px;
          animation: shake 0.35s ease;
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          25%      { transform: translateX(-5px); }
          75%      { transform: translateX(5px); }
        }

        /* ── Field ── */
        .field { margin-bottom: 1.1rem; }
        .field label {
          display: block;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: var(--text-dim);
          margin-bottom: 8px;
          padding-left: 2px;
        }
        .input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-icon {
          position: absolute;
          left: 14px;
          color: var(--text-dim);
          pointer-events: none;
          font-size: 0.85rem;
          transition: color 0.2s;
        }
        .input-wrap:focus-within .input-icon { color: var(--sky); }

        .field input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border);
          border-radius: 14px;
          color: var(--white);
          font-family: 'Outfit', sans-serif;
          font-size: 0.93rem;
          padding: 13px 44px 13px 40px;
          outline: none;
          transition: border-color 0.25s, background 0.25s, box-shadow 0.25s;
        }
        .field input::placeholder { color: rgba(255,255,255,0.2); }
        .field input:focus {
          border-color: rgba(77,182,247,0.55);
          background: rgba(255,255,255,0.08);
          box-shadow: 0 0 0 3px rgba(77,182,247,0.1);
        }

        .toggle-pass {
          position: absolute;
          right: 14px;
          background: none;
          border: none;
          color: var(--text-dim);
          cursor: pointer;
          font-size: 0.85rem;
          padding: 4px;
          transition: color 0.2s;
        }
        .toggle-pass:hover { color: var(--sky); }

        /* underline accent on focused field */
        .field input:focus + .field-line { width: 100%; }
        .field-line {
          height: 1px;
          background: linear-gradient(90deg, var(--blue-glow), var(--sky));
          width: 0%;
          transition: width 0.35s ease;
          border-radius: 0 0 14px 14px;
          margin-top: -1px;
        }

        /* ── Button ── */
        .btn-login {
          width: 100%;
          padding: 14px;
          margin-top: 0.5rem;
          background: linear-gradient(135deg, #1a5cff 0%, #4db6f7 100%);
          color: var(--white);
          font-family: 'Outfit', sans-serif;
          font-size: 0.95rem;
          font-weight: 600;
          border: none;
          border-radius: 14px;
          cursor: pointer;
          letter-spacing: 0.3px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 28px rgba(26,92,255,0.4);
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .btn-login::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.12), transparent);
          pointer-events: none;
        }
        .btn-login:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 36px rgba(26,92,255,0.55);
        }
        .btn-login:active:not(:disabled) { transform: translateY(0); }
        .btn-login:disabled { opacity: 0.65; cursor: not-allowed; }

        .spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Footer ── */
        .register-link { text-align: center; font-size: 0.8rem; color: var(--text-dim); margin-top: 1.25rem; }
        .register-link a { color: var(--sky); text-decoration: none; font-weight: 600; transition: color 0.2s; }
        .register-link a:hover { color: var(--white); }

        .footer {
          text-align: center;
          font-size: 0.72rem;
          color: rgba(255,255,255,0.2);
          margin-top: 1rem;
          letter-spacing: 0.3px;
        }
        .footer span { color: rgba(255,255,255,0.35); }
      `}</style>

      <div className="page">
        {/* Orbs */}
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />

        {/* Particles */}
        {PARTICLES.map((p) => (
          <Particle
            key={p.id}
            style={{
              width: p.size,
              height: p.size,
              left: p.left,
              bottom: "-10px",
              opacity: p.opacity,
              animationDelay: p.animDelay,
              animationDuration: p.animDuration,
            }}
          />
        ))}

        {/* Card */}
        <div className={`card${mounted ? " visible" : ""}`}>
          {/* Brand */}
          <div className="brand">
            <div className="brand-mip">Mip</div>
            <div className="brand-activity">activity!</div>
            <div className="brand-sub">Masuk untuk melanjutkan</div>
          </div>

          <div className="divider" />

          {/* Form */}
          <form onSubmit={handleSubmit} autoComplete="off">
            {error && (
              <div className="error-box">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            {/* Username */}
            <div className="field">
              <label htmlFor="email">Email</label>
              <div className="input-wrap">
                <svg className="input-icon" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="pegawai@mcc.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="input-wrap">
                <svg className="input-icon" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="toggle-pass"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPass ? (
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-login" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="spinner" />
                  Memproses...
                </>
              ) : (
                <>
                  Masuk
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="register-link">
            Belum punya akun? <Link to="/register">Daftar di sini</Link>
          </div>

          <p className="footer">
            &copy; 2025 <span>Mip Activity</span>. All rights reserved.
          </p>
        </div>
      </div>
    </>
  );
}
