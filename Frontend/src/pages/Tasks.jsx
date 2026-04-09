import React from "react";
import { useAuth } from "../contexts/AuthContext";
import InternTasks from "./intern/InternTasks"; // Path sesuaikan ke file checklist intern lu
import AdminTaskCRUD from "./admin/AdminTaskCRUD"; // Path sesuaikan ke file admin lu

const Tasks = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  // Normalisasi role (jaga-jaga kalo format textnya beda)
  const rawRole = user?.role?.toLowerCase().replace(/_|\s/g, "") || "intern";
  
  // Jika dia Admin, Superadmin, atau Developer, kasih tampilan CRUD
  const isAdminLevel = ["admin", "superadmin", "developer"].includes(rawRole);

  if (isAdminLevel) {
    return <AdminTaskCRUD />;
  }

  // Jika bukan (berarti anak magang), kasih tampilan Checklist / Logbook
  return <InternTasks />;
};

export default Tasks;