<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Shift;
use App\Models\DailyTask;
use App\Models\MasterTemplate;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Buat Shift
        $shiftA = Shift::firstOrCreate(['nama_shift' => 'Shift A']);
        Shift::firstOrCreate(['nama_shift' => 'Shift B']);
        Shift::firstOrCreate(['nama_shift' => 'Shift C']);

        // 2. Buat User Testing (Pegawai)
        $user = User::firstOrCreate(
            ['email' => 'pegawai@mcc.com'],
            [
                'name' => 'Pegawai Testing',
                'nama_lengkap' => 'Budi Santoso',
                'username' => 'budi_mcc',
                'password' => Hash::make('password123'),
                'role' => 'pegawai',
                'shift_id' => $shiftA->id
            ]
        );

        // 3. Buat Master Template untuk Shift A
        $templates = [
            ['nama_kegiatan' => 'Checklist Kebersihan Ruangan', 'estimasi_waktu' => '00:15:00'],
            ['nama_kegiatan' => 'Update Laporan Harian', 'estimasi_waktu' => '00:30:00'],
            ['nama_kegiatan' => 'Evaluasi Kerja Shift', 'estimasi_waktu' => '00:20:00'],
        ];

        foreach ($templates as $temp) {
            MasterTemplate::firstOrCreate(
                ['shift_id' => $shiftA->id, 'nama_kegiatan' => $temp['nama_kegiatan']],
                ['estimasi_waktu' => $temp['estimasi_waktu']]
            );
        }

        // 4. Buat Daily Tasks untuk Hari Ini
        foreach ($templates as $temp) {
            DailyTask::firstOrCreate(
                [
                    'user_id' => $user->id,
                    'tanggal' => Carbon::today()->toDateString(),
                    'nama_kegiatan' => $temp['nama_kegiatan']
                ],
                [
                    'status' => 'pending'
                ]
            );
        }
    }
}
