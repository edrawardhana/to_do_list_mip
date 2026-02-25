<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Division;
use App\Models\TaskMaster;
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
            ['name' => 'IT'],
            ['description' => 'Divisi IT dan pengembangan sistem']
        );

        $media = Division::firstOrCreate(
            ['name' => 'Media'],
            ['description' => 'Divisi media dan konten']
        );

        Division::firstOrCreate(
            ['name' => 'Marketing'],
            ['description' => 'Divisi marketing dan promosi']
        );

        // 2. Buat User Admin
        User::firstOrCreate(
            ['email' => 'admin@mcc.com'],
            [
                'full_name'     => 'Admin MCC',
                'password_hash' => Hash::make('password123'),
                'role'          => 'SuperAdmin',
                'division_id'   => $it->id,
                'shift_type'    => 'Morning',
                'is_locked'     => false,
                'status'        => 'Active',
            ]
        );

        // 3. Buat User Intern Testing
        $intern = User::firstOrCreate(
            ['email' => 'intern@mcc.com'],
            [
                'full_name'     => 'Intern Testing',
                'password_hash' => Hash::make('password123'),
                'role'          => 'Intern',
                'division_id'   => $it->id,
                'shift_type'    => 'Morning',
                'is_locked'     => false,
                'status'        => 'Active',
            ]
        );

        // 4. Buat Tasks Master untuk divisi IT
        $tasks = [
            ['task_name' => 'Setup VR', 'description' => 'Setup perangkat Virtual Reality'],
            ['task_name' => 'Maintenance Server', 'description' => 'Cek dan maintenance server'],
            ['task_name' => 'Update Sistem', 'description' => 'Update aplikasi dan sistem internal'],
        ];

        foreach ($tasks as $task) {
            TaskMaster::firstOrCreate(
                ['division_id' => $it->id, 'task_name' => $task['task_name']],
                ['description' => $task['description']]
            );
        }

        // 5. Buat Tasks Master untuk divisi Media
        $mediaTasks = [
            ['task_name' => 'Digisign Update', 'description' => 'Update konten digital signage'],
            ['task_name' => 'Pembuatan Konten', 'description' => 'Membuat konten sosial media'],
        ];

        foreach ($mediaTasks as $task) {
            TaskMaster::firstOrCreate(
                ['division_id' => $media->id, 'task_name' => $task['task_name']],
                ['description' => $task['description']]
            );
        }
    }
}
