# Dokumentasi RLS (Row Level Security)

Penjelasan tentang sistem keamanan RLS yang diterapkan di database Supabase project ini.

---

## Apa Itu RLS?

RLS (Row Level Security) adalah fitur bawaan PostgreSQL yang membatasi akses data **per baris** berdasarkan siapa yang sedang mengakses. Jadi meskipun dua user mengakses tabel yang sama, data yang mereka lihat bisa berbeda tergantung kondisi yang kita tentukan.

Di project ini, RLS digunakan untuk **menyekat konten per divisi**. Artinya user dari divisi IT hanya bisa melihat data milik divisi IT, user dari divisi Media hanya bisa lihat data divisi Media, dan seterusnya.

---

## Tabel Yang Sudah Dipasang RLS

### 1. `whiteboards`

Tabel whiteboard menyimpan aset, SOP, dan tutorial per divisi. RLS dipasang agar konten tersekat berdasarkan `division_id` user yang sedang login.

**Policy yang aktif:**

| Nama Policy | Aksi | Aturan |
|-------------|------|--------|
| `whiteboard_division_select` | SELECT | User hanya bisa **melihat** whiteboard di divisinya |
| `whiteboard_division_insert` | INSERT | User hanya bisa **menambah** whiteboard ke divisinya |
| `whiteboard_division_update` | UPDATE | User hanya bisa **mengedit** whiteboard di divisinya |
| `whiteboard_division_delete` | DELETE | User hanya bisa **menghapus** whiteboard di divisinya |

**Cara kerja:**
Setiap kali ada akses ke tabel `whiteboards`, database akan:
1. Mengambil `auth.uid()` (UUID user yang sedang login via Supabase Auth).
2. Mencocokan UUID tersebut ke tabel `profiles` untuk mendapatkan `division_id` milik user itu.
3. Hanya menampilkan/mengizinkan baris yang `division_id`-nya cocok.

**Contoh SQL policy-nya:**
```sql
CREATE POLICY whiteboard_division_select ON public.whiteboards
  FOR SELECT
  USING (
    division_id = (
      SELECT division_id FROM public.profiles WHERE id = auth.uid()
    )
  );
```

---

## Cara Cek RLS Sudah Aktif

Di Supabase Dashboard, buka tabel `whiteboards`. Kalau di bagian atas ada label **"RLS enabled"** (bukan "RLS disabled"), berarti sudah aktif.

Atau jalankan SQL ini di SQL Editor Supabase:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'whiteboards';
```
Kalau hasilnya `rowsecurity = true`, berarti RLS sudah nyala.

---

## Catatan

- RLS hanya berlaku untuk akses via **Supabase Client SDK** (anon key / authenticated key). Akses via **service_role key** atau koneksi langsung dari Backend Laravel (via `.env` DB credentials) **tidak terkena RLS** karena dianggap sebagai admin/server.
- Jika nanti ada tabel lain yang perlu disekat per divisi (misal `daily_tasks`), tinggal pasang RLS dengan pola yang sama.
