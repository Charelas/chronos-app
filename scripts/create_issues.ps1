$gh = "C:\Program Files\GitHub CLI\gh.exe"
$repo = "Charelas/chronos-app"
$tmp = "$env:TEMP\gh_issue_body.md"

# ── ISSUE 1 ─────────────────────────────────────────────────────────────────
@"
## Deskripsi
Inisialisasi proyek **Chronos Balance** menggunakan Expo SDK dengan konfigurasi awal untuk platform Android, iOS, dan Web.

## Task yang Diselesaikan
- [x] Membuat proyek baru menggunakan create-expo-app
- [x] Mengkonfigurasi app.json (nama, bundle ID, splash screen)
- [x] Setup expo-router sebagai sistem navigasi berbasis file
- [x] Mengkonfigurasi tsconfig.json untuk TypeScript support
- [x] Membuat .gitignore yang sesuai untuk proyek Expo
- [x] Setup scripts: start, android, ios, web, lint

## Tech Stack
- Expo SDK ~54.0.33
- React 19.1.0 / React Native 0.81.5
- TypeScript ~5.9.2
- Expo Router ~6.0.23

## File Terkait
- app.json, tsconfig.json, package.json, .gitignore
"@ | Set-Content $tmp -Encoding UTF8
& $gh issue create --repo $repo --title "[SETUP] Inisialisasi Proyek Expo React Native dengan Expo Router" --body-file $tmp
Write-Host "Issue 1 created"
Start-Sleep -Seconds 2

# ── ISSUE 2 ─────────────────────────────────────────────────────────────────
@"
## Deskripsi
Instalasi dan konfigurasi semua dependency utama yang dibutuhkan aplikasi Chronos Balance.

## Task yang Diselesaikan
- [x] Install NativeWind v4 + Tailwind CSS untuk styling
- [x] Install @expo-google-fonts/manrope dan inter untuk tipografi editorial
- [x] Install @expo/vector-icons (MaterialIcons)
- [x] Install react-native-reanimated ~4.1.1 untuk animasi
- [x] Install react-native-gesture-handler, safe-area-context, screens
- [x] Install @react-native-async-storage/async-storage 2.2.0 untuk persistensi data
- [x] Install expo-sqlite ~16.0.10
- [x] Konfigurasi metro.config.js untuk NativeWind
- [x] Konfigurasi tailwind.config.js dengan custom design tokens

## File Terkait
- package.json, metro.config.js, tailwind.config.js, nativewind-env.d.ts
"@ | Set-Content $tmp -Encoding UTF8
& $gh issue create --repo $repo --title "[SETUP] Instalasi Dependencies dan Konfigurasi NativeWind" --body-file $tmp
Write-Host "Issue 2 created"
Start-Sleep -Seconds 2

# ── ISSUE 3 ─────────────────────────────────────────────────────────────────
@"
## Deskripsi
Membangun Design System terpusat berdasarkan filosofi **The Balanced Chronograph** yang mendefinisikan semua token warna, tipografi, dan elevasi.

## Latar Belakang
Aplikasi ini menggunakan filosofi desain editorial premium yang melarang penggunaan border 1px biasa dan drop shadow generik. Semua struktur visual dibangun menggunakan surface stacking dan tonal nesting.

## Task yang Diselesaikan
- [x] Mendefinisikan color palette berbasis teal: primary #004d64
- [x] Membuat token surface (surface, container-low, container-lowest, dll)
- [x] Setup dual-typeface system: Manrope (display/headline) + Inter (body/label)
- [x] Mendefinisikan Fonts constants (headlineExtraBold, headline, body, bodySemiBold, labelBold)
- [x] Membuat DESIGN.md sebagai dokumentasi design system
- [x] Implementasi The No-Line Rule di semua komponen

## File Terkait
- constants/theme.ts, DESIGN.md
"@ | Set-Content $tmp -Encoding UTF8
& $gh issue create --repo $repo --title "[FEATURE] Implementasi Design System - The Balanced Chronograph" --body-file $tmp
Write-Host "Issue 3 created"
Start-Sleep -Seconds 2

# ── ISSUE 4 ─────────────────────────────────────────────────────────────────
@"
## Deskripsi
Membangun lapisan storage menggunakan AsyncStorage dengan type-safety penuh untuk semua data persisten aplikasi.

