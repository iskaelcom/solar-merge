# Solar Merge — Skin Generation Rules

Dokumen ini adalah standar wajib untuk membuat setiap skin planet baru. Sebuah skin belum dianggap selesai sebelum seluruh aset dan pemeriksaan QA di bawah terpenuhi.

## 1. Paket Aset Wajib

Setiap skin harus memiliki:

- 10 planet sehat: Moon, Mercury, Mars, Venus, Earth, Neptune, Uranus, Saturn, Jupiter, dan Sun.
- 10 planet sakit dengan pasangan satu-ke-satu untuk setiap planet sehat.
- 4 objek spesial: Mystery Planet, Star, Virus, dan Black Hole.

Semua aset harus berupa PNG dengan background transparan asli, tanpa teks atau watermark.

## 2. Konsistensi Gaya

- Tentukan satu aset sehat sebagai style anchor sebelum membuat aset lain.
- Semua aset dalam satu skin harus memakai bahasa visual, pencahayaan, outline, detail, tekstur, dan palet yang konsisten.
- Identitas warna dan ciri astronomis setiap planet harus tetap mudah dikenali pada ukuran kecil.
- Setiap planet sehat harus memiliki ekspresi yang berbeda dan sesuai karakternya. Jangan menyalin satu wajah ke seluruh planet.
- Ekspresi harus tetap terbaca pada thumbnail sekitar 40 px.

Contoh pembagian karakter:

- Moon: mengantuk atau lembut.
- Mercury: penasaran.
- Mars: berani atau bersemangat.
- Venus: anggun atau malu.
- Earth: ceria dan ramah.
- Neptune: tenang atau dreamy.
- Uranus: terkejut.
- Saturn: percaya diri.
- Jupiter: jenaka atau usil.
- Sun: sangat antusias.

## 3. Canvas, Framing, dan Transparansi

- Planet biasa menggunakan canvas persegi 400×400.
- Mystery Planet, Star, Virus, dan Black Hole menggunakan canvas persegi 512×512.
- Saturn menggunakan canvas 800×400 dengan rasio 2:1 seperti aset default.
- Objek harus tepat di tengah dengan safe margin transparan yang terlihat di semua sisi.
- Tidak boleh ada pixel opaque, antialias, glow, cincin, sinar, spike, atau ornamen yang menyentuh batas canvas.
- Tidak boleh ada serpihan dari sprite lain.
- Jangan memotong sprite berdasarkan pembagian grid secara kasar.
- Jika memakai source sheet, identifikasi siluet/alpha setiap sprite dahulu, potong secara individual, lalu beri canvas dan safe margin baru.

## 4. Aturan Khusus Saturn

- Saturn wajib mengikuti framing 2:1 milik Saturn default.
- Cincin harus lebar dan hampir memenuhi canvas secara horizontal.
- Badan planet harus tepat di tengah cincin.
- Seluruh cincin harus terlihat, termasuk bagian yang lewat di depan dan di belakang badan.
- Versi sakit harus memakai Saturn sehat dari skin yang sama sebagai master siluet dan framing.

## 5. Aturan Planet Sakit

- Selalu buat planet sakit dari file planet sehat pasangannya, bukan dari prompt baru yang berdiri sendiri atau dari sprite planet lain.
- Pertahankan bentuk, ukuran, posisi, orientasi, jumlah fitur, siluet, dan bounding box planet sehat.
- Yang boleh berubah hanya ekspresi, warna/indikator penyakit, dan efek permukaan yang tidak mengubah siluet.
- Ekspresi sakit tetap boleh berbeda sesuai karakter planet, tetapi harus jelas terlihat sedih, lemah, pusing, khawatir, atau tidak sehat.
- Jangan menambah atau menghapus cincin, sinar, spike, kawah, atau fitur utama.
- Jangan membesarkan aset sakit hingga lebih mepet ke canvas.
- Bandingkan pasangan sehat dan sakit secara berdampingan sebelum menyetujui hasilnya.

## 6. Aturan Khusus Sun

- Semua sinar Sun harus lengkap; tidak boleh ada ujung yang hilang, terpotong, atau menyentuh canvas.
- Jumlah, panjang, posisi, dan jarak sinar versi sakit harus mengikuti Sun sehat.
- Sun sakit wajib dibuat langsung dari Sun sehat.
- Bounding box dan margin Sun sehat/sakit harus diselaraskan.

## 7. Mystery, Star, Virus, dan Black Hole

- Buat dan proses keempat objek sebagai aset individual.
- Seluruh fitur harus masuk canvas: ujung Star, spike Virus, ring/glow Black Hole, serta ornamen Mystery Planet.
- Glow harus rapat ke objek dan tetap berada di dalam safe margin.
- Jangan buru-buru melakukan crop setelah generate.
- Periksa alpha bounds dan tampilan visual terlebih dahulu, kemudian trim, resize, dan center ke canvas final.
- Setelah diproses, pastikan tidak ada pixel tepi dan tidak ada detail yang hilang.

## 8. QA Wajib Sebelum Integrasi

Untuk setiap aset:

1. Pastikan dimensi file sesuai aturan.
2. Hitung alpha bounds.
3. Pastikan `edgePixels = 0` pada keempat tepi canvas.
4. Periksa safe margin kiri, atas, kanan, dan bawah.
5. Pastikan siluet lengkap pada resolusi asli.
6. Periksa keterbacaan pada ukuran gameplay dan thumbnail.

Untuk keseluruhan skin:

1. Buat contact sheet planet sehat.
2. Buat contact sheet sehat versus sakit dalam pasangan sejajar.
3. Buat contact sheet empat objek spesial.
4. Periksa bahwa setiap planet sehat memiliki ekspresi unik.
5. Periksa Saturn pada rasio 2:1.
6. Periksa seluruh sinar Sun sehat dan sakit.
7. Jalankan TypeScript check dan `git diff --check` setelah integrasi.

## 9. Integrasi Project

Skin yang telah lolos QA harus:

- Ditambahkan ke `PlanetSkinId` dan katalog `PLANET_SKINS`.
- Dipetakan di `PlanetView.tsx` untuk aset sehat dan sakit.
- Dipetakan di `MysteryPlanetView.tsx`, `StarView.tsx`, `VirusPlanetView.tsx`, dan `BlackHoleView.tsx`.
- Ditampilkan dengan benar di Cosmetic Shop, preview antrean, evolution bar, dan papan permainan.
- Ditandai selesai di `TASK.md` hanya setelah aset, integrasi, dan QA semuanya selesai.
