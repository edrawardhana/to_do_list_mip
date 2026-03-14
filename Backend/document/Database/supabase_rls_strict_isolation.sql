-- =========================================================================
-- MASTER SQL SCRIPT: IMPLEMENTASI ROW LEVEL SECURITY (RLS) SUPER KETAT
-- Tujuan Utama: Anak divisi A (misal: IT) HARAM melihat data milik divisi B (misal: Media)
--               Superadmin bisa melihat semua. Admin bisa melihat semua data DALAM divisinya.
-- =========================================================================

-- PERSIAPAN UTAMA: Mengaktifkan RLS di SEMUA tabel penting
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE whiteboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
-- (Tabel divisions dibiarkan terbuka / read-only publik karena hanya isi daftar nama divisi)

-- =========================================================================
-- 1. KEBIJAKAN UNTUK TABEL: profiles
-- =========================================================================
-- Hapus policy lama agar bersih
DROP POLICY IF EXISTS "Users can only view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update limited fields" ON profiles;
DROP POLICY IF EXISTS "Admins can view all" ON profiles;
DROP POLICY IF EXISTS "Developer Full Access" ON profiles;

-- Policy A: Superadmin bebas mengakses semua profil
CREATE POLICY "Superadmin bebas akses semua profil" 
ON profiles FOR ALL 
USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'superadmin' );

-- Policy B: Admin bisa melihat SEMUA orang, TAPI HANYA yang SATU DIVISI dengannya
CREATE POLICY "Admin hanya melihat anggota divisinya" 
ON profiles FOR SELECT 
USING ( 
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' AND 
    division_id = (SELECT division_id FROM profiles WHERE id = auth.uid()) 
);

-- Policy C: User biasa HANYA bisa melihat profitnya SENDIRI
CREATE POLICY "User hanya melihat profilnya sendiri" 
ON profiles FOR SELECT 
USING ( id = auth.uid() );

-- Policy D: User biasa hanya bisa update profilnya sendiri (itupun dibatasi dari aplikasi)
CREATE POLICY "User hanya update profilnya sendiri" 
ON profiles FOR UPDATE 
USING ( id = auth.uid() );


-- =========================================================================
-- 2. KEBIJAKAN UNTUK TABEL: daily_tasks (Logbook)
-- =========================================================================
DROP POLICY IF EXISTS "User submit logbook" ON daily_tasks;
DROP POLICY IF EXISTS "User manage own logbook" ON daily_tasks;
DROP POLICY IF EXISTS "Admin approve logbook" ON daily_tasks;
DROP POLICY IF EXISTS "Dev logbook control" ON daily_tasks;

-- Policy A: Superadmin bebas akses semua task
CREATE POLICY "Superadmin bebas akses tugas" 
ON daily_tasks FOR ALL 
USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'superadmin' );

-- Policy B: Admin bisa melihat dan ACC/Reject tugas milik ANAK DIVISINYA SAJA
CREATE POLICY "Admin kelola tugas divisinya saja" 
ON daily_tasks FOR ALL 
USING ( 
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' AND 
    division_id = (SELECT division_id FROM profiles WHERE id = auth.uid()) 
);

-- Policy C: User BISA INSERT tugas, asal division_id-nya SAMA dengan division_id profilnya
CREATE POLICY "User tambah tugas untuk divisinya sendiri" 
ON daily_tasks FOR INSERT 
WITH CHECK ( 
    user_id = auth.uid() AND 
    division_id = (SELECT division_id FROM profiles WHERE id = auth.uid()) 
);

-- Policy D: User HANYA melihat dan mengedit TUGASNYA SENDIRI
CREATE POLICY "User kelola tugasnya sendiri" 
ON daily_tasks FOR SELECT 
USING ( user_id = auth.uid() );

CREATE POLICY "User update tugasnya sendiri" 
ON daily_tasks FOR UPDATE 
USING ( user_id = auth.uid() );


-- =========================================================================
-- 3. KEBIJAKAN UNTUK TABEL: attendance_schedules (Absensi/Izin)
-- =========================================================================
DROP POLICY IF EXISTS "User view own schedule" ON attendance_schedules;
DROP POLICY IF EXISTS "Admin manage schedules" ON attendance_schedules;
DROP POLICY IF EXISTS "Dev schedule control" ON attendance_schedules;

-- Absensi tidak punya tabel division_id langsung, jadi kita join lewat profiles
CREATE POLICY "Superadmin akses penuh absensi" 
ON attendance_schedules FOR ALL 
USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'superadmin' );

CREATE POLICY "Admin kelola absensi divisinya" 
ON attendance_schedules FOR ALL 
USING ( 
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' AND 
    (SELECT division_id FROM profiles WHERE id = attendance_schedules.user_id) = (SELECT division_id FROM profiles WHERE id = auth.uid()) 
);

CREATE POLICY "User kelola absensi sendiri" 
ON attendance_schedules FOR ALL 
USING ( user_id = auth.uid() );


-- =========================================================================
-- 4. KEBIJAKAN UNTUK TABEL: whiteboards (Pengumuman Divisi)
-- =========================================================================
-- Whiteboard bersifat rahasia antar divisi!
CREATE POLICY "Superadmin kelola semua papan tulis" 
ON whiteboards FOR ALL 
USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'superadmin' );

-- SEMUA ORANG (Admin & User) HANYA BISA MELIHAT whiteboard milik DIVISINYA SENDIRI
CREATE POLICY "Orang hanya melihat papan tulis divisinya" 
ON whiteboards FOR SELECT 
USING ( division_id = (SELECT division_id FROM profiles WHERE id = auth.uid()) );

-- HANYA ADMIN yang bisa membuat/edit whiteboard divisinya (User biasa dilarang!)
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
-- Log aktivitas itu rahasia tingkat tinggi, HANYA SUPERADMIN yang boleh lihat!
CREATE POLICY "Hanya superadmin lihat log aktivitas" 
ON audit_logs FOR SELECT 
USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'superadmin' );

-- Namun sistem aplikasi tetap boleh menambah (INSERT) log aktivitas untuk siapapun
CREATE POLICY "Sistem bisa insert log aktivitas siapapun" 
ON audit_logs FOR INSERT 
WITH CHECK ( true ); -- Aplikasi bebas nge-log apa saja


-- Selesai! Execute kueri ini di Supabase SQL Editor.
