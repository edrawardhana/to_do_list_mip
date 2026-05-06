-- =========================================================================
-- ADD ASSIGN FIELDS TO DAILY_TASKS TABLE
-- Menambahkan field untuk fitur admin assign task ke intern
-- =========================================================================

-- 1. Add assign_note column
ALTER TABLE public.daily_tasks 
ADD COLUMN IF NOT EXISTS assign_note text;

-- 2. Add assigned_by column with foreign key
ALTER TABLE public.daily_tasks 
ADD COLUMN IF NOT EXISTS assigned_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 3. Add comment for documentation
COMMENT ON COLUMN public.daily_tasks.assign_note IS 'Catatan khusus dari admin saat membagikan tugas';
COMMENT ON COLUMN public.daily_tasks.assigned_by IS 'ID admin yang membagikan tugas ini ke intern';

-- 4. Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_daily_tasks_assigned_by ON public.daily_tasks(assigned_by);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_status ON public.daily_tasks(status);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_task_date ON public.daily_tasks(task_date);

-- Selesai
-- Jalankan script ini di Supabase SQL Editor
