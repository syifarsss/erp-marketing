# Design Document

## Overview

Fitur **Industry Lead Filter** adalah perubahan terfokus pada satu file â€” `frontend/src/App.jsx` â€” yang mencakup dua area:

1. **Perluasan `industriesList`**: Menambahkan empat opsi industri baru ("Oil & Gas", "Petrochemical", "Power and Energy", "Construction") ke dalam array `industriesList` yang sudah ada, sehingga total menjadi 13 opsi dengan "Other" tetap di posisi terakhir. Tidak ada perubahan backend yang diperlukan.

2. **Filter Industri di Customer Segmentation**: Menambahkan state `segmentIndustryFilter` dan dropdown Industry_Filter di tab Customer Segmentation. Filter ini diterapkan secara client-side di atas logika filter segmen yang sudah ada. Filter di-reset ke nilai default ("Semua Industri") setiap kali pengguna meninggalkan tab segments.

Tidak ada perubahan backend, tidak ada komponen baru, tidak ada file baru. Semua perubahan terlokalisir di `App.jsx`.

---

## Architecture

Fitur ini sepenuhnya berada di lapisan frontend (React SPA). Tidak ada komunikasi jaringan baru yang diinduksi oleh fitur ini.

```
App.jsx
â”œâ”€â”€ State
â”‚   â”œâ”€â”€ industriesList          â† diperluas: +4 item baru (const, bukan state)
â”‚   â””â”€â”€ segmentIndustryFilter   â† useState baru: '' | nama industri
â”‚
â”œâ”€â”€ Efek Samping
â”‚   â””â”€â”€ useEffect[operatorTab]  â† reset segmentIndustryFilter ke '' 
â”‚                                   saat operatorTab !== 'segments'
â”‚
â””â”€â”€ Rendering
    â”œâ”€â”€ Lead_Form <select>       â† sudah pakai industriesList, tidak berubah
    â””â”€â”€ Segments Tab
        â”œâ”€â”€ Industry_Filter dropdown  â† baru: pakai industriesList
        â””â”€â”€ Segment Cards            â† matchedLeads difilter tambahan oleh
                                        segmentIndustryFilter
```

**Aliran data:**

```
industriesList (const)
    â†“ dipopulasi ke
Industry_Filter <select>  â†’  segmentIndustryFilter (state)
                                    â†“
                         matchedLeads = baseFilter(leads) + industryFilter
                                    â†“
                         Segment Card table rows
```

---

## Components and Interfaces

### 1. `industriesList` â€” Perluasan Array

**Lokasi**: `App.jsx` baris ~1539, di dalam body komponen `App` (setelah semua hooks dan handlers).

**Perubahan**: Menambahkan 4 opsi baru sebelum "Other".

```javascript
// Sebelum
const industriesList = [
  'Technology', 'E-commerce', 'Tourism', 'Finance',
  'F&B', 'Education', 'FMCG', 'Energy', 'Other'
];

// Sesudah (13 opsi, "Other" tetap di posisi terakhir)
const industriesList = [
  'Technology', 'E-commerce', 'Tourism', 'Finance',
  'F&B', 'Education', 'FMCG', 'Energy',
  'Oil & Gas', 'Petrochemical', 'Power and Energy', 'Construction',
  'Other'
];
```

Array ini sudah digunakan di dua tempat yang ada: Lead_Form `<select>` dan template CSV bulk import â€” keduanya tidak memerlukan modifikasi karena sudah melakukan `.map()` atas array tersebut.

---

### 2. `segmentIndustryFilter` â€” State Baru

**Lokasi**: Blok state "Filtering states" di App.jsx (~baris 58-62), setelah `leadsFilterIndustry`.

```javascript
// Tambahkan bersama state filter yang ada
const [segmentIndustryFilter, setSegmentIndustryFilter] = useState('');
```

**Nilai**: String kosong `''` berarti "Semua Industri". Nilai selain itu adalah nama industri tepat seperti yang ada di `industriesList`.

---

### 3. Reset via `useEffect` â€” Perilaku Tab-Switch

Saat pengguna berpindah dari tab `segments` ke tab lain, filter di-reset.

**Lokasi**: Tambahkan `useEffect` baru setelah blok `useEffect` untuk `assetSearchTerm` dan `notesCategoryFilter`.

