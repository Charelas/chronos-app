## Objective

Tambahkan micro-animation pada hero balance number di dashboard (`app/(tabs)/index.tsx`) — angka balance harus count-up/count-down dengan animasi saat pertama kali load atau saat nilai berubah (setelah stop timer / tambah entry).

## Expected Behavior

- Saat dashboard pertama kali mount: angka balance animate dari 0 ke nilai aktual
- Saat nilai berubah (setelah log entry baru): animate dari nilai lama ke nilai baru
- Durasi animasi: ~800ms dengan easing yang smooth (ease-out)
- Angka harus format dengan benar selama animasi (1 decimal place)

## Implementation Notes

- Gunakan `Animated.Value` + interpolate, atau library `react-native-reanimated`
- Target element: `heroNumber` text di `app/(tabs)/index.tsx` (line ~99)
- Juga pertimbangkan subtle pulse animation pada `pulseDot` di focus card

## Acceptance Criteria

- [ ] Balance number animates on first load
- [ ] Balance number re-animates saat nilai berubah
- [ ] Animasi smooth, tidak choppy
- [ ] Performance: tidak drop frame (gunakan `useNativeDriver` atau reanimated)
- [ ] Tanda +/- muncul dengan benar selama dan setelah animasi

## Competition Impact

**Kriteria Keunikan (30%) — Wow Factor** — Micro-animation ini adalah perbedaan antara app yang "bagus" dan app yang "memorable".
