-- =============================================================================
-- MASTER DATABASE SETUP — TO-DO LIST MIP
-- Supabase / PostgreSQL
-- Jalankan file ini secara berurutan di Supabase SQL Editor
-- =============================================================================
-- URUTAN EKSEKUSI:
--   1. Schema & Tabel
--   2. Storage Bucket
--   3. Row Level Security (RLS)
--   4. Triggers
--   5. Cron Jobs (pg_cron)
--   6. Migration Utilities
-- =============================================================================


-- =============================================================================
-- BAGIAN 1: SCHEMA & TABEL
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop semua tabel lama (urutan anak → induk)
DROP TABLE IF EXISTS public.audit_logs          CASCADE;
DROP TABLE IF EXISTS public.notifications       CASCADE;
DROP TABLE IF EXISTS public.system_configs      CASCADE;
DROP TABLE IF EXISTS public.broadcasts          CASCADE;
DROP TABLE IF EXISTS public.whiteboards         CASCADE;
DROP TABLE IF EXISTS public.exceptions          CASCADE;
DROP TABLE IF EXISTS public.schedules           CASCADE;
DROP TABLE IF EXISTS public.daily_tasks         CASCADE;
DROP TABLE IF EXISTS public.profiles            CASCADE;
DROP TABLE IF EXISTS public.task_templates      CASCADE;
DROP TABLE IF EXISTS public.divisions           CASCADE;

-- ── Tabel Induk ──────────────────────────────────────────────────────────────

CREATE TABLE public.divisions (
    id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name        varchar(255) NOT NULL,
    description text,
    created_at  timestamptz  DEFAULT now()
);

CREATE TABLE public.system_configs (
    key        varchar(100) PRIMARY KEY,
    value      text         NOT NULL,
    updated_at timestamptz  DEFAULT now()
);

-- ── Layer 1 ───────────────────────────────────────────────────────────────────

CREATE TABLE public.task_templates (
    id          uuid    DEFAULT uuid_generate_v4() PRIMARY KEY,
    division_id uuid    NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,
    title       varchar(255) NOT NULL,
    description text,
    is_active   boolean DEFAULT true,
    created_at  timestamptz DEFAULT now()
);

CREATE TABLE public.profiles (
    id            uuid    DEFAULT uuid_generate_v4() PRIMARY KEY,
    full_name     varchar(255) NOT NULL,
    nickname      varchar(100),
    email         varchar(255) UNIQUE NOT NULL,
    username      varchar(255) UNIQUE,
    password_hash text    NOT NULL,
    division_id   uuid    REFERENCES public.divisions(id) ON DELETE SET NULL,
    role          varchar(50) NOT NULL DEFAULT 'intern'
                  CHECK (role IN ('intern', 'admin', 'super_admin', 'developer')),
    is_verified   boolean DEFAULT false,
    is_locked     boolean DEFAULT false,
    avatar_url    text,
    phone_number  varchar(20),
    fcm_token     text,
    created_at    timestamptz DEFAULT now(),
    updated_at    timestamptz DEFAULT now(),
    deleted_at    timestamptz  -- Soft Delete
);

-- ── Layer 2 ───────────────────────────────────────────────────────────────────

CREATE TABLE public.daily_tasks (
    id                     uuid    DEFAULT uuid_generate_v4() PRIMARY KEY,
    uploader_id            uuid    NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    division_id            uuid    NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,
    template_id            uuid    NOT NULL REFERENCES public.task_templates(id) ON DELETE RESTRICT,
    task_date              date    NOT NULL,
    description            text,
    status                 varchar(50) NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'approved', 'rejected', 'revision')),
    evidence_url           text,
    captured_at            timestamptz,
    confirmed_participants jsonb   DEFAULT '[]'::jsonb,
    evaluated_by           uuid    REFERENCES public.profiles(id) ON DELETE SET NULL,
    reject_reason          text,
    assign_note            text,
    assigned_by            uuid    REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_archived            boolean DEFAULT false,
    created_at             timestamptz DEFAULT now(),
    updated_at             timestamptz DEFAULT now()
);

CREATE TABLE public.schedules (
    id         uuid    DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id    uuid    NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    shift_date date    NOT NULL,
    shift_type varchar(50) NOT NULL
               CHECK (shift_type IN ('morning', 'afternoon', 'full')),
    created_at timestamptz DEFAULT now(),
    UNIQUE (user_id, shift_date)
);

