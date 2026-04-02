// src/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://syvvhzdstzdcnehkzbik.supabase.co";

// Client biasa (anon key) — untuk user umum, kena RLS
// Gunakan environment variables untuk production
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5dnZoemRzdHpkY25laGt6YmlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MzEzMTEsImV4cCI6MjA4NzEwNzMxMX0.Yk2jh17ldjmXutan7AKodQbQaM8orK8CKsh0Mp3iBj8";

export const supabase = createClient(supabaseUrl, supabaseKey);

// Client admin (service role key) — bypass RLS, khusus admin
// PERINGATAN: Jangan pernah expose service role key ke client-side!
// Key ini hanya boleh digunakan di server-side (API routes, server actions, etc.)
const serviceRoleKey =
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5dnZoemRzdHpkY25laGt6YmlrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTUzMTMxMSwiZXhwIjoyMDg3MTA3MzExfQ.POOkdTNA8yAfCu6cYo9kFwPsE-10VcNQmEXjOg3KGa4";

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    storageKey: "supabase-admin", // ← tambahkan ini untuk menghindari konflik dengan client biasa
  },
});

/**
 * Fungsi untuk Mengunci/Membuka Akun User (Selective Route Guard)
 * Mencatat setiap perubahan ke dalam tabel AUDIT_LOGS
 *
 * NOTE: Jika fungsi ini dipanggil dari server-side, gunakan supabaseAdmin
 * Jika dipanggil dari client-side dengan RLS, gunakan supabase biasa
 */
export const updateUserLockStatus = async (
  targetUserId,
  currentStatus,
  adminId,
  adminRole,
  useAdminClient = false, // Parameter opsional untuk memilih client
) => {
  // Validasi input
  if (!targetUserId || !adminId) {
    return {
      success: false,
      error:
        "Missing required parameters: targetUserId and adminId are required",
    };
  }

  const newStatus = !currentStatus;
  const client = useAdminClient ? supabaseAdmin : supabase;

  try {
    // 1. Update status is_locked di tabel PROFILES
    const { data: profileData, error: profileError } = await client
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
    const { error: auditError } = await client.from("audit_logs").insert({
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
 *
 * NOTE: Gunakan supabaseAdmin jika perlu bypass RLS untuk melihat semua logs
 */
export const getAuditLogs = async (useAdminClient = false) => {
  const client = useAdminClient ? supabaseAdmin : supabase;

  try {
    const { data, error } = await client
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

/**
 * Fungsi untuk mendapatkan service role key dari environment variable
 * Rekomendasi untuk production - lebih aman daripada mengekspos langsung
 */
export const getSupabaseAdmin = () => {
  // Cek apakah di server-side (opsional)
  if (typeof window !== "undefined") {
    console.warn(
      "⚠️ Peringatan: Supabase admin client seharusnya hanya digunakan di server-side!",
    );
  }

  const key =
    import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    console.error(
      "❌ Service role key tidak ditemukan di environment variables",
    );
    return null;
  }

  return createClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      storageKey: "supabase-admin",
    },
  });
};

// Ekspor konfigurasi URL juga jika diperlukan
export const getSupabaseUrl = () => supabaseUrl;
