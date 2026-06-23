import React from "react";
import { useAuth } from "../contexts/AuthContext";
import InternTasks from "./intern/InternTasks"; // Path sesuaikan ke file checklist intern lu
import AdminTaskCRUD from "./admin/AdminTaskCRUD"; // Path sesuaikan ke file admin lu

const Tasks = () => {
  const { isLoading, isAnyAdmin } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  // Gunakan variabel isAnyAdmin dari AuthContext biar rapi dan otomatis mendeteksi role
  if (isAnyAdmin) {
    return <AdminTaskCRUD />;
  }

  // Jika bukan (berarti anak magang), kasih tampilan Checklist / Logbook
  return <InternTasks />;
};

export default Tasks;