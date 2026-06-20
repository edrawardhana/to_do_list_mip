import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom"; 
import { useAuth } from "../contexts/AuthContext"; 
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios"; 
import toast from "react-hot-toast";
import ConfirmModal from "../components/ui/ConfirmModal"; 

const getEmbedUrl = (url) => {
  if (!url) return "";
  if (url.includes("drive.google.com") && url.includes("/view")) {
    return url.replace("/view", "/preview");
  }
  if (url.includes("youtube.com/watch?v=")) {
    return url.replace("watch?v=", "embed/").split("&")[0];
  }
  if (url.includes("youtu.be/")) {
    return url.replace("youtu.be/", "youtube.com/embed/").split("?")[0];
  }
  return url;
};

const getIconByType = (type) => {
  switch (type) {
    case "gdrive": return "fa-brands fa-google-drive text-emerald-500";
    case "video": return "fa-solid fa-circle-play text-rose-500";
    case "link": return "fa-solid fa-link text-blue-500";
    case "text": return "fa-solid fa-align-left text-slate-500";
    default: return "fa-solid fa-file-pdf text-rose-500";
  }
};

const Whitebook = () => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();

  const canEdit = isAdmin && !isSuperAdmin;
  const canViewAll = isSuperAdmin;
  const isIntern = !isAdmin && !isSuperAdmin; 
  
  const myDivision = user?.division?.name || user?.division_name || "IT Support";

  const isPinkTheme = isSuperAdmin;           
  const isDarkBlueTheme = isAdmin && !isSuperAdmin; 

  const [selectedDiv, setSelectedDiv] = useState(canViewAll ? "IT Support" : myDivision);
  const [activeDocId, setActiveDocId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const [formData, setFormData] = useState({ id: null, title: "", content: "", type: "gdrive", file_url: "" });

  // State Integrasi Interaktif AI
  const [breakdown, setBreakdown] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isAsking, setIsAsking] = useState(false);

  const [modalState, setModalState] = useState({ isOpen: false, type: "danger", title: "", message: "", actionText: "Ya", onConfirm: () => { } });
  const closeModal = () => setModalState(s => ({ ...s, isOpen: false }));

  useEffect(() => {
    if (isFormOpen || modalState.isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isFormOpen, modalState.isOpen]);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["whitebooksData"],
    queryFn: async () => {
      const res = await api.get("/whiteboards"); 
      return res.data?.data || res.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const divName = doc.division?.name || doc.division_name || doc.division || "Unknown";
      const matchDiv = canViewAll ? divName === selectedDiv : true;
      const matchSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchDiv && matchSearch;
    });
  }, [documents, selectedDiv, searchQuery, canViewAll]);

  useEffect(() => {
    if (filteredDocs.length > 0 && (!activeDocId || !filteredDocs.find(d => d.id === activeDocId))) {
      setActiveDocId(filteredDocs[0].id);
    }
  }, [filteredDocs, activeDocId]);

  const activeDoc = useMemo(() => filteredDocs.find((d) => d.id === activeDocId), [filteredDocs, activeDocId]);

  useEffect(() => {
    setBreakdown([]);
    setQuestion("");
    setAnswer("");
  }, [activeDocId]);

  const handleGenerateBreakdown = async () => {
    const textContext = activeDoc?.content || activeDoc?.description || activeDoc?.title;
    if (!textContext) return toast.error("Konteks teks SOP tidak ditemukan!");
    
    setIsGenerating(true);
    const tid = toast.loading("Llama 4 Scout sedang menganalisis dokumen...");
    try {
      const res = await api.post('/whiteboards/breakdown', { sop_text: textContext, division_name: selectedDiv });
      setBreakdown(res.data?.data || []); 
      toast.success("Llama 4 Scout berhasil memecah SOP!", { id: tid });
    } catch (error) {
      toast.error("Gagal generate breakdown checklist.", { id: tid });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAskAI = async (e) => {
    e.preventDefault();
    const textContext = activeDoc?.content || activeDoc?.description || activeDoc?.title;
    if (!question.trim()) return;
    
    setIsAsking(true);
    try {
      const res = await api.post('/whiteboards/ask', { question: question, sop_context: textContext || "SOP Umum" });
      setAnswer(res.data?.answer || "Tidak ada jawaban dari AI.");
    } catch (error) {
      console.error(error);
      // 🔥 FIX: Re-branding nama AI pas lagi error
      toast.error(
        error.response?.data?.message?.replace(/Qwen\s*3?/gi, 'MacrecenAI') 
        || "Sistem Macrecen AI sedang sibuk memproses antrean, coba beberapa detik lagi."
      );
    } finally {
      setIsAsking(false);
    }
  };

  const handleOpenForm = (doc = null) => {
    if (doc) setFormData({ id: doc.id, title: doc.title, content: doc.content || doc.description || "", type: doc.type || "link", file_url: doc.file_url || "" });
    else setFormData({ id: null, title: "", content: "", type: "gdrive", file_url: "" });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tid = toast.loading("Menyimpan materi...");
    try {
      const iconMap = { gdrive: "fa-brands fa-google-drive", video: "fa-solid fa-circle-play", link: "fa-solid fa-link", text: "fa-solid fa-align-left" };
      const payload = {
        title: formData.title,
        content: formData.content,       
        description: formData.content,   
        icon: iconMap[formData.type] || "fa-solid fa-file", 
        type: formData.type === "text" || formData.type === "gdrive" || formData.type === "video" ? "link" : formData.type,
        file_url: formData.type === "text" ? `${window.location.origin}/text-only` : formData.file_url
      };

      if (formData.id) await api.put(`/whiteboards/${formData.id}`, payload); 
      else await api.post("/whiteboards", payload); 
      
      toast.success("Materi berhasil disimpan!", { id: tid });
      setIsFormOpen(false);
      queryClient.invalidateQueries(["whitebooksData"]);
    } catch (error) {
      toast.error("Gagal memvalidasi data ke server.", { id: tid });
    }
  };

  const handleDelete = (id, title) => {
    setModalState({
      isOpen: true,
      type: "delete",
      title: "Hapus Materi SOP",
      message: `Yakin ingin menghapus materi "${title}" secara permanen? Tindakan ini akan memotong parameter sinkronisasi kecerdasan AI penilai logbook.`,
      actionText: "Ya, Hapus Permanen!",
      onConfirm: async () => {
        const tid = toast.loading("Menghapus materi...");
        try {
          await api.delete(`/whiteboards/${id}`); 
          toast.success("Materi berhasil dihapus bre!", { id: tid });
          if (activeDocId === id) setActiveDocId(null);
          queryClient.invalidateQueries(["whitebooksData"]);
          closeModal();
        } catch (error) {
          toast.error("Gagal menghapus materi", { id: tid });
        }
      }
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-6 sm:pt-8 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
      
      {/* HERO SECTION */}
      <div className={`rounded-[2.5rem] border shadow-2xl relative overflow-hidden flex flex-col text-white mb-6 transition-all duration-500 ${
        isPinkTheme ? "bg-gradient-to-br from-pink-300 to-rose-400 border-pink-300 shadow-pink-200/50" : 
        isDarkBlueTheme ? "bg-gradient-to-b from-[#0b1437] to-[#162447] border-blue-800/40" : 
        "bg-gradient-to-br from-sky-400 to-blue-500 border-sky-300 shadow-sky-300/50"
      }`}>
        <div className={`absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[100px] pointer-events-none ${isPinkTheme ? "bg-white/40" : "bg-blue-500/20"}`} />
        <div className={`absolute -bottom-32 -left-32 w-72 h-72 rounded-full blur-[100px] pointer-events-none ${isPinkTheme ? "bg-rose-100/30" : "bg-sky-200/30"}`} />

        <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-white/10">
          <div className="lg:max-w-xl">
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner shrink-0 border backdrop-blur-sm ${isPinkTheme ? "bg-white/20 border-white/40 text-white" : isDarkBlueTheme ? "bg-white/10 border-white/20 text-white" : "bg-white/20 border-white/30 text-white"}`}>
                <i className="fa-solid fa-book-bookmark text-xl" />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-[0.25em] px-3 py-1.5 rounded-lg border ${isPinkTheme ? "text-pink-50 bg-white/20 border-pink-200" : isDarkBlueTheme ? "text-blue-200 bg-white/10 border-white/10" : "text-white bg-white/20 border-white/30 drop-shadow-sm"}`}>
                Knowledge Base
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-3 leading-tight">Whitebook.</h1>
            <p className={`text-sm font-medium leading-relaxed ${isPinkTheme ? "text-pink-50" : isDarkBlueTheme ? "text-blue-100/70" : "text-sky-50/90"}`}>
              Pusat SOP dan panduan kerja divisi. Standar ini akan dipelajari otomatis oleh AI untuk penilaian Logbook.
            </p>
          </div>

          <button
            onClick={() => queryClient.invalidateQueries(["whitebooksData"])}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all shadow-lg active:scale-95 shrink-0 mt-4 sm:mt-0 bg-white/10 hover:bg-white/20 border-white/20 text-white"
          >
            <i className="fa-solid fa-arrows-rotate" /> Sync Whitebook
          </button>
        </div>
      </div>

      {/* DIVISI FILTER */}
      {canViewAll && (
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap gap-2 items-center mb-6">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mr-4">Filter Divisi:</span>
          {["IT Support", "Marketing", "Public Relation", "Design", "Administration", "Media & Production"].map((div) => (
            <button key={div} onClick={() => setSelectedDiv(div)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${selectedDiv === div ? "bg-pink-500 text-white border-pink-500 shadow-md shadow-pink-500/20" : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"}`}>{div}</button>
          ))}
        </div>
      )}

      {/* CORE LAYOUT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
        
        {/* SIDEBAR LEFT */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-[2rem] shadow-sm flex flex-col overflow-hidden max-h-[750px]">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Cari materi SOP..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm" />
            </div>
            {canEdit && (
              <button onClick={() => handleOpenForm()} className={`w-full mt-4 py-3 rounded-xl text-white text-xs font-black uppercase tracking-widest shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 ${isPinkTheme ? "bg-pink-500 hover:bg-pink-600 shadow-pink-500/20" : isDarkBlueTheme ? "bg-blue-800 hover:bg-blue-900 shadow-blue-800/20" : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/30"}`}><i className="fa-solid fa-file-circle-plus" /> Tambah Materi</button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {isLoading ? (
              <div className="text-center py-10"><i className="fa-solid fa-spinner fa-spin text-2xl text-blue-500" /></div>
            ) : filteredDocs.length === 0 ? (
              <div className="text-center py-16 opacity-50">
                <i className="fa-solid fa-folder-open text-4xl text-slate-300 mb-3 block" />
                <p className="font-black text-slate-500 text-xs">Belum ada materi di divisi ini.</p>
              </div>
            ) : (
              filteredDocs.map((doc) => {
                const isActive = activeDocId === doc.id;
                return (
                  <div key={doc.id} onClick={() => setActiveDocId(doc.id)} className={`p-4 rounded-2xl cursor-pointer transition-all border group ${isActive ? (isPinkTheme ? "bg-pink-50 border-pink-200 shadow-sm" : "bg-blue-50 border-blue-200 shadow-sm") : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${isActive ? (isPinkTheme ? "bg-pink-500 text-white border-pink-600" : "bg-blue-600 text-white border-blue-700") : "bg-slate-100 border-slate-200 group-hover:bg-white"}`}><i className={`${doc.icon || getIconByType(doc.type)} ${isActive ? "text-white" : ""} text-base`} /></div>
                        <div>
                          <h4 className={`text-[13px] font-black leading-tight mb-1 truncate max-w-[180px] ${isActive ? (isPinkTheme ? "text-pink-700" : "text-blue-800") : "text-slate-700"}`}>{doc.title}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{doc.type || "materi"}</p>
                        </div>
                      </div>
                      {canEdit && (
                        <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? "opacity-100" : ""}`}>
                          <button onClick={(e) => { e.stopPropagation(); handleOpenForm(doc); }} className="w-6 h-6 rounded-lg flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-amber-500 hover:border-amber-200 transition-colors"><i className="fa-solid fa-pen text-[9px]" /></button>
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(doc.id, doc.title); }} className="w-6 h-6 rounded-lg flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-colors"><i className="fa-solid fa-trash text-[9px]" /></button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* KOLOM KANAN: VIEWER & AREA PANEL INTERAKTIF AI */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-[2rem] shadow-sm flex flex-col h-[750px] overflow-hidden relative">
          {activeDoc ? (
            <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
              
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0 sticky top-0 z-30 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-blue-50`}><i className={activeDoc.icon || getIconByType(activeDoc.type)} /></div>
                  <div>
                    <h2 className="text-sm md:text-base font-black text-slate-800 leading-tight">{activeDoc.title}</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{new Date(activeDoc.created_at || Date.now()).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}</p>
                  </div>
                </div>
                {activeDoc.file_url && !activeDoc.file_url.includes("/text-only") && (
                  <a href={activeDoc.file_url} target="_blank" rel="noreferrer" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 bg-white px-3 py-2 rounded-xl border border-slate-200 transition-colors shadow-sm flex items-center gap-2">Buka Eksternal <i className="fa-solid fa-arrow-up-right-from-square" /></a>
                )}
              </div>

              {(activeDoc.content || activeDoc.description) && (
                <div className="px-6 py-5 border-b border-slate-100 bg-white">
                  <p className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">{activeDoc.content || activeDoc.description}</p>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════════
                  🔥 SEKTOR DASHBOARD INTERAKTIF AI ORCHESTRATION 
              ══════════════════════════════════════════════════════════════ */}
              <div className="p-6 sm:p-8 bg-slate-50/50 space-y-8 border-b border-slate-100">
                
                {/* Header Status */}
                <div className="p-5 rounded-[2rem] bg-gradient-to-r from-[#0b1437] to-[#162447] border border-blue-500/30 shadow-lg flex flex-col sm:flex-row items-start sm:items-center gap-5 text-white">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-400 flex items-center justify-center text-blue-400 shrink-0"><i className="fa-solid fa-microchip text-2xl animate-pulse" /></div>
                  <div>
                    <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      Macrecen AI Active
                    </h4>
                    <p className="text-xs text-blue-100/80 leading-relaxed font-medium">
                      Sistem pintar <span className="font-bold text-white">MacrecenAI (Dual-Core Model Orchestration)</span> telah menyinkronkan parameter SOP ini. {isIntern ? "Gunakan asisten chat dan generator checklist di bawah untuk membedah panduan teknis ini dengan cepat." : "Parameter tugas kini dijadikan standar otomatis untuk memvalidasi logbook intern."}
                    </p>
                  </div>
                </div>

                {/* ALAT AI (KHUSUS TAMPIL BUAT INTERN) - SEKARANG STACK ATAS BAWAH! */}
                {isIntern && (
                  <div className="flex flex-col gap-8 items-stretch">
                    
                    {/* FITUR 1: ACTIONABLE CHECKLIST (TAMPILAN LEGA FULL WIDTH) */}
                    <div className="bg-white border border-slate-200 rounded-[2rem] p-6 sm:p-8 shadow-sm flex flex-col relative overflow-hidden">
                      {/* Dekorasi Air Blur */}
                      <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-50 rounded-full blur-3xl pointer-events-none"></div>

                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 relative z-10">
                        <div>
                          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2 mb-1"><i className="fa-solid fa-list-check text-blue-500 text-lg" /> Actionable Checklist</h3>
                          <p className="text-xs text-slate-500 font-medium">Ekstrak prosedur rumit ini menjadi barisan tugas praktis.</p>
                        </div>
                        <button onClick={handleGenerateBreakdown} disabled={isGenerating || breakdown.length > 0} className="px-5 py-3 bg-[#0b1437] hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest rounded-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md shrink-0">
                          {isGenerating ? <><i className="fa-solid fa-spinner fa-spin" /> Menganalisis...</> : <><i className="fa-solid fa-wand-magic-sparkles text-amber-400" /> Generate Checklist</>}
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto max-h-[350px] custom-scrollbar space-y-3 relative z-10">
                        {breakdown.length > 0 ? (
                          breakdown.map((step, index) => (
                            <div key={index} className="flex gap-3.5 text-sm font-medium leading-relaxed text-slate-700 bg-slate-50/80 p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2">
                              <span className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-blue-500 font-black flex items-center justify-center shrink-0 shadow-sm">{index + 1}</span>
                              <span className="pt-1">{step}</span>
                            </div>
                          ))
                        ) : (
                          <div className="bg-slate-50 border border-slate-100 border-dashed rounded-2xl p-10 text-center">
                            <i className="fa-solid fa-clipboard-list text-4xl text-slate-300 mb-3"></i>
                            <p className="text-xs text-slate-500 font-bold">Belum ada urutan checklist teknis.</p>
                            <p className="text-[11px] text-slate-400 font-medium mt-1">Klik tombol generate di atas untuk merombak teks SOP via Llama 4 Scout.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* FITUR 2: CHAT ASSISTANT (TAMPILAN BUBBLE LEGA) */}
                    <div className="bg-gradient-to-br from-indigo-50/80 to-white border border-indigo-100 rounded-[2rem] p-4 sm:p-8 shadow-sm flex flex-col relative overflow-hidden w-full max-w-full">
                      <div className="mb-5 px-1">
                        <h3 className="text-sm font-black uppercase tracking-wider text-indigo-900 flex items-center gap-2 mb-1"><i className="fa-solid fa-robot text-indigo-500 text-lg" /> Tanya Macrecen AI</h3>
                        <p className="text-xs text-indigo-900/60 font-medium">Bingung sama isi panduan? Tanyain aja ke asisten pinter ini.</p>
                      </div>
                      
                      {/* Kotak Chat Respons */}
                      <div className="flex-1 min-h-[120px] bg-white p-4 sm:p-5 rounded-2xl border border-indigo-100/60 shadow-inner text-sm text-slate-700 font-medium mb-5 w-full break-words">
                        {answer ? (
                          <div className="animate-in fade-in slide-in-from-bottom-1 w-full max-w-full">
                            <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-[9px] font-black uppercase tracking-widest rounded-lg mb-3">Jawaban Macrecen AI:</span>
                            <p className="leading-relaxed whitespace-pre-wrap word-break break-words w-full">{answer}</p>
                          </div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-center opacity-50 px-2">
                            <i className="fa-regular fa-comments text-3xl text-indigo-300 mb-2"></i>
                            <p className="text-xs text-indigo-900 font-bold">Belum ada obrolan.</p>
                          </div>
                        )}
                      </div>

                      {/* Input Prompts */}
                      <form onSubmit={handleAskAI} className="flex gap-2 sm:gap-3 w-full shrink-0">
                        <input 
                          type="text" 
                          value={question} 
                          onChange={(e) => setQuestion(e.target.value)} 
                          placeholder="Contoh: Jika server down dadakan?" 
                          className="flex-1 min-w-0 bg-white border border-slate-200 rounded-xl px-3 sm:px-4 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/30 shadow-sm transition-all" 
                          disabled={isAsking} 
                        />
                        <button 
                          type="submit" 
                          disabled={isAsking || !question.trim()} 
                          className="px-4 sm:px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-40 shrink-0"
                        >
                          {isAsking ? <i className="fa-solid fa-ellipsis fa-fade text-lg" /> : <><i className="fa-solid fa-paper-plane" /> <span className="hidden sm:inline">Kirim</span></>}
                        </button>
                      </form>
                    </div>

                  </div>
                )}
              </div>

              {/* 📄 MEDIA PREVIEW DISPLAY IFRAME */}
              <div className="w-full bg-slate-100 relative min-h-[400px] flex-1">
                {activeDoc.file_url && activeDoc.file_url.includes("/text-only") ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 opacity-40">
                    <i className="fa-solid fa-align-left text-6xl text-slate-300 mb-4" />
                    <p className="font-bold text-slate-500">Materi ini hanya berisi teks keterangan di atas.</p>
                  </div>
                ) : activeDoc.icon?.includes("fa-link") ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4 border border-blue-100 text-blue-400"><i className="fa-solid fa-link text-3xl" /></div>
                    <h3 className="font-black text-slate-700 mb-2">Tautan Web Eksternal</h3>
                    <p className="text-sm font-medium text-slate-500 mb-6">Materi ini diarahkan ke halaman website luar.</p>
                    <a href={activeDoc.file_url} target="_blank" rel="noreferrer" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-md hover:bg-blue-700 transition-colors">Buka Tautan <i className="fa-solid fa-arrow-right ml-1" /></a>
                  </div>
                ) : (
                  <iframe src={getEmbedUrl(activeDoc.file_url)} title={activeDoc.title} className="absolute inset-0 w-full h-full border-0 shadow-inner" allowFullScreen />
                )}
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
              <div className="w-20 h-20 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-3xl text-slate-300 mb-4 shadow-inner"><i className="fa-regular fa-folder-open" /></div>
              <h3 className="text-base font-black text-slate-700 mb-2">Pilih Materi Panduan</h3>
              <p className="text-xs font-medium text-slate-500 max-w-sm">Klik salah satu dokumen di sebelah kiri untuk melihat isi SOP. Dokumen yang tampil di sini terintegrasi dengan mesin AI penilai logbook.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL FORM CMS */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-[#0b1437]/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2"><i className="fa-solid fa-file-signature text-blue-500" />{formData.id ? "Edit Konten SOP" : "Buat Konten SOP Baru"}</h2>
              <button onClick={() => setIsFormOpen(false)} className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 hover:bg-rose-500 hover:text-white transition-colors flex items-center justify-center"><i className="fa-solid fa-xmark" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Tipe Materi</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "text", label: "Teks Artikel", icon: "fa-align-left" },
                    { id: "gdrive", label: "Google Drive", icon: "fa-google-drive", brand: true },
                    { id: "video", label: "Video YouTube", icon: "fa-youtube", brand: true },
                    { id: "link", label: "Link Eksternal", icon: "fa-link" },
                  ].map(opt => (
                    <button key={opt.id} type="button" onClick={() => setFormData({ ...formData, type: opt.id })} className={`flex flex-col items-center justify-center p-3 rounded-xl border text-[10px] font-black uppercase tracking-wider gap-2 transition-all ${formData.type === opt.id ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
                      <i className={`${opt.brand ? 'fa-brands' : 'fa-solid'} ${opt.icon} text-lg ${formData.type === opt.id ? 'text-blue-500' : 'text-slate-400'}`} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Judul Materi <span className="text-rose-500">*</span></label>
                <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Misal: Prosedur Reset Server Database..." className="w-full p-3.5 rounded-xl border outline-none text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 bg-slate-50 border-slate-200 transition-all" />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2 flex justify-between"><span>Isi / Keterangan Teks</span><span className="text-slate-400 normal-case tracking-normal">(Opsional)</span></label>
                <textarea rows="4" value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} placeholder="Tulis penjelasan, ringkasan, atau instruksi langkah-langkah di sini..." className="w-full p-3.5 rounded-xl border outline-none text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 bg-slate-50 border-slate-200 transition-all resize-none" />
              </div>

              {formData.type !== "text" && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2 flex justify-between"><span>{formData.type === 'video' ? 'URL YouTube / Video' : formData.type === 'gdrive' ? 'URL Google Drive' : 'URL Link Web'}</span><span className="text-rose-500 normal-case tracking-normal">(Wajib)</span></label>
                  <input type="url" required value={formData.file_url} onChange={(e) => setFormData({ ...formData, file_url: e.target.value })} placeholder="https://..." className="w-full p-3.5 rounded-xl border outline-none text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 bg-slate-50 border-slate-200 transition-all" />
                </div>
              )}
            </form>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-3 shrink-0">
              <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all bg-white text-slate-500 hover:bg-slate-100 border border-slate-200 shadow-sm">Batal</button>
              <button type="submit" onClick={handleSubmit} className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 ${isPinkTheme ? "bg-pink-500 hover:bg-pink-600 shadow-pink-500/30" : isDarkBlueTheme ? "bg-blue-800 hover:bg-blue-900 shadow-blue-800/30" : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/30"}`}><i className="fa-solid fa-cloud-arrow-up" /> Simpan Materi</button>
            </div>
          </div>
        </div>
      )}

      {/* PORTAL CONFIRMATION MODAL CUSTOM */}
      {modalState.isOpen && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-[#0b1437]/60 backdrop-blur-sm animate-in fade-in">
          <ConfirmModal {...modalState} onClose={closeModal} isDark={false} />
        </div>,
        document.body
      )}

    </div>
  );
};

export default Whitebook;