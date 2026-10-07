# Kontrak API — Multi-Method (ISM / MICMAC)

Kontrak bersama backend dan frontend untuk implementasi PRD Fase 1–4. Semua respons memakai envelope yang sudah ada: `{ success, data, message?, error? }`. Prefix: `/api/v1`.

## 1. Kode metode

Kode kanonik: `AHP`, `ANP`, `FUZZY_AHP`, `FUZZY_ANP`, `ISM`, `MICMAC`.

- Backend **menerima** label lama `'Fuzzy AHP'` / `'Fuzzy ANP'` di request (dinormalisasi) dan **membaca** nilai lama di DB lewat normalisasi yang sama.
- Backend **selalu mengembalikan** kode kanonik (`case.method`, `user.defaultMethod`).
- Frontend tidak boleh membandingkan string nama metode untuk logika baru. Pakai metadata dari `GET /methods` (`structure_tier`, `judgment_shape`, `result_shape`).

## 2. `GET /methods`

Tanpa autentikasi. Mengembalikan metode aktif, terurut `sort_order`.

```json
{ "success": true, "data": [
  { "code": "AHP", "label": "AHP", "description": "...", "family": "pairwise_ratio",
    "structure_tier": "two_tier", "judgment_shape": "ratio_matrix", "consistency_kind": "cr",
    "result_shape": "ranking", "max_elements": 20, "is_selectable": true, "derived_from": null, "sort_order": 10 },
  { "code": "ISM", "label": "ISM", "family": "structural", "structure_tier": "single_tier",
    "judgment_shape": "binary_relation_matrix", "consistency_kind": "consensus",
    "result_shape": "level_partition", "max_elements": 40, "is_selectable": true, "derived_from": null, "sort_order": 50 },
  { "code": "MICMAC", "label": "MICMAC", "structure_tier": "single_tier", "judgment_shape": null,
    "consistency_kind": "none", "result_shape": "quadrant_scatter", "max_elements": 40,
    "is_selectable": false, "derived_from": "ISM", "sort_order": 60 }
]}
```

Wizard hanya menampilkan `is_selectable = true`.

## 3. Membuat / mengubah case ISM

`POST /cases` dan `PUT /cases/:caseId` memakai body yang sama dengan sekarang, ditambah `method_config`:

```json
{
  "name": "Hambatan adopsi teknologi",
  "description": "", "objective": "",
  "method": "ISM",
  "deadline": "2026-12-31",
  "goal": { "name": "Struktur hambatan adopsi" },
  "method_config": { "contextual_relation": "memengaruhi" },
  "criteria": [
    { "id": "tmp-1", "name": "Biaya", "description": "" },
    { "id": "tmp-2", "name": "SDM", "description": "" },
    { "id": "tmp-3", "name": "Regulasi", "description": "" }
  ],
  "alternatives": [],
  "experts": [{ "email": "pakar@contoh.id", "weight": 1 }]
}
```

- Elemen ISM dikirim lewat `criteria` (tanpa `subs`). `alternatives` kosong atau tidak dikirim.
- `method_config.contextual_relation`: teks bebas, wajib untuk ISM, maks 200 karakter.
- Validasi ISM: 3 ≤ jumlah elemen ≤ `max_elements`; tidak boleh ada alternatif atau sub-kriteria. Gagal: `400 VALIDATION_ERROR`.
- `GET /cases/:caseId` mengembalikan `method_config` dan `criteria` dalam urutan kanonik (sama setiap kali dipanggil).

## 4. Judgment ISM

Satu level per pakar: `levelId = "structure"`.

### Simpan draf — `PUT /judgments/structure`
```json
{
  "caseId": "<uuid>",
  "order": ["<criteriaId e1>", "<criteriaId e2>", "<criteriaId e3>"],
  "comparisons": { "0-1": "V", "0-2": "O", "1-2": "A" }
}
```
- `order`: wajib untuk ISM; permutasi tepat dari id elemen case. Indeks di `comparisons` mengacu ke `order`.
- Kunci `"i-j"` dengan `i < j` (segitiga atas). Nilai: `"V"` (i memengaruhi j), `"A"` (j memengaruhi i), `"X"` (saling), `"O"` (tidak berhubungan).
- Draf boleh tidak lengkap, tapi minimal 1 sel. Kunci dengan `i >= j`, indeks di luar `order`, atau simbol lain: `400`.
- Respons sukses: `{ success: true, data: { level_id: "structure", filled: 2, total: 3 } }`.

