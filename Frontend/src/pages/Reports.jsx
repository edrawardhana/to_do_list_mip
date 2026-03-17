import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const Report = () => {
  const { isAnyAdmin } = useAuth();

  // State untuk Modal Review (Hanya Admin)
  const [selectedReport, setSelectedReport] = useState(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  // Data Dummy untuk Admin (Ditambahkan isi laporan untuk review)
  const [incomingReports, setIncomingReports] = useState([
    {
      id: 1,
      name: "Nabil P",
      division: "IT Support",
      month: "Maret 2026",
      status: "PENDING",
      summary:
        "Menyelesaikan setup jaringan di lantai 2 dan maintenance server rutin.",
      highlights: "Server uptime mencapai 99% minggu ini.",
      obstacles: "Beberapa kabel LAN perlu diganti karena sudah usang.",
    },
    {
      id: 2,
      name: "Bagas",
      division: "IT Support",
      month: "Maret 2026",
      status: "APPROVED",
      summary: "Melakukan instalasi OS pada 5 PC baru di ruang rapat.",
      highlights: "Instalasi selesai lebih cepat dari jadwal.",
      obstacles: "Koneksi internet sempat tidak stabil saat download driver.",
    },
  ]);

  // Handler untuk membuka modal review
  const openReview = (report) => {
    setSelectedReport(report);
    setIsReviewOpen(true);
  };

  // Handler untuk Approve/Reject
  const handleStatusUpdate = (id, newStatus) => {
    setIncomingReports(
      incomingReports.map((r) =>
        r.id === id ? { ...r, status: newStatus } : r,
      ),
    );
    setIsReviewOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f4f7fe] p-4 md:p-8 space-y-10 animate-in fade-in duration-500 relative">
      <div className="text-center">
        <h1 className="text-4xl font-black text-[#5e6681] uppercase tracking-tight">
          {isAnyAdmin ? "Management Reports" : "Laporan Bulanan"}
        </h1>
      </div>

      <div className="max-w-6xl mx-auto">
        {isAnyAdmin ? (
          <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
            <h2 className="text-xl font-black text-[#1b254b] uppercase mb-8 tracking-tight">
              Incoming Intern Reports
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="pb-4 px-4">Intern Name</th>
                    <th className="pb-4 px-4 text-center">Month</th>
                    <th className="pb-4 px-4 text-center">Status</th>
                    <th className="pb-4 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-bold text-[#1b254b]">
                  {incomingReports.map((report) => (
                    <tr
                      key={report.id}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-6 px-4">{report.name}</td>
                      <td className="py-6 px-4 text-center text-slate-400">
                        {report.month}
                      </td>
                      <td className="py-6 px-4 text-center">
                        <span
                          className={`px-4 py-1.5 rounded-full text-[10px] font-black ${
                            report.status === "APPROVED"
                              ? "bg-green-100 text-green-600"
                              : "bg-orange-100 text-orange-600"
                          }`}
                        >
                          {report.status}
                        </span>
                      </td>
                      <td className="py-6 px-4 text-center">
                        <button
                          onClick={() => openReview(report)}
                          className="bg-[#1b254b] text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-800 transition-all active:scale-95"
                        >
                          Review Report
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Tampilan Intern (Tetap seperti sebelumnya) */
          <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
            {/* ... Form Intern ... */}
            <p className="text-center text-slate-400 font-bold uppercase text-xs">
              Intern View Active
            </p>
          </div>
        )}
      </div>

      {/* --- MODAL REVIEW DETAIL (KHUSUS ADMIN) --- */}
      {isReviewOpen && selectedReport && (
        <div className="fixed inset-0 bg-[#1b254b]/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl p-10 shadow-2xl animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto border border-white">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-black text-[#1b254b] uppercase tracking-tight">
                  Review Laporan
                </h2>
                <p className="text-sm font-bold text-slate-400">
                  {selectedReport.name} - {selectedReport.month}
                </p>
              </div>
              <button
                onClick={() => setIsReviewOpen(false)}
                className="text-slate-300 hover:text-red-500 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-2">
                  Ringkasan Pekerjaan
                </label>
                <p className="text-sm font-bold text-[#1b254b] leading-relaxed">
                  {selectedReport.summary}
                </p>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-2">
                  Pencapaian / Highlights
                </label>
                <p className="text-sm font-bold text-[#1b254b] leading-relaxed">
                  {selectedReport.highlights}
                </p>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest block mb-2">
                  Kendala
                </label>
                <p className="text-sm font-bold text-[#1b254b] leading-relaxed">
                  {selectedReport.obstacles}
                </p>
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button
                onClick={() =>
                  handleStatusUpdate(selectedReport.id, "APPROVED")
                }
                className="flex-1 bg-emerald-500 text-white font-black py-4 rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 uppercase text-xs tracking-widest"
              >
                Approve Report
              </button>
              <button
                onClick={() =>
                  handleStatusUpdate(selectedReport.id, "REJECTED")
                }
                className="flex-1 bg-red-50 text-red-500 font-black py-4 rounded-2xl hover:bg-red-500 hover:text-white transition-all uppercase text-xs tracking-widest"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Report;
