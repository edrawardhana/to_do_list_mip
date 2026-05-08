-- =============================================================================
-- SUPABASE MASTER SETUP — TO-DO LIST MIP
-- Jalankan SELURUH file ini di Supabase SQL Editor (Run All)
-- Aman dijalankan ulang: semua perintah menggunakan IF NOT EXISTS / OR REPLACE
-- =============================================================================


-- =============================================================================
-- BAGIAN 1: EXTENSIONS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_cron;


-- =============================================================================
-- BAGIAN 2: TABEL
-- =============================================================================

-- ── divisions ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.divisions (
    id          uuid        DEFAULT uuid_generate_v4() PRIMARY KEY,
    name        varchar(255) NOT NULL,
    description text,
    created_at  timestamptz DEFAULT now()
);

-- ── system_configs ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.system_configs (
    key        varchar(100) PRIMARY KEY,
    value      text         NOT NULL,
    updated_at timestamptz  DEFAULT now()
);

-- ── task_templates ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.task_templates (
    id          uuid        DEFAULT uuid_generate_v4() PRIMARY KEY,
    division_id uuid        NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,
    title       varchar(255) NOT NULL,
    description text,
    is_active   boolean     DEFAULT true,
    created_at  timestamptz DEFAULT now()
);

-- ── profiles ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
    id            uuid        DEFAULT uuid_generate_v4() PRIMARY KEY,
    full_name     varchar(255) NOT NULL,
    nickname      varchar(100),
    email         varchar(255) UNIQUE NOT NULL,
    username      varchar(255) UNIQUE,
    password_hash text        NOT NULL,
    division_id   uuid        REFERENCES public.divisions(id) ON DELETE SET NULL,
    role          varchar(50) NOT NULL DEFAULT 'intern'
                  CHECK (role IN ('intern', 'admin', 'super_admin', 'developer')),
    is_verified   boolean     DEFAULT false,
    is_locked     boolean     DEFAULT false,
    avatar_url    text,
    phone_number  varchar(20),
    fcm_token     text,
    created_at    timestamptz DEFAULT now(),
    updated_at    timestamptz DEFAULT now(),
    deleted_at    timestamptz                    -- Soft Delete
);

-- ── daily_tasks ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_tasks (
    id                     uuid        DEFAULT uuid_generate_v4() PRIMARY KEY,
    uploader_id            uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    division_id            uuid        NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,
    template_id            uuid        NOT NULL REFERENCES public.task_templates(id) ON DELETE RESTRICT,
    task_date              date        NOT NULL,
    description            text,
    status                 varchar(50) NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'approved', 'rejected', 'revision')),
    evidence_url           text,
    captured_at            timestamptz,
    confirmed_participants jsonb       DEFAULT '[]'::jsonb,   -- array of profile UUIDs
    evaluated_by           uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
    reject_reason          text,
    assign_note            text,
    assigned_by            uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_archived            boolean     DEFAULT false,
    created_at             timestamptz DEFAULT now(),
    updated_at             timestamptz DEFAULT now()
);

-- ── schedules ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.schedules (
    id         uuid        DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    shift_date date        NOT NULL,
    shift_type varchar(50) NOT NULL
               CHECK (shift_type IN ('morning', 'afternoon', 'full')),
    created_at timestamptz DEFAULT now(),
    UNIQUE (user_id, shift_date)
);

-- ── exceptions (izin / sakit / swap / tugas luar) ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.exceptions (
    id               uuid        DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id          uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    evaluated_by     uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
    permission_date  date        NOT NULL,
    replacement_date date,
    type             varchar(50) NOT NULL
                     CHECK (type IN ('sakit', 'izin', 'tugas_luar', 'swap_shift')),
    evidence_url     text,
    description      text        NOT NULL,
    status           varchar(50) NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at       timestamptz DEFAULT now(),
    processed_at     timestamptz
);

-- ── whiteboards ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.whiteboards (
    id          uuid        DEFAULT uuid_generate_v4() PRIMARY KEY,
    division_id uuid        NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,
    title       varchar(255) NOT NULL,
    file_url    text        NOT NULL,
    type        varchar(50) NOT NULL CHECK (type IN ('pdf', 'image', 'link')),
    created_at  timestamptz DEFAULT now()
);

-- ── broadcasts ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.broadcasts (
    id         uuid        DEFAULT uuid_generate_v4() PRIMARY KEY,
    author_id  uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title      varchar(255) NOT NULL,
    content    text        NOT NULL,
    category   varchar(50) NOT NULL DEFAULT 'info'
               CHECK (category IN ('info', 'urgent')),
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- ── notifications ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
    id         uuid        DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title      varchar(255) NOT NULL,
    message    text        NOT NULL,
    type       varchar(50) NOT NULL DEFAULT 'info'
               CHECK (type IN ('info', 'warning', 'success', 'danger')),
    is_read    boolean     DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- ── audit_logs ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id             uuid        DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id       uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    actor_role     varchar(100) NOT NULL,
    action         text        NOT NULL,
    old_values     jsonb,
    new_values     jsonb,
    target_user_id uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at     timestamptz DEFAULT now()
);