## Task yang Diselesaikan
- [x] Mendefinisikan interface TimeEntry (id, date, startTime, endTime, category, description, durationMinutes, balanceHours)
- [x] Mendefinisikan interface TimerState dan AppSettings
- [x] Implementasi defaultSettings (weeklyCommitment: 40h, monthlyCap: 160h)
- [x] Fungsi getEntries / saveEntries / addEntry / deleteEntry / clearAllEntries
- [x] Fungsi getSettings / saveSettings
- [x] Fungsi getTimerState / saveTimerState
- [x] Fungsi getOnboarded / setOnboarded / resetOnboarding
- [x] Implementasi getSeedEntries untuk data demo pertama kali launch
- [x] Fungsi computeTotalBalance dengan canonical sign rule
- [x] Fungsi getCategoryBalanceSign (Work/OT/Meeting = +1, Personal/Education = -1)
- [x] Helper formatDuration dan formatBalance

## File Terkait
- utils/storage.ts
"@ | Set-Content $tmp -Encoding UTF8
& $gh issue create --repo $repo --title "[FEATURE] Implementasi Storage Layer dengan AsyncStorage" --body-file $tmp
Write-Host "Issue 4 created"
Start-Sleep -Seconds 2

# ── ISSUE 5 ─────────────────────────────────────────────────────────────────
@"
## Deskripsi
Membangun global state management menggunakan React Context API dengan semua business logic terpusat.

## Task yang Diselesaikan
- [x] Membuat AppContext dengan AppContextType yang lengkap
- [x] State: entries, settings, timer, elapsed, isOnboarded, loading
- [x] Derived state dengan useMemo: totalBalance, weeklyHours, monthlyHours
- [x] Timer tick menggunakan setInterval via useEffect
- [x] Load initial data secara parallel dengan Promise.all
- [x] Auto-seed data pada first launch jika entries kosong
- [x] Implementasi addEntry, removeEntry, updateSettings
- [x] Implementasi startTimer, stopTimer dengan auto-save entry
- [x] Implementasi completeOnboarding, refreshData, clearEntries, signOut
- [x] Export useApp() hook dengan error boundary

## Bug Fixes yang Diimplementasi
- R-BUG-001: Apply canonical sign rule di stopTimer agar Personal/Education = negative balance
- BUG-002: clearEntries juga sync React state (tidak hanya storage)
- R-CS-003: Abstract resetOnboarding lewat signOut() agar settings.tsx tidak akses AsyncStorage langsung

## File Terkait
- context/AppContext.tsx
"@ | Set-Content $tmp -Encoding UTF8
& $gh issue create --repo $repo --title "[FEATURE] Global State Management dengan React Context dan useMemo" --body-file $tmp
Write-Host "Issue 5 created"
Start-Sleep -Seconds 2

# ── ISSUE 6 ─────────────────────────────────────────────────────────────────
@"
## Deskripsi
Setup navigasi berbasis file menggunakan Expo Router dengan tab navigation dan stack navigation untuk screen tambahan.

## Task yang Diselesaikan
- [x] Membuat app/_layout.tsx sebagai root layout dengan AppProvider wrapping
- [x] Mengkonfigurasi Stack navigator untuk screen: splash, welcome, analytics, notifications, project_details, team_balance
- [x] Membuat app/(tabs)/_layout.tsx dengan Bottom Tab Navigator
- [x] Konfigurasi 4 tab: Dashboard (index), Add Entry, History, Settings
- [x] Setup tab icons menggunakan MaterialIcons
- [x] Implementasi SafeAreaProvider dan GestureHandlerRootView di root layout

## File Terkait
- app/_layout.tsx, app/(tabs)/_layout.tsx
"@ | Set-Content $tmp -Encoding UTF8
& $gh issue create --repo $repo --title "[FEATURE] Setup Navigasi Expo Router (Tab + Stack Navigation)" --body-file $tmp
Write-Host "Issue 6 created"
Start-Sleep -Seconds 2

# ── ISSUE 7 ─────────────────────────────────────────────────────────────────
@"
## Deskripsi
Membangun Splash Screen dan Welcome/Onboarding Screen yang menjadi pintu masuk pertama pengguna ke aplikasi.

## Task yang Diselesaikan
- [x] Implementasi splash.tsx dengan animasi logo Chronos
- [x] Implementasi welcome.tsx dengan onboarding flow
- [x] Logic routing: jika sudah onboarded langsung ke tabs, jika belum tampilkan welcome
- [x] Integrasi dengan isOnboarded state dari AppContext
- [x] Implementasi completeOnboarding() saat user menyelesaikan onboarding

## File Terkait
- app/splash.tsx, app/welcome.tsx
"@ | Set-Content $tmp -Encoding UTF8
& $gh issue create --repo $repo --title "[FEATURE] Splash Screen dan Welcome/Onboarding Flow" --body-file $tmp
Write-Host "Issue 7 created"
Start-Sleep -Seconds 2

