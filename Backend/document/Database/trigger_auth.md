# Dokumentasi Trigger Auth Supabase

Sistem database kita menggunakan **PostgreSQL Trigger** untuk menangani pembuatan profil user secara otomatis setiap kali ada registrasi baru di Supabase Authentication (`auth.users`).

---

## 1. Konsep & Tujuan

Di Supabase, data autentikasi user (seperti email dan password) disimpan di schema internal `auth`, tepatnya di tabel `auth.users`. Tabel ini di-manage langsung oleh Supabase secara aman.

Namun, untuk kebutuhan relasi aplikasi kita (seperti memberikan peran, menghubungkan ke divisi, status absensi), kita memiliki tabel `public.profiles`. 

Daripada kita harus mengkoding API secara manual untuk memasukkan data 2 kali (sekali ke `auth.users`, sekali ke `public.profiles`), pendekatan terbaik adalah menggunakan **Trigger Database**.

Tujuannya:
> **Setiap kali terjadi pendaftaran user baru (INSERT) di tabel `auth.users`, database akan secara otomatis menjalankan fungsi untuk membuat salinan baris profilnya di tabel `public.profiles`.**

---

## 2. Cara Kerja Trigger

Ada 2 komponen SQL yang sudah diimplementasikan di dalam Supabase untuk menjalankan sistem ini:

### A. Fungsi Handler (`handle_new_user`)
Fungsi ini dipanggil ketika trigger terpicu. Tugasnya mengambil data yang baru masuk (`new`) dan mengekstrak informasinya.
Fungsi ini juga diatur untuk membaca metadata (`raw_user_meta_data`) jika saat register kita menyisipkan data kustom (seperti `full_name`, `division_id`, dll).

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, division_id, full_name, email, role, shift, is_locked)
  VALUES (
    new.id,
    COALESCE((new.raw_user_meta_data->>'division_id')::uuid, (SELECT id FROM public.divisions LIMIT 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', 'Karyawan Baru'),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'user'),
    COALESCE(new.raw_user_meta_data->>'shift', 'pagi'),
    false
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Penjelasan Logika:**
- `new.id`: UUID profil sama persis dengan UUID di tabel keamanan auth.
- `new.email`: Menyalin email.
- `COALESCE`: Fungsi bawaan SQL untuk mengecek "Apakah datanya ada? Jika tidak ada, pakaikan data default". Misal jika saat register user tidak memasukkan nama, maka namanya akan otomatis jadi "Karyawan Baru".

### B. Trigger (`on_auth_user_created`)
Ini adalah "alarm" yang ditempelkan di tabel pendaftaran Supabase.
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```
**Arti perintahnya:** Jalankan fungsi di atas TEPAT SETELAH (`AFTER`) ada baris baru dimasukkan (`INSERT`) di tabel `auth.users`.

---

## 3. Keuntungan Sistem Ini

1. **Konsistensi Data**: Tidak akan pernah ada kejadian *"User sukses register, tapi gagal masuk database Profiles karena jaringan/API Backend mati"*. Eksekusi dilakukan di dalam tingkat mesin database Postgres.
2. **Kerapian Kode Backend**: Controller API kita tidak perlu pusing memikirkan transaksi pengisian profil saat register. Cukup panggil API Sign Up bawaan Supabase SDK, dan database akan mengurus sisanya.
