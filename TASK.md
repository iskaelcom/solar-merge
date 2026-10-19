# Solar Merge — Optimization & Feature Roadmap

Dokumen ini berisi daftar tugas optimasi teknis, perbaikan bug, peningkatan *game feel* (UX), serta rencana pengembangan fitur baru untuk **Solar Merge**.

---

## 🛠️ 1. Optimasi Teknis, Performa & Perbaikan Bug

### A. Performa Rendering & Physics
- [ ] **Optimasi Re-render Physics Frame (`src/useGame.ts` & `src/components/PlanetView.tsx`)**
  - [ ] *Quick Win:* Bulatkan (*quantize*) nilai `x`, `y` (misal `Math.round(pos.x * 2) / 2`) dan `angle` (misal `Math.round(angle * 100) / 100`) sebelum masuk ke state `RenderPlanet` agar `React.memo` tidak terus-menerus re-render akibat getaran mikro.
  - [ ] *Advanced:* Migrasi posisi `x`, `y`, dan `angle` planet menggunakan `Animated.Value` / `react-native-reanimated` (`SharedValue`) sehingga `setState` React hanya dipanggil saat planet bertambah atau terhapus, bukan setiap frame (16–22ms).
- [ ] **Cegah Remount Saat Resize Kecil (`src/components/GameScreen.tsx`)**
  - [ ] Ubah mekanisme `<GameView key={`${dims.w}x${dims.h}`} />` agar perubahan kecil pada dimensi layar (misal saat bar navigasi sistem muncul/hilang) tidak meng-*unmount* dan me-reset permainan yang sedang berjalan.

### B. Perbaikan Bug State & Persistensi Data
- [x] **Fix State Reset pada `restart()` (`src/useGame.ts`)**
  - [x] Pertahankan nilai `streak`, `lastStreakDate`, `redeemedCodes`, dan `freeGiftsClaimed` dari state sebelumnya (`prev`) saat fungsi `restart()` dipanggil, agar tampilan 🔥 Streak di header dan data klaim tidak kembali ke nilai awal.
- [x] **Fitur Auto-Save Sesi Permainan Aktif (`src/useGame.ts`)**
  - [x] Simpan snapshot papan permainan (`planets`, `stars`, `blackHoles`, `viruses`, `score`, `dropCount`, `sickPlanetIds`, `shieldLayers`, `shrinkTimeLeft`) ke `AsyncStorage` setiap kali scene menjadi *idle* (`!isSceneActive`).
  - [x] Muat kembali state permainan yang belum *Game Over* saat aplikasi dibuka kembali.

### C. Optimasi Audio & Ukuran Aplikasi
- [ ] **Kompresi Aset Audio (`assets/sounds/` & `src/utils/SoundManager.native.ts`)**
  - [ ] Konversi file `.wav` (terutama `ambient_alien.wav`) ke format terkompresi (`.mp3` / `.m4a` / `.ogg`) untuk memangkas ukuran APK/AAB dan penggunaan memori.
- [ ] **Sound Pool & Dynamic Combo Pitch (`src/utils/SoundManager.native.ts`)**
  - [ ] Buat *sound pool* (2–3 instance `Audio.Sound`) untuk suara `merge` agar suara tidak saling memotong saat terjadi *chain-reaction combo*.
  - [ ] Tambahkan kenaikan *pitch/rate* dinamis berdasarkan jumlah combo (`1.0 + Math.min(combo * 0.08, 0.6)`).

### D. Kebersihan Kode & Keamanan (Code Hygiene & Security)
- [ ] **Hapus Dead Code (`src/components/PlanetSVG.tsx`)**
  - [ ] Hapus atau arsipkan `PlanetSVG.tsx` karena rendering planet sudah sepenuhnya menggunakan aset PNG di `PlanetView.tsx`.
- [ ] **Validasi Klaim Free Diamonds (`src/components/FreeDiamondModal.tsx`)**
  - [ ] Tambahkan pengecekan `AppState` (memastikan user benar-benar berpindah ke browser/aplikasi tujuan selama minimal beberapa detik sebelum memberikan hadiah *diamond*).
- [ ] **Keamanan Kode Redeem & Checksum (`src/constants/redeemCodes.ts` & `src/useGame.ts`)**
  - [ ] Pindahkan validasi *redeem code* event spesial ke Firestore agar tidak mudah dibaca dari hasil dekompilasi bundle JS.
- [ ] **Pembersihan File Build & Kredensial di Git Root**
  - [ ] Pastikan file `.apk`, `.aab`, `.jks`, dan `credentials.json` masuk ke `.gitignore` dan tidak tersimpan di dalam riwayat *repository*.

---

## ✨ 2. Optimasi Game Feel ("Juice") & UX

- [ ] **Integrasi Haptic Feedback (`expo-haptics`)**
  - [ ] Getaran *Light Impact* saat menjatuhkan planet.
  - [ ] Getaran *Medium Impact* saat planet merge.
  - [ ] Getaran *Heavy Impact* saat Sun terbentuk, Sun + Sun menjadi Black Hole, atau Black Hole menghisap planet.
  - [ ] Getaran *Warning* saat planet mendekati atau menyentuh *Danger Zone*.
- [ ] **Indikator Bahaya Dinamis & Grace Period (`src/useGame.ts` & `src/components/GameScreen.tsx`)**
  - [ ] Tambahkan *grace period* (1.5 – 2 detik) sebelum memicu *Game Over* ketika planet yang sudah tenang menyentuh `DANGER_HEIGHT`.
  - [ ] Tampilkan animasi garis bahaya berkedip dan *vignette* merah di tepi area permainan selama *grace period*.