```javascript
// Reset filter industri segmentasi setiap kali meninggalkan tab segments
useEffect(() => {
  if (operatorTab !== 'segments') {
    setSegmentIndustryFilter('');
  }
}, [operatorTab]);
```

Efek ini hanya berjalan ketika `operatorTab` berubah. Karena kondisi `!== 'segments'`, state akan di-reset ketika pengguna beralih ke tab 'leads' atau 'roles', tetapi tidak ketika beralih ke 'segments' (karena pengecekan dilakukan setelah nilai berubah ke bukan 'segments').

---

### 4. Industry_Filter Dropdown â€” Rendering di Segments Tab

**Lokasi**: Di dalam blok `{operatorTab === 'segments' && (...)}`, sebagai bagian dari header section sebelum `segments.map(...)`.

```jsx
{/* Header dan Industry Filter */}
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
  <div>
    <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Customer Segmentation</h3>
    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
      Segmentasi dinamis berdasarkan kriteria CRM
    </span>
  </div>

  {/* Industry_Filter */}
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
      Filter Industri:
    </label>
    <select
      className="form-select"
      style={{ minWidth: '200px', height: '38px', fontSize: '13px' }}
      value={segmentIndustryFilter}
      onChange={e => setSegmentIndustryFilter(e.target.value)}
    >
      <option value="">Semua Industri ({leads.length})</option>
      {industriesList.map(ind => {
        const count = leads.filter(l => l.industry === ind).length;
        return (
          <option key={ind} value={ind}>
            {ind} ({count})
          </option>
        );
      })}
    </select>
  </div>
</div>
```

Jumlah leads di setiap opsi dihitung secara dinamis dari `leads` state pada saat render, mencerminkan data terkini tanpa perlu state tambahan.

---

### 5. Filter Gabungan di Segment Cards

**Lokasi**: Di dalam `segments.map(...)`, setelah logika `matchedLeads` yang ada dan sebelum `return`.

Pola yang diterapkan adalah **two-phase filtering**: fase pertama adalah logika segmen yang ada (berdasarkan score, value, source, dll.), fase kedua adalah filter industri opsional.

```javascript
segments.map((seg, idx) => {
  const isExpanded = expandedSegmentId === seg.id;

  // Fase 1: Filter berdasarkan kriteria segmen (logika yang sudah ada, tidak berubah)
  let matchedLeads = [];
  if (seg.id === 'high-score') {
    matchedLeads = leads.filter(l => l.lead_score >= 80);
  } else if (seg.id === 'enterprise-tier') {
    matchedLeads = leads.filter(l => parseFloat(l.value) >= 200000000);
  } else if (seg.id === 'digital-ads') {
    matchedLeads = leads.filter(l =>
      ['Google Ads', 'Facebook Ads', 'TikTok Ads', 'Instagram Ads'].includes(l.source)
    );
  } else if (seg.id === 'pt-accounts') {
    matchedLeads = leads.filter(l =>
      (l.company || '').toUpperCase().includes('PT') ||
      (l.name || '').toUpperCase().includes('PT')
    );
  } else if (seg.id === 'proposal-stage') {
    matchedLeads = leads.filter(l => l.status === 'Proposal');
  } else {
    matchedLeads = leads.filter(l =>
      !l.last_contact ||
      (new Date() - new Date(l.last_contact) > 7 * 24 * 60 * 60 * 1000)
    );
  }

  // Fase 2: Terapkan filter industri (baru) â€” no-op jika '' (semua)
  if (segmentIndustryFilter !== '') {
    matchedLeads = matchedLeads.filter(l => l.industry === segmentIndustryFilter);
  }

  // ... sisa render tidak berubah
```

**Badge jumlah leads** di header kartu tetap menampilkan `matchedLeads.length` â€” angka ini otomatis mencerminkan hasil filter gabungan.

**Pesan kosong**: Di dalam tabel leads yang sudah ada (bagian `{isExpanded && ...}`), tambahkan kondisi untuk menampilkan pesan deskriptif ketika `matchedLeads.length === 0`:

