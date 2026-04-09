import React, { useState, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";

const Analytics = () => {
  const { user } = useAuth();
  const [selectedDivision, setSelectedDivision] = useState(null); // Buat modal detail divisi

  // ==========================================
  // DUMMY DATA HASIL JOIN (BE PAYLOAD)
  // ==========================================
  const divisionOverview = [
    { 
      id: 1, name: "IT Support", icon: "fa-network-wired", color: "blue",
      adminName: "Pak Budi", internCount: 15, performance: 95, alphaRate: 2,
      leaderboard: [
        { name: "Kiel", score: 98, status: "Top Performer" },
        { name: "Nabil", score: 92, status: "Stable" },
        { name: "Andi", score: 45, status: "Warning" }, // Biar Bos tau siapa yang bermasalah
      ]
    },
    { 
      id: 2, name: "Multimedia", icon: "fa-video", color: "purple",
      adminName: "Mas Anton", internCount: 10, performance: 88, alphaRate: 5,
      leaderboard: [
        { name: "Edra", score: 99, status: "Top Performer" },
        { name: "Siti", score: 85, status: "Stable" },
      ]
    },
    { 
      id: 3, name: "Public Relation", icon: "fa-bullhorn", color: "rose",
      adminName: null, // Simulasi belum ada Mandor (Badge Merah)
      internCount: 8, performance: 70, alphaRate: 12,
      leaderboard: []
    },
    { 
      id: 4, name: "Creative Design", icon: "fa-pen-nib", color: "emerald",
      adminName: "Mbak Rina", internCount: 12, performance: 92, alphaRate: 3,
      leaderboard: []
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-8 px-2 max-w-7xl mx-auto">
      
      {/* HERO SECTION ANALYTICS */}
      <div className="bg-gradient-to-br from-[#0b1437] to-[#1a237e] p-8 md:p-10 rounded-[2.5rem] text-white shadow-xl border border-white/5 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-sky-500/20 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 text-sky-400">
              <i className="fa-solid fa-chart-line text-lg"></i>
            </div>
            <span className="text-sky-300 text-[10px] font-black uppercase tracking-widest">Global Performance Monitoring</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">MCC Global Analytics</h1>
          <p className="text-[14px] text-sky-100/80 font-medium max-w-2xl leading-relaxed border-l-[3px] border-sky-500/50 pl-4">
            Data rekapitulasi performa seluruh divisi. Klik pada kartu divisi untuk membedah leaderboard dan daftar anak magang yang memerlukan perhatian khusus.
          </p>
        </div>
      </div>

      {/* ================================================================= */}
      {/* GRID CARDS DIVISI                                                   */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {divisionOverview.map((div) => (
          <div 
            key={div.id} 
            onClick={() => setSelectedDivision(div)}
            className="bg-white rounded-[2.5rem] border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 group cursor-pointer relative overflow-hidden"
          >
            {/* Dekorasi BG Ikon */}
            <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
              <i className={`fa-solid ${div.icon} text-[10rem]`}></i>
            </div>

            <div className="flex justify-between items-start mb-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner bg-${div.color}-50 text-${div.color}-600 border border-${div.color}-100`}>
                <i className={`fa-solid ${div.icon}`}></i>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Kinerja Global</p>
                <h4 className={`text-2xl font-black ${div.performance > 80 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {div.performance}%
                </h4>
              </div>
            </div>

            <h3 className="text-xl font-black text-slate-800 mb-4 group-hover:text-blue-600 transition-colors">{div.name}</h3>

            {/* Info Mandor / Admin */}
            <div className="mb-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Penanggung Jawab</p>
              {div.adminName ? (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-slate-200">{div.adminName.charAt(0)}</div>
                  <span className="text-xs font-bold text-slate-700">{div.adminName}</span>
                  <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded border border-emerald-100 uppercase">Mandor</span>
                </div>
              ) : (
                <span className="bg-rose-50 text-rose-600 text-[10px] font-black px-3 py-1.5 rounded-lg border border-rose-100 flex items-center gap-1.5 w-max">
                  <i className="fa-solid fa-triangle-exclamation animate-pulse"></i> Belum Ada Admin
                </span>
              )}
            </div>

            {/* Info Pasukan */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
               <div className="flex items-center gap-2">
                  <i className="fa-solid fa-users text-slate-400 text-xs"></i>
                  <span className="text-xs font-bold text-slate-600">{div.internCount} Anak Magang</span>
               </div>
               <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded">
                  {div.alphaRate}% Alpha
               </span>
            </div>
          </div>
        ))}
      </div>

      {/* ================================================================= */}
      {/* MODAL DETAIL DIVISI (LEADERBOARD & GRAPH SIMULATION)                */}
      {/* ================================================================= */}
      {selectedDivision && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0b1437]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl shadow-lg shadow-blue-600/30">
                    <i className={`fa-solid ${selectedDivision.icon}`}></i>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-800">{selectedDivision.name}</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Deep Performance Analysis</p>
                  </div>
               </div>
               <button onClick={() => setSelectedDivision(null)} className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-500 transition-colors">
                 <i className="fa-solid fa-xmark"></i>
               </button>
            </div>

            <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Bagian Leaderboard */}
                <div>
                   <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                     <i className="fa-solid fa-crown text-amber-500"></i> Leaderboard Divisi
                   </h3>
                   <div className="space-y-3">
                     {selectedDivision.leaderboard.length > 0 ? selectedDivision.leaderboard.map((intern, idx) => (
                       <div key={idx} className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-slate-50/50">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-black text-slate-400 w-4">{idx + 1}.</span>
                            <span className="text-sm font-bold text-slate-700">{intern.name}</span>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-black text-blue-600">{intern.score}%</p>
                             <p className={`text-[8px] font-bold uppercase tracking-widest ${intern.status === 'Warning' ? 'text-rose-500' : 'text-emerald-500'}`}>{intern.status}</p>
                          </div>
                       </div>
                     )) : (
                       <p className="text-xs font-medium text-slate-400 italic">Data leaderboard belum tersedia untuk divisi ini.</p>
                     )}
                   </div>
                </div>

                {/* Statistik Visual (Simulasi) */}
                <div className="space-y-6">
                   <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                     <i className="fa-solid fa-chart-simple text-blue-500"></i> Grafik Kehadiran Bulanan
                   </h3>
                   {/* Dummy Chart Bar */}
                   <div className="flex items-end gap-3 h-32 px-2 border-b border-slate-200">
                      <div className="flex-1 bg-blue-100 rounded-t-lg h-[40%] transition-all hover:bg-blue-400" title="Minggu 1"></div>
                      <div className="flex-1 bg-blue-200 rounded-t-lg h-[65%] transition-all hover:bg-blue-400" title="Minggu 2"></div>
                      <div className="flex-1 bg-blue-400 rounded-t-lg h-[90%] transition-all hover:bg-blue-400" title="Minggu 3"></div>
                      <div className="flex-1 bg-blue-300 rounded-t-lg h-[75%] transition-all hover:bg-blue-400" title="Minggu 4"></div>
                   </div>
                   <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                      <span>M-1</span><span>M-2</span><span>M-3</span><span>M-4</span>
                   </div>
                </div>

              </div>
            </div>

            {/* Modal Footer Action */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
               <button className="px-6 py-2.5 bg-[#0b1437] text-white rounded-xl text-xs font-black shadow-lg hover:bg-blue-700 transition-colors">
                  Download Laporan Lengkap Divisi Ini (PDF)
               </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Analytics;