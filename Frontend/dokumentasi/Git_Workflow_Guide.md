# 🌿 Git Workflow Guide — `to_do_list_mip`

Panduan ini menjelaskan cara kerja yang benar saat ingin **memperbaiki bug** atau **menambah fitur baru** tanpa merusak `main`.

---

## 🗺️ Struktur Branch Saat Ini

```
main          ← branch utama & stabil (PRODUCTION)
├── fe-edra   ← branch kerja Edra (Frontend)
├── rikza     ← branch kerja Rikza
├── Abil      ← branch kerja Abil
└── dst...
```

> ⚠️ **Jangan pernah commit langsung ke `main`.**
> Selalu buat branch baru dari `main`, kerjakan di sana, lalu merge kembali ke `main`.

---

## ⚡ Alur Kerja Singkat (Quick Reference)

```
main  →  buat branch baru  →  kerjakan  →  push  →  merge ke main
```

---

## 📋 Skenario 1: Memperbaiki Bug

### Langkah-langkah

**1. Pastikan kamu di `main` dan update terbaru:**
```bash
git checkout main
git pull origin main
```

**2. Buat branch baru dari `main`:**
```bash
# Format nama: fix/<nama-bug-singkat>
git checkout -b fix/superadmin-white-screen
```

**3. Kerjakan perbaikan di file yang perlu diubah.**

**4. Simpan perubahan (commit):**
```bash
git add .
git commit -m "fix: perbaiki white screen saat login superadmin"
```

**5. Push branch ke GitHub:**
```bash
git push origin fix/superadmin-white-screen
```

**6. Merge ke `main`:**
```bash
git checkout main
git pull origin main
git merge fix/superadmin-white-screen --no-ff -m "Merge fix: superadmin white screen"
git push origin main
```

**7. (Opsional) Hapus branch setelah selesai:**
```bash
git branch -d fix/superadmin-white-screen
git push origin --delete fix/superadmin-white-screen
```

---

## 🚀 Skenario 2: Menambah Fitur Baru

**1. Update `main` terlebih dahulu:**
```bash
git checkout main
git pull origin main
```

**2. Buat branch fitur:**
```bash
# Format nama: feat/<nama-fitur>
git checkout -b feat/export-pdf-laporan
```

**3. Kerjakan fitur, lalu commit bertahap:**
```bash
git add .
git commit -m "feat: tambah tombol export PDF di halaman laporan"

# bisa commit berkali-kali selama pengerjaan
git commit -m "feat: styling PDF template selesai"
```

**4. Push dan merge ke `main`:**
```bash
git push origin feat/export-pdf-laporan
git checkout main
git merge feat/export-pdf-laporan --no-ff
git push origin main
```

---

## 🔄 Skenario 3: Update Branch Kamu dari `main` (Sync)

Saat `main` sudah diupdate orang lain dan kamu ingin menarik perubahannya ke branch kamu:

```bash
# Misal kamu di branch fe-edra
git checkout fe-edra
git pull origin fe-edra        # pastikan branch lokal update
git merge origin/main          # tarik perubahan terbaru dari main
# Selesaikan conflict jika ada, lalu:
git push origin fe-edra
```

---

## 📝 Konvensi Nama Branch

| Tipe | Format | Contoh |
|------|--------|--------|
| Bug fix | `fix/<deskripsi>` | `fix/login-error` |
| Fitur baru | `feat/<deskripsi>` | `feat/notifikasi-push` |
| Hotfix darurat | `hotfix/<deskripsi>` | `hotfix/crash-dashboard` |
| Per-orang | `<nama>/<deskripsi>` | `fe-edra`, `rikza` |

---

## 📝 Konvensi Pesan Commit

| Tipe | Prefix | Kapan dipakai |
|------|--------|---------------|
| Fitur baru | `feat:` | Menambah fitur baru |
| Perbaikan bug | `fix:` | Memperbaiki bug |
| Styling/UI | `style:` | Perubahan tampilan saja |
| Refactoring | `refactor:` | Ubah kode tanpa tambah/hapus fitur |
| Dokumentasi | `docs:` | Update README / panduan |

**Contoh pesan commit yang baik:**
```
feat: tambah filter tanggal di halaman riwayat cuti
fix: perbaiki tombol approve yang tidak bisa diklik di mobile
style: ubah warna header superadmin dari pink ke navy
```

---

## ⚠️ Mengatasi Merge Conflict

Saat merge dan ada conflict:

```bash
# 1. Git akan memberi tahu file mana yang conflict
git status

# 2. Buka file yang conflict, cari tanda ini:
# <<<<<<< HEAD        ← versi kamu (branch sekarang)
# ...kode kamu...
# =======
# ...kode dari branch lain...
# >>>>>>> branch-lain ← versi yang di-merge

# 3. Edit file: pilih versi mana yang dipakai, hapus tanda <<<<, ===, >>>>

# 4. Setelah selesai:
git add <nama-file>
git commit -m "fix: resolve merge conflict di MainLayout"
```

---

## 🆘 Perintah Darurat

```bash
# Batalkan merge yang sedang berjalan
git merge --abort

# Kembalikan file ke kondisi terakhir commit (buang perubahan lokal)
git checkout -- <nama-file>

# Buang semua perubahan lokal yang belum di-commit
git reset --hard HEAD

# Lihat riwayat commit singkat
git log --oneline -10

# Cek branch mana yang sudah di-merge ke main
git branch --merged main
```

---

## ✅ Checklist Sebelum Merge ke `main`

- [ ] Sudah `git pull origin main` terbaru sebelum mulai
- [ ] Tidak ada error saat `npm run dev` atau build
- [ ] Fitur/bug sudah dicoba dan berfungsi
- [ ] Pesan commit jelas dan deskriptif
- [ ] Tidak ada `console.log` debug yang tertinggal

---

> 💡 **Aturan emas:** Satu branch = satu tujuan (satu bug atau satu fitur).
> Jangan campur perbaikan bug dan fitur baru dalam satu branch yang sama.