-- =============================================================================
-- BAGIAN 3: INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_division      ON public.profiles(division_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role          ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_verified      ON public.profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_uploader   ON public.daily_tasks(uploader_id);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_status     ON public.daily_tasks(status);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_task_date  ON public.daily_tasks(task_date);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_assigned   ON public.daily_tasks(assigned_by);
CREATE INDEX IF NOT EXISTS idx_schedules_user_date    ON public.schedules(user_id, shift_date);
CREATE INDEX IF NOT EXISTS idx_exceptions_user        ON public.exceptions(user_id);
CREATE INDEX IF NOT EXISTS idx_exceptions_date        ON public.exceptions(permission_date);


-- =============================================================================
-- BAGIAN 4: STORAGE BUCKET
-- =============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('task_evidence', 'task_evidence', true)
ON CONFLICT (id) DO NOTHING;

-- Evidence: siapa saja bisa lihat (public bucket)
DROP POLICY IF EXISTS "storage_evidence_select" ON storage.objects;
CREATE POLICY "storage_evidence_select"
ON storage.objects FOR SELECT
USING (bucket_id = 'task_evidence');

-- Evidence: hanya user login yang bisa upload
DROP POLICY IF EXISTS "storage_evidence_insert" ON storage.objects;
CREATE POLICY "storage_evidence_insert"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'task_evidence' AND auth.role() = 'authenticated');

-- Evidence: hanya pemilik atau superadmin yang bisa hapus
DROP POLICY IF EXISTS "storage_evidence_delete" ON storage.objects;
CREATE POLICY "storage_evidence_delete"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'task_evidence' AND (
        auth.uid() = owner OR
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
    )
);


-- =============================================================================
-- BAGIAN 5: ROW LEVEL SECURITY (RLS)
-- Catatan: RLS hanya berlaku untuk akses via Supabase SDK (anon/authenticated key).
-- Akses dari Laravel via DB credentials (service role) tidak terkena RLS.
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
DROP POLICY IF EXISTS "rls_bc_select"     ON public.broadcasts;
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
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid())
           IN ('admin', 'super_admin', 'developer'));


-- =============================================================================
-- BAGIAN 6: TRIGGERS
-- =============================================================================

-- ── 6a. Auto updated_at ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_auto_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at    ON public.profiles;
DROP TRIGGER IF EXISTS trg_daily_tasks_updated_at ON public.daily_tasks;

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION fn_auto_updated_at();

CREATE TRIGGER trg_daily_tasks_updated_at
    BEFORE UPDATE ON public.daily_tasks
    FOR EACH ROW EXECUTE FUNCTION fn_auto_updated_at();

-- ── 6b. Evidence Lock ─────────────────────────────────────────────────────────
-- Intern tidak bisa ganti foto setelah upload.
-- Pengecualian: task dengan status 'revision' BOLEH ganti foto.
CREATE OR REPLACE FUNCTION fn_lock_evidence_url()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_role text;
BEGIN
    IF OLD.evidence_url IS NOT NULL
       AND NEW.evidence_url IS DISTINCT FROM OLD.evidence_url THEN

        -- Izinkan jika task sedang revision (admin minta perbaikan)
        IF OLD.status = 'revision' OR NEW.status = 'revision' THEN
            RETURN NEW;
        END IF;

        SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
        IF v_role = 'intern' THEN
            RAISE EXCEPTION '[LOCK] evidence_url sudah terkunci. (task_id: %)', OLD.id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lock_evidence ON public.daily_tasks;
CREATE TRIGGER trg_lock_evidence
    BEFORE UPDATE ON public.daily_tasks
    FOR EACH ROW EXECUTE FUNCTION fn_lock_evidence_url();

-- ── 6c. Auto-lock akun saat izin/sakit disetujui ─────────────────────────────
CREATE OR REPLACE FUNCTION fn_lock_on_exception()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NEW.status = 'approved' AND CURRENT_DATE = NEW.permission_date THEN
        IF NEW.type IN ('izin', 'sakit') THEN
            UPDATE public.profiles SET is_locked = true
            WHERE id = NEW.user_id AND role = 'intern';
        ELSIF NEW.type IN ('swap_shift', 'tugas_luar') THEN
            UPDATE public.profiles SET is_locked = false
            WHERE id = NEW.user_id AND role = 'intern';
        END IF;
    END IF;
    -- Batalkan izin → buka kunci kembali
    IF NEW.status != 'approved' AND OLD.status = 'approved'
       AND CURRENT_DATE = NEW.permission_date THEN
        UPDATE public.profiles SET is_locked = false
        WHERE id = NEW.user_id AND role = 'intern';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lock_on_exception ON public.exceptions;
