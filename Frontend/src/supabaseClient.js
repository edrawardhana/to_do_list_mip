// src/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

// Ambil URL dan Anon Key dari dashboard Supabase Anda
const supabaseUrl = "https://syvvhzdstzdcnehkzbik.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5dnZoemRzdHpkY25laGt6YmlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MzEzMTEsImV4cCI6MjA4NzEwNzMxMX0.Yk2jh17ldjmXutan7AKodQbQaM8orK8CKsh0Mp3iBj8";

export const supabase = createClient(supabaseUrl, supabaseKey);
