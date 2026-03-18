// src/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

// Ambil URL dan Anon Key dari dashboard Supabase Anda
const supabaseUrl = "https://YOUR_PROJECT_URL.supabase.co";
const supabaseKey = "YOUR_ANON_KEY";

export const supabase = createClient(supabaseUrl, supabaseKey);
