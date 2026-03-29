// src/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://syvvhzdstzdcnehkzbik.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5dnZoemRzdHpkY25laGt6YmlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MzEzMTEsImV4cCI6MjA4NzEwNzMxMX0.Yk2jh17ldjmXutan7AKodQbQaM8orK8CKsh0Mp3iBj8";

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Fungsi untuk Mengunci/Membuka Akun User (Selective Route Guard)
 * Mencatat setiap perubahan ke dalam tabel AUDIT_LOGS
 */
export const updateUserLockStatus = async (
  targetUserId,
  currentStatus,
  adminId,
  adminRole,
) => {
  const newStatus = !currentStatus;

  try {
    // 1. Update status is_locked di tabel PROFILES
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .update({
        is_locked: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", targetUserId)
      .select()
      .single();

    if (profileError) throw profileError;

    // 2. Catat ke AUDIT_LOGS untuk transparansi (Sesuai skema ERD kamu)
    const { error: auditError } = await supabase.from("audit_logs").insert({
      actor_id: adminId,
      actor_role: adminRole,
      target_user_id: targetUserId,
      action: newStatus ? "LOCK_USER_ACCOUNT" : "UNLOCK_USER_ACCOUNT",
      old_values: { is_locked: currentStatus },
      new_values: { is_locked: newStatus },
      created_at: new Date().toISOString(),
    });

    if (auditError) {
      console.warn(
        "Status terupdate, tapi gagal mencatat Audit Log:",
        auditError.message,
      );
    }

    return { success: true, data: profileData };
  } catch (error) {
    console.error("Error in updateUserLockStatus:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Fungsi untuk mengambil semua data Audit Logs
 * Menggabungkan data actor (admin) dan target user dari tabel profiles
 */
export const getAuditLogs = async () => {
  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .select(
        `
        *,
        actor:profiles!actor_id(full_name, nickname, avatar_url),
        target:profiles!target_user_id(full_name, nickname)
      `,
      )
      .order("created_at", { ascending: false }); // Log terbaru di atas

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching audit logs:", error.message);
    return { success: false, error: error.message };
  }
};