# ── ISSUE 8 ─────────────────────────────────────────────────────────────────
@"
## Deskripsi
Membangun Dashboard utama yang menampilkan Hero Balance Card, Quick Actions (timer), Weekly Trend Chart, dan Recent History.

## Task yang Diselesaikan
- [x] Hero Balance Card dengan angka balance 72px editorial weight
- [x] Quick Actions: Start/Stop Timer button dan Manual Entry button
- [x] Weekly Trend Bar Chart dengan useMemo (R-CS-002)
- [x] Current Focus Card yang muncul saat timer aktif dengan pulse dot
- [x] Monthly Goal progress bar
- [x] Recent History (3 entries terbaru) dengan category color chips
- [x] Floating Active Tracker bar (glassmorphism) di bottom saat timer running
- [x] Start Timer Modal dengan task input dan category selector
- [x] Navigasi ke analytics, team_balance, add entry, history screens

## File Terkait
- app/(tabs)/index.tsx
"@ | Set-Content $tmp -Encoding UTF8
& $gh issue create --repo $repo --title "[FEATURE] Dashboard Screen - Hero Balance, Timer, Weekly Chart" --body-file $tmp
Write-Host "Issue 8 created"
Start-Sleep -Seconds 2

# ── ISSUE 9 ─────────────────────────────────────────────────────────────────
@"
## Deskripsi
Membangun form Add Entry untuk mencatat waktu kerja secara manual dengan validasi lengkap.

## Task yang Diselesaikan
- [x] Hero card dengan live balance chip
- [x] Date picker dengan chevron navigation (blokir future date - UX-004)
- [x] Category selector dengan 5 kategori: Work, Overtime, Personal, Meeting, Education
- [x] Time input HH:MM dengan auto-pad on blur (UX-001)
- [x] Live preview duration dan balance impact
- [x] Task description multiline input
- [x] Validasi: deskripsi wajib, end time harus setelah start time
- [x] Warning dialog jika timer sedang aktif (UX-002)
- [x] Balance calculation menggunakan getCategoryBalanceSign (BUG-005 fix)
- [x] Weekly summary card (logged vs target vs delta)

## File Terkait
- app/(tabs)/add.tsx
"@ | Set-Content $tmp -Encoding UTF8
& $gh issue create --repo $repo --title "[FEATURE] Add Entry Screen - Manual Time Logging dengan Validasi" --body-file $tmp
Write-Host "Issue 9 created"
Start-Sleep -Seconds 2

# ── ISSUE 10 ─────────────────────────────────────────────────────────────────
@"
## Deskripsi
Membangun History Screen yang menampilkan semua time entries dengan filter dan kemampuan delete.

## Task yang Diselesaikan
- [x] List semua time entries diurutkan terbaru
- [x] Filter berdasarkan kategori
- [x] Category color chips untuk setiap entry
- [x] Balance impact per entry (positive/negative dengan warna)
- [x] Swipe-to-delete atau delete button per entry
- [x] Empty state saat tidak ada entries
- [x] Group entries berdasarkan tanggal

## File Terkait
- app/(tabs)/history.tsx
"@ | Set-Content $tmp -Encoding UTF8
& $gh issue create --repo $repo --title "[FEATURE] History Screen - Riwayat Semua Time Entries" --body-file $tmp
Write-Host "Issue 10 created"
Start-Sleep -Seconds 2

# ── ISSUE 11 ─────────────────────────────────────────────────────────────────
@"
## Deskripsi
Membangun Analytics Screen yang memberikan insight mendalam tentang pola produktivitas pengguna.

## Task yang Diselesaikan
- [x] Productivity Score circle (0-100) dengan label OPTIMAL/FAIR/LOW
- [x] Time Distribution dengan stacked bar chart per kategori
- [x] Weekly Comparison chart (current week vs prev week) per hari
- [x] Peak Day insight card
- [x] Balance Warning insight card saat balance negatif
- [x] Semua data dihitung dengan useMemo dari entries

## File Terkait
- app/analytics.tsx
"@ | Set-Content $tmp -Encoding UTF8
& $gh issue create --repo $repo --title "[FEATURE] Analytics Screen - Productivity Score dan Time Distribution" --body-file $tmp
Write-Host "Issue 11 created"
Start-Sleep -Seconds 2

# ── ISSUE 12 ─────────────────────────────────────────────────────────────────
@"
## Deskripsi
Membangun Settings Screen untuk konfigurasi preferensi pengguna dan management data.

## Task yang Diselesaikan
- [x] Input weekly commitment hours (default 40h)
- [x] Input monthly cap hours (default 160h)
- [x] Toggle preferensi notifikasi
- [x] Clear all entries dengan konfirmasi dialog
- [x] Sign Out / Reset onboarding menggunakan signOut() dari AppContext (R-CS-003)
- [x] App version display

