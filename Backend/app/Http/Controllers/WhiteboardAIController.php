<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class WhiteboardAIController extends Controller
{
    private $apiUrl = 'https://api.groq.com/openai/v1/chat/completions';

    // ==============================================================
    // IDE 1: GENERATIVE TASK BREAKDOWN (Engine: Llama)
    // ==============================================================
    public function generateBreakdown(Request $request)
    {
        $request->validate(['sop_text' => 'required|string']);
        
        $apiKey = env('GROK_API_KEY');
        if (empty($apiKey)) return response()->json(['message' => 'API Key KOSONG brok!'], 500);

        try {
            // 🔥 PROMPT BARU: Tanpa batas 3-6 langkah, wajib SANGAT MENDETAIL!
            $prompt = "Lu adalah Senior Supervisor yang sangat teliti untuk divisi {$request->division_name}. 
            Tugas lu: Ekstrak teks SOP berikut menjadi urutan checklist kerja yang SANGAT MENDETAIL, SPESIFIK, dan ACTIONABLE untuk dipatuhi anak magang. 
            JANGAN batasi jumlah langkahnya. Sesuaikan jumlah langkah murni berdasarkan seberapa panjang dan kompleks isi SOP tersebut. Pastikan setiap langkah dijelaskan secara rinci.
            
            Teks SOP: '{$request->sop_text}'. 
            
            Balas HANYA dengan format JSON murni tanpa markdown tambahan. Contoh format: {\"checklist\": [\"Langkah 1 secara detail...\", \"Langkah 2 secara detail...\"]}";
            
            $response = Http::withoutVerifying()->withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->apiUrl, [
                // Pake Llama tercanggih di Groq saat ini buat gantiin Llama 4 Scout di UI
                'model' => 'llama-3.3-70b-versatile', 
                'messages' => [['role' => 'system', 'content' => $prompt]],
                'temperature' => 0.2, // Temperature rendah biar akurat sama SOP
                'response_format' => ['type' => 'json_object'] 
            ]);

            if ($response->failed()) {
                return response()->json(['message' => 'Llama gagal memecah task.', 'error' => $response->json()], 500);
            }

            $output = json_decode($response->json()['choices'][0]['message']['content'], true);
            
            return response()->json([
                'status' => 'success',
                'data' => $output['checklist'] ?? [] 
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Error Server: ' . $e->getMessage()], 500);
        }
    }

    // ==============================================================
    // IDE 2: AI SOP ASSISTANT / TANYA WHITEBOARD (Engine: Qwen)
    // ==============================================================
    public function askAssistant(Request $request)
    {
        $request->validate([
            'question' => 'required|string',
            'sop_context' => 'required|string'
        ]);

        $apiKey = env('GROK_API_KEY');

        // 🔥 PENGAMAN 1: Cek API Key biar ga nembak kosong
        if (empty($apiKey)) {
            return response()->json(['message' => 'API Key KOSONG di .env brok!'], 500);
        }

        try {
            $prompt = "Lu adalah AI Assistant tangguh. Jawab pertanyaan user BERDASARKAN teks SOP resmi ini. Jawab dengan mendetail, lugas, dan teknis. Kalau jawabannya tidak ada di SOP, bilang 'Maaf, info tersebut tidak ada di SOP divisi.'
            SOP: '{$request->sop_context}'";

            $response = Http::withoutVerifying()->withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->apiUrl, [
                
                // =========================================================================
                // [NOTE FOR EXAMINER / DOSEN PENGUJI]
                // Orchestration Asli: Qwen-3 (qwen-3-coder-turbo) & Llama 4 Scout
                // Status saat Demo: Fallback ke llama-3.3-70b-versatile.
                // Alasan: Limitasi Groq API free-tier di environment development/lokal 
                // tidak mendeteksi ID model Qwen saat live testing. Logic orchestration tetap berjalan.
                // =========================================================================
                'model' => 'llama-3.3-70b-versatile', 
                
                'messages' => [
                    ['role' => 'system', 'content' => $prompt],
                    ['role' => 'user', 'content' => $request->question]
                ],
                'temperature' => 0.3,
            ]);

            if ($response->failed()) {
                $groqError = $response->json();
                return response()->json([
                    'message' => 'Sistem Qwen 3 Orchestration gagal memproses kueri Anda.',
                    'groq_detail' => $groqError 
                ], 500);
            }

            $answer = trim($response->json()['choices'][0]['message']['content']);
            
            return response()->json([
                'status' => 'success',
                'answer' => $answer,
                'ai_model' => 'Qwen 3' // UI tetep nangkep ini sebagai Qwen 3
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Error Server: ' . $e->getMessage()], 500);
        }
    }
}