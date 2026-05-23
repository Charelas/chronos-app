## Objective

Layar `project_details.tsx`, `team_balance.tsx`, dan `notifications.tsx` saat ini berisi UI mock/static yang tidak terhubung ke data real dari AppContext. Jika juri membuka layar-layar ini saat demo, mereka akan melihat data dummy yang tidak berubah.

## Screens Affected

### `app/project_details.tsx`
- **Current state**: Data project statis / hardcoded
- **Fix**: Derive project data dari `entries` yang sudah ada — group by category, hitung total hours per "project"

### `app/team_balance.tsx`
- **Current state**: Data team statis
- **Decision needed**: Apakah fitur ini in-scope? Jika tidak, sembunyikan navigation ke sana. Jika ya, isi dengan data yang meaningful (bisa mock tapi harus terlihat credible).

### `app/notifications.tsx`
- **Current state**: UI notification center yang kemungkinan tidak ada notifikasi real
- **Fix**: Derive notifikasi dari state app (timer yang sedang jalan, balance warning, goal completion)

## Acceptance Criteria

- [ ] `project_details.tsx` menampilkan breakdown entri berdasarkan category sebagai "projects"
- [ ] `team_balance.tsx` keputusan dibuat: dihapus dari nav ATAU diisi data yang credible
- [ ] `notifications.tsx` menampilkan minimal 1 notifikasi yang generated dari state real
- [ ] Tidak ada layar yang menampilkan data yang jelas-jelas placeholder saat demo

## Competition Impact

**Kriteria Solusi (40%) — Fungsionalitas** — Layar yang broken merusak kesan profesional saat live demo.
