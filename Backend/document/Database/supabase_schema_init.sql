-- =========================================================================
-- MASTER SCHEMA INIT (KEMBALI KE LARAVEL JWT)
-- ERD V3 TO-DO LIST MAGANG
-- =========================================================================

-- 1. Enable UUID Extension (Wajib untuk primary key)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. DROP TABEL LAMA (Berurutan dari anak ke induk untuk menghindari FK error)
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.system_configs CASCADE;
DROP TABLE IF EXISTS public.broadcasts CASCADE;
DROP TABLE IF EXISTS public.whiteboards CASCADE;
DROP TABLE IF EXISTS public.exceptions CASCADE;
DROP TABLE IF EXISTS public.schedules CASCADE;
DROP TABLE IF EXISTS public.daily_tasks CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.task_templates CASCADE;
DROP TABLE IF EXISTS public.divisions CASCADE;

-- =========================================================================
-- 3. PEMBUATAN TABEL INDUK
-- =========================================================================

-- TABEL: DIVISIONS
CREATE TABLE public.divisions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name varchar(255) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now()
);

-- TABEL: SYSTEM_CONFIGS
CREATE TABLE public.system_configs (
    key varchar(100) PRIMARY KEY,
    value text NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);

-- =========================================================================
-- 4. PEMBUATAN TABEL LAYER 1
-- =========================================================================

-- TABEL: TASK_TEMPLATES
CREATE TABLE public.task_templates (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    division_id uuid NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,
    title varchar(255) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- TABEL: PROFILES (Authentikasi Murni dari Laravel JWT)
CREATE TABLE public.profiles (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    full_name varchar(255) NOT NULL,
    nickname varchar(100),
    email varchar(255) UNIQUE NOT NULL,
    username varchar(255) UNIQUE,
    password_hash text NOT NULL,     -- Hash dari Laravel (Bcrypt)
    division_id uuid REFERENCES public.divisions(id) ON DELETE SET NULL,
    role varchar(50) NOT NULL CHECK (role IN ('intern', 'admin', 'super_admin', 'developer')) DEFAULT 'intern',
    is_verified boolean DEFAULT false,
    is_locked boolean DEFAULT false,
    avatar_url text,
    phone_number varchar(20),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone -- Soft Delete
);

-- =========================================================================
-- 5. PEMBUATAN TABEL LAYER 2
-- =========================================================================

-- TABEL: DAILY_TASKS (Logbook)
CREATE TABLE public.daily_tasks (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    uploader_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    division_id uuid NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,
    template_id uuid NOT NULL REFERENCES public.task_templates(id) ON DELETE RESTRICT,
    task_date date NOT NULL,
    description text,
    status varchar(50) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'revision')) DEFAULT 'pending',
    evidence_url text,
    captured_at timestamp with time zone,
    confirmed_participants jsonb DEFAULT '[]'::jsonb,
    evaluated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    reject_reason text,
    is_archived boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- TABEL: SCHEDULES (Shift Dinamis)
CREATE TABLE public.schedules (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    shift_date date NOT NULL,
    shift_type varchar(50) NOT NULL CHECK (shift_type IN ('morning', 'afternoon', 'full')),
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, shift_date) -- Mencegah 1 orang punya 2 shift bertumpuk di hari yg sama
);

-- TABEL: EXCEPTIONS (Izin / Sakit / Swap / Tugas Luar)
CREATE TABLE public.exceptions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    evaluated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    permission_date date NOT NULL,
    replacement_date date,
    type varchar(50) NOT NULL CHECK (type IN ('sakit', 'izin', 'tugas_luar', 'swap_shift')),
    evidence_url text,
    description text NOT NULL,
    status varchar(50) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT now(),
    processed_at timestamp with time zone
);

-- TABEL: WHITEBOARDS (Pengumuman per Divisi)
CREATE TABLE public.whiteboards (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    division_id uuid NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,
    title varchar(255) NOT NULL,
    file_url text NOT NULL,
    type varchar(50) NOT NULL CHECK (type IN ('pdf', 'image', 'link')),
    created_at timestamp with time zone DEFAULT now()
);

-- TABEL: BROADCASTS (Global/Sistem)
CREATE TABLE public. broadcasts (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- Superadmin
    title varchar(255) NOT NULL,
    content text NOT NULL,
    category varchar(50) NOT NULL CHECK (category IN ('info', 'urgent')) DEFAULT 'info',
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- TABEL: NOTIFICATIONS
CREATE TABLE public.notifications (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title varchar(255) NOT NULL,
    message text NOT NULL,
    type varchar(50) NOT NULL CHECK (type IN ('info', 'warning', 'success', 'danger')) DEFAULT 'info',
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- TABEL: AUDIT_LOGS (Catatan Log)
CREATE TABLE public.audit_logs (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    actor_role varchar(100) NOT NULL,
    action text NOT NULL,
    old_values jsonb,
    new_values jsonb,
    target_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- =========================================================================
-- 6. SETUP TRIGGER: AUTO UPDATE "updated_at"
-- =========================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_update_profiles ON public.profiles;
CREATE TRIGGER trg_auto_update_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS trg_auto_update_daily_tasks ON public.daily_tasks;
CREATE TRIGGER trg_auto_update_daily_tasks BEFORE UPDATE ON public.daily_tasks FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Selesai
