# Solar Merge — Rencana Optimasi Android & Web

Dokumen ini memuat optimasi yang diperkirakan memberi dampak nyata pada kelancaran permainan, penggunaan CPU, baterai, dan stabilitas sesi. Fokus utamanya bukan sekadar mengurangi jumlah render kecil, tetapi memisahkan simulasi physics dari proses render React per frame.

## 1. Kondisi Saat Ini

Alur frame aktif saat ini kurang lebih sebagai berikut:

```text
requestAnimationFrame
  -> Matter.Engine.update()
  -> baca seluruh body
  -> buat array/object RenderPlanet baru
  -> setState(GameState)
  -> render ulang GameView
  -> map seluruh planet/special object
  -> ubah left/top/rotation setiap view
```

Masalah utamanya:

- `setState()` dipanggil pada hampir setiap frame selama ada body yang aktif.
- Array, `Set`, dan object posisi dibuat ulang setiap frame sehingga menambah tekanan garbage collector.
- Posisi memakai `left` dan `top`, yang dapat memicu layout ulang; transform lebih murah untuk objek bergerak.
- Seluruh `GameView`, termasuk HUD, ikut masuk proses render walaupun yang berubah hanya posisi body.
- `Math.min(delta, 22)` bukan pembatas 45 FPS. Pada layar 90/120 Hz, callback masih dapat berjalan 90/120 kali per detik.
- `GameView` memakai dimensi sebagai React `key`, sehingga resize browser atau perubahan system bar Android dapat me-reset sesi.

Hal yang sudah baik dan harus dipertahankan:

- Matter.js menggunakan sleeping.
- Game loop berhenti ketika seluruh scene idle melalui `hasActiveBodies()`.
- Preview pointer sudah digerakkan dengan `Animated.Value`, bukan state React pada setiap gerakan.
- Hermes dan React Native New Architecture sudah aktif untuk Android.

## 2. Target Arsitektur

Pisahkan state permainan menjadi dua jalur:

```text
Matter.js
  |
  |-- event struktural ----------> React state
  |   add/remove/merge, score,     render hanya saat gameplay berubah
  |   combo, sick, game over
  |
  `-- x/y/angle per frame --------> transform store
                                     |-- Android: SharedValue/native transform
                                     `-- Web: CSS transform/animated style
```

React state hanya menyimpan data yang memang perlu menyebabkan render deklaratif. Posisi dan rotasi body tidak boleh membuat seluruh `GameView` render ulang setiap frame.

## 3. Optimasi Bersama Android dan Web

### P0 — Keluarkan posisi dari `GameState`

- [x] Pisahkan descriptor body dari nilai transform dinamis.
- [x] React state menyimpan `id`, tipe, ukuran, status mystery/sick, dan properti struktural lainnya.
- [x] Simpan `x`, `y`, dan `angle` dalam transform handle/store yang dapat diperbarui tanpa `setState()` parent.
- [x] Buat registry berdasarkan ID agar game loop dapat memperbarui transform body secara langsung.
- [x] Tambah/hapus registry hanya ketika body dibuat, merge, diserap, atau dihancurkan.
- [x] Terapkan pola yang sama untuk planet, star, black hole, virus, dan mystery planet.

Hasil yang diharapkan: HUD dan daftar komponen tidak ikut render hanya karena body bergerak.

### P0 — Gunakan transform untuk pergerakan

- [x] Ganti update posisi `left/top` per frame dengan `translateX/translateY`.
- [x] Gabungkan translasi, rotasi, dan scale dalam satu animated transform pipeline.
- [x] Pertahankan `width`, `height`, dan posisi dasar komponen selama masa hidup body.
- [x] Pastikan Saturn tetap memperhitungkan lebar ring tanpa mengubah layout per frame.

Contoh bentuk transform:

```ts
transform: [
  { translateX: x - radius - leftExtra },
  { translateY: y - radius },
  { rotateZ: `${angle}rad` },
  { scale },
]
```

### P0 — Hindari alokasi per frame

- [x] Jangan membuat ulang seluruh `RenderPlanet[]` pada setiap frame.
- [x] Jangan menjalankan `updated.map(...spread)` kedua hanya untuk memasukkan `scale`.
- [x] Bersihkan `sickPlanetIds` dan `mergeSpawnIds` hanya saat terjadi add/remove/merge.
- [x] Buat `Set` ID hanya saat daftar ID berubah, bukan pada setiap posisi berubah.
- [x] Hitung `sessionDiamonds` pada timer satu detik atau ketika sesi selesai, bukan setiap physics frame.
- [x] Pertahankan cache `getAllPlanets/getAllStars/...` yang sudah ada di physics.

