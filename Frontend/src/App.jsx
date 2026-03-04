import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute"; // <--- TAMBAHKAN
import MainLayout from "./components/layout/MainLayout";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Tasks from "./pages/Tasks";
import Attendance from "./pages/Attendance";
import Whiteboard from "./pages/Whiteboard";
import Dashboard from "./pages/Dashboard"; // <--- TAMBAHKAN
import Broadcasts from "./pages/Broadcasts"; // <--- TAMBAHKAN
import Divisions from "./pages/Divisions"; // <--- TAMBAHKAN
import Users from "./pages/Users"; // <--- TAMBAHKAN
import AuditLog from "./pages/AuditLog";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rute publik */}
          <Route path="/login" element={<Login />} />

          {/* Rute yang dilindungi */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <MainLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Home />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="whiteboard" element={<Whiteboard />} />
            {/* Rute admin */}
            <Route
              path="dashboard"
              element={
                <AdminRoute>
                  <Dashboard />
                </AdminRoute>
              }
            />
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
          </Route>

          {/* Redirect ke home jika path tidak dikenal */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
