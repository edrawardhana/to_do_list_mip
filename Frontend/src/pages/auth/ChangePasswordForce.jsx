import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

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

export default function ChangePasswordForce() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      return toast.error("Password baru minimal 6 karakter!");
    }

    if (newPassword !== confirmPassword) {
      return toast.error("Konfirmasi password baru tidak cocok!");
    }

    setIsLoading(true);
    const loadId = toast.loading("Sedang memperbarui password Anda...");

    try {
      const response = await api.put("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });

      if (response.data.status === "success") {
        toast.success("Password berhasil diperbarui! Selamat datang.", { id: loadId });
        
        // Perbarui data user di AuthContext
        const token = localStorage.getItem("jwt_token");
        const updatedUser = { ...user, needs_password_change: false };
        login(token, updatedUser);

        // Arahkan ke dashboard
        navigate("/dashboard");
      } else {
        toast.error(response.data.message || "Gagal memperbarui password.", { id: loadId });
      }
    } catch (err) {
      let errorMsg = "Gagal memperbarui password.";
      if (err.response && err.response.data && err.response.data.message) {
        errorMsg = err.response.data.message;
      }
      toast.error(errorMsg, { id: loadId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght=700&family=Outfit:wght=300;400;500;600;700&display=swap');
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

        .page {
          min-height: 100vh; display: flex; align-items: center; justify-content: center;
          background: radial-gradient(ellipse 80% 70% at 50% -10%, #1a4ccc 0%, #0b1a3d 60%, #060e22 100%);
          overflow: hidden; position: relative;
        }
        .page::before {
          content: ''; position: absolute; inset: 0;
          background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 48px 48px; pointer-events: none;
        }
        .orb { position: absolute; border-radius: 50%; filter: blur(90px); pointer-events: none; }
        .orb-1 { width: 520px; height: 520px; background: radial-gradient(circle, rgba(26,92,255,0.35) 0%, transparent 70%); top: -120px; left: -100px; }
        .orb-2 { width: 380px; height: 380px; background: radial-gradient(circle, rgba(77,182,247,0.2) 0%, transparent 70%); bottom: -80px; right: -80px; }
        .orb-3 { width: 200px; height: 200px; background: radial-gradient(circle, rgba(245,200,66,0.12) 0%, transparent 70%); top: 40%; left: 60%; }
        .particle { position: absolute; border-radius: 50%; background: rgba(255,255,255,0.6); animation: floatUp linear infinite; }
        @keyframes floatUp {
          0%   { transform: translateY(100vh) scale(0); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(-20vh) scale(1); opacity: 0; }
        }
        .card {
          position: relative; z-index: 10; width: 100%; max-width: 420px; margin: 1rem;
          background: rgba(11, 26, 61, 0.75); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border: 1px solid var(--border); border-radius: 28px; padding: 2.5rem 2.25rem 2rem;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.04) inset, 0 32px 80px rgba(0,0,0,0.55), 0 0 60px rgba(26,92,255,0.12);
          opacity: 0; transform: translateY(28px); transition: all 0.7s cubic-bezier(.22,1,.36,1);
        }
        .card.visible { opacity: 1; transform: translateY(0); }
        .card::before {
          content: ''; position: absolute; top: 0; left: 10%; right: 10%; height: 2px;
          background: linear-gradient(90deg, transparent, var(--blue-glow), var(--sky), transparent);
        }
        .brand { text-align: center; margin-bottom: 2rem; }
        .brand-mip { font-family: 'Caveat', cursive; font-size: 2.6rem; color: var(--accent); line-height: 1; text-shadow: 0 0 30px rgba(245,200,66,0.45); }
        .brand-activity { font-size: 1.65rem; font-weight: 700; color: var(--white); margin-top: -4px; }
        .brand-sub { font-size: 0.78rem; color: var(--text-dim); margin-top: 8px; font-weight: 300; line-height: 1.5; padding: 0 8px; }
        .divider { height: 1px; background: linear-gradient(90deg, transparent, var(--border), transparent); margin-bottom: 1.75rem; }
        .field { margin-bottom: 1.1rem; }
        .field label { display: block; font-size: 0.7rem; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: var(--text-dim); margin-bottom: 8px; }
        .input-wrap { position: relative; display: flex; align-items: center; }
        .input-icon { position: absolute; left: 14px; color: var(--text-dim); font-size: 0.85rem; z-index: 2; }
        
        .field input {
          width: 100%; background: rgba(255,255,255,0.05); border: 1px solid var(--border);
          border-radius: 14px; color: var(--white); font-size: 0.93rem; padding: 13px 48px 13px 40px; outline: none;
          transition: all 0.3s ease;
        }
        .field input:focus { border-color: var(--sky); background: rgba(255,255,255,0.08); box-shadow: 0 0 15px rgba(77,182,247,0.15); }
        
        .toggle-pass { 
          position: absolute; right: 12px; background: rgba(255,255,255,0.05); border: none; 
          color: var(--sky); cursor: pointer; padding: 6px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center; z-index: 5; transition: all 0.2s ease;
        }
        .toggle-pass:hover { background: rgba(255,255,255,0.15); color: var(--white); }
        
        .btn-submit {
          width: 100%; padding: 14px; margin-top: 0.5rem; background: linear-gradient(135deg, #1a5cff 0%, #4db6f7 100%);
          color: var(--white); font-weight: 600; border: none; border-radius: 14px; cursor: pointer;
          box-shadow: 0 8px 28px rgba(26,92,255,0.4); display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all 0.3s ease;
        }
        .btn-submit:hover { transform: translateY(-1px); box-shadow: 0 12px 30px rgba(26,92,255,0.5); }
        .btn-submit:disabled { opacity: 0.65; cursor: not-allowed; }
        .spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .footer { text-align: center; font-size: 0.72rem; color: rgba(255,255,255,0.2); margin-top: 1.25rem; }
      `}</style>

      <div className="page">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        {PARTICLES.map((p) => (
          <Particle
            key={p.id}
            style={{
              width: p.size, height: p.size, left: p.left, bottom: "-10px",
              opacity: p.opacity, animationDelay: p.animDelay, animationDuration: p.animDuration,
            }}
          />
        ))}

        <div className={`card${mounted ? " visible" : ""}`}>
          <div className="brand">
            <div className="brand-mip">Mip</div>
            <div className="brand-activity">activity!</div>
            <div className="brand-sub">
              Sebagai langkah pengamanan login pertama kali, silakan ganti password default Anda.
            </div>
          </div>
          <div className="divider" />

          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="field">
              <label htmlFor="currentPassword">Password Saat Ini</label>
              <div className="input-wrap">
                <svg className="input-icon" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="currentPassword"
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Password default Anda"
                  required
                />
                <button
                  type="button"
                  className="toggle-pass"
                  onClick={() => setShowCurrent(!showCurrent)}
                  title={showCurrent ? "Sembunyikan" : "Lihat"}
                >
                  {showCurrent ? (
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="field">
              <label htmlFor="newPassword">Password Baru</label>
              <div className="input-wrap">
                <svg className="input-icon" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                </svg>
                <input
                  id="newPassword"
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 karakter"
                  required
                />
                <button
                  type="button"
                  className="toggle-pass"
                  onClick={() => setShowNew(!showNew)}
                  title={showNew ? "Sembunyikan" : "Lihat"}
                >
                  {showNew ? (
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="field">
              <label htmlFor="confirmPassword">Konfirmasi Password Baru</label>
              <div className="input-wrap">
                <svg className="input-icon" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru Anda"
                  required
                />
                <button
                  type="button"
                  className="toggle-pass"
                  onClick={() => setShowConfirm(!showConfirm)}
                  title={showConfirm ? "Sembunyikan" : "Lihat"}
                >
                  {showConfirm ? (
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-submit" disabled={isLoading}>
              {isLoading ? (
                <><div className="spinner" /> Memproses...</>
              ) : (
                <>Simpan Password Baru <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg></>
              )}
            </button>
          </form>

          <p className="footer">&copy; 2026 <span>Mip Activity</span>. All rights reserved.</p>
        </div>
      </div>
    </>
  );
}
