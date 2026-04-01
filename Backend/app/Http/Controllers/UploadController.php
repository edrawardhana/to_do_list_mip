<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    /**
     * Upload an image/evidence to Supabase Storage
     */
    public function uploadEvidence(Request $request)
    {
        // 1. Validasi Input Dasar
        $request->validate([
            'evidence_file' => 'required|image|mimes:jpeg,png,jpg,webp|max:5120', // Maks 5MB, hanya gambar
        ], [
            'evidence_file.required' => 'File foto/bukti wajib diunggah.',
            'evidence_file.image' => 'File harus berupa gambar.',
            'evidence_file.mimes' => 'Format gambar harus JPEG, PNG, JPG, atau WEBP.',
            'evidence_file.max' => 'Ukuran gambar maksimal adalah 5MB.',
        ]);

        try {
            // 2. Ambil File dari Request
            $file = $request->file('evidence_file');

            // 3. Buat nama file yang unik agar tidak tertimpa (Contoh: evidence_167890_abc123.jpg)
            $extension = $file->extension() ?: 'jpg';
            $filename = 'evidence_' . time() . '_' . Str::random(8) . '.' . $extension;

            // 4. Proses Upload ke Supabase (via disk 'supabase')
            // Method putFileAs otomatis membaca stream, sangat efisien RAM.
            // Parameter pertama ('') adalah root folder dari bucket (karena bucket kita sudah spesifik di env).
            Storage::disk('supabase')->putFileAs('', $file, $filename, 'public');

            // 5. Generate URL Publik yang bisa langsung diakses Frontend
            $publicUrl = Storage::disk('supabase')->url($filename);

            // 6. Kembalikan Response Sukses ke Frontend beserta URL-nya
            return response()->json([
                'status' => 'success',
                'message' => 'Gambar berhasil diunggah.',
                'data' => [
                    'evidence_url' => $publicUrl
                ]
            ], 201);

        } catch (\Exception $e) {
            // 7. Tangani jika koneksi ke Supabase gagal atau Kredensial Salah
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengunggah gambar ke server Supabase Storage.',
                'debug' => env('APP_DEBUG') ? $e->getMessage() : 'Internal Server Error'
            ], 500);
        }
    }
}