### P1 — Fixed timestep dan batas update 60 Hz

- [ ] Gunakan timestep physics tetap sekitar `1000 / 60` ms.
- [ ] Pada layar 90/120 Hz, lewati frame yang belum mengumpulkan satu timestep penuh.
- [ ] Batasi catch-up maksimal dua atau tiga step per frame agar tidak terjadi spiral of death.
- [ ] Batasi delta resume, misalnya maksimum 50 ms.
- [ ] Reset timestamp ketika aplikasi/tab kembali aktif.

Contoh konseptual:

```ts
const STEP_MS = 1000 / 60;
const MAX_STEPS = 3;
let accumulator = 0;

function frame(now: number) {
  accumulator += Math.min(now - lastTime, 50);
  lastTime = now;

  let steps = 0;
  while (accumulator >= STEP_MS && steps < MAX_STEPS) {
    physics.step(STEP_MS);
    accumulator -= STEP_MS;
    steps++;
  }

  syncBodyTransforms();
  requestNextFrame();
}
```

Catatan: uji kembali feel collision setelah memakai fixed timestep. Jangan mengubah konstanta gravitasi hanya untuk menutupi kesalahan timestep.

### P1 — Threshold update sebagai pengganti quantization state

Setelah posisi keluar dari React state, quantization digunakan untuk menghindari update transform yang terlalu kecil:

```ts
const moved =
  Math.abs(nextX - lastX) >= 0.25 ||
  Math.abs(nextY - lastY) >= 0.25 ||
  Math.abs(nextAngle - lastAngle) >= 0.005;
```

- [ ] Update transform hanya ketika melewati threshold.
- [ ] Selalu kirim posisi terakhir sebelum body dinyatakan sleeping agar tidak berhenti pada posisi visual yang salah.
- [ ] Jangan memakai threshold besar yang membuat planet terlihat tersendat.

Quantization langsung ke `RenderPlanet` tetap boleh menjadi eksperimen sementara, tetapi bukan solusi akhir karena parent masih melakukan `setState()` per frame.

### P1 — Pause dan resume lifecycle

- [ ] Android/iOS: hentikan loop ketika `AppState` bukan `active`.
- [ ] Web: hentikan loop ketika `document.visibilityState === 'hidden'`.
- [ ] Saat aktif kembali, set ulang `lastTime` dan jalankan loop hanya jika scene masih aktif.
- [ ] Hindari membuat loop ganda saat event resume dan drop terjadi berdekatan.

### P1 — Resize tanpa me-reset sesi

- [ ] Jangan menjadikan perubahan dimensi kecil sebagai alasan remount `GameView`.
- [ ] Bekukan dimensi arena selama sesi aktif.
- [ ] Abaikan perubahan kecil akibat navigation bar/browser chrome, misalnya kurang dari 24–40 px.
- [ ] Terapkan dimensi baru ketika board kosong atau pemain menekan restart.
- [ ] Tangani perubahan besar/orientation secara eksplisit: bangun ulang wall, skala posisi body, lalu sinkronkan transform.
- [ ] Jangan hanya menghapus prop `key`; `useGame` saat ini menginisialisasi physics hanya saat mount sehingga perubahan ukuran perlu lifecycle khusus.

## 4. Implementasi Khusus Android

### Renderer

- [ ] Gunakan `react-native-reanimated` versi yang kompatibel dengan Expo SDK untuk `SharedValue` dan `useAnimatedStyle`.
- [ ] Satu komponen body memiliki shared values sendiri dan mengekspos transform handle ke registry.
- [ ] Update posisi menggunakan transform, bukan perubahan layout.
- [ ] Jangan membuat shared value baru ketika body hanya berganti posisi.
- [ ] Pastikan animasi pop, shrink, rotasi, dan posisi digabung tanpa saling menimpa transform.

Matter.js tetap berjalan di JS thread. Reanimated di sini mengurangi biaya React reconciliation dan layout; ia tidak memindahkan simulasi Matter.js ke UI thread.

### CPU, baterai, dan thermal

- [ ] Batasi simulasi ke maksimum 60 update per detik pada layar refresh tinggi.
- [ ] Tetap hentikan loop ketika semua body sleeping.
- [ ] Hentikan animasi loop dekoratif yang tidak terlihat ketika modal menutup scene atau aplikasi masuk background.
- [ ] Hindari timer yang tetap hidup setelah component unmount.

