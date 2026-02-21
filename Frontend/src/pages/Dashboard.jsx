import { useState, useEffect } from 'react';
import api from '../api/axios';

const Dashboard = ({ onLogout, onStartAbsen }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await api.get('/me');
                setUser(response.data);
            } catch (err) {
                console.error('Gagal mengambil data user', err);
                onLogout();
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [onLogout]);

    if (loading) {
        return <div className="loading">Memuat data...</div>;
    }

    return (
        <div className="dashboard-container">
            <nav className="navbar">
                <div className="user-info">
                    <span className="user-name">Halo, {user?.name || 'User'}</span>
                    <span className="user-role">{user?.role || 'Pegawai'}</span>
                </div>
                <button onClick={onLogout} className="logout-btn">Logout</button>
            </nav>

            <main className="content">
                <section className="welcome-card">
                    <h1>Selamat Datang di To-Do List MCC</h1>
                    <p>Mulai absen harian kamu dan kelola tugasmu di sini.</p>
                </section>

                <section className="absen-section">
                    <h2>Fitur Absen</h2>
                    <div className="absen-grid">
                        <div className="absen-card">
                            <h3>Absen Harian</h3>
                            <button onClick={onStartAbsen} className="primary-btn">Mulai Absen Sekarang</button>
                        </div>
                    </div>
                </section>
            </main>

            <style>{`
                .dashboard-container {
                    min-height: 100vh;
                    background: #0f1014;
                    color: white;
                    font-family: 'Inter', sans-serif;
                }
                .navbar {
                    padding: 20px 40px;
                    background: rgba(255, 255, 255, 0.02);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }
                .user-info {
                    display: flex;
                    flex-direction: column;
                }
                .user-name {
                    font-weight: 600;
                    font-size: 1.1rem;
                }
                .user-role {
                    font-size: 0.8rem;
                    color: #888;
                }
                .logout-btn {
                    background: transparent;
                    border: 1px solid #ff4d4d;
                    color: #ff4d4d;
                    padding: 8px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: 0.3s;
                }
                .logout-btn:hover {
                    background: #ff4d4d;
                    color: white;
                }
                .content {
                    padding: 40px;
                    max-width: 1200px;
                    margin: 0 auto;
                }
                .welcome-card {
                    background: linear-gradient(90deg, #646cff 0%, #535bf2 100%);
                    padding: 40px;
                    border-radius: 20px;
                    margin-bottom: 40px;
                }
                .absen-card {
                    background: rgba(255, 255, 255, 0.05);
                    padding: 30px;
                    border-radius: 15px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    text-align: center;
                }
                .primary-btn {
                    background: #646cff;
                    border: none;
                    color: white;
                    padding: 12px 24px;
                    border-radius: 10px;
                    font-weight: 600;
                    cursor: pointer;
                    margin-top: 20px;
                }
                .loading {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    background: #0f1014;
                    color: white;
                }
            `}</style>
        </div>
    );
};

export default Dashboard;
