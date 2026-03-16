import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
import MainLayout from "./components/layout/MainLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Tasks from "./pages/Tasks";
import Attendance from "./pages/Attendance";
import Whiteboard from "./pages/Whitebook";
import Dashboard from "./pages/Dashboard";
import Broadcasts from "./pages/Broadcasts";
import Divisions from "./pages/Divisions";
import Users from "./pages/Users";
import AuditLog from "./pages/AuditLog";
import ManageAdmin from "./pages/admin/ManageAdmin";
import Reports from "./pages/Reports";
import Whitebook from "./pages/Whitebook";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rute publik */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Rute Dashboard Utama dengan Layout */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <MainLayout />
              </PrivateRoute>
            }
          >
            {/* Index: Mengarahkan user ke Home */}
            <Route index element={<Home />} />

            {/* Rute Khusus Intern / User Umum */}
            <Route path="tasks" element={<Tasks />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="whitebook" element={<Whitebook />} />

            {/* RUTE DASHBOARD (Semua user terautentikasi) */}
            <Route path="dashboard" element={<Dashboard />} />

            {/* RUTE ADMIN & SUPER_ADMIN */}
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

            {/* Routes yang hanya boleh diakses Admin/Superadmin */}
            <Route
              path="manage-admin"
              element={
                <AdminRoute>
                  <ManageAdmin />
                </AdminRoute>
              }
            />
            <Route
              path="reports"
              element={
                <AdminRoute>
                  <Reports />
                </AdminRoute>
              }
            />
            <Route
              path="approval"
              element={
                <AdminRoute>
                  <Dashboard />
                </AdminRoute>
              }
            />
          </Route>

          {/* Catch-all: Kembali ke root jika salah ketik path */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