```jsx
{isExpanded && (
  <div ... onClick={(e) => e.stopPropagation()}>
    {matchedLeads.length === 0 ? (
      <div style={{
        textAlign: 'center', padding: '32px 20px',
        color: 'var(--text-muted)', fontSize: '13px'
      }}>
        {segmentIndustryFilter !== ''
          ? `Tidak ada leads dengan industri "${segmentIndustryFilter}" dalam segmen ini.`
          : 'Tidak ada leads dalam segmen ini.'}
      </div>
    ) : (
      <div className="table-container">
        {/* tabel yang sudah ada */}
      </div>
    )}
    ...
  </div>
)}
```

---

## Data Models

Tidak ada perubahan skema database. Nilai industri baru ("Oil & Gas", "Petrochemical", "Power and Energy", "Construction") disimpan sebagai string VARCHAR di kolom `industry` yang sudah ada.

**Struktur lead yang relevan** (tidak berubah):

```typescript
interface Lead {
  id: number;
  industry: string;   // nilai dari industriesList, disimpan as-is
  // ... field lainnya
}
```

**Kompatibilitas mundur**: Lead dengan nilai industri lama ("Energy", "FMCG", dll.) tetap valid â€” nilai tersebut sudah ada di `industriesList` dan tidak terpengaruh. Lead dengan nilai industri yang tidak ada di daftar manapun (data kotor) akan tampil di semua opsi kecuali filter spesifik yang dipilih (karena client-side filter menggunakan `===` exact match).

---

## Correctness Properties

*Properti adalah karakteristik atau perilaku yang harus berlaku di semua eksekusi valid sistem â€” pada dasarnya, pernyataan formal tentang apa yang harus dilakukan sistem. Properti menjadi jembatan antara spesifikasi yang dapat dibaca manusia dan jaminan kebenaran yang dapat diverifikasi mesin.*

### Property 1: Daftar industri memiliki tepat 13 opsi dengan "Other" di posisi terakhir

*Untuk semua* keadaan sistem, array `industriesList` SHALL memiliki panjang tepat 13 dan elemen terakhirnya SHALL selalu bernilai `"Other"`.

**Validates: Requirements 1.1**

---

### Property 2: Nilai industri yang dipilih diteruskan tanpa transformasi ke API

*Untuk semua* nilai `ind` yang terdapat dalam `industriesList`, jika `leadFormData.industry` diset ke `ind` dan `saveLead()` dipanggil, maka payload yang dikirim ke `api.createLead()` atau `api.updateLead()` SHALL memiliki `industry === ind` tanpa modifikasi string apapun.

**Validates: Requirements 1.2**

---

### Property 3: Form edit menampilkan nilai industri yang tersimpan

*Untuk semua* nilai industri `ind` yang terdapat dalam `industriesList`, jika data lead memiliki `industry === ind` dan form edit dibuka dengan data tersebut, maka elemen `<select>` industri SHALL menampilkan `ind` sebagai nilai terpilih (`selected`).

**Validates: Requirements 1.3**

---

### Property 4: Filter segmen hanya menampilkan leads dengan industri yang dipilih

*Untuk semua* nilai `segmentIndustryFilter` yang tidak kosong dan *untuk semua* kartu segmen, setiap elemen dalam `matchedLeads` yang dihasilkan oleh logika filter gabungan SHALL memiliki `lead.industry === segmentIndustryFilter`.

**Validates: Requirements 2.2, 3.4**

---

### Property 5: Filter industri adalah idempoten terhadap "Semua Industri"

*Untuk semua* keadaan `leads`, jika `segmentIndustryFilter === ''`, maka fase kedua filter SHALL menghasilkan array yang sama persis dengan `matchedLeads` setelah fase pertama (tidak ada leads yang dihilangkan).

**Validates: Requirements 2.3**

---

### Property 6: Reset filter saat meninggalkan tab segments

*Untuk semua* nilai `operatorTab` yang bukan `'segments'`, nilai `segmentIndustryFilter` SHALL selalu sama dengan `''` (string kosong) setelah efek samping dijalankan.

**Validates: Requirements 2.6**

---

### Property 7: Dropdown Industry_Filter memiliki N+1 opsi dari industriesList

*Untuk semua* keadaan `leads`, dropdown Industry_Filter SHALL merender tepat `industriesList.length + 1` opsi: satu opsi "Semua Industri" ditambah satu opsi untuk setiap industri dalam `industriesList`.

**Validates: Requirements 2.1**

---

## Error Handling