CREATE TRIGGER trg_lock_on_exception
    AFTER INSERT OR UPDATE ON public.exceptions
    FOR EACH ROW EXECUTE FUNCTION fn_lock_on_exception();

-- ── 6d. Ghost Audit Log — tidak bisa dihapus/diubah ──────────────────────────
CREATE OR REPLACE FUNCTION fn_prevent_audit_delete()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RAISE EXCEPTION 'GHOST LOCK: Audit log bersifat permanen dan tidak dapat dihapus.';
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION fn_prevent_audit_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RAISE EXCEPTION 'GHOST LOCK: Audit log tidak dapat dimodifikasi setelah tercatat.';
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_no_delete ON public.audit_logs;
DROP TRIGGER IF EXISTS trg_audit_no_update ON public.audit_logs;

CREATE TRIGGER trg_audit_no_delete
    BEFORE DELETE ON public.audit_logs
    FOR EACH ROW EXECUTE FUNCTION fn_prevent_audit_delete();

CREATE TRIGGER trg_audit_no_update
    BEFORE UPDATE ON public.audit_logs
    FOR EACH ROW EXECUTE FUNCTION fn_prevent_audit_update();


-- =============================================================================
-- BAGIAN 7: CRON JOBS
-- Semua waktu UTC. WIB = UTC+7 → WIB - 7 jam = UTC
-- =============================================================================

-- ── 7a. Auto-Lock harian (21:30 WIB = 14:30 UTC) ─────────────────────────────
CREATE OR REPLACE FUNCTION fn_lock_interns()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    UPDATE public.profiles SET is_locked = true WHERE role = 'intern';
END;
$$;

-- ── 7b. Auto-Unlock harian (07:30 WIB = 00:30 UTC) ───────────────────────────
CREATE OR REPLACE FUNCTION fn_unlock_interns()
RETURNS void LANGUAGE plpgsql AS $$
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
$$;

-- ── 7c. Generate daily tasks (00:00 WIB = 17:00 UTC) ─────────────────────────
CREATE OR REPLACE FUNCTION fn_generate_daily_tasks()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.daily_tasks
        (uploader_id, division_id, template_id, status, task_date)
    SELECT
        p.id, p.division_id, t.id, 'pending', CURRENT_DATE
    FROM public.profiles p
    JOIN public.task_templates t ON p.division_id = t.division_id
    WHERE p.role = 'intern'
      AND p.is_verified = true
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
$$;

-- Daftarkan cron jobs (hapus lama dulu jika ada)
DO $$ BEGIN PERFORM cron.unschedule('lock-interns-daily');    EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('unlock-interns-daily');  EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('generate-daily-tasks');  EXCEPTION WHEN OTHERS THEN NULL; END $$;

SELECT cron.schedule('lock-interns-daily',   '30 14 * * *', 'SELECT fn_lock_interns()');
SELECT cron.schedule('unlock-interns-daily', '30 0  * * *', 'SELECT fn_unlock_interns()');
SELECT cron.schedule('generate-daily-tasks', '0  17 * * *', 'SELECT fn_generate_daily_tasks()');


-- =============================================================================
-- BAGIAN 8: MIGRATION — jalankan hanya jika diperlukan
-- =============================================================================

-- ── 8a. Fix confirmed_participants: json → jsonb ──────────────────────────────
-- Jalankan jika kolom masih bertipe 'json' (cek dulu dengan query verifikasi di bawah)
--
-- ALTER TABLE public.daily_tasks ALTER COLUMN confirmed_participants DROP DEFAULT;
-- ALTER TABLE public.daily_tasks
--     ALTER COLUMN confirmed_participants
--     TYPE jsonb USING COALESCE(confirmed_participants::text::jsonb, '[]'::jsonb);
-- ALTER TABLE public.daily_tasks
--     ALTER COLUMN confirmed_participants SET DEFAULT '[]'::jsonb;

-- ── 8b. Fix evidence_url: relative → full URL ─────────────────────────────────
-- Ganti 'http://localhost:8000' dengan URL backend yang sesuai
--
-- BEGIN;
-- SET session_replication_role = replica;  -- bypass trigger sementara
-- UPDATE public.daily_tasks
-- SET evidence_url = 'http://localhost:8000' || evidence_url
-- WHERE evidence_url IS NOT NULL
--   AND evidence_url NOT LIKE 'http%'
--   AND evidence_url LIKE '/storage/%';
-- SET session_replication_role = DEFAULT;
-- COMMIT;

