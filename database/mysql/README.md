# MySQL Migration Scripts

Urutan eksekusi script:

1. `000_init_finance_tracker.sql`
2. `009_seed_user_template.sql`

Catatan:

- `000_init_finance_tracker.sql` sudah berisi seluruh DDL utama: database, tabel, foreign key, dan index.
- `009_seed_user_template.sql` tetap dipisah agar data contoh tidak ikut dijalankan saat inisialisasi awal.
- Tabel `users` memakai `firebase_uid` sebagai penghubung jika auth masih tetap menggunakan Firebase Auth.
- Modul `wishlist` belum dibuatkan tabel karena di flow aplikasi saat ini masih berupa placeholder UI.
- Seluruh nominal uang disimpan sebagai `DECIMAL(15,2)`.
