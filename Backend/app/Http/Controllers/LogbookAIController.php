<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class LogbookAIController extends Controller
{
    public function checkLogbook(Request $request)
    {
        $request->validate([
            'logbook_text' => 'required|string|min:5',
        ]);

        try {
            $logbookText = $request->logbook_text;
            $divisionName = $request->user()?->division?->name ?? 'General'; 

            $apiUrl = env('GROK_API_URL') ?: 'https://api.groq.com/openai/v1/chat/completions';
            $apiKey = env('GROK_API_KEY'); 

            if (empty($apiKey)) return response()->json(['message' => 'API Key kosong! Cek .env'], 500);

            // ── TAHAP 1: LLAMA 4 SCOUT ──
            $llamaPrompt = "Lu adalah AI Assessor santai untuk divisi {$divisionName}. Evaluasi logbook ini: '{$logbookText}'. 
            Aturan: 1. ACCEPTED jika konteks kegiatannya jelas. 2. REJECTED HANYA jika teks berisi spam huruf acak atau hanya 1 kata tanpa makna kerjaan. 
            Balas HANYA 'ACCEPTED' jika lolos. Jika nolak, balas format 'REJECTED: <alasan>'";

            $scoutResponse = Http::withoutVerifying()->withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ])->post($apiUrl, [
                'model' => 'llama-3.3-70b-versatile', 
                'messages' => [['role' => 'system', 'content' => $llamaPrompt]],
                'temperature' => 0.2, 
            ]);

            // PELACAK ERROR GROQ
            if ($scoutResponse->failed()) {
                $errData = $scoutResponse->json();
                $errMsg = $errData['error']['message'] ?? 'API Groq Error (Mungkin Limit / Down)';
                return response()->json(['message' => 'Gagal kontak Llama: ' . $errMsg], 500);
            }
            
            $aiReply = trim($scoutResponse->json()['choices'][0]['message']['content']);
            
            if (str_contains(strtoupper($aiReply), 'REJECTED')) {
                return response()->json([
                    'status' => 'rejected',
                    'message' => 'Llama 4 Scout: ' . str_replace('REJECTED:', '', $aiReply)
                ], 422); // INI YANG BIKIN 422 (NORMAL)
            }

            // ── TAHAP 2: QWEN 3 (FALLBACK AMAN) ──
            $qwenPrompt = "Buat ringkasan profesional maksimal 1 kalimat dari: '{$logbookText}'. 
            Tentukan 1 kategori divisi: (Marketing, Public Relation, Customer Relation, IT Support, Administration, Media & Production). 
            Balas HANYA format JSON murni: {\"summary\": \"...\", \"category\": \"...\"}. JANGAN ada markdown.";

            $qwenResponse = Http::withoutVerifying()->withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ])->post($apiUrl, [
                'model' => 'qwen-2.5-32b', 
                'messages' => [['role' => 'system', 'content' => $qwenPrompt]],
                'temperature' => 0.3,
            ]);

            if ($qwenResponse->failed()) {
                $qwenData = ['summary' => 'Kegiatan disetujui (Qwen limit/timeout).', 'category' => $divisionName];
            } else {
                $qwenRawOutput = trim($qwenResponse->json()['choices'][0]['message']['content']);
                $qwenRawOutput = str_replace(['```json', '```'], '', $qwenRawOutput);
                $qwenData = json_decode(trim($qwenRawOutput), true) ?: ['summary' => 'Logbook diterima.', 'category' => $divisionName];
            }

            return response()->json([
                'status' => 'accepted',
                'message' => 'Logbook solid, divalidasi Llama 4 Scout!',
                'ai_data' => [
                    'original_text' => $logbookText,
                    'summary' => $qwenData['summary'] ?? '',
                    'category' => $qwenData['category'] ?? $divisionName,
                    'processed_by' => 'Qwen 3'
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Sistem Backend Error: ' . $e->getMessage()], 500);
        }
    }
}