-- ── 8c. Rename role 'user' → 'intern' (jika ada data lama) ───────────────────
-- UPDATE public.profiles SET role = 'intern' WHERE role = 'user';
-- ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
-- ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
--     CHECK (role IN ('intern', 'admin', 'super_admin', 'developer'));


-- =============================================================================
-- VERIFIKASI — jalankan untuk cek hasil setup
-- =============================================================================

-- Cek semua tabel berhasil dibuat:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' ORDER BY table_name;

-- Cek tipe kolom confirmed_participants (harus jsonb):
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'daily_tasks' AND column_name = 'confirmed_participants';

-- Cek cron jobs terdaftar:
-- SELECT jobname, schedule, command FROM cron.job ORDER BY jobname;

-- Cek triggers aktif:
-- SELECT trigger_name, event_object_table, action_timing, event_manipulation
-- FROM information_schema.triggers
-- WHERE trigger_schema = 'public' ORDER BY event_object_table, trigger_name;

-- =============================================================================
-- SELESAI
-- =============================================================================


-- =============================================================================
-- BAGIAN 9: HOUSEKEEPING — Auto cleanup data > 90 hari
-- =============================================================================

-- ── 9a. Fungsi cleanup utama ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_housekeeping_cleanup()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_cutoff        timestamptz := now() - interval '90 days';
    v_tasks_deleted int := 0;
    v_audit_deleted int := 0;
    v_month         text := to_char(now(), 'Month YYYY');
BEGIN
    -- 1. Hapus daily_tasks lama (evidence files dihapus oleh Laravel backend)
    DELETE FROM public.daily_tasks WHERE created_at < v_cutoff;
    GET DIAGNOSTICS v_tasks_deleted = ROW_COUNT;

    -- 2. Hapus audit_logs lama (bypass ghost lock trigger)
    SET session_replication_role = replica;
    DELETE FROM public.audit_logs WHERE created_at < v_cutoff;
    GET DIAGNOSTICS v_audit_deleted = ROW_COUNT;
    SET session_replication_role = DEFAULT;

    -- 3. Log hasil ke audit_logs (sebagai system record)
    INSERT INTO public.audit_logs (admin_id, actor_role, action, new_values, created_at)
    SELECT
        id,
        'system',
        'Housekeeping Otomatis ' || v_month,
        jsonb_build_object(
            'cutoff_date',   v_cutoff::date,
            'tasks_deleted', v_tasks_deleted,
            'audit_deleted', v_audit_deleted,
            'executed_at',   now()
        ),
        now()
    FROM public.profiles
    WHERE role = 'developer'
    LIMIT 1;

    RETURN jsonb_build_object(
        'month',          v_month,
        'cutoff_date',    v_cutoff::date,
        'tasks_deleted',  v_tasks_deleted,
        'audit_deleted',  v_audit_deleted
    );
END;
$$;

-- ── 9b. Cron job: setiap tanggal 1 jam 02:00 WIB (19:00 UTC hari sebelumnya) ──
-- 02:00 WIB = 02:00 - 7 = 19:00 UTC (hari sebelumnya)
-- Cron expression: menit jam hari bulan hari_minggu
-- "0 19 L * *" = jam 19:00 UTC pada hari terakhir bulan (≈ tanggal 1 jam 02:00 WIB)
-- Atau gunakan "0 19 1 * *" = tanggal 1 setiap bulan jam 19:00 UTC

DO $$ BEGIN PERFORM cron.unschedule('housekeeping-monthly'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

SELECT cron.schedule(
    'housekeeping-monthly',
    '0 19 1 * *',   -- Tanggal 1 setiap bulan, 02:00 WIB (19:00 UTC)
    'SELECT fn_housekeeping_cleanup()'
);

-- ── 9c. Data dummy untuk testing (created_at 4 bulan lalu) ───────────────────
-- Jalankan bagian ini HANYA untuk testing, lalu hapus setelah selesai.
-- Uncomment untuk membuat data dummy:

-- INSERT INTO public.daily_tasks
--     (uploader_id, division_id, template_id, status, task_date, created_at, updated_at)
-- SELECT
--     p.id,
--     p.division_id,
--     t.id,
--     'approved',
--     (now() - interval '4 months')::date,
--     now() - interval '4 months',
--     now() - interval '4 months'
-- FROM public.profiles p
-- JOIN public.task_templates t ON p.division_id = t.division_id
-- WHERE p.role = 'intern'
--   AND p.is_verified = true
-- LIMIT 10;

-- Verifikasi data dummy:
-- SELECT id, task_date, created_at FROM public.daily_tasks
-- WHERE created_at < now() - interval '90 days'
-- ORDER BY created_at ASC LIMIT 10;

-- Jalankan cleanup manual (test):
-- SELECT fn_housekeeping_cleanup();

-- Cek hasil:
-- SELECT jobname, schedule, command FROM cron.job WHERE jobname = 'housekeeping-monthly';