### GPU dan memori

- [ ] Profil jumlah transparent layer, glow, dan shadow ketika chain merge besar.
- [ ] Kurangi shadow/glow Android yang mahal jika tidak memberi perbedaan visual berarti.
- [ ] Batasi jumlah particle pada ledakan simultan.
- [ ] Setelah bottleneck frame utama selesai, evaluasi aset planet 400x400; gunakan resolusi lebih kecil hanya jika hasil visual tetap tajam pada ukuran tampil maksimum.
- [ ] Jangan mengoptimasi ukuran file PNG saja; ukur decoded bitmap memory dan GPU upload.

### Pengukuran Android

- [ ] Uji memakai release/profile build, bukan development build.
- [ ] Uji minimal pada satu perangkat kelas bawah/menengah dan satu perangkat 90/120 Hz.
- [ ] Gunakan Perfetto/System Trace atau Android GPU profiling untuk melihat JS, UI, render, dan GC stall.
- [ ] Skenario wajib: 30–50 body, chain merge, black hole aktif, shrink aktif, lalu background/resume.

## 5. Implementasi Khusus Web

### Renderer DOM/CSS

- [ ] Gunakan CSS transform melalui animated style untuk posisi dan rotasi; hindari perubahan `left/top` setiap frame.
- [ ] Pastikan hasil web menggunakan transform terkomposisi, idealnya `translate3d(...) rotate(...) scale(...)`.
- [ ] Gunakan `will-change: transform` secara selektif hanya pada body aktif. Memberikannya ke semua elemen secara permanen dapat menghabiskan GPU memory.
- [ ] Pertimbangkan `contain: layout paint` pada area permainan setelah memastikan overlay/modal tidak terpotong.
- [ ] Jangan membaca layout (`getBoundingClientRect`, `measure`) dalam loop physics karena dapat memaksa synchronous layout.

Implementasi awal sebaiknya tetap memakai renderer komponen saat ini. Canvas bukan prioritas pertama karena akan menambah kompleksitas input, efek, accessibility, dan variasi visual.

### Tab visibility dan throttling browser

- [ ] Dengarkan `visibilitychange` dan hentikan loop ketika tab tersembunyi.
- [ ] Reset accumulator/timestamp ketika tab kembali terlihat.
- [ ] Jangan mencoba mengejar seluruh waktu yang hilang saat tab berada di background.
- [ ] Pause animasi dekoratif berulang saat halaman tidak terlihat.

### Resize browser

- [ ] Debounce resize tetap boleh digunakan, tetapi jangan remount sesi aktif.
- [ ] Bedakan perubahan viewport kecil akibat address bar mobile dengan perubahan layout/orientation nyata.
- [ ] Simpan ukuran arena stabil selama permainan; ruang luar arena boleh menyesuaikan viewport.
- [ ] Terapkan breakpoint/layout UI tanpa mengubah koordinat physics jika ukuran arena tidak benar-benar berubah.

### Input web

- [ ] Gunakan satu jalur Pointer Events untuk mouse, touch, dan stylus jika dukungan React Native Web memungkinkan.
- [ ] Jangan memasukkan `pointermove` ke React state; perbarui preview secara imperatif seperti yang sudah dilakukan sekarang.
- [ ] Clamp posisi menggunakan nilai yang tersimpan di ref, tanpa pengukuran DOM per event.

### SVG dan efek

- [ ] Profil `StarView`, `BlackHoleView`, dan `VirusPlanetView` karena masing-masing memakai beberapa SVG/gradient dan animasi kontinu.
- [ ] Pastikan kalkulasi points/spikes tidak diulang akibat render parent; memoization menjadi efektif setelah posisi keluar dari props React.
- [ ] Jika SVG terbukti mahal, rasterisasi layer statis ke WebP/PNG dan sisakan transform/rotation pada wrapper.
- [ ] Batasi particle DOM saat banyak ledakan terjadi bersamaan.

### Opsi lanjutan web, hanya jika profiling membuktikan perlu

- [ ] Pindahkan physics ke Web Worker dan kirim posisi dalam typed array.
- [ ] Gunakan Canvas/WebGL renderer jika jumlah DOM body menjadi bottleneck nyata.

Kedua opsi tersebut bukan langkah awal. Worker menambah biaya komunikasi per frame, sedangkan Canvas/WebGL memerlukan renderer dan hit-testing khusus.

### Pengukuran web

