<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

// Catatan: Scheduled tasks (housekeeping 60 hari & pengingat tugas dinamis)
// didaftarkan via ->withSchedule() di bootstrap/app.php
// Jalankan dengan: php artisan schedule:run  (atau php artisan schedule:work)

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');
