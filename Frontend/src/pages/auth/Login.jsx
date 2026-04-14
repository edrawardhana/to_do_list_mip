import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
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

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // --- STATE TERMINAL (GOD MODE) ---
  const [devMode, setDevMode] = useState(false);
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalLogs, setTerminalLogs] = useState([
    "MCC OS v2.1.0 (Root Console)",
    "Type 'help' for available commands or 'sudo login' to authenticate.",
  ]);
  const terminalBottomRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // --- SECRET KEYBIND LISTENER (Ctrl + Shift + X) ---
  useEffect(() => {
    const handleSecretKey = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "x") {
        e.preventDefault();
        setDevMode((prev) => !prev);
        if (!devMode) toast.success("Developer Console Unlocked", { icon: "🔓", style: { background: "#050a15", color: "#34d399" } });
      }
    };
    window.addEventListener("keydown", handleSecretKey);
    return () => window.removeEventListener("keydown", handleSecretKey);
  }, [devMode]);

  useEffect(() => {
    if (terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [terminalLogs, devMode]);

  // --- NORMAL LOGIN HANDLER ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const loadId = toast.loading("Sedang memverifikasi akun...");

    try {
      // BYPASS AXIOS BUAT TESTING ROLE DUMMY KITA
      if (email.includes("@mcc.com")) {
        await new Promise(resolve => setTimeout(resolve, 800)); // Fake delay
        
        // Sesuaikan dengan parameter AuthContext baru: login(token, userData)
        const dummyUser = {
          id: "dummy-123",
          full_name: "Rekiel Dummy",
          email: email,
          role: email.includes("admin") ? "admin" : "user",
          is_locked: false
        };
        login("dummy-token-123", dummyUser); 
        toast.success(`Login Berhasil!`, { id: loadId });
        navigate("/dashboard");
        return; // Berhenti di sini, gak usah jalanin axios di bawah
      }

      // KODE ASLI LU (Jalan kalau emailnya BUKAN @mcc.com)
      const response = await api.post("/auth/login", { email, password });

      console.log("ISI RESPON BACKEND (LOGIN):", response.data);

      const resData = response.data?.data || response.data;
      const token = resData?.access_token || resData?.token || response.data?.authorization?.token;
      let userData = resData?.user || resData?.profile || (resData?.id ? resData : null);

      // Skenario: Backend Laravel cuma kirim Token, gak kirim data User
      if (token && !userData) {
        try {
          console.log("Token ditemukan! Mencoba fetch data user dari /auth/me...");
          const meRes = await api.get("/auth/me", {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log("ISI RESPON BACKEND (ME):", meRes.data);
          userData = meRes.data?.data || meRes.data?.user || meRes.data;
        } catch (err) {
          console.warn("Gagal fetch /auth/me, backend mungkin belum punya endpoint ini.");
        }
      }

      if (token) {
        // Jika masih gagal dapet data, kita buat data darurat biar sistem Frontend gak stuck
        if (!userData || !userData.id) {
          userData = { id: "darurat-123", email: email, role: email.includes("admin") ? "super_admin" : "user", full_name: "Karyawan (Fallback)" };
        }
        // Fungsi login dari AuthContext akan otomatis menyimpan token & user_data ke localStorage
        login(token, userData);
        toast.success("Login Berhasil! Selamat datang.", { id: loadId });
        navigate("/");
      } else {
        toast.error("Token tidak ditemukan dari balasan server.", { id: loadId });
      }
    } catch (err) {
      let errorMsg = "Terjadi kesalahan koneksi.";
      if (err.response && err.response.status === 422) {
        errorMsg = Object.values(err.response.data).flat().join(" ");
      } else if (err.response) {
        errorMsg = err.response.data.error || err.response.data.message || "Login gagal";
      } else {
        errorMsg = err.message;
      }
      toast.error(errorMsg, {
        id: loadId,
        duration: 4000,
        style: { borderRadius: "12px", background: "#1b254b", color: "#fff" },
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- TERMINAL COMMAND HANDLER ---
  const handleTerminalSubmit = (e) => {
    e.preventDefault();
    const cmd = terminalInput.trim().toLowerCase();
    const newLogs = [...terminalLogs, `root@mcc-sync:~# ${terminalInput}`];

    if (cmd === "clear") {
      setTerminalLogs([]);
    } else if (cmd === "help") {
      newLogs.push("Available commands: clear, help, sudo login");
      setTerminalLogs(newLogs);
    } else if (cmd === "sudo login") {
      newLogs.push("Authenticating Developer Credentials...");
      newLogs.push("Access Granted. Redirecting to Root Console...");
      setTerminalLogs(newLogs);
      
      setTimeout(() => {
        const rootUser = {
          id: "root-000",
          full_name: "System Root Developer",
          email: "root@mcc.com",
          role: "developer",
          is_locked: false
        };
        login("terminal-root-token", rootUser); 
        toast.success("Root Access Granted", { style: { background: "#050a15", color: "#34d399" } });
        navigate("/dashboard");
      }, 1500);
    } else if (cmd !== "") {
      newLogs.push(`bash: ${cmd}: command not found`);
      setTerminalLogs(newLogs);
    }
    setTerminalInput("");
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
        
        /* Transisi blur buat Dev Mode */
        .page-wrapper {
          transition: all 0.7s cubic-bezier(0.87,0,0.13,1);
        }
        .page-wrapper.dev-active {
          filter: blur(8px) brightness(0.4);
          transform: scale(0.98);
        }

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
        .brand-sub { font-size: 0.78rem; color: var(--text-dim); margin-top: 6px; font-weight: 300; }
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
        
        .btn-login {
          width: 100%; padding: 14px; margin-top: 0.5rem; background: linear-gradient(135deg, #1a5cff 0%, #4db6f7 100%);
          color: var(--white); font-weight: 600; border: none; border-radius: 14px; cursor: pointer;
          box-shadow: 0 8px 28px rgba(26,92,255,0.4); display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .btn-login:disabled { opacity: 0.65; cursor: not-allowed; }
        .spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .register-link { text-align: center; font-size: 0.8rem; color: var(--text-dim); margin-top: 1.25rem; }
        .register-link a { color: var(--sky); text-decoration: none; font-weight: 600; }
        .footer { text-align: center; font-size: 0.72rem; color: rgba(255,255,255,0.2); margin-top: 1rem; }
      `}</style>

      {/* ========================================= */}
      {/* TERMINAL UI (GOD MODE) */}
      {/* Muncul kalo Ctrl+Shift+X dipencet */}
      {/* ========================================= */}
      <div 
        className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.87,0,0.13,1)] ${
          devMode ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="w-full max-w-4xl p-8 absolute z-20">
          <div className="bg-black/90 rounded-2xl border border-white/10 shadow-2xl overflow-hidden font-mono text-sm h-[60vh] flex flex-col relative">
            <div className="bg-white/5 px-4 py-2 border-b border-white/5 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500 cursor-pointer" onClick={() => setDevMode(false)}></div>
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="ml-4 text-slate-500 text-xs">root@mcc-sync:~</span>
            </div>
            <div className="flex-1 p-6 overflow-y-auto text-emerald-400 space-y-2 relative z-10">
              {terminalLogs.map((log, index) => (
                <div key={index} className={log.startsWith("root@mcc") ? "text-emerald-500" : "text-emerald-400/80"}>{log}</div>
              ))}
              <form onSubmit={handleTerminalSubmit} className="flex items-center gap-2 mt-2">
                <span className="text-emerald-500 font-bold">root@mcc-sync:~#</span>
                <input
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-emerald-400 border-none focus:ring-0 p-0"
                  autoFocus={devMode}
                  autoComplete="off"
                  spellCheck="false"
                />
              </form>
              <div ref={terminalBottomRef} />
            </div>
            {/* Efek Garis Terminal */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-0 opacity-20"></div>
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* NORMAL LOGIN UI (Desain Dewa Lu) */}
      {/* ========================================= */}
      <div className={`page-wrapper w-full h-full ${devMode ? 'dev-active' : ''}`}>
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
              <div className="brand-sub">Masuk untuk melanjutkan</div>
            </div>
            <div className="divider" />

            <form onSubmit={handleSubmit} autoComplete="off">
              <div className="field">
                <label htmlFor="email">Email</label>
                <div className="input-wrap">
                  <svg className="input-icon" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="pegawai@mcc.com" required
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="password">Password</label>
                <div className="input-wrap">
                  <svg className="input-icon" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    id="password" type={showPass ? "text" : "password"} value={password}
                    onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required
                  />
                  <button type="button" className="toggle-pass" onClick={() => setShowPass(!showPass)} title={showPass ? "Sembunyikan Password" : "Lihat Password"}>
                    {showPass ? (
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

              <button type="submit" className="btn-login" disabled={isLoading}>
                {isLoading ? (
                  <><div className="spinner" /> Memproses...</>
                ) : (
                  <>Masuk <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg></>
                )}
              </button>
            </form>

            <div className="register-link">
              Belum punya akun? <Link to="/register">Daftar di sini</Link>
            </div>
            <p className="footer">&copy; 2026 <span>Mip Activity</span>. All rights reserved.</p>
          </div>
        </div>
      </div>
    </>
  );
}