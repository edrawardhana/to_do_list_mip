import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const Report = () => {
  const { isAnyAdmin, isIntern, user } = useAuth();

  // --- STATE UNTUK ADMIN ---
  const [selectedReport, setSelectedReport] = useState(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
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

  // --- STATE UNTUK INTERN (FORM) ---
  const [formData, setFormData] = useState({
    summary: "",
    highlights: "",
    obstacles: "",
    month: "Maret 2026",
  });

  const handleInternSubmit = (e) => {
    e.preventDefault();
    alert("Laporan berhasil dikirim ke Admin!");
    setFormData({
      summary: "",
      highlights: "",
      obstacles: "",
      month: "Maret 2026",
    });
  };

  // Handler Admin
  const openReview = (report) => {
    setSelectedReport(report);
    setIsReviewOpen(true);
  };

  const handleStatusUpdate = (id, newStatus) => {
    setIncomingReports(
      incomingReports.map((r) =>
        r.id === id ? { ...r, status: newStatus } : r,
      ),
    );
    setIsReviewOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f4f7fe] p-4 md:p-8 space-y-10 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-black text-[#1b254b] uppercase tracking-tight">
          {isAnyAdmin ? "Management Reports" : "Laporan Bulanan"}
        </h1>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em]">
          {isAnyAdmin
            ? "Review & Approval System"
            : "Submission Period: March 2026"}
        </p>
      </div>

      <div className="max-w-5xl mx-auto">
        {isAnyAdmin ? (
          /* ================= ADMIN VIEW ================= */
          <div className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-sm border border-white">
            <h2 className="text-xl font-black text-[#1b254b] uppercase mb-8 tracking-tight flex items-center gap-3">
              <span className="w-2 h-8 bg-indigo-600 rounded-full"></span>
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
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-6 px-4">
                        <p>{report.name}</p>
                        <p className="text-[10px] text-slate-300 uppercase">
                          {report.division}
                        </p>
                      </td>
                      <td className="py-6 px-4 text-center text-slate-400">
                        {report.month}
                      </td>
                      <td className="py-6 px-4 text-center">
                        <span
                          className={`px-4 py-1.5 rounded-full text-[10px] font-black italic tracking-tighter ${
                            report.status === "APPROVED"
                              ? "bg-emerald-50 text-emerald-500"
                              : report.status === "REJECTED"
                                ? "bg-red-50 text-red-500"
                                : "bg-orange-50 text-orange-400"
                          }`}
                        >
                          {report.status}
                        </span>
                      </td>
                      <td className="py-6 px-4 text-center">
                        <button
                          onClick={() => openReview(report)}
                          className="bg-[#f4f7fe] text-[#4318ff] px-6 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all active:scale-95 shadow-sm"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ================= INTERN VIEW (FORM) ================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Form Side */}
            <div className="lg:col-span-7 bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-white">
              <h2 className="text-xl font-black text-[#1b254b] uppercase mb-8 tracking-tight">
                Submit Monthly Report
              </h2>
              <form onSubmit={handleInternSubmit} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">
                    Ringkasan Pekerjaan
                  </label>
                  <textarea
                    required
                    className="w-full bg-[#f4f7fe] border-none rounded-[1.5rem] p-5 text-sm font-bold text-[#1b254b] focus:ring-2 focus:ring-indigo-500 min-h-[120px]"
                    placeholder="Apa saja yang kamu kerjakan bulan ini?"
                    value={formData.summary}
                    onChange={(e) =>
                      setFormData({ ...formData, summary: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">
                      Pencapaian
                    </label>
                    <textarea
                      className="w-full bg-[#f4f7fe] border-none rounded-[1.5rem] p-5 text-sm font-bold text-[#1b254b] focus:ring-2 focus:ring-emerald-500 min-h-[100px]"
                      placeholder="Highlights..."
                      value={formData.highlights}
                      onChange={(e) =>
                        setFormData({ ...formData, highlights: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">
                      Kendala
                    </label>
                    <textarea
                      className="w-full bg-[#f4f7fe] border-none rounded-[1.5rem] p-5 text-sm font-bold text-[#1b254b] focus:ring-2 focus:ring-red-500 min-h-[100px]"
                      placeholder="Masalah yang dihadapi..."
                      value={formData.obstacles}
                      onChange={(e) =>
                        setFormData({ ...formData, obstacles: e.target.value })
                      }
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white font-black py-4 rounded-[1.5rem] shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all uppercase text-xs tracking-[0.2em] active:scale-95"
                >
                  Send Report to Admin
                </button>
              </form>
            </div>

            {/* Instruction Side */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-[#0b1437] p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100">
                <i className="fa-solid fa-circle-info text-3xl mb-4 text-indigo-400"></i>
                <h3 className="text-lg font-black uppercase italic mb-2">
                  Petunjuk Laporan
                </h3>
                <ul className="text-xs font-bold text-indigo-100/60 space-y-3">
                  <li className="flex gap-2">
                    <span>•</span> Isi laporan dengan jujur sesuai tugas di
                    Dashboard.
                  </li>
                  <li className="flex gap-2">
                    <span>•</span> Sertakan kendala teknis agar Admin bisa
                    membantu.
                  </li>
                  <li className="flex gap-2">
                    <span>•</span> Batas pengiriman adalah tanggal 30 setiap
                    bulannya.
                  </li>
                </ul>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-white shadow-sm">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">
                  Status Laporan Terakhir
                </p>
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-black text-[#1b254b]">
                    Februari 2026
                  </h4>
                  <span className="bg-emerald-50 text-emerald-500 px-4 py-1 rounded-full text-[10px] font-black italic">
                    APPROVED
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- MODAL REVIEW DETAIL (KHUSUS ADMIN) --- */}
      {isReviewOpen && selectedReport && (
        <div className="fixed inset-0 bg-[#1b254b]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl p-8 md:p-10 shadow-2xl animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto border border-white">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-black text-[#1b254b] uppercase tracking-tight">
                  Review Laporan
                </h2>
                <p className="text-sm font-bold text-slate-400">
                  {selectedReport.name} — {selectedReport.month}
                </p>
              </div>
              <button
                onClick={() => setIsReviewOpen(false)}
                className="w-10 h-10 bg-slate-50 rounded-full text-slate-400 hover:text-red-500 transition-colors text-xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {[
                {
                  label: "Ringkasan Pekerjaan",
                  val: selectedReport.summary,
                  color: "text-indigo-600",
                  bg: "bg-indigo-50/30",
                },
                {
                  label: "Pencapaian / Highlights",
                  val: selectedReport.highlights,
                  color: "text-emerald-600",
                  bg: "bg-emerald-50/30",
                },
                {
                  label: "Kendala",
                  val: selectedReport.obstacles,
                  color: "text-orange-600",
                  bg: "bg-orange-50/30",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`${item.bg} p-6 rounded-2xl border border-slate-50`}
                >
                  <label
                    className={`text-[10px] font-black ${item.color} uppercase tracking-widest block mb-2`}
                  >
                    {item.label}
                  </label>
                  <p className="text-sm font-bold text-[#1b254b] leading-relaxed">
                    {item.val}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex gap-4 mt-10">
              <button
                onClick={() =>
                  handleStatusUpdate(selectedReport.id, "APPROVED")
                }
                className="flex-1 bg-emerald-500 text-white font-black py-4 rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 uppercase text-xs tracking-widest"
              >
                Approve
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
