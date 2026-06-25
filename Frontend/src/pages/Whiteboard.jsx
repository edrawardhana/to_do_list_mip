import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom"; 
import { useAuth } from "../contexts/AuthContext"; 
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios"; 
import toast from "react-hot-toast";
import ConfirmModal from "../components/ui/ConfirmModal"; 

const getEmbedUrl = (url) => {
  if (!url) return "";
  
  // Convert Google Drive link
  if (url.includes("drive.google.com") && url.includes("/view")) {
    return url.replace("/view", "/preview").split("?")[0];
  }
  // Convert YouTube standard link
  if (url.includes("youtube.com/watch?v=")) {
    return url.replace("watch?v=", "embed/").split("&")[0];
  }
  // Convert YouTube short link
  if (url.includes("youtu.be/")) {
    return url.replace("youtu.be/", "youtube.com/embed/").split("?")[0];
  }
  return url;
};

const isEmbeddable = (url) => {
  return url && (url.includes("youtube.com") || url.includes("youtu.be") || url.includes("drive.google.com"));
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
  const { user, isAdmin, isSuperAdmin, userTheme } = useAuth();
  const queryClient = useQueryClient();

  const canEdit = isAdmin && !isSuperAdmin;
  const canViewAll = isSuperAdmin;
  const isIntern = !isAdmin && !isSuperAdmin; 
  
  const myDivision = user?.division?.name || user?.division_name || "IT Support";

  const isPinkTheme = userTheme === "super_admin";           
  const isDarkBlueTheme = userTheme === "admin"; 

  const [selectedDiv, setSelectedDiv] = useState(canViewAll ? "semua" : myDivision);
  const [activeDocId, setActiveDocId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [formData, setFormData] = useState({
    id: null,
    title: "",
    type: "link",
    file_url: "",
    content: "", 
  });

  // State Integrasi Interaktif AI
  const [checklistLogs, setChecklistLogs] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [aiToken, setAiToken] = useState(null);

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

  const { data: divisionsList = [] } = useQuery({
    queryKey: ["divisionsList"],
    queryFn: async () => {
      const res = await api.get("/divisions");
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    },
    enabled: canViewAll, 
    staleTime: 10 * 60 * 1000,
  });

  const filteredDocs = useMemo(() => {
    if (!documents || documents.length === 0) return [];

    return documents.filter((doc) => {
      // 1. Tangkep nama dari backend (kalau ada)
      let rawDiv = doc.category || doc.division?.name || doc.division_name || doc.division;

      // 🔥 2. FIX: Terjemahin ID divisi pake divisionsList dari API!
      if (!rawDiv && doc.division_id && divisionsList.length > 0) {
        const matchedDiv = divisionsList.find(d => d.id === doc.division_id);
        if (matchedDiv) {
          rawDiv = matchedDiv.name;
        }
      }

      rawDiv = rawDiv || "Unknown";

      // 3. Bersihin spasi dan kecilin huruf
      const docDivName = String(rawDiv).toLowerCase().trim();
      const selected = String(selectedDiv).toLowerCase().trim();

      let matchDiv = true;
      if (canViewAll && selected !== "semua" && selected !== "semua divisi") {
        // 🔥 Pake includes biar kebal typo (IT tembus ke IT Support)
        matchDiv = docDivName.includes(selected) || selected.includes(docDivName);
      }

      const matchSearch = (doc.title || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchDiv && matchSearch;
    });
  }, [documents, selectedDiv, searchQuery, canViewAll, divisionsList]); 

  useEffect(() => {
    if (filteredDocs.length > 0 && (!activeDocId || !filteredDocs.find(d => d.id === activeDocId))) {
      setActiveDocId(filteredDocs[0].id);
    }
  }, [filteredDocs, activeDocId]);

  const groupedDocs = useMemo(() => {
    const groups = {};
    filteredDocs.forEach(doc => {
      let rawDiv = doc.category || doc.division?.name || doc.division_name || doc.division;
      if (!rawDiv && doc.division_id && divisionsList.length > 0) {
        const matchedDiv = divisionsList.find(d => d.id === doc.division_id);
        if (matchedDiv) rawDiv = matchedDiv.name;
      }
      const divName = rawDiv || "General / Umum";
      
      if (!groups[divName]) groups[divName] = [];
      groups[divName].push(doc);
    });
    return groups;
  }, [filteredDocs, divisionsList]);

  const activeDoc = useMemo(() => filteredDocs.find((d) => d.id === activeDocId), [filteredDocs, activeDocId]);

  useEffect(() => {
    if (activeDocId) {
      const savedHistory = localStorage.getItem(`checklist_logs_doc_${activeDocId}`);
      if (savedHistory) {
        setChecklistLogs(JSON.parse(savedHistory));
      } else {
        setChecklistLogs([]);
      }
    }
    setQuestion("");
    setAnswer("");
  }, [activeDocId]);

  const handleGenerateBreakdown = async () => { 
    
    const sopText = activeDoc?.content || activeDoc?.description || activeDoc?.title;

    if (!sopText) return toast.error("Teks SOP kosong!");

    setIsGenerating(true);
    const toastId = toast.loading("AI sedang membedah SOP...");

    try {
      // Nembak ke endpoint IDE 1 lu
      const res = await api.post("/ai/generate-breakdown", {
        sop_text: sopText,
        division_name: myDivision,
      });

      const newChecklist = res.data?.data || [];
      setChecklistLogs((prevLogs) => {
        const newLog = {
          id: Date.now(),
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          items: newChecklist
        };
        const updatedLogs = [...prevLogs, newLog].slice(-3); // Mentok 3 versi
        
        localStorage.setItem(`checklist_logs_doc_${activeDocId}`, JSON.stringify(updatedLogs));
        
        return updatedLogs;
      });

      toast.success("Checklist berhasil di-generate dan tersimpan di riwayat!", { id: toastId });

    } catch (error) {
      console.error("AI Error:", error.response?.data || error.message);
      const errMsg = error.response?.data?.message || "AI gagal merespons. Cek Console F12.";
      toast.error(errMsg, { id: toastId });
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
      
      // Update sisa token dari response backend
      if (res.data?.remaining_quota !== undefined) {
        setAiToken(res.data.remaining_quota);
      }
      setQuestion(""); // Kosongin form setelah nanya
    } catch (error) {
      console.error(error);
      
      // 🔥 TANGKEP ERROR LIMIT 429 DARI BACKEND
      if (error.response?.status === 429) {
        setAiToken(0); // Gembok form!
        toast.error(error.response?.data?.message || "Limit harian AI habis!");
      } else {
        toast.error(
          error.response?.data?.message?.replace(/Qwen\s*3?/gi, 'MacrecenAI') 
          || "Sistem Macrecen AI sedang sibuk, coba beberapa detik lagi."
        );
      }
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
      const isFileUpload = ["pdf", "video", "image"].includes(formData.type);
      let payload;
      let headers = {};

      if (isFileUpload) {
        payload = new FormData();
        payload.append("title", formData.title);
        payload.append("type", formData.type);
        payload.append("icon", getIconByType(formData.type));
        
        if (formData.file_upload) {
          payload.append("file", formData.file_upload); 
        }
        if (formData.id) {
          payload.append("_method", "PUT");
        }
        headers = { "Content-Type": "multipart/form-data" };
      } else {
        payload = {
          title: formData.title,
          content: formData.content,       
          description: formData.content,   
          icon: getIconByType(formData.type), 
          type: ["text", "gdrive", "youtube"].includes(formData.type) ? "link" : formData.type,
          file_url: formData.type === "text" ? `${window.location.origin}/text-only` : formData.file_url
        };
      }

      // Hit API-nya
      let res;
      if (formData.id) {
        if (isFileUpload) {
          res = await api.post(`/whiteboards/${formData.id}`, payload, { headers }); 
        } else {
          res = await api.put(`/whiteboards/${formData.id}`, payload); 
        }
      } else {
        res = await api.post("/whiteboards", payload, { headers }); 
      }

      toast.success("Materi berhasil disimpan!", { id: tid });
      setIsFormOpen(false);
      queryClient.invalidateQueries(["whitebooksData"]);

      if (res.data?.data?.id) {
        setActiveDocId(res.data.data.id);
      }

    } catch (error) {
      const errorMsg = error.response?.data?.errors?.file?.[0] 
                    || error.response?.data?.message 
                    || "Gagal memvalidasi data ke server.";
      toast.error(errorMsg, { id: tid });
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
          <div className="flex flex-wrap gap-2">
            
            <button 
              onClick={() => setSelectedDiv("semua")} 
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${selectedDiv === "semua" ? (isPinkTheme ? "bg-pink-500 text-white border-pink-500 shadow-md shadow-pink-500/20" : isDarkBlueTheme ? "bg-blue-800 text-white border-blue-800 shadow-md shadow-blue-800/20" : "bg-cyan-600 text-white border-cyan-600 shadow-md shadow-cyan-500/20") : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"}`}
            >
              Semua Divisi
            </button>
            
            {divisionsList.map(div => (
              <button 
                key={div.id} 
                onClick={() => setSelectedDiv(div.name)} 
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${selectedDiv === div.name ? (isPinkTheme ? "bg-pink-500 text-white border-pink-500 shadow-md shadow-pink-500/20" : isDarkBlueTheme ? "bg-blue-800 text-white border-blue-800 shadow-md shadow-blue-800/20" : "bg-cyan-600 text-white border-cyan-600 shadow-md shadow-cyan-500/20") : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"}`}
              >
                {div.name}
              </button>
            ))}

          </div>
        </div>
      )}

      {/* CORE LAYOUT GRID */}
      <div className="flex flex-col lg:flex-row items-start gap-6 md:gap-8 w-full transition-all duration-500 ease-in-out">

        {/* SIDEBAR LEFT */}
        <div className={`bg-white border border-slate-200 rounded-[2rem] shadow-sm flex flex-col max-h-[750px] transition-all duration-500 ease-in-out origin-left shrink-0 ${
          isSidebarOpen 
            ? "w-full lg:w-[32%] opacity-100 scale-100" 
            : "w-0 opacity-0 scale-95 overflow-hidden !border-0 !p-0 !m-0 !gap-0" // Paksa hilangin ruang kalau ditutup
        }`}>
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
              <>
                {/* Render pakai groupedDocs biar kepisah per divisi */}
                {Object.entries(groupedDocs).map(([divName, docsInDiv]) => (
                  <div key={divName} className="mb-4 last:mb-0">
                    
                    {/* Munculin Header Divisi cuma pas milih "semua" */}
                    {selectedDiv === "semua" && (
                      <div className="flex items-center gap-3 mb-3 px-1 mt-6 first:mt-0">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${isPinkTheme ? "text-pink-500 bg-pink-50 border-pink-200" : "text-blue-500 bg-blue-50 border-blue-200"}`}>
                          <i className="fa-solid fa-layer-group mr-1"></i> {divName}
                        </span>
                        <span className="h-px bg-slate-200 flex-1"></span>
                      </div>
                    )}

                    {/* Render List SOP di dalem divisi tersebut */}
                    <div className="space-y-2">
                      {docsInDiv.map((doc) => {
                        const isActive = activeDocId === doc.id;
                        return (
                          <div key={doc.id} onClick={() => setActiveDocId(doc.id)} className={`p-4 rounded-2xl cursor-pointer transition-all border group ${isActive ? (isPinkTheme ? "bg-pink-50 border-pink-200 shadow-sm" : "bg-blue-50 border-blue-200 shadow-sm") : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50"}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 min-w-0">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${isActive ? (isPinkTheme ? "bg-pink-500 text-white border-pink-600" : "bg-blue-600 text-white border-blue-700") : "bg-slate-100 border-slate-200 group-hover:bg-white"}`}>
                                  <i className={`${doc.icon || getIconByType(doc.type)} ${isActive ? "text-white" : ""} text-base`} />
                                </div>
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
                      })}
                    </div>
                  </div>
                ))}
              </>
            )} 
          </div>
        </div>
    
        {/* KOLOM KANAN: VIEWER & AREA PANEL INTERAKTIF AI */}
        <div className={`bg-white border border-slate-200 rounded-[2rem] shadow-sm flex flex-col h-[750px] relative transition-all duration-500 ease-in-out overflow-hidden ${
          isSidebarOpen ? "w-full lg:w-[68%]" : "w-full"
        }`}>
          {activeDoc ? (
            <div className="flex-1 w-full flex flex-col overflow-hidden">

              {/* Header Konten */}
              <div className="p-5 md:p-8 border-b shrink-0 bg-slate-50/50 border-slate-100 flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start md:items-center gap-4">

                  {/* TOMBOL TOGGLE SIDEBAR */}
                  <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                    className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-600 flex items-center justify-center shrink-0 transition-all border border-slate-200 shadow-sm active:scale-95"
                    title={isSidebarOpen ? "Tutup Daftar SOP" : "Buka Daftar SOP"}
                  >
                    <i className={`fa-solid ${isSidebarOpen ? "fa-outdent" : "fa-indent"} text-lg transition-transform duration-300`}></i>
                  </button>

                  {/* LOGO ICON DIVISI */}
                  <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-2xl md:text-3xl shadow-lg shrink-0 ${
                    isPinkTheme ? "bg-pink-500 text-white shadow-pink-500/20" : 
                    isDarkBlueTheme ? "bg-blue-800 text-white shadow-blue-800/20" : 
                    "bg-blue-500 text-white shadow-blue-500/20"
                  }`}>
                    <i className={`${activeDoc.icon || getIconByType(activeDoc.type)} !text-white`}></i>
                  </div>

                  {/* JUDUL DOKUMEN SOP */}
                  <div className="min-w-0">
                    <h2 className="text-xl md:text-3xl font-black tracking-tight leading-tight mb-2 text-slate-800 pr-2">
                      {activeDoc.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                      <span className={`text-[9px] md:text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest border ${
                        isPinkTheme ? "bg-pink-50 text-pink-600 border-pink-200" : 
                        isDarkBlueTheme ? "bg-blue-50 text-blue-800 border-blue-200" : 
                        "bg-blue-50 text-blue-600 border-blue-200"
                      }`}>
                        Verified SOP
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tombol Aksi (Hanya tampil jika canEdit = True) */}
                {canEdit && (
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-auto w-full md:w-auto mt-2 md:mt-0">
                    <button onClick={() => handleOpenForm(activeDoc)} className="flex-1 md:flex-none justify-center px-4 py-2 border rounded-xl text-[10px] md:text-[11px] font-black transition-colors shadow-sm flex items-center gap-1.5 bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100">
                      <i className="fa-solid fa-pen-to-square"></i> Edit
                    </button>
                    <button onClick={() => handleDelete(activeDoc.id, activeDoc.title)} className="flex-1 md:flex-none justify-center px-4 py-2 border rounded-xl text-[10px] md:text-[11px] font-black transition-colors shadow-sm flex items-center gap-1.5 bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100">
                      <i className="fa-solid fa-trash"></i> Hapus
                    </button>
                  </div>
                )}
              </div>

              {/* 🔥 WRAPPER UTAMA BIAR TEKS, AI, DAN MEDIA PREVIEW BERJAJAR RAPI KE BAWAH */}
             <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/20 p-4 md:p-6 space-y-6 w-full">
                
                {/* 📝 SEKSI 1: KETERANGAN TEKS SOP */}
                {(activeDoc.content || activeDoc.description) && (
                  <div className={`bg-white p-5 md:p-8 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 ${activeDoc.file_url?.includes("/text-only") ? "flex-1" : ""}`}>
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-1.5 select-none border-b border-slate-100 pb-3">
                      <i className="fa-solid fa-align-left text-blue-500"></i> {activeDoc.file_url?.includes("/text-only") ? "Isi Dokumen Artikel" : "Detail Keterangan SOP"}
                    </h4>
                    <p className="text-sm md:text-[15px] text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                      {activeDoc.content || activeDoc.description}
                    </p>
                  </div>
                )}

                {/* 📄 SEKSI 3: MEDIA PREVIEW DISPLAY IFRAME */}
                <div className="w-full">
                  {activeDoc.type === "image" && (
                    <img src={activeDoc.file_url} alt={activeDoc.title} className="max-w-full h-auto rounded-xl border border-slate-200 shadow-sm mx-auto" />
                  )}
                  
                  {activeDoc.type === "pdf" && (
                    <iframe src={activeDoc.file_url} className="w-full h-[400px] sm:h-[500px] md:h-[600px] rounded-xl border border-slate-200 shadow-sm bg-white"></iframe>
                  )}

                  {/* Render YouTube / G-Drive */}
                  {activeDoc.type === "link" && isEmbeddable(activeDoc.file_url) && (
                    <div className="w-full h-[400px] sm:h-[500px] md:h-[600px] rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-black">
                      <iframe src={getEmbedUrl(activeDoc.file_url)} className="w-full h-full border-0" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>
                    </div>
                  )}

                  {/* Fallback kalau link-nya bukan YouTube/G-Drive (misal link web biasa) */}
                  {(!activeDoc.type || (activeDoc.type === "link" && !isEmbeddable(activeDoc.file_url))) && !activeDoc.file_url?.includes("/text-only") && (
                    <div className="text-center py-12 md:py-16 max-w-sm mx-auto animate-in fade-in zoom-in-95 bg-white border border-slate-200 rounded-2xl shadow-sm mt-4">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200 shadow-inner">
                        <i className="fa-solid fa-arrow-up-right-from-square text-2xl text-blue-400"></i>
                      </div>
                      <h3 className="text-base font-black text-slate-800 mb-2">Tautan Web Eksternal</h3>
                      <p className="mb-5 text-xs font-medium text-slate-500 px-4">Dokumen dialihkan ke layanan eksternal.</p>
                      <a href={activeDoc.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md transition-all">
                        Buka Dokumen Sekarang <i className="fa-solid fa-arrow-right"></i>
                      </a>
                    </div>
                  )}
                </div>

                {/* 🤖 SEKSI 2: FITUR AI (KHUSUS INTERN) */}
                {isIntern && (
                  <div className="flex flex-col gap-6 items-stretch">
                    
                    {/* FITUR 1: ACTIONABLE CHECKLIST (SISTEM HISTORY / APPEND) */}
                    <div className="bg-white border border-slate-200 rounded-[2rem] p-6 sm:p-8 shadow-sm flex flex-col relative overflow-hidden">
                      <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-50 rounded-full blur-3xl pointer-events-none"></div>
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-5 flex gap-3 shadow-sm relative z-10 animate-in fade-in">
                        <i className="fa-solid fa-triangle-exclamation text-amber-500 mt-0.5 text-sm shrink-0"></i>
                        <div className="text-[10px] md:text-[11px] text-amber-800 font-medium leading-relaxed">
                          <strong className="block text-amber-900 mb-1 tracking-wide">⚠️ Syarat & Ketentuan Generate AI</strong>
                          Hasil analisis AI akan tersimpan otomatis di riwayat tab ini. Maksimal perombakan SOP adalah <b>3 Versi</b>. Tombol akan dikunci permanen jika batas versi telah penuh.
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 relative z-10">
                        <div>
                          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2 mb-1"><i className="fa-solid fa-list-check text-blue-500 text-lg" /> Actionable Checklist</h3>
                          <p className="text-xs text-slate-500 font-medium">Ekstrak prosedur rumit ini menjadi barisan tugas praktis.</p>
                        </div>

                        <button 
                          onClick={handleGenerateBreakdown} 
                          disabled={isGenerating || checklistLogs.length >= 3} 
                          className={`px-5 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shrink-0 
                            ${checklistLogs.length >= 3 
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300' 
                              : 'bg-[#0b1437] hover:bg-blue-700 text-white disabled:opacity-50'}`}
                        >
                          {isGenerating 
                            ? <><i className="fa-solid fa-spinner fa-spin" /> Menganalisis...</> 
                            : checklistLogs.length >= 3 
                              ? <><i className="fa-solid fa-lock text-slate-400" /> Limit 3 Versi Penuh</>
                              : <><i className="fa-solid fa-wand-magic-sparkles text-amber-400" /> Generate Checklist</>
                          }
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto max-h-[350px] custom-scrollbar space-y-4 relative z-10 pr-2">
                        {checklistLogs && checklistLogs.length > 0 ? (
                          checklistLogs.map((log, logIndex) => (
                            <div key={log.id} className="flex flex-col bg-slate-50/80 p-5 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2 relative">
                              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200/60">
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-100 px-2.5 py-1 rounded-md">
                                  Versi {logIndex + 1}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">
                                  <i className="fa-regular fa-clock mr-1"></i> {log.time}
                                </span>
                              </div>
                              <div className="space-y-3">
                                {log.items.map((step, idx) => (
                                  <div key={idx} className="flex gap-3.5 text-sm font-medium leading-relaxed text-slate-700">
                                    <span className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-blue-500 text-xs font-black flex items-center justify-center shrink-0 shadow-sm">{idx + 1}</span>
                                    <span className="pt-0.5">{step}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="bg-slate-50 border border-slate-100 border-dashed rounded-2xl p-10 text-center">
                            <i className="fa-solid fa-clipboard-list text-4xl text-slate-300 mb-3"></i>
                            <p className="text-xs text-slate-500 font-bold">Belum ada urutan checklist teknis.</p>
                            <p className="text-[11px] text-slate-400 font-medium mt-1">Klik tombol generate di atas untuk merombak teks SOP via AI.</p>
                          </div>
                        )}
                        {isGenerating && checklistLogs && checklistLogs.length > 0 && (
                           <div className="flex items-center justify-center p-4 bg-slate-50 border border-slate-100 border-dashed rounded-2xl animate-pulse">
                              <p className="text-xs font-bold text-slate-400"><i className="fa-solid fa-robot fa-bounce text-blue-400 mr-2"></i> AI sedang menyusun versi baru...</p>
                           </div>
                        )}
                      </div>
                    </div>

                    {/* FITUR 2: CHAT ASSISTANT (LIMIT 5 TOKEN) */}
                    <div className="bg-gradient-to-br from-indigo-50/80 to-white border border-indigo-100 rounded-[2rem] p-4 sm:p-8 shadow-sm flex flex-col relative overflow-hidden w-full max-w-full">
                      <div className="mb-5 px-1">
                        <h3 className="text-sm font-black uppercase tracking-wider text-indigo-900 flex items-center gap-2 mb-1"><i className="fa-solid fa-robot text-indigo-500 text-lg" /> Tanya Macrecen AI</h3>
                        <p className="text-xs text-indigo-900/60 font-medium">Bingung sama isi panduan? Tanyain aja ke asisten pinter ini.</p>
                      </div>
                      
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

                      <form onSubmit={handleAskAI} className="flex flex-col w-full shrink-0">
                        <div className="flex gap-2 sm:gap-3 w-full">
                          <input 
                            type="text" 
                            value={question} 
                            onChange={(e) => setQuestion(e.target.value)} 
                            placeholder={aiToken === 0 ? "Limit harian habis..." : "Contoh: Jika server down dadakan?"} 
                            className={`flex-1 min-w-0 bg-white border border-slate-200 rounded-xl px-3 sm:px-4 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-slate-700 outline-none shadow-sm transition-all ${aiToken === 0 ? "bg-slate-100 cursor-not-allowed opacity-60" : "focus:ring-2 focus:ring-indigo-500/30"}`} 
                            disabled={isAsking || aiToken === 0} 
                          />
                          <button 
                            type="submit" 
                            disabled={isAsking || !question.trim() || aiToken === 0} 
                            className="px-4 sm:px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                          >
                            {isAsking ? <i className="fa-solid fa-ellipsis fa-fade text-lg" /> : <><i className="fa-solid fa-paper-plane" /> <span className="hidden sm:inline">Kirim</span></>}
                          </button>
                        </div>
                        
                        <div className="mt-2 ml-1 flex justify-between items-center">
                          <p className={`text-[10px] font-black uppercase tracking-widest ${aiToken === 0 ? "text-rose-500" : "text-indigo-400"}`}>
                            {aiToken === 0 
                              ? <><i className="fa-solid fa-lock mr-1"></i> Akses Chat Digembok Sementara</>
                              : <><i className="fa-solid fa-coins mr-1"></i> Jatah Tanya: {aiToken !== null ? `${aiToken} Token` : 'Tersedia'}</>
                            }
                          </p>
                        </div>
                      </form>
                    </div>
                  </div>
                )}  
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 min-h-[500px]">
              <div className="w-20 h-20 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-3xl text-slate-300 mb-4 shadow-inner"><i className="fa-regular fa-folder-open" /></div>
              <h3 className="text-base font-black text-slate-700 mb-2">Pilih Materi Panduan</h3>
              <p className="text-xs font-medium text-slate-500 max-w-sm">Klik salah satu dokumen di sebelah kiri untuk melihat isi SOP. Dokumen yang tampil di sini terintegrasi dengan mesin AI penilai logbook.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL FORM CMS */}
      {isFormOpen && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 bg-[#0b1437]/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 border border-slate-200 flex flex-col max-h-[90vh]">
            
            {/* HEADER MODAL */}
            <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <h2 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
                <i className="fa-solid fa-file-signature text-blue-500" />
                {formData.id ? "Edit Konten SOP" : "Buat Konten SOP Baru"}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 hover:bg-rose-500 hover:text-white transition-colors flex items-center justify-center">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            {/* 🔥 FIX SAKTI: <form> ngebungkus scroll area dan footer, ditambah flex-1 min-h-0 */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              
              {/* AREA INPUT (Bisa di-scroll bebas, ga bakal dorong footer) */}
              <div className="p-5 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
                
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Judul Materi <span className="text-rose-500">*</span></label>
                  <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Misal: Prosedur Reset Server..." className="w-full p-3.5 rounded-xl border outline-none text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 bg-slate-50 border-slate-200 transition-all" />
                </div>

               <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Tipe Materi</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "text", label: "Artikel", icon: "fa-align-left" },
                      { id: "pdf", label: "File PDF", icon: "fa-file-pdf" },
                      { id: "video", label: "Video", icon: "fa-file-video" }, // 🔥 Opsi Video Ditambahin
                      { id: "image", label: "Gambar", icon: "fa-image" },
                      { id: "gdrive", label: "G-Drive", icon: "fa-google-drive", brand: true },
                      { id: "youtube", label: "YouTube", icon: "fa-youtube", brand: true },
                      { id: "link", label: "Eksternal", icon: "fa-link" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: opt.id })}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all gap-1.5 ${
                          formData.type === opt.id 
                            ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm" 
                            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        <i className={`${opt.brand ? 'fa-brands' : 'fa-solid'} ${opt.icon} text-lg mb-1 ${formData.type === opt.id ? 'text-blue-500' : 'text-slate-400'}`}></i>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* RENDER KHUSUS: Teks Artikel */}
                {formData.type === "text" && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1.5 block text-slate-500">
                      Isi Artikel / Prosedur <span className="text-rose-500 normal-case tracking-normal">(Wajib)</span>
                    </label>
                    <textarea
                      required
                      rows="6"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Ketik isi panduan SOP di sini..."
                      className="w-full p-3.5 rounded-xl border outline-none text-sm font-medium focus:ring-2 focus:ring-blue-500/20 bg-slate-50 border-slate-200 resize-none"
                    ></textarea>
                  </div>
                )}

                {/* RENDER KHUSUS: URL & Peringatan TnC */}
                {["pdf", "video", "image"].includes(formData.type) && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1.5 block text-slate-500">
                      Upload File {formData.type.toUpperCase()} <span className="text-rose-500 normal-case tracking-normal">(Wajib)</span>
                    </label>
                    <input
                      type="file"
                      required={!formData.id} // Kalo edit, file kaga wajib diisi ulang
                      accept={formData.type === "pdf" ? ".pdf" : formData.type === "video" ? "video/mp4,video/webm" : "image/png,image/jpeg,image/webp"}
                      onChange={(e) => setFormData({ ...formData, file_upload: e.target.files[0] })}
                      className="w-full p-3 rounded-xl border outline-none text-sm font-medium focus:ring-2 focus:ring-blue-500/20 bg-slate-50 border-slate-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-black file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                    />

                    {/* KOTAK TnC WARNING */}
                    <div className="mt-3 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex gap-3 shadow-sm">
                      <i className="fa-solid fa-circle-exclamation text-rose-500 mt-0.5 text-sm shrink-0"></i>
                      <div className="text-[10px] md:text-[11px] text-rose-800 font-medium leading-relaxed">
                        <strong className="block text-rose-900 mb-1 tracking-wide">⚠️ Syarat & Ketentuan Upload</strong>
                        <p>1. Maksimal ukuran file adalah <b>10 MB</b> (Hindari beban server).</p>
                        <p>2. Pastikan format sesuai ({formData.type === "pdf" ? "Hanya .PDF" : formData.type === "video" ? "Hanya .MP4" : "Hanya .JPG / .PNG"}).</p>
                        <p>3. File dengan unsur sensitif/berbahaya akan langsung dihapus oleh sistem.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* RENDER KHUSUS: URL LINK (GDRIVE, YOUTUBE, LINK) */}
                {["gdrive", "youtube", "link"].includes(formData.type) && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1.5 block text-slate-500">
                      URL / Tautan Link <span className="text-rose-500 normal-case tracking-normal">(Wajib)</span>
                    </label>
                    <input
                      type="url"
                      required
                      value={formData.file_url}
                      onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                      placeholder="https://..."
                      className="w-full p-3.5 rounded-xl border outline-none text-sm font-medium focus:ring-2 focus:ring-blue-500/20 bg-slate-50 border-slate-200"
                    />

                    {(formData.type === "gdrive" || formData.type === "youtube") && (
                      <div className="mt-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex gap-3 shadow-sm">
                        <i className="fa-solid fa-triangle-exclamation text-amber-500 mt-0.5 text-sm shrink-0"></i>
                        <div className="text-[10px] md:text-[11px] text-amber-800 font-medium leading-relaxed">
                          <strong className="block text-amber-900 mb-1 tracking-wide">⚠️ Syarat Tautan Web Terbuka</strong>
                          {formData.type === "gdrive" ? (
                            <p>Pastikan akses Google Drive diatur ke <b>"Siapa saja yang memiliki tautan" (Public)</b>.</p>
                          ) : (
                            <p>Pastikan privasi video berstatus <b>Public</b> atau <b>Unlisted</b>.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div> {/* Tutup Scroll Area */}

              {/* FOOTER MODAL (Tombolnya nempel mutlak di bawah, kaga bakal kedorong) */}
              <div className="px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-3 shrink-0">
                <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all bg-white text-slate-500 hover:bg-slate-100 border border-slate-200 shadow-sm">Batal</button>
                <button type="submit" className="flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 shadow-blue-600/30">
                  <i className="fa-solid fa-cloud-arrow-up" /> Simpan
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}

      {/* PORTAL CONFIRMATION MODAL CUSTOM */}
      {modalState.isOpen && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-[#0b1437]/60 backdrop-blur-sm animate-in fade-in">
          <ConfirmModal {...modalState} onClose={closeModal} isDark={false} />
        </div>,
        document.body
      )}
    </div>
  );
};

export default Whitebook;