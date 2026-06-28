<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Division;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Pastikan ada setidaknya satu divisi agar constraint database tidak error
        $it = Division::firstOrCreate(['name' => 'IT']);

        User::updateOrCreate(
            ['email' => 'superadmin@mcc.com'], // Bisa diganti sesuai kebutuhan
            [
                'full_name'     => 'Super Admin MCC',
                'password_hash' => Hash::make('password123'), // Disarankan diganti setelah login pertama
                'role'          => 'super_admin',
                'division_id'   => $it->id, 
                'is_verified'   => true,
                'is_locked'     => false,
            ]
        );

        $this->command->info('User Superadmin berhasil dibuat! (Email: superadmin@mcc.com | Pass: password123)');
    }
}
