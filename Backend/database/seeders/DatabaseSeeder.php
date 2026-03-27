<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Division;
use App\Models\TaskTemplate;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed data awal ke database.
     */
    public function run(): void
    {
        // 1. Buat Divisions
        $it = Division::firstOrCreate(['name' => 'IT']);
        $metpro = Division::firstOrCreate(['name' => 'Media dan Production']);
        $administrasi = Division::firstOrCreate(['name' => 'Administrasi']);
        $cr = Division::firstOrCreate(['name' => 'Customer Relation']);
        $pr = Division::firstOrCreate(['name' => 'Public Relation']);
        $marketing = Division::firstOrCreate(['name' => 'Marketing dan Partnership']);

        // 2. Buat User SuperAdmin
        User::updateOrCreate(
            ['email' => 'superadmin@mcc.com'],
            [
                'full_name'     => 'Super Admin MCC',
                'password_hash' => Hash::make('password123'),
                'role'          => 'super_admin',
                'division_id'   => $it->id, // Defaulting to IT to satisfy constraints
                'is_verified'   => true,
                'is_locked'     => false,
            ]
        );

        // 3. Buat User Admin
        User::updateOrCreate(
            ['email' => 'admin@mcc.com'],
            [
                'full_name'     => 'Admin IT',
                'password_hash' => Hash::make('password123'),
                'role'          => 'admin',
                'division_id'   => $it->id,
                'is_verified'   => true,
                'is_locked'     => false,
            ]
        );

        // 4. Buat User Intern
        User::updateOrCreate(
            ['email' => 'intern@mcc.com'],
            [
                'full_name'     => 'Intern Testing',
                'password_hash' => Hash::make('password123'),
                'role'          => 'intern',
                'division_id'   => $it->id,
                'is_verified'   => true,
                'is_locked'     => false,
            ]
        );

        // 5. Buat Task Templates untuk divisi IT (ERD v3: title & description)
        $tasks = [
            ['title' => 'Setup VR', 'description' => 'Mempersiapkan device Oculus'],
            ['title' => 'Maintenance Server', 'description' => 'Pengecekan rutin kabel LAN'],
            ['title' => 'Update Sistem', 'description' => 'Patch security OS'],
        ];

        foreach ($tasks as $task) {
            TaskTemplate::firstOrCreate(
                ['division_id' => $it->id, 'title' => $task['title']],
                ['description' => $task['description'], 'is_active' => true]
            );
        }

        // 6. Buat Task Templates untuk Media
        $mediaTasks = [
            ['title' => 'Digisign Update', 'description' => 'Upload konten ke papan digital'],
            ['title' => 'Pembuatan Konten', 'description' => 'Shooting video dokumentasi'],
        ];

        foreach ($mediaTasks as $task) {
            TaskTemplate::firstOrCreate(
                ['division_id' => $metpro->id, 'title' => $task['title']],
                ['description' => $task['description'], 'is_active' => true]
            );
        }
    }
}
