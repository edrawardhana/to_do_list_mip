<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Mail;

// Catatan: Scheduled tasks (housekeeping 60 hari & pengingat tugas dinamis)
// didaftarkan via ->withSchedule() di bootstrap/app.php
// Jalankan dengan: php artisan schedule:run  (atau php artisan schedule:work)

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/**
 * Test pengiriman email via Mailtrap Live Sending (Email API).
 * Pastikan MAILTRAP_API_KEY sudah diisi di .env sebelum menjalankan.
 * Jalankan: php artisan send-mail
 */
Artisan::command('send-mail', function () {
    $this->info('Mengirim email test via Mailtrap Live Sending...');

    try {
        Mail::mailer('mailtrap-sdk')
            ->raw(
                "Halo!\n\nIni adalah email test dari sistem MipActivity MCC.\n\nEmail berhasil dikirim via Mailtrap Live Sending (Email API).\n\n- MipActivity MCC",
                function ($message) {
                    $message
                        ->to('noval.compani@gmail.com')
                        ->from(config('mail.from.address'), config('mail.from.name'))
                        ->subject('Test Email - MipActivity MCC');
                }
            );

        $this->info('✅ Email berhasil dikirim ke noval.compani@gmail.com!');
    } catch (\Exception $e) {
        $this->error('❌ Gagal mengirim email: ' . $e->getMessage());
    }
})->purpose('Test Live Sending email via Mailtrap SDK');
