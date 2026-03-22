import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
import MainLayout from "./components/layout/MainLayout";

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
import Reports from "./pages/Reports";
import Whitebook from "./pages/Whitebook";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* 1. RUTE PUBLIK */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* 2. RUTE TERPROTEKSI (MainLayout) */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <MainLayout />
              </PrivateRoute>
            }
          >
            {/* Arahkan root "/" langsung ke "/dashboard". 
               Ini memastikan Dashboard.jsx yang menangani pemisahan tampilan Admin/Intern.
            */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />

            {/* --- RUTE KHUSUS INTERN (ROLE: USER) --- */}
            <Route path="tasks" element={<Tasks />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="whitebook" element={<Whitebook />} />

            {/* --- RUTE KHUSUS ADMIN & SUPER_ADMIN --- */}
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
            <Route
              path="reports"
              element={
                <AdminRoute>
                  <Reports />
                </AdminRoute>
              }
            />
            {/* Rute Approval mengarah ke Dashboard karena Dashboard.jsx 
               sudah memiliki komponen <Approval /> di dalamnya untuk role Admin.
            */}
            <Route
              path="approval"
              element={
                <AdminRoute>
                  <Dashboard />
                </AdminRoute>
              }
            />
          </Route>

          {/* 3. CATCH-ALL: Redirect rute tidak dikenal ke root */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
