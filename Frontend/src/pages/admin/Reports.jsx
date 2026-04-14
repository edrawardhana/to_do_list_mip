import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../api/axios";
import toast from "react-hot-toast";

const Reports = () => {
  const { user, isSuperAdmin, isDeveloper } = useAuth();
  
  // Tentukan bos atau bukan
  const canViewAll = isSuperAdmin || isDeveloper;
  const myDivision = user?.division?.name || user?.division_name || "IT Support";

  // State Filter (Kalo Admin biasa, defaultnya langsung divisinya dia)
  const [filterDivision, setFilterDivision] = useState(canViewAll ? "Semua" : myDivision);
  const [filterMonth, setFilterMonth] = useState("2026-04");
  const [isExporting, setIsExporting] = useState(false);

  const [rawData, setRawData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      try {
        const res = await api.get('/reports', { params: { month: filterMonth } });
        const data = res.data?.data || res.data || [];
        // Normalisasi data dari DB untuk menyesuaikan nama field di UI Frontend
        setRawData(data.map(item => ({ ...item, name: item.name || item.full_name, division: item.division?.name || item.division_name || item.division })));
      } catch (error) {
        console.error("Gagal mengambil data laporan:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, [filterMonth]);

  // Logic Filter Sakti
  const filteredData = useMemo(() => {
    // 1. Filter Kasta Dulu (Admin biasa cuma dapet anak divisinya)
    let accessibleData = rawData;
    if (!canViewAll) {
      accessibleData = rawData.filter(item => item.division === myDivision);
    }

    // 2. Filter Dropdown (Khusus bos yang bisa milih "Semua" atau divisi spesifik)
    if (canViewAll && filterDivision !== "Semua") {
      accessibleData = rawData.filter(item => item.division === filterDivision);
    }

    return accessibleData;
  }, [filterDivision, myDivision, canViewAll]);

  // Kalkulasi Statistik Angka Atas (Cards)
  const stats = useMemo(() => {
    const totalInterns = filteredData.length;
    const avgAttendance = totalInterns === 0 ? 0 : Math.round(filteredData.reduce((acc, curr) => acc + curr.attendance, 0) / totalInterns);
    
    let totalCompleted = 0;
    let totalAssigned = 0;
    filteredData.forEach(item => {
      totalCompleted += item.tasksCompleted;
      totalAssigned += item.tasksTotal;
    });
    const taskCompletionRate = totalAssigned === 0 ? 0 : Math.round((totalCompleted / totalAssigned) * 100);

    return { totalInterns, avgAttendance, taskCompletionRate };
  }, [filteredData]);

  // Simulasi Export PDF
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const res = await api.get('/reports/export-pdf', { params: { month: filterMonth, division: canViewAll ? filterDivision : myDivision }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Laporan_Performa_${filterMonth}.pdf`);
      document.body.appendChild(link);
      link.click();
      toast.success("Laporan PDF berhasil diunduh");
    } catch(e) {
      toast.error("Gagal mengekspor PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-8 px-2 max-w-7xl mx-auto">
      
      {/* ================================================================= */}
      {/* HERO SECTION */}
      {/* ================================================================= */}
      <div className="bg-gradient-to-br from-[#0b1437] to-[#111c44] p-8 md:p-10 rounded-[2.5rem] text-white shadow-xl shadow-sky-900/10 border border-white/5 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-sky-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 text-sky-400 shadow-inner">
                <i className="fa-solid fa-file-contract text-lg"></i>
              </div>
              <span className="text-sky-300 text-[10px] font-black uppercase tracking-widest">
                Data & Analytics Center
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3 text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-sky-200">
              Generate Laporan {canViewAll ? "" : `Divisi ${myDivision}`}
            </h1>
            <p className="text-[14px] text-sky-100/80 font-medium max-w-xl leading-relaxed border-l-[3px] border-sky-500/50 pl-4">
              Tarik data rekapitulasi kehadiran, penyelesaian logbook, dan evaluasi performa anak magang untuk keperluan pelaporan kampus atau arsip internal.
            </p>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* FILTER & EXPORT ACTION ROW */}
      {/* ================================================================= */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          
          {/* LOGIC UI: TAMPILIN DROPDOWN KALO BOS, TAMPILIN BADGE KALO ADMIN BIASA */}
          {canViewAll ? (
            <div className="relative w-full sm:w-auto">
              <select 
                value={filterDivision} 
                onChange={e => setFilterDivision(e.target.value)}
                className="w-full sm:w-48 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                <option value="Semua">Semua Divisi</option>
                <option value="IT Support">IT Support</option>
                <option value="Multimedia">Multimedia</option>
                <option value="Public Relation">Public Relation</option>
                <option value="Creative Design">Creative Design</option>
              </select>
              <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
            </div>
          ) : (
            <div className="w-full sm:w-48 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 text-sm font-black text-blue-700 flex items-center gap-2">
              <i className="fa-solid fa-building text-blue-400"></i> {myDivision}
            </div>
          )}

          <div className="w-full sm:w-auto">
            <input 
              type="month" 
              value={filterMonth}
              onChange={e => setFilterMonth(e.target.value)}
              className="w-full sm:w-48 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-200 hover:border-emerald-200 text-sm font-bold transition-all flex items-center justify-center gap-2">
            <i className="fa-solid fa-file-excel"></i> CSV
          </button>
          
          <button 
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex-1 md:flex-none px-6 py-2.5 rounded-xl bg-rose-600 text-white shadow-lg shadow-rose-500/30 hover:bg-rose-700 text-sm font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <><i className="fa-solid fa-circle-notch fa-spin"></i> Processing...</>
            ) : (
              <><i className="fa-solid fa-file-pdf"></i> Export PDF</>
            )}
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* QUICK STATS CARDS */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center gap-5 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform"><i className="fa-solid fa-users text-8xl"></i></div>
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl shadow-inner shrink-0">
            <i className="fa-solid fa-users"></i>
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Anak Magang</p>
            <h3 className="text-3xl font-black text-slate-800">{stats.totalInterns} <span className="text-sm font-medium text-slate-500">Orang</span></h3>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center gap-5 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform"><i className="fa-solid fa-fingerprint text-8xl"></i></div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl shadow-inner shrink-0">
            <i className="fa-solid fa-fingerprint"></i>
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Rata-Rata Hadir</p>
            <h3 className="text-3xl font-black text-slate-800">{stats.avgAttendance}%</h3>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center gap-5 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform"><i className="fa-solid fa-list-check text-8xl"></i></div>
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl shadow-inner shrink-0">
            <i className="fa-solid fa-list-check"></i>
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Logbook Selesai</p>
            <h3 className="text-3xl font-black text-slate-800">{stats.taskCompletionRate}%</h3>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* DATA TABLE REKAPITULASI */}
      {/* ================================================================= */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-black text-slate-800 flex items-center gap-2">
            <i className="fa-solid fa-table-list text-blue-500"></i> Detail Performa ({canViewAll ? filterDivision : myDivision})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-white border-b border-slate-100 text-[10px] uppercase font-black text-slate-400 tracking-widest">
              <tr>
                <th className="px-6 py-4">Nama & Divisi</th>
                <th className="px-6 py-4 text-center">Kehadiran</th>
                <th className="px-6 py-4 text-center">Logbook Selesai</th>
                <th className="px-6 py-4 text-center">Izin / Sakit</th>
                <th className="px-6 py-4 text-center">Evaluasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs shrink-0">
                        {row.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{row.name}</p>
                        <p className="text-[11px] font-medium text-slate-400">{row.division}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-black text-slate-700">{row.attendance}%</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-bold text-slate-700">{row.tasksCompleted}</span>
                      <span className="text-slate-400 text-xs">/ {row.tasksTotal}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-bold ${row.leaveCount > 3 ? 'text-rose-500' : 'text-slate-500'}`}>
                      {row.leaveCount} Hari
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {row.status === "Excellent" && <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border border-emerald-100">Excellent</span>}
                    {row.status === "Good" && <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border border-blue-100">Good</span>}
                    {row.status === "Warning" && <span className="bg-rose-50 text-rose-600 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border border-rose-100">Warning</span>}
                  </td>
                </tr>
              ))}
              
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500 font-medium">
                    Tidak ada data untuk divisi ini pada periode tersebut.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Reports;