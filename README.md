# UD Grating Sejahterah

Aplikasi Next.js dan MySQL untuk katalog produk dan jasa, pengajuan penawaran multi-item, dan dashboard bengkel. Kebutuhan dan skenario penerimaan ada di [PRD](PRD.md).

## Menjalankan di Laragon

1. Jalankan MySQL Laragon. Salin `.env.example` ke `.env.local` dan sesuaikan koneksi MySQL jika perlu.
2. Jalankan `npm install` dan `npm run db:setup`. Skrip membuat skema dan akun admin awal. Untuk mode demo, kata sandi acak disimpan di `.env.local` apabila belum diisi.
3. Jalankan `npm run dev` dan buka [website lokal](http://localhost:3000). Masuk melalui [dashboard admin](http://localhost:3000/admin) dengan `ADMIN_USERNAME` dan `ADMIN_PASSWORD` dari `.env.local`.

`DEMO_MODE=1` mengisi contoh katalog pada basis data kosong. Gambar contoh di `public/images` merupakan ilustrasi yang dibuat dengan ImageGen. Jika `SALES_WHATSAPP` kosong, WhatsApp menerima draf contoh tanpa tujuan tetap.

## Bukti implementasi awal

Demo memakai dua produk dengan jumlah berbeda, yaitu Grating Polos × 2 dan Grating Bergerigi × 3. Penawaran **#1** muncul di konfirmasi pelanggan dan detail admin. Pada detail admin, status penawaran disimpan sebagai **Diproses**.

1. Pilih produk dari katalog. [Screenshot katalog](docs/bukti-implementasi/01-katalog.png)
2. Periksa kedua produk, jumlah, dan subtotal di keranjang. [Screenshot keranjang](docs/bukti-implementasi/02-keranjang.png)
3. Isi kontak dan alamat demo. [Screenshot checkout](docs/bukti-implementasi/03-checkout.png)
4. Periksa ID penawaran yang tersimpan dan tautan draf WhatsApp. [Screenshot konfirmasi](docs/bukti-implementasi/04-konfirmasi.png)
5. Buka penawaran yang sama di admin untuk melihat item dan statusnya. [Screenshot detail admin](docs/bukti-implementasi/05-detail-admin.png)

## Menyiapkan produksi

- Gunakan basis data baru dengan `DEMO_MODE=0` dan akun MySQL aplikasi dengan hak yang sesuai. Jalankan `npm run db:setup` menggunakan kredensial instalasi yang dapat membuat skema.
- Isi `SALES_WHATSAPP` dalam format internasional tanpa tanda plus. Isi kontak publik, katalog, dan portofolio resmi melalui panel admin.
- Jalankan `npm run build` dan `npm start` di belakang reverse proxy HTTPS. Aktifkan `COOKIE_SECURE=1`. Simpan direktori unggahan `storage/uploads` atau `UPLOAD_DIR` pada volume persisten. Sertakan direktori dan MySQL dalam cadangan harian.
- Jalankan skenario uji pada PRD dengan data staging. Tetapkan aturan tindak lanjut, batas laju trafik publik di reverse proxy, serta target performa dan ketersediaan bersama mitra.
