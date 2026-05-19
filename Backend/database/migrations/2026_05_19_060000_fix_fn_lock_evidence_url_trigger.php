<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Update the fn_lock_evidence_url trigger function to support:
        // 1. Revisions (where OLD.status = 'revision' OR NEW.status = 'revision')
        // 2. Setting evidence_url to NULL (where NEW.evidence_url IS NULL) during resets or deletes
        DB::unprepared("
            CREATE OR REPLACE FUNCTION fn_lock_evidence_url()
            RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
            BEGIN
                IF OLD.evidence_url IS NOT NULL
                   AND OLD.evidence_url <> ''
                   AND NEW.evidence_url IS DISTINCT FROM OLD.evidence_url
                THEN
                    -- Pengecualian 1: Izinkan jika statusnya sedang 'revision' atau diubah ke 'revision'
                    IF OLD.status = 'revision' OR NEW.status = 'revision' THEN
                        RETURN NEW;
                    END IF;

                    -- Pengecualian 2: Izinkan jika di-reset (diubah menjadi NULL dan status kembali ke pending)
                    IF NEW.evidence_url IS NULL THEN
                        RETURN NEW;
                    END IF;

                    RAISE EXCEPTION
                        '[LOCK] evidence_url sudah terkunci dan tidak dapat diubah. (task_id: %)', OLD.id;
                END IF;
                RETURN NEW;
            END;
            $$;
        ");
    }

    public function down(): void
    {
        // Revert to original locked logic (no exceptions for revisions or nulls)
        DB::unprepared("
            CREATE OR REPLACE FUNCTION fn_lock_evidence_url()
            RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
            BEGIN
                IF OLD.evidence_url IS NOT NULL
                   AND OLD.evidence_url <> ''
                   AND NEW.evidence_url IS DISTINCT FROM OLD.evidence_url
                THEN
                    RAISE EXCEPTION
                        '[LOCK] evidence_url sudah terkunci dan tidak dapat diubah. (task_id: %)', OLD.id;
                END IF;
                RETURN NEW;
            END;
            $$;
        ");
    }
};