### Nilai industri legacy (tidak ada di industriesList)

Lead yang tersimpan dengan nilai industri yang tidak ada di `industriesList` saat ini (data lama atau migrasi tidak lengkap) akan ditangani sebagai berikut:

- **Lead_Form**: State `leadFormData` diinisialisasi dengan `industry: lead.industry` dari data API. Jika nilai tersebut tidak ada dalam opsi `<select>`, browser HTML akan menampilkan opsi pertama sebagai fallback standar. Tidak ada error UI.
- **Requirement 1.4**: Untuk memenuhi requirement ini secara eksplisit, nilai default `'Technology'` sudah terpasang di inisialisasi `leadFormData`. Jika perlu jaminan lebih kuat, tambahkan normalisasi di `openEditModal`:
  ```javascript
  industry: industriesList.includes(lead.industry) ? lead.industry : 'Technology'
  ```
- **Industry_Filter**: Leads dengan industri tidak dikenal tidak akan muncul ketika filter spesifik dipilih (karena exact match gagal). Mereka tetap tampil saat "Semua Industri" dipilih. Ini adalah perilaku yang diharapkan dan tidak perlu penanganan khusus.

### Filter menghasilkan daftar kosong

Ditangani dengan pesan deskriptif di dalam expanded segment card (lihat bagian Komponen). Tidak ada toast/alert yang diperlukan â€” UI state cukup.

### Performa rendering

`leads.filter(l => l.industry === ind).length` dipanggil N kali (satu per industri) saat merender dropdown. Untuk jumlah leads tipikal (<1000) ini tidak menimbulkan masalah performa karena:
- Ini adalah operasi O(NÃ—M) di mana N = jumlah leads dan M = 13 (konstan)
- Terjadi hanya di tab segments, bukan di setiap render
- Tidak ada API call tambahan yang diinduksi

Jika di masa depan jumlah leads membesar signifikan (>10.000), perhitungan count bisa di-memoize dengan `useMemo`.

---

## Testing Strategy

### Pendekatan Pengujian Ganda

Fitur ini melibatkan logika filter array murni (pure function) yang cocok untuk property-based testing, dikombinasikan dengan contoh spesifik untuk kasus tepi.

