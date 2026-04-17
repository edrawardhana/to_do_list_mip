<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;

// Tulis pesan status keberjalanan update
echo "Menambahkan kolom profil divisi baru...\n";

try {
    if (!Schema::hasColumn('divisions', 'icon')) {
        Schema::table('divisions', function (Blueprint $table) {
            $table->string('icon')->nullable()->default('fa-building');
        });
        echo "Kolom 'icon' berhasil ditambah.\n";
    }

    if (!Schema::hasColumn('divisions', 'color')) {
        Schema::table('divisions', function (Blueprint $table) {
            $table->string('color')->nullable()->default('blue');
        });
        echo "Kolom 'color' berhasil ditambah.\n";
    }

    if (!Schema::hasColumn('divisions', 'head')) {
        Schema::table('divisions', function (Blueprint $table) {
            $table->string('head')->nullable();
        });
        echo "Kolom 'head' berhasil ditambah.\n";
    }

    if (!Schema::hasColumn('divisions', 'job_descriptions')) {
        Schema::table('divisions', function (Blueprint $table) {
            $table->jsonb('job_descriptions')->nullable();
        });
        echo "Kolom 'job_descriptions' berhasil ditambah.\n";
    }

    echo "Update skema divisions SUKSES.\n";
} catch (\Exception $e) {
    echo "GAGAL: " . $e->getMessage() . "\n";
}

// Exit tinker explicitly
exit();