CREATE TABLE public.exceptions (
    id               uuid    DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id          uuid    NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    evaluated_by     uuid    REFERENCES public.profiles(id) ON DELETE SET NULL,
    permission_date  date    NOT NULL,
    replacement_date date,
    type             varchar(50) NOT NULL
                     CHECK (type IN ('sakit', 'izin', 'tugas_luar', 'swap_shift')),
    evidence_url     text,
    description      text    NOT NULL,
    status           varchar(50) NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at       timestamptz DEFAULT now(),
    processed_at     timestamptz
);

CREATE TABLE public.whiteboards (
    id          uuid    DEFAULT uuid_generate_v4() PRIMARY KEY,
    division_id uuid    NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,
    title       varchar(255) NOT NULL,
    file_url    text    NOT NULL,
    type        varchar(50) NOT NULL CHECK (type IN ('pdf', 'image', 'link')),
    created_at  timestamptz DEFAULT now()
);

CREATE TABLE public.broadcasts (
    id         uuid    DEFAULT uuid_generate_v4() PRIMARY KEY,
    author_id  uuid    NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title      varchar(255) NOT NULL,
    content    text    NOT NULL,
    category   varchar(50) NOT NULL DEFAULT 'info' CHECK (category IN ('info', 'urgent')),
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE public.notifications (
    id         uuid    DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id    uuid    NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title      varchar(255) NOT NULL,
    message    text    NOT NULL,
    type       varchar(50) NOT NULL DEFAULT 'info'
               CHECK (type IN ('info', 'warning', 'success', 'danger')),
    is_read    boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE public.audit_logs (
    id             uuid    DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id       uuid    NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    actor_role     varchar(100) NOT NULL,
    action         text    NOT NULL,
    old_values     jsonb,
    new_values     jsonb,
    target_user_id uuid    REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at     timestamptz DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_daily_tasks_uploader   ON public.daily_tasks(uploader_id);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_status     ON public.daily_tasks(status);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_task_date  ON public.daily_tasks(task_date);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_assigned   ON public.daily_tasks(assigned_by);
CREATE INDEX IF NOT EXISTS idx_schedules_user_date    ON public.schedules(user_id, shift_date);
CREATE INDEX IF NOT EXISTS idx_exceptions_user        ON public.exceptions(user_id);

-- ── Trigger: auto updated_at ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_update_profiles    ON public.profiles;
DROP TRIGGER IF EXISTS trg_auto_update_daily_tasks ON public.daily_tasks;

CREATE TRIGGER trg_auto_update_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER trg_auto_update_daily_tasks
    BEFORE UPDATE ON public.daily_tasks
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();


-- =============================================================================
-- BAGIAN 2: STORAGE BUCKET
-- =============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('task_evidence', 'task_evidence', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public View Evidence"              ON storage.objects;
DROP POLICY IF EXISTS "User Upload Evidence"              ON storage.objects;
DROP POLICY IF EXISTS "Owner or Superadmin Delete Evidence" ON storage.objects;

-- Siapa saja bisa melihat/download foto bukti
CREATE POLICY "Public View Evidence"
ON storage.objects FOR SELECT
USING (bucket_id = 'task_evidence');

-- Hanya user yang login yang bisa upload
CREATE POLICY "User Upload Evidence"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'task_evidence' AND auth.role() = 'authenticated');

-- Hanya pemilik file atau superadmin yang bisa hapus
CREATE POLICY "Owner or Superadmin Delete Evidence"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'task_evidence' AND (
        auth.uid() = owner OR
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin'
    )
);


-- =============================================================================
-- BAGIAN 3: ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_tasks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exceptions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whiteboards    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcasts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_configs ENABLE ROW LEVEL SECURITY;

-- ── profiles ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "rls_profiles_superadmin" ON public.profiles;
DROP POLICY IF EXISTS "rls_profiles_admin"      ON public.profiles;
DROP POLICY IF EXISTS "rls_profiles_intern_sel" ON public.profiles;
DROP POLICY IF EXISTS "rls_profiles_intern_upd" ON public.profiles;

CREATE POLICY "rls_profiles_superadmin" ON public.profiles FOR ALL
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin');

CREATE POLICY "rls_profiles_admin" ON public.profiles FOR SELECT
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' AND
        division_id = (SELECT division_id FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "rls_profiles_intern_sel" ON public.profiles FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "rls_profiles_intern_upd" ON public.profiles FOR UPDATE
    USING (id = auth.uid());

-- ── daily_tasks ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "rls_tasks_superadmin" ON public.daily_tasks;
DROP POLICY IF EXISTS "rls_tasks_admin"      ON public.daily_tasks;
DROP POLICY IF EXISTS "rls_tasks_intern_ins" ON public.daily_tasks;
DROP POLICY IF EXISTS "rls_tasks_intern_sel" ON public.daily_tasks;
DROP POLICY IF EXISTS "rls_tasks_intern_upd" ON public.daily_tasks;

CREATE POLICY "rls_tasks_superadmin" ON public.daily_tasks FOR ALL
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin');

CREATE POLICY "rls_tasks_admin" ON public.daily_tasks FOR ALL
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' AND
        division_id = (SELECT division_id FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "rls_tasks_intern_ins" ON public.daily_tasks FOR INSERT
    WITH CHECK (
        uploader_id = auth.uid() AND
        division_id = (SELECT division_id FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "rls_tasks_intern_sel" ON public.daily_tasks FOR SELECT
    USING (uploader_id = auth.uid());

CREATE POLICY "rls_tasks_intern_upd" ON public.daily_tasks FOR UPDATE
    USING (uploader_id = auth.uid());

-- ── exceptions ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "rls_exc_superadmin" ON public.exceptions;
DROP POLICY IF EXISTS "rls_exc_admin"      ON public.exceptions;
DROP POLICY IF EXISTS "rls_exc_intern"     ON public.exceptions;

CREATE POLICY "rls_exc_superadmin" ON public.exceptions FOR ALL
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin');

CREATE POLICY "rls_exc_admin" ON public.exceptions FOR ALL
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' AND
        (SELECT division_id FROM public.profiles WHERE id = exceptions.user_id) =
        (SELECT division_id FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "rls_exc_intern" ON public.exceptions FOR ALL
    USING (user_id = auth.uid());

-- ── schedules ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "rls_sched_superadmin" ON public.schedules;
DROP POLICY IF EXISTS "rls_sched_admin"      ON public.schedules;
DROP POLICY IF EXISTS "rls_sched_intern"     ON public.schedules;

CREATE POLICY "rls_sched_superadmin" ON public.schedules FOR ALL
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin');

CREATE POLICY "rls_sched_admin" ON public.schedules FOR ALL
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' AND
        (SELECT division_id FROM public.profiles WHERE id = schedules.user_id) =
        (SELECT division_id FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "rls_sched_intern" ON public.schedules FOR SELECT
    USING (user_id = auth.uid());

-- ── whiteboards ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "rls_wb_superadmin" ON public.whiteboards;
DROP POLICY IF EXISTS "rls_wb_sel"        ON public.whiteboards;
DROP POLICY IF EXISTS "rls_wb_admin_ins"  ON public.whiteboards;
DROP POLICY IF EXISTS "rls_wb_admin_upd"  ON public.whiteboards;
DROP POLICY IF EXISTS "rls_wb_admin_del"  ON public.whiteboards;

CREATE POLICY "rls_wb_superadmin" ON public.whiteboards FOR ALL
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin');

CREATE POLICY "rls_wb_sel" ON public.whiteboards FOR SELECT
    USING (division_id = (SELECT division_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "rls_wb_admin_ins" ON public.whiteboards FOR INSERT
    WITH CHECK (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' AND
        division_id = (SELECT division_id FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "rls_wb_admin_upd" ON public.whiteboards FOR UPDATE
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' AND
        division_id = (SELECT division_id FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "rls_wb_admin_del" ON public.whiteboards FOR DELETE
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' AND
        division_id = (SELECT division_id FROM public.profiles WHERE id = auth.uid())
    );

-- ── audit_logs ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "rls_audit_insert" ON public.audit_logs;
DROP POLICY IF EXISTS "rls_audit_select" ON public.audit_logs;

CREATE POLICY "rls_audit_insert" ON public.audit_logs FOR INSERT
    TO authenticated WITH CHECK (true);

CREATE POLICY "rls_audit_select" ON public.audit_logs FOR SELECT
    TO authenticated USING (true);

-- ── broadcasts ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "rls_bc_select"    ON public.broadcasts;
DROP POLICY IF EXISTS "rls_bc_superadmin" ON public.broadcasts;

CREATE POLICY "rls_bc_select"     ON public.broadcasts FOR SELECT USING (true);
CREATE POLICY "rls_bc_superadmin" ON public.broadcasts FOR ALL
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin');

-- ── notifications ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "rls_notif_sel" ON public.notifications;
DROP POLICY IF EXISTS "rls_notif_upd" ON public.notifications;
DROP POLICY IF EXISTS "rls_notif_ins" ON public.notifications;

CREATE POLICY "rls_notif_sel" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "rls_notif_upd" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "rls_notif_ins" ON public.notifications FOR INSERT WITH CHECK (true);

-- ── system_configs ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "rls_cfg_sel" ON public.system_configs;
DROP POLICY IF EXISTS "rls_cfg_upd" ON public.system_configs;

CREATE POLICY "rls_cfg_sel" ON public.system_configs FOR SELECT USING (true);
CREATE POLICY "rls_cfg_upd" ON public.system_configs FOR UPDATE
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'developer'));


-- =============================================================================
-- BAGIAN 4: TRIGGERS
-- =============================================================================

-- ── 4a. Evidence Lock — intern tidak bisa ganti foto setelah upload ───────────

CREATE OR REPLACE FUNCTION fn_lock_evidence_url()
RETURNS TRIGGER AS $$
DECLARE
    v_role text;
BEGIN
    IF OLD.evidence_url IS NOT NULL AND NEW.evidence_url IS DISTINCT FROM OLD.evidence_url THEN
        SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
        IF v_role = 'intern' THEN
            RAISE EXCEPTION '[LOCK] evidence_url sudah terkunci dan tidak dapat diubah. (task_id: %)', OLD.id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_lock_evidence ON public.daily_tasks;
CREATE TRIGGER trigger_lock_evidence
    BEFORE UPDATE ON public.daily_tasks
    FOR EACH ROW EXECUTE FUNCTION fn_lock_evidence_url();

-- ── 4b. Auto-lock akun saat izin/sakit disetujui ─────────────────────────────

CREATE OR REPLACE FUNCTION fn_lock_on_exception()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND CURRENT_DATE = NEW.permission_date THEN
        IF NEW.type IN ('izin', 'sakit') THEN
            UPDATE public.profiles SET is_locked = true  WHERE id = NEW.user_id AND role = 'intern';
        ELSIF NEW.type IN ('swap_shift', 'tugas_luar') THEN
            UPDATE public.profiles SET is_locked = false WHERE id = NEW.user_id AND role = 'intern';
        END IF;
    END IF;
    -- Batalkan izin yang sudah disetujui → buka kunci kembali
    IF NEW.status != 'approved' AND OLD.status = 'approved' AND CURRENT_DATE = NEW.permission_date THEN
        UPDATE public.profiles SET is_locked = false WHERE id = NEW.user_id AND role = 'intern';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_lock_on_exception ON public.exceptions;
CREATE TRIGGER trigger_lock_on_exception
    AFTER INSERT OR UPDATE ON public.exceptions
    FOR EACH ROW EXECUTE FUNCTION fn_lock_on_exception();

-- ── 4c. Ghost Audit Log — audit_logs tidak bisa dihapus/diubah ───────────────

CREATE OR REPLACE FUNCTION fn_prevent_audit_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'GHOST LOCK: Audit log bersifat permanen dan tidak dapat dihapus.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION fn_prevent_audit_update()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'GHOST LOCK: Audit log tidak dapat dimodifikasi setelah tercatat.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_ghost_audit_no_delete ON public.audit_logs;
DROP TRIGGER IF EXISTS trigger_ghost_audit_no_update ON public.audit_logs;

CREATE TRIGGER trigger_ghost_audit_no_delete
    BEFORE DELETE ON public.audit_logs FOR EACH ROW EXECUTE FUNCTION fn_prevent_audit_delete();

CREATE TRIGGER trigger_ghost_audit_no_update
    BEFORE UPDATE ON public.audit_logs FOR EACH ROW EXECUTE FUNCTION fn_prevent_audit_update();


-- =============================================================================
-- BAGIAN 5: CRON JOBS (pg_cron)
-- Semua waktu dalam UTC. WIB = UTC+7, jadi WIB - 7 = UTC.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ── 5a. Auto-Lock & Auto-Unlock harian ───────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_lock_regular_users()
RETURNS void AS $$
BEGIN
    UPDATE public.profiles SET is_locked = true WHERE role = 'intern';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_unlock_regular_users()
RETURNS void AS $$
BEGIN
    UPDATE public.profiles p
    SET is_locked = false
    WHERE p.role = 'intern'
      AND NOT EXISTS (
          SELECT 1 FROM public.exceptions e
          WHERE e.user_id = p.id
            AND e.status = 'approved'
            AND e.type IN ('izin', 'sakit')
            AND e.permission_date = CURRENT_DATE
      );
END;
$$ LANGUAGE plpgsql;

-- Hapus job lama jika ada
DO $$ BEGIN PERFORM cron.unschedule('auto-lock-daily');   EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('auto-unlock-daily'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- TUTUP: 21:30 WIB = 14:30 UTC
SELECT cron.schedule('auto-lock-daily',   '30 14 * * *', 'SELECT fn_lock_regular_users()');
-- BUKA:  07:30 WIB = 00:30 UTC
SELECT cron.schedule('auto-unlock-daily', '30 0  * * *', 'SELECT fn_unlock_regular_users()');

-- ── 5b. Generate daily tasks dari template (00:00 WIB = 17:00 UTC) ────────────

CREATE OR REPLACE FUNCTION fn_generate_daily_tasks()
RETURNS void AS $$
BEGIN
    INSERT INTO public.daily_tasks (uploader_id, division_id, template_id, status, task_date)
    SELECT
        p.id,
        p.division_id,
        t.id,
        'pending',
        CURRENT_DATE
    FROM public.profiles p
    JOIN public.task_templates t ON p.division_id = t.division_id
    WHERE p.role = 'intern'
      AND p.division_id IS NOT NULL
      AND t.is_active = true
      AND NOT EXISTS (
          SELECT 1 FROM public.exceptions e
          WHERE e.user_id = p.id
            AND e.status = 'approved'
            AND e.type IN ('izin', 'sakit', 'tugas_luar')
            AND e.permission_date = CURRENT_DATE
      )
      AND NOT EXISTS (
          SELECT 1 FROM public.daily_tasks d
          WHERE d.uploader_id = p.id
            AND d.template_id = t.id
            AND d.task_date = CURRENT_DATE
      );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN PERFORM cron.unschedule('generate-daily-tasks'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
SELECT cron.schedule('generate-daily-tasks', '0 17 * * *', 'SELECT fn_generate_daily_tasks()');


-- =============================================================================
-- BAGIAN 6: MIGRATION UTILITIES
-- Jalankan bagian ini HANYA jika diperlukan (tidak perlu dijalankan ulang)
-- =============================================================================

-- ── 6a. Fix evidence_url dari relative path ke full URL ──────────────────────
-- Jalankan dalam transaction agar bisa di-rollback jika ada masalah

-- Development (localhost):
-- BEGIN;
-- SET session_replication_role = replica;  -- bypass trigger sementara
-- UPDATE public.daily_tasks
-- SET evidence_url = 'http://localhost:8000' || evidence_url
-- WHERE evidence_url IS NOT NULL
--   AND evidence_url NOT LIKE 'http%'
--   AND evidence_url LIKE '/storage/%';
-- SET session_replication_role = DEFAULT;
-- COMMIT;

-- Production (ganti domain sesuai server):
-- BEGIN;
-- SET session_replication_role = replica;
-- UPDATE public.daily_tasks
-- SET evidence_url = 'https://api.yourdomain.com' || evidence_url
-- WHERE evidence_url IS NOT NULL
--   AND evidence_url NOT LIKE 'http%'
--   AND evidence_url LIKE '/storage/%';
-- SET session_replication_role = DEFAULT;
-- COMMIT;

-- Migrasi antar environment (dev → prod):
-- BEGIN;
-- SET session_replication_role = replica;
-- UPDATE public.daily_tasks
-- SET evidence_url = REPLACE(evidence_url, 'http://localhost:8000', 'https://api.yourdomain.com')
-- WHERE evidence_url LIKE 'http://localhost:8000%';
-- SET session_replication_role = DEFAULT;
-- COMMIT;

-- ── 6b. Verifikasi hasil migration ───────────────────────────────────────────
-- SELECT id, evidence_url, status, updated_at
-- FROM public.daily_tasks
-- WHERE evidence_url IS NOT NULL
-- ORDER BY updated_at DESC LIMIT 10;

-- =============================================================================
-- SELESAI
-- =============================================================================
