import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "react-hot-toast";

// Layout & Guard
import MainLayout from "./components/layout/MainLayout";
import ProtectedRoute from "./components/guards/ProtectedRoute"; 
import SelectiveLockGuard from "./components/guards/SelectiveLockGuard";

// Pages - Public
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Pages - Universal (Semua Role)
import Dashboard from "./pages/dashboard/Dashboard";
import Whitebook from "./pages/Whitebook"; 
import Settings from "./pages/Settings";
import LockedPage from "./pages/LockedPage"; 

// Pages - Unified Task (Gerbang Utama)
import Tasks from "./pages/Tasks"; 

// Pages - Khusus Intern
import LeaveRequest from "./pages/intern/LeaveRequest"; 

// Pages - Manajerial (Admin & Up)
import Approval from "./pages/admin/Approval";
import ManageAccountIntern from "./pages/admin/ManageAccountIntern";
import Broadcasts from "./pages/admin/Broadcasts"; 
import Reports from "./pages/admin/Reports";

// Pages - VVIP (Superadmin & Up)
import ManageAdmin from "./pages/superadmin/ManageAdmin";
import DivisionAnalytics from "./pages/superadmin/DivisionAnalytics"; 
// 👇 IMPORT KOMPONEN CONFIG
import SystemConfig from './pages/developer/SystemConfig';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />

        <Routes>
          {/* RUTE PUBLIK */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* RUTE TERPROTEKSI */}
          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* --- JALUR KEBAL GEMBOK --- */}
            <Route path="leave-request" element={<LeaveRequest />} />
            <Route path="forbidden" element={<LockedPage />} />

            {/* --- JALUR TERGEMBOK --- */}
            <Route element={<SelectiveLockGuard />}>
              
              {/* Universal */}
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="whitebook" element={<Whitebook />} />
              <Route path="settings" element={<Settings />} />

              {/* Multi-Role (Tugas) */}
              <Route path="tasks" element={
                <ProtectedRoute roles={["intern", "admin", "superadmin", "developer"]}>
                  <Tasks />
                </ProtectedRoute>
              } />

              {/* Manajerial */}
              <Route path="approval" element={
                <ProtectedRoute roles={["admin", "superadmin", "developer"]}>
                  <Approval />
                </ProtectedRoute>
              } />
              <Route path="manage-intern" element={
                <ProtectedRoute roles={["admin", "superadmin", "developer"]}>
                  <ManageAccountIntern />
                </ProtectedRoute>
              } />
              <Route path="broadcasts" element={
                <ProtectedRoute roles={["admin", "superadmin", "developer"]}>
                  <Broadcasts />
                </ProtectedRoute>
              } />
              <Route path="reports" element={
                <ProtectedRoute roles={["admin", "superadmin"]}>
                  <Reports />
                </ProtectedRoute>
              } />

              {/* VVIP & Analytics */}
              <Route path="manage-admin" element={
                <ProtectedRoute roles={["superadmin", "developer"]}>
                  <ManageAdmin />
                </ProtectedRoute>
              } />
              
              <Route path="division-analytics" element={
                <ProtectedRoute roles={["superadmin", "developer"]}>
                  <DivisionAnalytics />
                </ProtectedRoute>
              } />

              {/* 👇 INI YANG KETINGGALAN: RUTE KHUSUS DEVELOPER */}
              <Route path="system-config" element={
                <ProtectedRoute roles={["developer"]}>
                  <SystemConfig />
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