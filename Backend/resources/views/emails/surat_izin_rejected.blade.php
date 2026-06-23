<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Surat Izin Ditolak</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #f6f9fc;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
        }
        .wrapper {
            width: 100%;
            background-color: #f6f9fc;
            padding: 40px 20px;
            box-sizing: border-box;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            border: 1px solid #eef2f5;
        }
        /* Header merah untuk penolakan */
        .header {
            background: linear-gradient(135deg, #7f1d1d, #dc2626);
            padding: 35px 40px;
            text-align: center;
        }
        .logo {
            max-height: 55px;
            margin-bottom: 15px;
        }
        .header-title {
            color: #ffffff;
            font-size: 22px;
            font-weight: 700;
            margin: 0;
            letter-spacing: -0.5px;
        }
        .header-subtitle {
            color: rgba(255,255,255,0.80);
            font-size: 13px;
            margin: 6px 0 0 0;
        }
        /* Badge status */
        .status-badge {
            display: inline-block;
            background-color: #fee2e2;
            color: #991b1b;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
            padding: 5px 14px;
            border-radius: 999px;
            margin-bottom: 20px;
        }
        .content {
            padding: 40px;
        }
        .greeting {
            font-size: 16px;
            color: #1e293b;
            margin-top: 0;
            margin-bottom: 12px;
        }
        .message {
            font-size: 15px;
            color: #475569;
            line-height: 1.6;
            margin-bottom: 25px;
        }
        .detail-card {
            background-color: #f8fafc;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 25px;
            border: 1px solid #f1f5f9;
        }
        .detail-title {
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #64748b;
            margin-top: 0;
            margin-bottom: 16px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 8px;
        }
        /* Info box merah untuk penolakan */
        .alert-box {
            background-color: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 25px;
        }
        .alert-text {
            font-size: 13px;
            color: #991b1b;
            margin: 0;
            line-height: 1.5;
        }
        /* Info box biru untuk saran */
        .info-box {
            background-color: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 25px;
        }
        .info-text {
            font-size: 13px;
            color: #1e40af;
            margin: 0;
            line-height: 1.5;
        }
        .footer {
            background-color: #f8fafc;
            padding: 24px 40px;
            text-align: center;
            border-top: 1px solid #f1f5f9;
        }
        .footer-text {
            font-size: 11px;
            color: #94a3b8;
            margin: 0;
            line-height: 1.5;
        }
    </style>
@php
    $logoUrl = env('LOGO_EMAIL_URL', '');
    $tipeIzin = ucfirst(str_replace('_', ' ', $exception->type));
    $tanggal = \Carbon\Carbon::parse($exception->permission_date)->locale('id')->translatedFormat('l, d F Y');
    $rejectorName = $rejectedBy->full_name ?? '-';
    $rejectorRole = match($rejectedBy->role ?? '') {
        'admin'       => 'Manager / Admin Divisi',
        'super_admin' => 'SPV / Superadmin',
        default       => 'Administrator',
    };
@endphp
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                @if($logoUrl)
                    <img class="logo" src="{{ $logoUrl }}" alt="MCC Logo" />
                @endif
                <h1 class="header-title">Surat Izin Ditolak</h1>
                <p class="header-subtitle">Permohonan izin Anda tidak dapat disetujui</p>
            </div>

            <div class="content">
                <p class="greeting">Halo <strong>{{ $user->full_name }}</strong>,</p>
                <p class="message">
                    Kami ingin menginformasikan bahwa permohonan izin Anda yang diajukan pada sistem absensi MIP
                    telah <strong>ditolak</strong> oleh <strong>{{ $rejectorName }}</strong> selaku <strong>{{ $rejectorRole }}</strong>.
                </p>

                {{-- Badge status --}}
                <div style="text-align: center; margin-bottom: 24px;">
                    <span class="status-badge">❌ Ditolak</span>
                </div>

                {{-- Detail Pengajuan --}}
                <div class="detail-card">
                    <h3 class="detail-title">Detail Pengajuan</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #475569; width: 140px; vertical-align: top;">Tipe Izin</td>
                            <td style="padding: 6px 0; font-size: 14px; color: #1e293b; vertical-align: top;">{{ $tipeIzin }}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #475569; vertical-align: top;">Tanggal Izin</td>
                            <td style="padding: 6px 0; font-size: 14px; color: #1e293b; vertical-align: top;">{{ $tanggal }}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #475569; vertical-align: top;">Keterangan</td>
                            <td style="padding: 6px 0; font-size: 14px; color: #1e293b; vertical-align: top;">{{ $exception->description }}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #475569; vertical-align: top;">Ditolak oleh</td>
                            <td style="padding: 6px 0; font-size: 14px; color: #dc2626; font-weight: 600; vertical-align: top;">{{ $rejectorName }} ({{ $rejectorRole }})</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #475569; vertical-align: top;">Waktu Diproses</td>
                            <td style="padding: 6px 0; font-size: 14px; color: #1e293b; vertical-align: top;">
                                {{ \Carbon\Carbon::parse($exception->processed_at)->locale('id')->translatedFormat('l, d F Y · H:i') }} WIB
                            </td>
                        </tr>
                    </table>
                </div>

                {{-- Pesan penolakan --}}
                <div class="alert-box">
                    <p class="alert-text">
                        <strong>⚠️ Perhatian:</strong> Pengajuan izin ini telah ditolak dan tidak akan diproses lebih lanjut.
                        Status kehadiran Anda pada tanggal tersebut tetap tercatat sesuai data absensi.
                    </p>
                </div>

                {{-- Saran tindak lanjut --}}
                <div class="info-box">
                    <p class="info-text">
                        <strong>💡 Langkah Selanjutnya:</strong> Jika Anda merasa ada kesalahan atau ingin mengajukan kembali,
                        silakan hubungi Manager/SPV Anda secara langsung atau ajukan ulang permohonan melalui sistem MipActivity.
                    </p>
                </div>

                <p class="message" style="margin-bottom: 0;">Terima kasih atas pengertian Anda.</p>
            </div>

            <div class="footer">
                <p class="footer-text">Email ini dikirim secara otomatis oleh Sistem Absensi &amp; Logbook MIP. Harap tidak membalas email ini.</p>
            </div>
        </div>
    </div>
</body>
</html>
