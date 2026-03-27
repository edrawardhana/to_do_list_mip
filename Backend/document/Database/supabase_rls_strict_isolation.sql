-- =========================================================================
-- MASTER SQL SCRIPT: IMPLEMENTASI ROW LEVEL SECURITY (RLS) SUPER KETAT ERD v3
-- Tujuan Utama: Anak divisi A (misal: IT) HARAM melihat data milik divisi B (misal: Media)
--               Superadmin bisa melihat semua. Admin bisa melihat semua data DALAM divisinya.
-- =========================================================================

-- PERSIAPAN UTAMA: Mengaktifkan RLS di SEMUA tabel penting
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE whiteboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_configs ENABLE ROW LEVEL SECURITY;
-- (Tabel divisions dibiarkan terbuka / read-only publik)

-- =========================================================================
-- 1. KEBIJAKAN UNTUK TABEL: profiles
-- =========================================================================
DROP POLICY IF EXISTS "Superadmin bebas akses semua profil" ON profiles;
DROP POLICY IF EXISTS "Admin hanya melihat anggota divisinya" ON profiles;
DROP POLICY IF EXISTS "User hanya melihat profilnya sendiri" ON profiles;
DROP POLICY IF EXISTS "User hanya update profilnya sendiri" ON profiles;

CREATE POLICY "Superadmin bebas akses semua profil" 
ON profiles FOR ALL 
USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin' );

CREATE POLICY "Admin hanya melihat anggota divisinya" 
ON profiles FOR SELECT 
USING ( 
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' AND 
    division_id = (SELECT division_id FROM profiles WHERE id = auth.uid()) 
);

CREATE POLICY "Intern hanya melihat profilnya sendiri" 
ON profiles FOR SELECT 
USING ( id = auth.uid() );

CREATE POLICY "Intern hanya update avatar dan no HP sendiri" 
ON profiles FOR UPDATE 
USING ( id = auth.uid() );


-- =========================================================================
-- 2. KEBIJAKAN UNTUK TABEL: daily_tasks (Logbook)
-- =========================================================================
DROP POLICY IF EXISTS "Superadmin bebas akses tugas" ON daily_tasks;
DROP POLICY IF EXISTS "Admin kelola tugas divisinya saja" ON daily_tasks;
DROP POLICY IF EXISTS "User tambah tugas untuk divisinya sendiri" ON daily_tasks;
DROP POLICY IF EXISTS "User kelola tugasnya sendiri" ON daily_tasks;
DROP POLICY IF EXISTS "User update tugasnya sendiri" ON daily_tasks;

CREATE POLICY "Superadmin bebas akses tugas" 
ON daily_tasks FOR ALL 
USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin' );

CREATE POLICY "Admin kelola tugas divisinya saja" 
ON daily_tasks FOR ALL 
USING ( 
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' AND 
    division_id = (SELECT division_id FROM profiles WHERE id = auth.uid()) 
);

CREATE POLICY "Intern tambah tugas untuk divisinya sendiri" 
ON daily_tasks FOR INSERT 
WITH CHECK ( 
    uploader_id = auth.uid() AND 
    division_id = (SELECT division_id FROM profiles WHERE id = auth.uid()) 
);

CREATE POLICY "Intern kelola tugasnya sendiri" 
ON daily_tasks FOR SELECT 
USING ( uploader_id = auth.uid() );

CREATE POLICY "Intern update tugasnya sendiri" 
ON daily_tasks FOR UPDATE 
USING ( uploader_id = auth.uid() );


-- =========================================================================
-- 3. KEBIJAKAN UNTUK TABEL: exceptions (Pengganti Absensi/Izin)
-- =========================================================================
DROP POLICY IF EXISTS "Superadmin akses penuh absensi" ON exceptions;
DROP POLICY IF EXISTS "Admin kelola absensi divisinya" ON exceptions;
DROP POLICY IF EXISTS "User kelola absensi sendiri" ON exceptions;

CREATE POLICY "Superadmin akses penuh exceptions" 
ON exceptions FOR ALL 
USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin' );

CREATE POLICY "Admin kelola exceptions divisinya" 
ON exceptions FOR ALL 
USING ( 
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' AND 
    (SELECT division_id FROM profiles WHERE id = exceptions.user_id) = (SELECT division_id FROM profiles WHERE id = auth.uid()) 
);

