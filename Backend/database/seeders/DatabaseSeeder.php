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
        $it = Division::firstOrCreate(
            ['name' => 'IT']
        );

        $metpro = Division::firstOrCreate(
            ['name' => 'Media dan Production']
        );

        $administrasi = Division::firstOrCreate(
            ['name' => 'Administrasi']
        );

        $cr = Division::firstOrCreate(
            ['name' => 'Customer Relation']
        );

        $pr = Division::firstOrCreate(
            ['name' => 'Public Relation']
        );

        $marketing = Division::firstOrCreate(
            ['name' => 'Marketing dan Partnership']
        );

        // 2. Buat User SuperAdmin (menggantikan admin sebelumnya)
        User::updateOrCreate(
            ['email' => 'admin@mcc.com'],
            [
                'full_name'     => 'Admin MCC',
                'password_hash' => Hash::make('password123'),
                'role'          => 'super_admin',
                'division_id'   => $it->id,
                'shift'         => 'pagi',
                'is_locked'     => false,
            ]
        );

        // 3. Buat User Intern Testing
        User::updateOrCreate(
            ['email' => 'intern@mcc.com'],
            [
                'full_name'     => 'Intern Testing',
                'password_hash' => Hash::make('password123'),
                'role'          => 'user',
                'division_id'   => $it->id,
                'shift'         => 'pagi',
                'is_locked'     => false,
            ]
        );

        // 4. Buat Task Templates untuk divisi IT
        $tasks = [
            ['task_name' => 'Setup VR'],
            ['task_name' => 'Maintenance Server'],
            ['task_name' => 'Update Sistem'],
        ];

        foreach ($tasks as $task) {
            TaskTemplate::firstOrCreate(
                ['division_id' => $it->id, 'task_name' => $task['task_name']]
            );
        }

        // 5. Buat Task Templates untuk divisi Media dan Production
        $mediaTasks = [
            ['task_name' => 'Digisign Update'],
            ['task_name' => 'Pembuatan Konten'],
        ];

        foreach ($mediaTasks as $task) {
            TaskTemplate::firstOrCreate(
                ['division_id' => $metpro->id, 'task_name' => $task['task_name']]
            );
        }
    }
}
