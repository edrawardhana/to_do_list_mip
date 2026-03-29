import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
import MainLayout from "./components/layout/MainLayout";
import { Toaster } from "react-hot-toast";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Tasks from "./pages/Tasks";
import Attendance from "./pages/Attendance";
import Dashboard from "./pages/Dashboard";
import Broadcasts from "./pages/Broadcasts";
import Divisions from "./pages/Divisions";
import Users from "./pages/Users";
import AuditLog from "./pages/AuditLog";
import ManageAdmin from "./pages/admin/ManageAdmin";
import ManageAccountIntern from "./pages/admin/ManageAccountIntern"; // Import halaman Manage Account Intern
import Reports from "./pages/Reports";
import Whitebook from "./pages/Whitebook";
import LockedPage from "./pages/LockedPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          reverseOrder={false}
          toastOptions={{
            style: {
              borderRadius: "16px",
              background: "#1b254b",
              color: "#fff",
              fontSize: "14px",
              fontWeight: "bold",
            },
          }}
        />

        <Routes>
          {/* 1. RUTE PUBLIK */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* 2. RUTE TERPROTEKSI (MainLayout & Sub-routes) */}
          <Route
            element={
              <PrivateRoute>
                <MainLayout />
              </PrivateRoute>
            }
          >
            {/* Navigasi Root & Dashboard (Bisa diakses SEMUA Role) */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />

            {/* Rute Reports (Bisa diakses SEMUA Role - Intern untuk ajukan laporan, Admin untuk lihat) */}
            <Route path="reports" element={<Reports />} />

            {/* Halaman Locked (Harus bisa diakses Intern saat mereka nyasar) */}
            <Route path="locked" element={<LockedPage />} />

            {/* --- RUTE KHUSUS INTERN (ROLE: USER) --- */}
            <Route path="tasks" element={<Tasks />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="whitebook" element={<Whitebook />} />

            {/* --- RUTE KHUSUS ADMIN & SUPER_ADMIN SAJA --- */}
            <Route
              path="broadcasts"
              element={
                <AdminRoute>
                  <Broadcasts />
                </AdminRoute>
              }
            />
            <Route
              path="divisions"
              element={
                <AdminRoute>
                  <Divisions />
                </AdminRoute>
              }
            />
            <Route
              path="users"
              element={
                <AdminRoute>
                  <Users />
                </AdminRoute>
              }
            />
            <Route
              path="audit-log"
              element={
                <AdminRoute>
                  <AuditLog />
                </AdminRoute>
              }
            />
            <Route
              path="manage-admin"
              element={
                <AdminRoute>
                  <ManageAdmin />
                </AdminRoute>
              }
            />
            {/* Route untuk Manage Account Intern - Hanya untuk Admin & Super Admin */}
            <Route
              path="manage-intern"
              element={
                <AdminRoute>
                  <ManageAccountIntern />
                </AdminRoute>
              }
            />
            {/* Rute Approval hanya untuk Admin */}
            <Route
              path="approval"
              element={
                <AdminRoute>
                  <Dashboard />
                </AdminRoute>
              }
            />
          </Route>

          {/* 3. CATCH-ALL */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