### Baca milik sendiri — `GET /judgments/:caseId/mine`
Untuk case ISM, entri level `structure` berisi:
```json
{ "level_id": "structure", "order": ["..."], "comparisons": { "0-1": "V" }, "submitted": false }
```

### Submit — `POST /judgments/:expertId/submit` (tidak berubah)
Untuk ISM, submit ditolak `400` bila belum semua n(n−1)/2 sel terisi, dengan `error.details = { missing: ["1-2", ...] }`.

## 5. Hasil — `GET /results/:caseId`

AHP family: **bentuk respons tidak berubah**, kecuali `method` sekarang kode kanonik.

ISM: dihitung dari judgment yang sudah **submitted**. Bila belum ada yang submit: `payload = null`, `secondary = []`.

```json
{ "success": true, "data": {
  "caseId": "<uuid>",
  "method": "ISM",
  "result_shape": "level_partition",
  "status": "active",
  "contextual_relation": "memengaruhi",
  "expertCount": 3,
  "completedExpertCount": 2,
  "elements": [ { "id": "e1", "name": "Biaya" }, { "id": "e2", "name": "SDM" } ],
  "payload": {
    "element_order": ["e1", "e2", "e3", "e4"],
    "consensus": { "score": 0.87, "ties": [[1, 3]], "tie_rule": "zero" },
    "consensus_ssim": [[null,"V","O","V"],[null,null,"A","O"],[null,null,null,"V"],[null,null,null,null]],
    "initial_reachability": [[1,1,0,1],[0,1,0,0],[0,1,1,1],[0,0,0,1]],
    "final_reachability": [[1,1,0,1],[0,1,0,0],[0,1,1,1],[0,0,0,1]],
    "transitive_cells": [],
    "iterations": [
      { "level": 1, "elements": ["e2", "e4"] },
      { "level": 2, "elements": ["e1", "e3"] }
    ],
    "digraph_edges": [["e1","e2"],["e1","e4"],["e3","e2"],["e3","e4"]],
    "expert_agreement": [ { "expert_id": "<uuid>", "name": "Pakar A", "score": 0.93 } ]
  },
  "secondary": [
    { "analysis_code": "MICMAC", "result_shape": "quadrant_scatter", "payload": {
      "source_analysis": "ISM",
      "threshold": 2,
      "elements": [
        { "id": "e1", "driving": 3, "dependence": 1, "quadrant": "independent", "on_boundary": false }
      ]
    }}
  ]
}}
```

- Semua matriks diindeks menurut `element_order` (id elemen kanonik).
- `transitive_cells`: daftar `[i, j]` yang bernilai 1 hanya karena transitivitas (ditampilkan `1*`).
- `consensus.ties`: sel `[i, j]` pada reachability (arah i ke j, i ≠ j) dengan suara tepat 50%; diputuskan 0.
- `consensus.score`: proporsi sel off-diagonal reachability yang disepakati semua pakar (0..1).
- `digraph_edges`: edge langsung setelah edge transitif dihapus; arah `[dari, ke]` = "dari memengaruhi ke".
- `iterations[k].level = 1` adalah level teratas (paling dipengaruhi).
- `quadrant`: `"autonomous"` | `"dependent"` | `"linkage"` | `"independent"`. Tinggi = nilai ≥ `threshold` (= n/2). Driving dan dependence dihitung dari `final_reachability` termasuk diagonal.

## 6. Endpoint yang tidak berlaku untuk ISM

`POST /results/:caseId/sensitivity` dan `GET /results/:caseId/discrepancy` untuk case dengan `result_shape` selain `ranking`/`network_ranking`:
```json
{ "success": false, "error": { "code": "UNSUPPORTED_FOR_METHOD", "message": "Analisis sensitivitas tidak tersedia untuk metode ISM" } }
```
Status HTTP `422`.
