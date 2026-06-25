<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class WhiteboardAIController extends Controller
{
    private $apiUrl = 'https://api.groq.com/openai/v1/chat/completions';

    // ==============================================================
    // IDE 1: GENERATIVE TASK BREAKDOWN (Engine: Llama)
    // ==============================================================
    public function generateBreakdown(Request $request)
    {
        $request->validate(['sop_text' => 'required|string']);
        
        // Jaga-jaga typo nama variabel env lu
        $apiKey = env('GROK_API_KEY') ?? env('GROQ_API_KEY'); 
        if (empty($apiKey)) return response()->json(['message' => 'API Key KOSONG brok!'], 500);

        try {
            $systemPrompt = "Lu adalah Senior Supervisor yang sangat teliti untuk divisi {$request->division_name}. 
            Tugas lu: Ekstrak teks SOP menjadi urutan checklist kerja yang SANGAT MENDETAIL, SPESIFIK, dan ACTIONABLE untuk dipatuhi anak magang. 
            JANGAN batasi jumlah langkahnya. Pastikan setiap langkah dijelaskan secara rinci.
            
            Balas HANYA dengan format JSON murni tanpa markdown tambahan. Contoh format: {\"checklist\": [\"Langkah 1...\", \"Langkah 2...\"]}";
            
            $response = Http::withoutVerifying()
                ->timeout(120) // 🔥 FIX 1: Kasih napas 120 detik biar kaga RTO (Request Timeout)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $apiKey,
                    'Content-Type' => 'application/json',
                ])->post($this->apiUrl, [
                    'model' => 'llama-3.3-70b-versatile', 
                    'messages' => [
                        ['role' => 'system', 'content' => $systemPrompt],
                        // 🔥 FIX 2: Teks SOP masukin ke role "user", jangan disatuin di "system"
                        ['role' => 'user', 'content' => "Teks SOP: '" . $request->sop_text . "'"] 
                    ],
                    'temperature' => 0.2,
                    'response_format' => ['type' => 'json_object'] 
                ]);

            if ($response->failed()) {
                return response()->json(['message' => 'Llama gagal memecah task.', 'error' => $response->json()], 500);
            }

            $content = $response->json()['choices'][0]['message']['content'];
            
            // 🔥 FIX 3: Bersihin sampah markdown ```json yang suka dikasih AI sebelum di-decode
            $content = preg_replace('/```json\s*/', '', $content);
            $content = preg_replace('/```\s*/', '', $content);
            
            $output = json_decode($content, true);
            
            return response()->json([
                'status' => 'success',
                'data' => $output['checklist'] ?? [] 
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Error Server AI: ' . $e->getMessage()], 500);
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

        $user = Auth::user();
        
        // 🔥 FIX 1: Jaga-jaga Typo di .env
        $apiKey = env('GROK_API_KEY') ?? env('GROQ_API_KEY');

        $maxDailyLimit = 5;
        $cacheKey = "ai_chat_usage_{$user->id}_" . now()->toDateString();
        $currentUsage = Cache::get($cacheKey, 0);

        if ($currentUsage >= $maxDailyLimit) {
            return response()->json([
                'status' => 'error',
                'message' => 'Batas limit harian token AI lu udah abis brok! Jatah lu cuma 5 pertanyaan sehari. Coba lagi besok.',
                'remaining_quota' => 0
            ], 429); 
        }

        if (empty($apiKey)) {
            return response()->json(['message' => 'API Key KOSONG di .env!'], 500);
        }

        try {
            $systemPrompt = "Lu adalah AI Assistant tangguh. Jawab pertanyaan user BERDASARKAN teks SOP resmi ini. Jawab dengan mendetail, lugas, dan teknis. Kalau jawabannya tidak ada di SOP, bilang 'Maaf, info tersebut tidak ada di SOP divisi.'\n\nSOP: '{$request->sop_context}'";

            $response = Http::withoutVerifying()
                ->timeout(120) // 🔥 FIX 2: Kasih napas 120 detik!
                ->withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->apiUrl, [
                'model' => 'llama-3.3-70b-versatile', 
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $request->question]
                ],
                'temperature' => 0.3,
            ]);

            if ($response->failed()) {
                $groqError = $response->json();
                return response()->json([
                    'message' => 'Sistem AI Orchestration gagal memproses kueri Anda.',
                    'groq_detail' => $groqError 
                ], 500);
            }

            // 🔥 FIX 3: Kurangin Jatah Tokennya (Nambahin usage di Cache)
            Cache::put($cacheKey, $currentUsage + 1, now()->endOfDay());

            $answer = trim($response->json()['choices'][0]['message']['content']);
            
            return response()->json([
                'status' => 'success',
                'answer' => $answer,
                'ai_model' => 'Qwen 3', 
                'remaining_quota' => $maxDailyLimit - ($currentUsage + 1)
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Error Server AI: ' . $e->getMessage()], 500);
        }
    }
};