## File Terkait
- app/(tabs)/settings.tsx
"@ | Set-Content $tmp -Encoding UTF8
& $gh issue create --repo $repo --title "[FEATURE] Settings Screen - Preferensi Pengguna dan Data Management" --body-file $tmp
Write-Host "Issue 12 created"
Start-Sleep -Seconds 2

# ── ISSUE 13 ─────────────────────────────────────────────────────────────────
@"
## Deskripsi
Membangun Team Balance Screen yang menampilkan perbandingan balance antar anggota tim.

## Task yang Diselesaikan
- [x] Tampilan balance per member tim
- [x] Visual indicator untuk status balance (positive/negative)
- [x] Avatar dan nama member
- [x] Navigasi dari header dashboard (avatar button)

## File Terkait
- app/team_balance.tsx
"@ | Set-Content $tmp -Encoding UTF8
& $gh issue create --repo $repo --title "[FEATURE] Team Balance Screen - Perbandingan Balance Antar Tim" --body-file $tmp
Write-Host "Issue 13 created"
Start-Sleep -Seconds 2

# ── ISSUE 14 ─────────────────────────────────────────────────────────────────
@"
## Deskripsi
Membangun Project Details Screen untuk menampilkan breakdown waktu per proyek/kategori secara detail.

## Task yang Diselesaikan
- [x] Detail breakdown waktu per proyek
- [x] Statistik ringkasan per kategori
- [x] Link dari Analytics insight card

## File Terkait
- app/project_details.tsx
"@ | Set-Content $tmp -Encoding UTF8
& $gh issue create --repo $repo --title "[FEATURE] Project Details Screen - Breakdown Waktu per Proyek" --body-file $tmp
Write-Host "Issue 14 created"
Start-Sleep -Seconds 2

# ── ISSUE 15 ─────────────────────────────────────────────────────────────────
@"
## Deskripsi
Membangun Notifications Screen untuk menampilkan notifikasi dan pengingat kepada pengguna.

## Task yang Diselesaikan
- [x] List notifikasi sistem
- [x] Notifikasi balance warning
- [x] Notifikasi reminder logging harian

## File Terkait
- app/notifications.tsx
"@ | Set-Content $tmp -Encoding UTF8
& $gh issue create --repo $repo --title "[FEATURE] Notifications Screen - Notifikasi dan Reminder" --body-file $tmp
Write-Host "Issue 15 created"
Start-Sleep -Seconds 2

# ── ISSUE 16 ─────────────────────────────────────────────────────────────────
@"
## Deskripsi
QA menyeluruh dan perbaikan bug kritis yang ditemukan selama pengujian aplikasi.

## Bug yang Diperbaiki

### R-BUG-001 - Balance Sign Rule di stopTimer
Saat timer dihentikan, balance tidak menggunakan canonical sign rule. Personal/Education seharusnya menghasilkan balance negatif.
**Fix:** Gunakan getCategoryBalanceSign(category) di stopTimer().

### BUG-002 - clearEntries Tidak Sync React State  
Memanggil clearAllEntries() hanya membersihkan AsyncStorage tetapi state entries di React tidak di-reset.
**Fix:** Tambahkan setEntries([]) setelah clearAllEntries().

### BUG-005 - Balance Calculation di Add Entry Screen
Add entry screen tidak menggunakan getCategoryBalanceSign sehingga Personal/Education menghasilkan balance positif.
**Fix:** Gunakan canonical getCategoryBalanceSign(category).

## UX Improvements

### UX-001 - Auto-pad Time Input
Input jam/menit tidak otomatis di-pad dengan leading zero saat blur.

### UX-002 - Warning Saat Timer Aktif
Tidak ada peringatan saat user mencoba tambah manual entry sementara timer sedang berjalan.

### UX-004 - Blokir Future Date
User bisa memilih tanggal masa depan saat menambah entry.

### R-CS-002 - useMemo untuk Weekly Chart Data
Weekly chart data dihitung ulang setiap render, bukan hanya saat entries berubah.

### R-CS-003 - Abstract resetOnboarding
settings.tsx mengakses AsyncStorage langsung, seharusnya lewat AppContext.

## File Terkait
- context/AppContext.tsx, app/(tabs)/add.tsx, app/(tabs)/index.tsx
"@ | Set-Content $tmp -Encoding UTF8
& $gh issue create --repo $repo --title "[QA] Bug Fixes dan UX Improvements - Production Hardening" --body-file $tmp
Write-Host "Issue 16 created"
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "All 16 issues created successfully!"
Remove-Item $tmp -ErrorAction SilentlyContinue