**Library PBT yang digunakan**: [fast-check](https://github.com/dubzzz/fast-check) (kompatibel dengan React/Jest/Vitest).

**Konfigurasi**: Minimal 100 iterasi per property test.

---

### Unit Tests (Contoh Spesifik)

#### Test 1: Nilai default industriesList

```javascript
// Feature: industry-lead-filter, contoh kasus default value
test('leadFormData.industry defaults to "Technology" for new leads', () => {
  // Verifikasi bahwa nilai default di state initializer adalah 'Technology'
  expect(defaultLeadFormData.industry).toBe('Technology');
});
```

#### Test 2: Opsi "Other" selalu di posisi terakhir

```javascript
test('"Other" is always the last option in industriesList', () => {
  expect(industriesList[industriesList.length - 1]).toBe('Other');
});
```

#### Test 3: Pesan kosong saat filter menghasilkan nol leads

```javascript
// Feature: industry-lead-filter, kasus empty state
test('shows descriptive message when no leads match combined filter', () => {
  // render segment tab dengan segmentIndustryFilter = 'Oil & Gas'
  // dan leads = [] atau leads tanpa 'Oil & Gas'
  // expect: pesan "Tidak ada leads dengan industri..." tampil
});
```

---

### Property-Based Tests

#### Property Test 1: Jumlah opsi industri

```javascript
// Feature: industry-lead-filter, Property 1: Daftar industri memiliki tepat 13 opsi
// dengan "Other" di posisi terakhir
test.prop([fc.constant(industriesList)])(
  'industriesList always has 13 items with "Other" last',
  (list) => {
    expect(list).toHaveLength(13);
    expect(list[list.length - 1]).toBe('Other');
  }
);
```

#### Property Test 2: Round-trip nilai industri ke API

```javascript
// Feature: industry-lead-filter, Property 2: Nilai industri yang dipilih diteruskan tanpa transformasi
test.prop([fc.constantFrom(...industriesList)])(
  'selected industry value is passed to API unchanged',
  async (industryValue) => {
    const mockApi = { createLead: jest.fn().mockResolvedValue({}) };
    const formData = { ...defaultLeadFormData, industry: industryValue };
    await saveLead(formData, mockApi);
    expect(mockApi.createLead).toHaveBeenCalledWith(
      expect.objectContaining({ industry: industryValue })
    );
  }
);
```

#### Property Test 3: Filter segmen hanya menampilkan leads dengan industri yang dipilih

```javascript
// Feature: industry-lead-filter, Property 4: Filter segmen hanya menampilkan leads dengan industri yang dipilih
test.prop([
  fc.array(fc.record({
    id: fc.nat(),
    industry: fc.oneof(fc.constantFrom(...industriesList), fc.string()),
    lead_score: fc.integer({ min: 0, max: 100 }),
    value: fc.float({ min: 0 }),
    source: fc.string(),
    status: fc.string(),
    company: fc.string(),
    name: fc.string(),
    last_contact: fc.option(fc.date().map(d => d.toISOString())),
  })),
  fc.constantFrom(...industriesList)
])(
  'all matchedLeads have matching industry when filter is active',
  (leads, selectedIndustry) => {
    // Simulasi fase 2 filter
    const filtered = leads.filter(l => l.industry === selectedIndustry);
    // Semua hasil harus memiliki industri yang cocok
    expect(filtered.every(l => l.industry === selectedIndustry)).toBe(true);
  }
);
```

#### Property Test 4: "Semua Industri" tidak mengurangi hasil fase pertama

```javascript
// Feature: industry-lead-filter, Property 5: Filter industri adalah idempoten terhadap "Semua Industri"
test.prop([
  fc.array(fc.record({
    id: fc.nat(),
    industry: fc.option(fc.string()),
  }))
])(
  'empty industry filter leaves matchedLeads unchanged',
  (baseMatchedLeads) => {
    const filterValue = '';
    let result = [...baseMatchedLeads];
    if (filterValue !== '') {
      result = result.filter(l => l.industry === filterValue);
    }
    expect(result).toHaveLength(baseMatchedLeads.length);
    expect(result).toEqual(baseMatchedLeads);
  }
);
```

#### Property Test 5: Reset filter saat berpindah tab

```javascript
// Feature: industry-lead-filter, Property 6: Reset filter saat meninggalkan tab segments
test.prop([
  fc.constantFrom('leads', 'roles')
])(
  'segmentIndustryFilter resets to "" when switching away from segments tab',
  (otherTab) => {
    // Simulasi: set operatorTab ke nilai bukan 'segments'
    // Setelah useEffect dijalankan, segmentIndustryFilter harus ''
    const { result } = renderHook(() => {
      const [operatorTab, setOperatorTab] = useState('segments');
      const [segmentIndustryFilter, setSegmentIndustryFilter] = useState('Oil & Gas');
      useEffect(() => {
        if (operatorTab !== 'segments') {
          setSegmentIndustryFilter('');
        }
      }, [operatorTab]);
      return { operatorTab, setOperatorTab, segmentIndustryFilter };
    });
    act(() => result.current.setOperatorTab(otherTab));
    expect(result.current.segmentIndustryFilter).toBe('');
  }
);
```

#### Property Test 6: Dropdown memiliki N+1 opsi

```javascript
// Feature: industry-lead-filter, Property 7: Dropdown Industry_Filter memiliki N+1 opsi
test.prop([
  fc.array(fc.record({ industry: fc.constantFrom(...industriesList) }))
])(
  'Industry_Filter dropdown has industriesList.length + 1 options',
  (leads) => {
    // Render dropdown dengan leads sembarang
    const { getAllByRole } = render(<IndustryFilterDropdown leads={leads} />);
    const options = getAllByRole('option');
    // +1 untuk opsi "Semua Industri"
    expect(options).toHaveLength(industriesList.length + 1);
  }
);
```

---

### Integrasi Tests

- **Backend exact match**: Verifikasi bahwa `GET /leads?industry=Oil%20%26%20Gas` mengembalikan hanya leads dengan `industry === 'Oil & Gas'`. Cukup 2-3 contoh data fixture.
- **Backend invalid industry**: Verifikasi bahwa `GET /leads?industry=InvalidValue` mengembalikan error (sesuai Requirement 3.5 â€” jika backend sudah mengimplementasikan ini).

