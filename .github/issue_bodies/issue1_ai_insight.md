## Objective

Tambahkan fitur AI Insight ke analytics screen menggunakan Google Gemini API untuk generate kalimat kontekstual berdasarkan pola waktu pengguna.

## Acceptance Criteria

- [ ] Integrasi Gemini API dengan `@google/generative-ai` package
- [ ] Muncul sebagai card di `app/analytics.tsx` setelah data mingguan diproses
- [ ] AI menganalisis pola: hari paling produktif, tren naik/turun, potensi burnout
- [ ] Contoh output: "Kamu bekerja 23% lebih lama dari minggu lalu. Pertimbangkan rebalance jadwalmu."
- [ ] Loading state yang elegan saat AI sedang generate
- [ ] Graceful fallback jika offline atau API error

## Implementation Notes

- File target: `app/analytics.tsx` + new `utils/gemini.ts`
- Input ke AI: weeklyHours, peakDay, totalBalance, categoryBreakdown
- Output: 1-2 kalimat insight yang personal dan actionable
- Gunakan environment variable untuk API key

## Competition Impact

**Kriteria Keunikan (30%)** — Gap terbesar terhadap kriteria juri yang eksplisit menyebutkan penggunaan AI secara elegan.