- [ ] Uji production export, bukan mode development Metro.
- [ ] Gunakan Chrome Performance panel dan React Profiler.
- [ ] Uji desktop Chrome serta Chrome Android/mobile viewport.
- [ ] Periksa long task, style/layout time, paint/composite time, heap growth, dan dropped frame.
- [ ] Uji resize, pergantian tab, zoom, pointer drag, serta background/resume.

## 6. Tahapan Implementasi

### Fase 1 — Baseline dan stabilitas

- [ ] Tambahkan penghitung render `GameView` hanya untuk development/profiling.
- [ ] Catat FPS, frame time, jumlah body, dan heap/GC pada skenario benchmark.
- [ ] Perbaiki resize/remount Android dan web.
- [ ] Tambahkan lifecycle pause/resume.

### Fase 2 — Pemisahan transform

- [ ] Buat interface transform registry yang tidak bergantung pada tipe body.
- [ ] Migrasikan `PlanetView` lebih dahulu sebagai proof of concept.
- [ ] Bandingkan hasil benchmark sebelum melanjutkan.
- [ ] Migrasikan mystery, star, black hole, dan virus.
- [ ] Hapus sinkronisasi posisi per-frame dari React state.

### Fase 3 — Physics cadence dan alokasi

- [ ] Terapkan fixed timestep 60 Hz.
- [ ] Hapus array/object/Set yang masih dibuat setiap frame.
- [ ] Pindahkan penghitung berbasis waktu ke timer berfrekuensi rendah.
- [ ] Tambahkan threshold transform dan validasi posisi akhir sleeping body.

### Fase 4 — GPU dan asset tuning

- [ ] Profil efek SVG, gradient, shadow, dan particle pada kedua platform.
- [ ] Sederhanakan hanya komponen yang terbukti mahal.
- [ ] Evaluasi resolusi gambar dan decoded memory Android.
- [ ] Pertimbangkan Worker atau Canvas web hanya jika target performa belum tercapai.

## 7. Acceptance Criteria

Optimasi dianggap berhasil jika memenuhi seluruh perilaku berikut:

- [ ] Pergerakan body tidak menyebabkan seluruh HUD/GameView render pada setiap frame.
- [ ] Saat scene idle, tidak ada physics loop aktif dan penggunaan CPU turun secara nyata.
- [ ] Pada perangkat 90/120 Hz, physics tidak berjalan lebih dari target 60 update per detik.
- [ ] Tidak ada reset sesi akibat perubahan system bar, address bar, atau resize kecil.
- [ ] Background/resume dan hidden/visible tab tidak menghasilkan lonjakan timestep atau loop ganda.
- [ ] Posisi visual tetap sinkron dengan body physics setelah sleeping, merge, shrink, continue, dan resize.
- [ ] Tidak ada pertumbuhan heap terus-menerus setelah beberapa kali restart.
- [ ] Pada skenario 30–50 body, dropped frame dan long task berkurang dibanding baseline.

Target awal yang dapat dipakai untuk pengujian:

- Gameplay normal mendekati 60 FPS pada perangkat target.
- Tidak ada long task web di atas 50 ms selama permainan normal, di luar loading awal.
- Tidak ada freeze yang terlihat saat chain merge atau garbage collection.
- Waktu frame dan penggunaan CPU lebih rendah daripada baseline pada scene yang sama.

Angka akhir harus ditetapkan setelah baseline diambil dari perangkat Android dan browser target; jangan menyatakan optimasi berhasil hanya berdasarkan berkurangnya jumlah baris kode atau hasil emulator.

## 8. Ringkasan Prioritas

| Prioritas | Pekerjaan | Dampak utama |
|---|---|---|
| P0 | Posisi/rotasi keluar dari React state | Mengurangi render dan garbage collection |
| P0 | `left/top` menjadi transform | Mengurangi layout cost Android dan web |
| P0 | Resize tanpa remount sesi | Mencegah kehilangan progres |
| P1 | Fixed timestep maksimum 60 Hz | CPU, baterai, thermal, konsistensi |
| P1 | Event-driven add/remove/cleanup | Menghilangkan alokasi per frame |
| P1 | Lifecycle pause/resume | Stabilitas background dan hidden tab |
| P1 | Threshold transform | Mengurangi micro-update |
| P2 | Tuning SVG, glow, particle, dan PNG | GPU dan memory setelah bottleneck utama selesai |
| P3 | Web Worker atau Canvas/WebGL | Hanya jika profiling masih menunjukkan bottleneck |
