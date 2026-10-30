# Timer Lomba ITCC 2026 (versi lokal)

Timer presentasi lomba ITCC 2026 (HMTI Universitas Udayana) yang jalan **di laptop koordinator sendiri, tanpa internet**. Atur sesi dan lonceng tiap cabang, lalu pakai layar Play saat lomba berlangsung. Data tersimpan di laptop ini (file `data/timer.db`).

Tampilan dan perilakunya sama dengan versi online. Bedanya, di versi lokal tidak ada PIN: siapa pun yang membuka aplikasi **di laptop itu** bisa mengubah data. Aplikasi hanya bisa dibuka dari laptop itu sendiri, bukan dari HP atau laptop lain di Wi-Fi yang sama.

## Yang perlu di-install sekali

- **Node.js 24 LTS** dari [nodejs.org](https://nodejs.org) (minimal 22.13).
- **Git** dari [git-scm.com](https://git-scm.com). Kalau tidak mau install Git, di GitHub klik _Code → Download ZIP_ lalu ekstrak.

## Menjalankan

Di Windows, pakai **Command Prompt** (bukan PowerShell).

```bash
git clone https://github.com/<akun>/itcc-timer-lokal.git
cd itcc-timer-lokal
npm install
npm start
```

- `npm install` satu-satunya langkah yang butuh internet.
- `npm start` pertama kali menyiapkan aplikasi sekitar 1 menit, lalu browser terbuka sendiri di `http://localhost:3000`. Setelahnya, start berikutnya cepat.
- **Jangan tutup jendela terminal** selama lomba. Tekan `Ctrl+C` untuk menghentikan.

Kalau di PowerShell muncul error `npm.ps1 cannot be loaded`, jalankan `npm.cmd start` atau pindah ke Command Prompt.

## Persiapan hari H

1. Jalankan `npm start` **sebelum** acara dimulai, dan tes lombamu sekali dari awal sampai akhir.
2. Matikan mode sleep/hibernasi dan colokkan charger.
3. Tes suara lonceng (tombol speaker di layar Play, atau tekan `T`) dan atur volume laptop.
4. Buka layar Play dan masuk layar penuh (`F`).

## Shortcut layar Play

| Tombol  | Fungsi            |
| ------- | ----------------- |
| `Spasi` | Mulai / jeda      |
| `R`     | Reset sesi        |
| `N`     | TIM BERIKUTNYA    |
| `F`     | Layar penuh       |
| `T`     | Tes suara lonceng |

## Memindahkan dan mencadangkan data

- **Dari versi online atau laptop lain:** export di sana (**Export JSON** di panel Data tiap lomba), lalu di sini klik **Import** di daftar lomba dan pilih berkasnya. Lomba dengan nama + kategori yang sama tidak ditimpa, tapi diberi akhiran ` (2)`, ` (3)`, dan seterusnya.
- **Backup:** klik **Export Semua** di daftar lomba, atau salin folder `data/`.

## Update aplikasi

```bash
git pull
npm install
npm start
```

Aplikasi dibangun ulang otomatis kalau ada perubahan.

## Masalah umum

| Masalah                       | Solusi                                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------- |
| Pesan "Node.js kamu versi …"  | Install Node.js 24 LTS dari nodejs.org, lalu jalankan ulang `npm start`.                    |
| Port 3000 terpakai            | Otomatis pindah ke 3001, 3002, dan seterusnya. Pakai alamat yang tercetak di terminal.      |
| Browser tidak terbuka sendiri | Buka manual `http://localhost:3000` (atau port yang tercetak).                              |
| Mau mulai dari nol            | Tutup aplikasi, lalu jalankan `npm run reset-data`. Export dulu kalau datanya mau disimpan. |

## Untuk developer

```bash
npm run dev      # development di 127.0.0.1
npm test         # vitest
npm run lint
npm run build
```

Env opsional: `PORT`, `TIMER_DB_PATH` (default `data/timer.db`), `NO_OPEN=1` (jangan buka browser). Penyimpanan memakai modul bawaan `node:sqlite`, tanpa dependency native.

## Lisensi dan kredit

Font, audio, dan logo dikreditkan di [CREDITS.md](CREDITS.md).
