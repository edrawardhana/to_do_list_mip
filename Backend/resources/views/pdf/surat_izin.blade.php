<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Surat Izin</title>
    <style>
        @page {
            margin: 0;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-image: url('{{ public_path("images/template_surat_izin.png") }}');
            background-size: cover;
            background-repeat: no-repeat;
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            font-size: 12px;
        }
        .container {
            padding: 135px 55px 35px 55px; /* Shifted up from 175px to avoid being too low */
        }
        .title {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            letter-spacing: 1px;
            text-decoration: none;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            margin-bottom: 15px;
        }
        .table-data td {
            padding: 8px;
            border: 1px solid #000;
        }
        .table-data td.label {
            width: 25%;
        }
        .table-data td.colon {
            width: 3%;
            text-align: center;
        }
        .table-data td.val {
            width: 72%;
        }
        .checkbox-container {
            width: 100%;
            border-left: 1px solid #000;
            border-right: 1px solid #000;
            border-bottom: 1px solid #000;
            font-size: 12px;
        }
        .checkbox-row {
            border-bottom: 1px solid #000;
            padding: 6px 12px;
        }
        .checkbox-row:last-child {
            border-bottom: none;
        }
        .checkbox-box {
            display: inline-block;
            width: 14px;
            height: 14px;
            border: 1px solid #000;
            border-radius: 50%;
            margin-right: 10px;
            vertical-align: middle;
            position: relative;
        }
        .checkbox-dot {
            position: absolute;
            top: 2px;
            left: 2px;
            width: 8px;
            height: 8px;
            background-color: #000;
            border-radius: 50%;
        }
        .checkbox-text {
            display: inline-block;
            vertical-align: middle;
        }
        .textarea-box {
            border-left: 1px solid #000;
            border-right: 1px solid #000;
            border-bottom: 1px solid #000;
            padding: 10px 12px;
            min-height: 50px;
            font-size: 12px;
        }
        .date-box {
            border-left: 1px solid #000;
            border-right: 1px solid #000;
            border-bottom: 1px solid #000;
            padding: 10px 12px;
            font-size: 12px;
        }
        .footer-table {
            margin-top: 25px;
            border: 1px solid #000;
        }
        .footer-table th, .footer-table td {
            border: 1px solid #000;
            text-align: center;
            width: 33.33%;
            font-size: 12px;
        }
        .footer-table th {
            padding: 6px;
            font-weight: normal;
        }
        .footer-table td {
            height: 130px;
            vertical-align: bottom;
            padding: 8px;
            position: relative;
        }
        .signature-img {
            max-height: 100px;
            max-width: 170px;
            display: block;
            margin: 0 auto 5px auto;
        }
        .stamp-wrapper {
            position: absolute;
            top: 5px;
            left: 0;
            width: 100%;
            height: 95px;
        }
        .spv-signature {
            position: absolute;
            top: 35px;
            left: 50%;
            transform: translateX(-50%);
            max-height: 95px;
            max-width: 155px;
            z-index: 2;
        }
        .stamp-img {
            position: absolute;
            top: 15px;
            left: 30px;
            max-height: 90px;
            max-width: 130px;
            opacity: 0.85;
            z-index: 1;
        }
        .noted-section {
            margin-top: 30px;
            font-size: 12px;
            font-style: italic;
            line-height: 1.4;
        }
        .noted-title {
            font-weight: bold;
            margin-bottom: 4px;
        }
        .date-text {
            display: block;
            width: 100%;
            text-align: center;
            font-size: 12px;
            clear: both;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Judul Surat -->
        <div class="title">SURAT IZIN</div>

        <!-- Tabel Informasi Diri -->
        <table class="table-data" cellpadding="0" cellspacing="0">
            <tr>
                <td class="label">Nama</td>
                <td class="colon">:</td>
                <td class="val">{{ $user->full_name }}</td>
            </tr>
            <tr>
                <td class="label">NIK</td>
                <td class="colon">:</td>
                <td class="val">{{ $user->internship_batch ?? '-' }}</td>
            </tr>
            <tr>
                <td class="label">Divisi</td>
                <td class="colon">:</td>
                <td class="val">{{ $user->division->name ?? '-' }}</td>
            </tr>
            <tr>
                <td class="label">Jabatan</td>
                <td class="colon">:</td>
                <td class="val">Intern / Magang</td>
            </tr>
        </table>

        <!-- Opsi Izin -->
        <table cellpadding="0" cellspacing="0" style="margin-bottom: 0;">
            <tr>
                <td style="border: 1px solid #000; padding: 6px 12px; font-weight: normal;">
                    Dengan ini mengajukan ijin untuk :
                </td>
            </tr>
        </table>

        <div class="checkbox-container">
            <!-- Opsi 1: Terlambat masuk kerja -->
            <div class="checkbox-row">
                <span class="checkbox-box">
                    @if($exception->type === 'terlambat')
                        <span class="checkbox-dot"></span>
                    @endif
                </span>
                <span class="checkbox-text">Terlambat masuk kerja</span>
            </div>
            <!-- Opsi 2: Sakit -->
            <div class="checkbox-row">
                <span class="checkbox-box">
                    @if($exception->type === 'sakit')
                        <span class="checkbox-dot"></span>
                    @endif
                </span>
                <span class="checkbox-text">Sakit (ada/ tidak ada surat Dokter)</span>
            </div>
            <!-- Opsi 3: Pulang Lebih Awal -->
            <div class="checkbox-row">
                <span class="checkbox-box">
                    @if($exception->type === 'pulang_awal')
                        <span class="checkbox-dot"></span>
                    @endif
                </span>
                <span class="checkbox-text">Pulang lebih awal</span>
            </div>
            <!-- Opsi 4: Ganti Shift -->
            <div class="checkbox-row">
                <span class="checkbox-box">
                    @if($exception->type === 'swap_shift')
                        <span class="checkbox-dot"></span>
                    @endif
                </span>
                <span class="checkbox-text">Ganti Shift</span>
            </div>
            <!-- Opsi 5: Sebab Lain (Izin atau Tugas Luar) -->
            <div class="checkbox-row">
                <span class="checkbox-box">
                    @if(in_array($exception->type, ['izin', 'tugas_luar']))
                        <span class="checkbox-dot"></span>
                    @endif
                </span>
                <span class="checkbox-text">Sebab lain {{ $exception->type === 'tugas_luar' ? '(Tugas Luar)' : '' }}</span>
            </div>
        </div>

        <!-- Alasan -->
        <table cellpadding="0" cellspacing="0" style="margin-bottom: 0; margin-top: 15px;">
            <tr>
                <td style="border: 1px solid #000; padding: 6px 12px; border-bottom: none;">
                    Alasan
                </td>
            </tr>
        </table>
        <div class="textarea-box">
            {{ $exception->description }}
        </div>

        <!-- Hari & Tanggal -->
        <table cellpadding="0" cellspacing="0" style="margin-bottom: 0; margin-top: 15px;">
            <tr>
                <td style="border: 1px solid #000; padding: 6px 12px; border-bottom: none;">
                    Pada Hari & Tanggal
                </td>
            </tr>
        </table>
        <div class="date-box">
            {{ \Carbon\Carbon::parse($exception->permission_date)->locale('id')->translatedFormat('l, d F Y') }}
        </div>

        <!-- Tabel Tanda Tangan & Stempel -->
        <table class="footer-table" cellpadding="0" cellspacing="0">
            <tr>
                <th>Mengetahui,<br>Penanggung Jawab / Manager</th>
                <th>Menyetujui,<br>SPV</th>
                <th>Karyawan Ybs,</th>
            </tr>
            <tr>
                <!-- TTD Manager (Admin Divisi) -->
                <td>
                    @if($manager && $managerSignature)
                        @php
                            $managerSigPath = str_replace(config('app.url') . '/storage/', '', $managerSignature);
                        @endphp
                        @if(str_starts_with($managerSignature, 'http') && !str_contains($managerSignature, config('app.url')))
                            <img class="signature-img" src="{{ $managerSignature }}" />
                        @elseif(file_exists(public_path('storage/' . $managerSigPath)))
                            <img class="signature-img" src="{{ public_path('storage/' . $managerSigPath) }}" />
                        @elseif(file_exists(public_path($managerSigPath)))
                            <img class="signature-img" src="{{ public_path($managerSigPath) }}" />
                        @endif
                    @endif
                    <div class="date-text">Tgl. {{ $exception->manager_approved_at ? $exception->manager_approved_at->format('d/m/Y') : '' }}</div>
                </td>
                
                <!-- TTD SPV + Stempel (Superadmin) -->
                <td>
                    <div class="stamp-wrapper">
                        <!-- Render Stempel Superadmin first (underneath) -->
                        @if($spv && $spvStamp)
                            @php
                                $spvStampPath = str_replace(config('app.url') . '/storage/', '', $spvStamp);
                            @endphp
                            @if(str_starts_with($spvStamp, 'http') && !str_contains($spvStamp, config('app.url')))
                                <img class="stamp-img" src="{{ $spvStamp }}" />
                            @elseif(file_exists(public_path('storage/' . $spvStampPath)))
                                <img class="stamp-img" src="{{ public_path('storage/' . $spvStampPath) }}" />
                            @elseif(file_exists(public_path($spvStampPath)))
                                <img class="stamp-img" src="{{ public_path($spvStampPath) }}" />
                            @endif
                        @endif

                        <!-- Render TTD Superadmin second (overlaps stamp) -->
                        @if($spv && $spvSignature)
                            @php
                                $spvSigPath = str_replace(config('app.url') . '/storage/', '', $spvSignature);
                            @endphp
                            @if(str_starts_with($spvSignature, 'http') && !str_contains($spvSignature, config('app.url')))
                                <img class="spv-signature" src="{{ $spvSignature }}" />
                            @elseif(file_exists(public_path('storage/' . $spvSigPath)))
                                <img class="spv-signature" src="{{ public_path('storage/' . $spvSigPath) }}" />
                            @elseif(file_exists(public_path($spvSigPath)))
                                <img class="spv-signature" src="{{ public_path($spvSigPath) }}" />
                            @endif
                        @endif
                    </div>
                    <div class="date-text">Tgl. {{ $exception->spv_approved_at ? $exception->spv_approved_at->format('d/m/Y') : '' }}</div>
                </td>
                
                <!-- TTD Karyawan Ybs (Intern) -->
                <td>
                    @if($userSignature)
                        @php
                            $userSigPath = str_replace(config('app.url') . '/storage/', '', $userSignature);
                        @endphp
                        @if(str_starts_with($userSignature, 'http') && !str_contains($userSignature, config('app.url')))
                            <img class="signature-img" src="{{ $userSignature }}" />
                        @elseif(file_exists(public_path('storage/' . $userSigPath)))
                            <img class="signature-img" src="{{ public_path('storage/' . $userSigPath) }}" />
                        @elseif(file_exists(public_path($userSigPath)))
                            <img class="signature-img" src="{{ public_path($userSigPath) }}" />
                        @endif
                    @endif
                    <div class="date-text">Tgl. {{ $exception->created_at ? $exception->created_at->format('d/m/Y') : '' }}</div>
                </td>
            </tr>
        </table>

        <!-- Catatan -->
        <div class="noted-section">
            <div class="noted-title">Noted :</div>
            1. Batasan pengajuan tukar Shift & Off sebanyak 1 kali dalam 1 bulan, baik di hari yang sama atau tidak (Diluar Event).<br>
            2. Persetujuan ijin tidak bekerja dengan urgensinya & pertimbangan yang rasional, diluar dari izin karena musibah keluarga terdekat.<br>
            3. Pengajuan dilakukan min H-3.
        </div>
    </div>
</body>
</html>
