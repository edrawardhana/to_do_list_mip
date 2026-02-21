import { useState, useEffect } from 'react';
import api from '../api/axios';

const Absen = ({ onBack }) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const response = await api.get('/daily-tasks');
            setTasks(response.data);
        } catch (err) {
            console.error('Gagal mengambil tugas harian', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleTask = async (taskId, currentStatus) => {
        const newStatus = currentStatus === 'selesai' ? 'pending' : 'selesai';
        try {
            await api.patch(`/daily-tasks/${taskId}`, { status: newStatus });
            setTasks(tasks.map(task =>
                task.id === taskId ? { ...task, status: newStatus, waktu_checklist: newStatus === 'selesai' ? new Date().toLocaleTimeString() : null } : task
            ));
            setMessage('Status berhasil diperbarui!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            alert('Gagal memperbarui tugas');
        }
    };

    if (loading) return <div className="loading">Memuat tugas...</div>;

    return (
        <div className="absen-page">
            <header className="page-header">
                <button onClick={onBack} className="back-btn">← Kembali</button>
                <h1>Checklist Absen Harian</h1>
            </header>

            <div className="task-container">
                {message && <div className="toast">{message}</div>}

                {tasks.length === 0 ? (
                    <div className="empty-state">Belum ada tugas untuk hari ini.</div>
                ) : (
                    <div className="task-list">
                        {tasks.map(task => (
                            <div key={task.id} className={`task-item ${task.status}`}>
                                <div className="task-info">
                                    <span className="task-name">{task.nama_kegiatan}</span>
                                    {task.waktu_checklist && (
                                        <span className="task-time">Selesai jam: {task.waktu_checklist}</span>
                                    )}
                                </div>
                                <button
                                    onClick={() => toggleTask(task.id, task.status)}
                                    className={`check-btn ${task.status}`}
                                >
                                    {task.status === 'selesai' ? '✓' : ''}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                .absen-page {
                    padding: 40px;
                    max-width: 800px;
                    margin: 0 auto;
                    color: white;
                }
                .page-header {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    margin-bottom: 40px;
                }
                .back-btn {
                    background: transparent;
                    border: none;
                    color: #888;
                    cursor: pointer;
                    font-size: 1rem;
                }
                .back-btn:hover { color: white; }
                .task-container { position: relative; }
                .task-list {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }
                .task-item {
                    background: rgba(255, 255, 255, 0.05);
                    padding: 20px;
                    border-radius: 12px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    transition: 0.3s;
                }
                .task-item.selesai {
                    border-color: #646cff;
                    background: rgba(100, 108, 255, 0.1);
                }
                .task-info { display: flex; flex-direction: column; }
                .task-name { font-weight: 500; font-size: 1.1rem; }
                .task-time { font-size: 0.8rem; color: #646cff; margin-top: 4px; }
                .check-btn {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    border: 2px solid #555;
                    background: transparent;
                    color: white;
                    cursor: pointer;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    font-weight: bold;
                }
                .check-btn.selesai {
                    background: #646cff;
                    border-color: #646cff;
                }
                .toast {
                    position: fixed;
                    bottom: 40px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #646cff;
                    padding: 10px 20px;
                    border-radius: 30px;
                    font-size: 0.9rem;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                }
                .empty-state {
                    text-align: center;
                    color: #888;
                    margin-top: 100px;
                }
            `}</style>
        </div>
    );
};

export default Absen;
