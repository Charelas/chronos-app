## Objective

Perbaiki onboarding flow yang saat ini broken: tombol "Set Your Targets" langsung masuk dashboard tanpa mengumpulkan nama user atau menetapkan weekly commitment target.

## Current Broken Flow

1. Splash -> Welcome
2. User tap "Set Your Targets"
3. **LANGSUNG masuk dashboard** (skip setup)

## Expected Flow

1. Splash -> Welcome (penjelasan filosofi app)
2. Step 1: Input nama user
3. Step 2: Set weekly commitment hours (slider/stepper)
4. Step 3: Konfirmasi -> Dashboard dengan sambutan personal

## Acceptance Criteria

- [ ] Welcome screen punya multi-step onboarding (min. 2 langkah)
- [ ] Collect: nama user, weekly commitment hours
- [ ] Nama user tampil di dashboard header (ganti hardcoded "Julian Sterling" di settings)
- [ ] Weekly commitment langsung ter-set di AppContext/storage saat onboarding selesai
- [ ] Skip option untuk pengguna yang ingin langsung coba
- [ ] Animasi transisi antar langkah yang smooth

## Files to Modify

- `app/welcome.tsx`
- `context/AppContext.tsx` (add userName to AppSettings)
- `utils/storage.ts` (add userName field)
- `app/(tabs)/settings.tsx` (read userName from context)

## Competition Impact

**Kriteria Solusi (40%) — UX** — Broken flow yang langsung terdeteksi juri saat demo pertama.