CREATE POLICY "Intern kelola exceptions sendiri" 
ON exceptions FOR ALL 
USING ( user_id = auth.uid() );


-- =========================================================================
-- 4. KEBIJAKAN UNTUK TABEL: whiteboards (Pengumuman Divisi)
-- =========================================================================
DROP POLICY IF EXISTS "Superadmin kelola semua papan tulis" ON whiteboards;
DROP POLICY IF EXISTS "Orang hanya melihat papan tulis divisinya" ON whiteboards;
DROP POLICY IF EXISTS "Hanya Admin yang mengisi papan tulis divisinya" ON whiteboards;
DROP POLICY IF EXISTS "Hanya Admin yang mengubah papan tulis divisinya" ON whiteboards;
DROP POLICY IF EXISTS "Hanya Admin yang menghapus papan tulis divisinya" ON whiteboards;

CREATE POLICY "Superadmin kelola semua papan tulis" 
ON whiteboards FOR ALL 
USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin' );

CREATE POLICY "Orang hanya melihat papan tulis divisinya" 
ON whiteboards FOR SELECT 
USING ( division_id = (SELECT division_id FROM profiles WHERE id = auth.uid()) );

CREATE POLICY "Hanya Admin yang mengisi papan tulis divisinya" 
ON whiteboards FOR INSERT 
WITH CHECK ( 
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' AND 
    division_id = (SELECT division_id FROM profiles WHERE id = auth.uid()) 
);
CREATE POLICY "Hanya Admin yang mengubah papan tulis divisinya" 
ON whiteboards FOR UPDATE 
USING ( 
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' AND 
    division_id = (SELECT division_id FROM profiles WHERE id = auth.uid()) 
);
CREATE POLICY "Hanya Admin yang menghapus papan tulis divisinya" 
ON whiteboards FOR DELETE 
USING ( 
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' AND 
    division_id = (SELECT division_id FROM profiles WHERE id = auth.uid()) 
);


-- =========================================================================
-- 5. KEBIJAKAN UNTUK TABEL: audit_logs
-- =========================================================================
DROP POLICY IF EXISTS "Hanya superadmin lihat log aktivitas" ON audit_logs;
DROP POLICY IF EXISTS "Sistem bisa insert log aktivitas siapapun" ON audit_logs;

CREATE POLICY "Hanya superadmin lihat log aktivitas" 
ON audit_logs FOR SELECT 
USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin' );

CREATE POLICY "Sistem bisa insert log aktivitas siapapun" 
ON audit_logs FOR INSERT 
WITH CHECK ( true ); 


-- =========================================================================
-- 6. KEBIJAKAN UNTUK TABEL LAINNYA (Broadcasts, Notifications, Schedules)
-- =========================================================================

-- Broadcasts (Global)
CREATE POLICY "Semua user bisa melihat broadcasts" ON broadcasts FOR SELECT USING (true);
CREATE POLICY "Superadmin bisa mengelola broadcasts" ON broadcasts FOR ALL USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin' );

-- Notifications (Personal)
CREATE POLICY "User melihat notifikasi sendiri" ON notifications FOR SELECT USING ( user_id = auth.uid() );
CREATE POLICY "User update notifikasi sendiri" ON notifications FOR UPDATE USING ( user_id = auth.uid() );
CREATE POLICY "Sistem insert notifikasi" ON notifications FOR INSERT WITH CHECK (true);

-- Schedules (Personal/Divisional)
CREATE POLICY "Superadmin akses penuh schedules" ON schedules FOR ALL USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin' );
CREATE POLICY "Admin kelola schedules divisi" ON schedules FOR ALL USING ( 
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' AND 
    (SELECT division_id FROM profiles WHERE id = schedules.user_id) = (SELECT division_id FROM profiles WHERE id = auth.uid()) 
);
CREATE POLICY "Intern melihat schedules sendiri" ON schedules FOR SELECT USING ( user_id = auth.uid() );

-- System Configs
CREATE POLICY "Semua user bisa melihat configs" ON system_configs FOR SELECT USING (true);
CREATE POLICY "Hanya admin+ update configs" ON system_configs FOR UPDATE USING ( (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'developer') );
