import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';

export default function ManageSchedules() {
  const [schedules, setSchedules] = useState([]);
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  
  // Form state
  const [selectedIntern, setSelectedIntern] = useState('');
  const [shiftDate, setShiftDate] = useState('');
  const [shiftType, setShiftType] = useState('morning');
  const [filterDate, setFilterDate] = useState('');

  // Fetch schedules
  const fetchSchedules = async () => {
    try {
      const params = filterDate ? { date: filterDate } : {};
      const response = await api.get('/schedules', { params });
      setSchedules(response.data.data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error('Gagal memuat jadwal');
    }
  };

  // Fetch interns in same division
  const fetchInterns = async () => {
    try {
      const response = await api.get('/profiles');
      // Filter only interns in same division as admin
      const internList = response.data.data.filter(user => 
        user.role === 'intern' || user.role === 'user'
      );
      setInterns(internList);
    } catch (error) {
      console.error('Error fetching interns:', error);
      toast.error('Gagal memuat data intern');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSchedules(), fetchInterns()]);
      setLoading(false);
    };
    loadData();
  }, [filterDate]);

  // Handle create/update schedule
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedIntern || !shiftDate || !shiftType) {
      toast.error('Semua field harus diisi');
      return;
    }

    const tid = toast.loading(editingSchedule ? 'Mengupdate jadwal...' : 'Membuat jadwal...');

    try {
      const data = {
        user_id: selectedIntern,
        shift_date: shiftDate,
        shift_type: shiftType
      };

      if (editingSchedule) {
        await api.put(`/schedules/${editingSchedule.id}`, data);
        toast.success('Jadwal berhasil diupdate', { id: tid });
      } else {
        await api.post('/schedules', data);
        toast.success('Jadwal berhasil dibuat', { id: tid });
      }

      setShowModal(false);
      resetForm();
      fetchSchedules();
    } catch (error) {
      console.error('Error saving schedule:', error);
      const message = error.response?.data?.message || 'Gagal menyimpan jadwal';
      toast.error(message, { id: tid });
    }
  };

  // Handle delete schedule
  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus jadwal ini?')) return;

    const tid = toast.loading('Menghapus jadwal...');
    try {
      await api.delete(`/schedules/${id}`);
      toast.success('Jadwal berhasil dihapus', { id: tid });
      fetchSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Gagal menghapus jadwal', { id: tid });
    }
  };

  // Handle edit
  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setSelectedIntern(schedule.user_id);
    setShiftDate(schedule.shift_date);
    setShiftType(schedule.shift_type);
    setShowModal(true);
  };

  // Reset form
  const resetForm = () => {
    setEditingSchedule(null);
    setSelectedIntern('');
    setShiftDate('');
    setShiftType('morning');
  };

  // Get shift type label
  const getShiftLabel = (type) => {
    const labels = {
      morning: '🌅 Pagi (08:00 - 12:00)',
      afternoon: '🌆 Siang (13:00 - 17:00)',
      full: '🌞 Full Day (08:00 - 17:00)'
    };
    return labels[type] || type;
  };

  // Get shift badge color
  const getShiftBadge = (type) => {
    const badges = {
      morning: 'bg-blue-100 text-blue-700',
      afternoon: 'bg-orange-100 text-orange-700',
      full: 'bg-purple-100 text-purple-700'
    };
    return badges[type] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            📅 Manage Schedules
          </h1>
          <p className="text-slate-600">
            Kelola jadwal shift intern di divisi Anda
          </p>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* Filter Date */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-slate-700">
                Filter Tanggal:
              </label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              {filterDate && (
                <button
                  onClick={() => setFilterDate('')}
                  className="text-sm text-slate-500 hover:text-slate-700"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Add Button */}
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
            >
              <i className="fa-solid fa-plus"></i>
              Tambah Jadwal
            </button>
          </div>
        </div>

        {/* Schedules List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {schedules.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-semibold text-slate-700 mb-2">
                Belum Ada Jadwal
              </h3>
              <p className="text-slate-500 mb-6">
                Klik "Tambah Jadwal" untuk membuat jadwal shift intern
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Intern
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Shift
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Divisi
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {schedules.map((schedule) => (
                    <tr key={schedule.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                            {schedule.user?.full_name?.charAt(0) || 'I'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">
                              {schedule.user?.full_name || 'Unknown'}
                            </div>
                            <div className="text-xs text-slate-500">
                              {schedule.user?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-700">
                          {new Date(schedule.shift_date).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getShiftBadge(schedule.shift_type)}`}>
                          {getShiftLabel(schedule.shift_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600">
                          {schedule.user?.division?.name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(schedule)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(schedule.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">
                {editingSchedule ? '✏️ Edit Jadwal' : '➕ Tambah Jadwal'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Select Intern */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Pilih Intern <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedIntern}
                  onChange={(e) => setSelectedIntern(e.target.value)}
                  required
                  disabled={editingSchedule}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <option value="">-- Pilih Intern --</option>
                  {interns.map((intern) => (
                    <option key={intern.id} value={intern.id}>
                      {intern.full_name} - {intern.division?.name || 'No Division'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Shift Date */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Tanggal Shift <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={shiftDate}
                  onChange={(e) => setShiftDate(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Shift Type */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Tipe Shift <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'morning', label: '🌅 Pagi', time: '08:00 - 12:00' },
                    { value: 'afternoon', label: '🌆 Siang', time: '13:00 - 17:00' },
                    { value: 'full', label: '🌞 Full Day', time: '08:00 - 17:00' }
                  ].map((shift) => (
                    <label
                      key={shift.value}
                      className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        shiftType === shift.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="shiftType"
                        value={shift.value}
                        checked={shiftType === shift.value}
                        onChange={(e) => setShiftType(e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-slate-800">{shift.label}</div>
                        <div className="text-xs text-slate-500">{shift.time}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 transition-all"
                >
                  {editingSchedule ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
