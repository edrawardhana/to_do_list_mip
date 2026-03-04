// src/pages/Home.jsx
const Home = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h1 className="text-2xl font-bold text-slate-800">
        Selamat datang di Dashboard Intern
      </h1>
      <p className="text-slate-600">
        Halaman ini akan menampilkan ringkasan tugas, kehadiran, dan pengumuman.
      </p>
      {/* Nanti Anda bisa tambahkan komponen SummaryCards, UpcomingTasks, dll */}
    </div>
  );
};

export default Home;