- [ ] **Efek Screen Shake (`src/components/GameScreen.tsx`)**
  - [ ] Tambahkan animasi getaran kamera (*screen shake*) singkat pada `gameWrapper` saat terjadi merge planet besar (Saturn, Jupiter, Sun) atau ledakan Supernova.
- [ ] **Countdown Visual pada Mystery Planet (`src/types.ts`, `src/physics.ts`, `src/components/MysteryPlanetView.tsx`)**
  - [ ] Teruskan nilai `mysteryRevealDrops` dari `PhysicsPlanet` ke `RenderPlanet`.
  - [ ] Tampilkan angka hitungan mundur (misal `5` → `1`) di atas Mystery Planet agar pemain tahu kapan planet tersebut akan berubah wujud.

---

## 🚀 3. Fitur Baru (Gameplay, Meta-Game & Monetisasi)

### A. Mekanik Gameplay & Spell Baru (`src/components/WizardModal.tsx`)
- [ ] **Fitur Swap / Hold Planet (`src/components/GameScreen.tsx` & `src/useGame.ts`)**
  - [ ]izinkan pemain menukar planet yang sedang dipegang (`currentPlanetId`) dengan planet di slot *Next* (`nextPlanetId`) dengan menekan kotak *Next* (bisa menggunakan *cooldown* beberapa *drop* atau biaya *diamond* kecil).
- [ ] **Spell Baru: Cosmic Shake / Gravity Wave**
  - [ ] Memberikan impuls gaya horizontal/vertikal acak ke seluruh planet di papan untuk membantu menggulirkan planet yang terjebak.
- [ ] **Spell Baru: Laser Vaporizer**
  - [ ] Menghancurkan seluruh planet level rendah (Level 1 Moon & Level 2 Mercury) di papan permainan untuk membuka ruang.

### B. Mid-Game Cosmic Events
- [ ] **Sistem Event Berkala (Setiap N Drop / Skor Tertentu)**
  - [ ] *Low Gravity Anomaly:* Mengurangi gravitasi selama 20 detik.
  - [ ] *Solar Flare:* Menggandakan perolehan skor merge (`2x Score`) selama 20 detik.
  - [ ] *Meteor Shower:* Menjatuhkan 2–3 *Star* kecil secara otomatis ke papan.

### C. Meta-Game, Retensi & Mode Permainan
- [ ] **Sistem Misi Harian (Daily Quests) & Achievements**
  - [ ] Tambahkan daftar misi harian (contoh: *"Merge 2 Jupiter"*, *"Capai 6x Combo"*, *"Sembuhkan 3 planet sakit"*) dengan hadiah *Diamond*.
- [x] **Toko Skin Planet & Tema Galaksi**
  - [x] Gunakan *Diamond* untuk membuka variasi tampilan planet (misal: *Neon Cyber*, *Pixel Space*, *Realistic NASA*) dan tema latar belakang nebula.
  - [ ] **Roadmap Skin Planet Berikutnya**
    - [x] *Candy Galaxy* — planet berbentuk permen, jelly, donat, dan cokelat; mencakup planet normal, varian sakit, dan seluruh objek spesial.
    - [x] *Mecha Cosmos* — badan robot, panel logam, baut, dan ekspresi digital; cocok sebagai skin premium.
    - [ ] *Celestial Magic* — kristal, rune, aura magis, serta Mystery Planet berbentuk bola ramalan.
    - [ ] *Lava Apocalypse* — permukaan retak, magma menyala, asap, dan ekspresi agresif.
    - [ ] *Ocean Worlds* — ombak, gelembung, dan karang; Black Hole menjadi pusaran air dan Virus menjadi makhluk laut beracun.
    - [x] *Cute Pastel* — warna lembut, bentuk membulat, ekspresi chibi, dan pipi kemerahan.
    - [ ] *Ancient Gods* — ornamen emas, batu kuno, mahkota, dan simbol mitologi.
    - [ ] *Haunted Galaxy* — hantu lucu, tengkorak, jahitan, kabut hijau, dan mata menyala; cocok untuk event Halloween.
    - [ ] *Steampunk Orbit* — tembaga, roda gigi, pipa, dan cincin Saturnus berbentuk mesin.
    - [ ] *Paper Craft* — tampilan seperti potongan kertas atau stiker dengan bayangan bertingkat.
    - [ ] Setiap skin baru harus mencakup planet normal, varian sakit, Mystery Planet, Virus, Black Hole, dan Star dengan satu bahasa visual yang konsisten.
- [ ] **Mode Permainan Baru**
  - [ ] *Time Attack (2 Menit):* Kecepatan drop lebih singkat, kejar skor tertinggi sebelum waktu habis.
  - [ ] *Daily Seed Challenge:* Urutan planet menggunakan *seeded PRNG* yang sama untuk semua pemain setiap harinya, lengkap dengan *tab leaderboard* harian.

### D. Monetisasi Tambahan (`src/utils/AdMobManager.native.ts` & `src/components/GameOverModal.tsx`)
- [ ] **Integrasi Rewarded Video Ads**
  - [ ] Opsi *"Watch Ad to Continue"* (1x per sesi permainan saat *Game Over*).
  - [ ] Opsi *"Watch Ad to Double (2x) Session Diamonds"* pada modal *Game Over*.
  - [ ] Opsi *"Watch Ad for +15 Diamonds"* di dalam `FreeDiamondModal.tsx` dengan *cooldown* harian.
