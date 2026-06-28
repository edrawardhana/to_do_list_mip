import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "react-hot-toast";

// Layout & Guard
import MainLayout from "./components/layout/MainLayout";
import ProtectedRoute from "./components/guards/ProtectedRoute";
import SelectiveLockGuard from "./components/guards/SelectiveLockGuard";

// Pages - Public
import Login from "./pages/auth/Login";
import ChangePasswordForce from "./pages/auth/ChangePasswordForce";

// Pages - Universal (Semua Role)
import Dashboard from "./pages/dashboard/Dashboard";
import Whiteboard from "./pages/Whiteboard"
import HardLockScreen from "./pages/HardLockScreen";

// Pages - Unified Task (Gerbang Utama)
import Tasks from "./pages/Tasks";

// Pages - Khusus Intern
import LeaveRequest from "./pages/intern/LeaveRequest";
import MySchedule from "./pages/intern/MySchedule";

// Pages - Manajerial (Admin & Up)
import Approval from "./pages/admin/Approval";
import ManageAccountIntern from "./pages/admin/ManageAccountIntern";
import ManageSchedules from "./pages/admin/ManageSchedules";
import ManageSchedulesCalendar from "./pages/admin/ManageSchedulesCalendar";
import Broadcasts from "./pages/admin/Broadcasts";

// Pages - VVIP (Superadmin & Up)
import ManageAdmin from "./pages/superadmin/ManageAdmin";
import DivisionAnalytics from "./pages/superadmin/DivisionAnalytics";
// 👇 IMPORT KOMPONEN CONFIG
import AuditLog from './pages/admin/AuditLog';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />

        <Routes>
          {/* RUTE PUBLIK */}
          <Route path="/login" element={<Login />} />
          <Route path="/change-password-force" element={
            <ProtectedRoute>
              <ChangePasswordForce />
            </ProtectedRoute>
          } />
          {/* Registrasi publik ditutup — akun dibuat oleh Superadmin */}

          {/* RUTE TERPROTEKSI */}
          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* --- JALUR KEBAL GEMBOK (selalu bisa diakses intern) --- */}
            <Route path="leave-request" element={<LeaveRequest />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="my-schedule" element={
              <ProtectedRoute roles={["intern"]}>
                <MySchedule />
              </ProtectedRoute>
            } />

            {/* --- JALUR TERGEMBOK (dibatasi saat OFF/cuti) --- */}
            <Route element={<SelectiveLockGuard />}>

              {/* Multi-Role (Tugas) */}
              <Route path="tasks" element={
                <ProtectedRoute roles={["intern", "admin", "superadmin"]}>
                  <Tasks />
                </ProtectedRoute>
              } />
              <Route path="whitebook" element={
                <ProtectedRoute roles={["intern", "admin", "superadmin"]}>
                  <Whiteboard />
                </ProtectedRoute>
              } />
              {/* Manajerial */}
              <Route path="approval" element={
                <ProtectedRoute roles={["admin", "superadmin"]}>
                  <Approval />
                </ProtectedRoute>
              } />
              <Route path="manage-intern" element={
                <ProtectedRoute roles={["admin", "superadmin"]}>
                  <ManageAccountIntern />
                </ProtectedRoute>
              } />
              <Route path="manage-schedules" element={
                <ProtectedRoute roles={["admin", "superadmin"]}>
                  <ManageSchedules />
                </ProtectedRoute>
              } />
              <Route path="schedule-calendar" element={
                <ProtectedRoute roles={["admin", "superadmin"]}>
                  <ManageSchedulesCalendar />
                </ProtectedRoute>
              } />
              <Route path="broadcasts" element={
                <ProtectedRoute roles={["admin", "superadmin"]}>
                  <Broadcasts />
                </ProtectedRoute>
              } />

              {/* VVIP & Analytics */}
              <Route path="manage-admin" element={
                <ProtectedRoute roles={["superadmin"]}>
                  <ManageAdmin />
                </ProtectedRoute>
              } />

              <Route path="division-analytics" element={
                <ProtectedRoute roles={["superadmin"]}>
                  <DivisionAnalytics />
                </ProtectedRoute>
              } />

              <Route path="audit-log" element={
                <ProtectedRoute roles={["admin", "superadmin"]}>
                  <AuditLog />
                </ProtectedRoute>
              } />

            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>

      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;