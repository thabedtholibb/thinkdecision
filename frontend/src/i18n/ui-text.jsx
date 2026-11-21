// i18n — source-string dictionary for bulk UI copy.
//
// The app already uses semantic keys (`t('creator.dash.newCase')`) for chrome
// that existed before the bilingual pass. Screens written in Indonesian before
// that pass use `tx('Teks Indonesia')` instead: the Indonesian source string is
// the key, so adding a translation never requires inventing a new key name and
// the diff stays local to the line being translated.
//
// `id` intentionally has no table: the source strings are already Indonesian.
// Unknown strings fall back to the source, so a missed translation is visible
// in English mode and can be found by `scripts/audit-i18n.cjs`.
const UI_TEXT = {
  en: {
    // ---- Creator: wizard ----
    'Memuat kasus...': 'Loading case...',
    'Batal': 'Cancel',
    'Informasi Kasus': 'Case Information',
    'Definisikan nama, deskripsi, tujuan, dan metode analisis untuk kasus keputusan Anda.':
      'Define the name, description, objective, and analysis method for your decision case.',
    'Nama Kasus': 'Case Name',
    'Contoh: Pemilihan Platform E-Learning': 'e.g. E-Learning Platform Selection',
    'Gunakan nama deskriptif yang jelas sehingga pakar mudah memahami konteks keputusan.':
      'Use a clear, descriptive name so experts can easily understand the decision context.',
    'Deskripsi Latar Belakang': 'Background Description',
    'Jelaskan konteks bisnis, tantangan, dan mengapa keputusan ini penting...':
      'Explain the business context, the challenge, and why this decision matters...',
    'Deskripsi membantu pakar memahami konteks penuh sebelum memberikan penilaian.':
      'The description helps experts understand the full context before giving judgments.',
    'Tujuan Pengambilan Keputusan': 'Decision Objective',
    'Apa hasil akhir yang ingin dicapai dari analisis ini?':
      'What final outcome should this analysis achieve?',
    'Tujuan yang jelas memastikan semua pihak selaras dengan hasil yang diharapkan.':
      'A clear objective keeps everyone aligned on the expected outcome.',
    'Pilih Metode Analisis': 'Choose an Analysis Method',
    'Batas Waktu Pengisian Pakar': 'Expert Submission Deadline',
    'Pakar akan menerima undangan dan deadline ini akan ditampilkan di dashboard mereka dengan jam spesifik.':
      'Experts will receive an invitation, and this deadline will appear on their dashboard with the exact time.',
    'Memilih Metode': 'Choosing a Method',
    'untuk keputusan dengan struktur hierarki yang jelas dan terpisah.':
      'for decisions with a clear, separate hierarchy.',
    'saat ada saling ketergantungan (misalnya kriteria A mempengaruhi kriteria B).':
      'when criteria depend on each other (for example, criterion A influences criterion B).',
    'ketika pakar kesulitan memberikan penilaian pasti dan perlu skala linguistik.':
      'when experts struggle to give exact values and need a linguistic scale.',
    'Jangan lupa:': "Don't forget:",
    'Definisi Hierarki': 'Hierarchy Definition',
    'Susun struktur goal → kriteria → sub-kriteria → alternatif. Visualisasi di bawah akan diperbarui secara real-time.':
      'Build the goal → criteria → sub-criteria → alternatives structure. The visualization below updates in real time.',
    'Visualisasi Hierarki Real-time': 'Real-time Hierarchy Visualization',
    'Otomatis dari nama kasus': 'Automatically from the case name',
    'KRITERIA': 'CRITERIA',
    'Tambah Kriteria': 'Add Criterion',
    'Deskripsi singkat...': 'Short description...',
    '+ sub': '+ sub',
    'ALTERNATIF': 'ALTERNATIVES',
    'Tambah Alternatif': 'Add Alternative',
    'Mode ANP terdeteksi': 'ANP mode detected',
    'Definisikan dependensi antar kriteria untuk membentuk jaringan.':
      'Define dependencies between criteria to form the network.',
    'Definisikan Dependensi': 'Define Dependencies',
    'Preview Hierarki': 'Hierarchy Preview',
    'Kriteria': 'Criteria',
    'Sub-Krit': 'Sub-criteria',
    'Alternatif': 'Alternatives',
    'Undang Pakar': 'Invite Experts',
    'Tambahkan email pakar yang akan menerima undangan untuk melakukan penilaian berpasangan. Anda dapat mengatur bobot agregasi untuk setiap pakar jika diperlukan.':
      'Add the emails of experts who will receive an invitation to complete pairwise judgments. You can set an aggregation weight for each expert if needed.',
    'Pilih Pakar dari Direktori': 'Select an Expert from the Directory',
    'Ketik nama atau email pakar…': 'Type an expert name or email…',
    'Pakar tidak ditemukan': 'No expert found',
    'Tentukan bobot agregasi per pakar': 'Set an aggregation weight per expert',
    'Pakar Baru': 'New Expert',
    'Tambah Pakar Baru': 'Add New Expert',
    'Nama Lengkap': 'Full Name',
    'Keahlian': 'Expertise',
    'Institusi': 'Institution',
    'Universitas, PT, Lembaga, dll': 'University, company, institution, etc.',
    'Tambah Pakar': 'Add Expert',
    'Pakar': 'Expert',
    'Status': 'Status',
    'Bobot': 'Weight',
    'Diundang': 'Invited',
    'baru saja': 'just now',
    'Review & Publikasi': 'Review & Publish',
    'Periksa kembali semua konfigurasi. Setelah publikasi, kasus akan dikirimkan ke semua pakar yang diundang.':
      'Review all settings. After publishing, the case will be sent to every invited expert.',
    'Ringkasan Konfigurasi': 'Configuration Summary',
    'Daftar Pakar yang Diundang': 'Invited Experts',
    'Siap untuk dipublikasikan.': 'Ready to publish.',
    'Undangan akan dikirim ke': 'Invitations will be sent to',
    'pakar dengan deadline': 'experts with a deadline of',
    '. Anda dapat memantau progress mereka di Dashboard dan melihat hasil agregasi secara real-time.':
      '. You can track their progress on the Dashboard and view aggregated results in real time.',
    'Preview Struktur Final': 'Final Structure Preview',
    'Level:': 'Level:',
    'Kompleksitas:': 'Complexity:',
    'Kolaborator:': 'Collaborators:',
    'Sebelumnya': 'Back',
    'Simpan & Publikasikan': 'Save & Publish',
    'Publikasikan ke': 'Publish to',
    'Langkah': 'Step',
    'Lanjut': 'Next',
    'Definisikan Dependensi Antar Kriteria': 'Define Dependencies Between Criteria',
    'Tutup': 'Close',
    'Simpan (': 'Save (',
    'Klik sel matriks untuk men-toggle dependensi': 'Click a matrix cell to toggle a dependency',
    'baris ➝ kolom': 'row ➝ column',
    '. Diagonal tidak diizinkan.': '. Diagonal cells are not allowed.',
    'Publikasikan Kasus ke Pakar?': 'Publish Case to Experts?',
    'Publikasikan Sekarang': 'Publish Now',
    'Kasus': 'Case',
    'akan dipublikasikan dan undangan akan dikirim ke':
      'will be published and invitations will be sent to',
    'dengan deadline': 'with a deadline of',
    'Ringkasan Publikasi:': 'Publication Summary:',
    'Setelah publikasi, Anda dapat memantau status pakar dan melihat hasil agregasi di halaman Hasil & Agregasi.':
      'After publishing, you can monitor expert status and view aggregated results on the Results & Aggregation page.',

    // ---- Creator: case detail ----
    'Kembali ke Dashboard': 'Back to Dashboard',
    'Memuat detail kasus...': 'Loading case details...',
    'Kasus tidak ditemukan': 'Case not found',
    'Objektif': 'Objective',
    'Metode': 'Method',
    'Deadline': 'Deadline',
    'Alur Kasus': 'Case Flow',
    'Siap untuk mengundang pakar?': 'Ready to invite experts?',
    'Mulai Undang Pakar': 'Start Inviting Experts',
    'Checklist Setup': 'Setup Checklist',
    '✓ Semua siap! Undang pakar untuk memulai penilaian.':
      '✓ All set! Invite experts to begin judging.',
    'Checklist Progres': 'Progress Checklist',
    '✓ Semua pakar selesai! Lihat hasil agregasi sekarang.':
      '✓ All experts are done! View the aggregated results now.',
    'Lihat Hasil': 'View Results',
    'Kasus Selesai': 'Case Completed',
    '✓ Pengambilan keputusan selesai': '✓ Decision making complete',
    'Ranking alternatif telah dikunci dan tersedia untuk export':
      'The alternative ranking is locked and ready to export',
    'Tindakan selanjutnya: Review hasil atau export keputusan':
      'Next: review the results or export the decision',
    'Export': 'Export',
    'Pakar yang Diundang (': 'Invited Experts (',
    'Lihat Hasil & Agregasi': 'View Results & Aggregation',

    // ---- Creator: results ----
    'Hasil & Agregasi': 'Results & Aggregation',
    'Error Memuat Hasil': 'Failed to Load Results',
    'Coba Lagi': 'Try Again',
    'Menunggu Penilaian Pakar': 'Waiting for Expert Judgments',
    'Hasil agregasi akan ditampilkan setelah semua pakar menyelesaikan penilaian mereka.':
      'Aggregated results will appear after all experts complete their judgments.',
    'Progress:': 'Progress:',
    'Refresh': 'Refresh',
    'Bobot Kriteria (Final)': 'Criteria Weights (Final)',
    'Peringkat Lengkap Alternatif': 'Full Alternative Ranking',
    'Hierarki + Bobot Final': 'Hierarchy + Final Weights',
    'Analisis Konsistensi (CR)': 'Consistency Analysis (CR)',
    'Distribusi CR per Level Hierarki': 'CR Distribution per Hierarchy Level',
    'CR Aktual': 'Actual CR',
    'Threshold Ideal (≤0.10)': 'Ideal Threshold (≤0.10)',
    'CR Agregat': 'Aggregate CR',
    'Panduan Saaty:': 'Saaty Guide:',
    '• CR ≤ 0.10: Konsisten ✓': '• CR ≤ 0.10: Consistent ✓',
    '• CR > 0.10: Perlu Review': '• CR > 0.10: Needs Review',
    'Konvergensi Supermatrix (ANP)': 'Supermatrix Convergence (ANP)',
    'Iterasi': 'Iterations',
    'Periode Siklus': 'Cycle Period',
    'Bobot Cluster Kriteria': 'Criteria Cluster Weights',
    'Belum ada data pakar yang tersimpan': 'No expert data saved yet',
    'Daftar Pakar yang Menyelesaikan Penilaian': 'Experts Who Completed Their Judgments',
    'CR:': 'CR:',
    'CR per level': 'CR per level',
    'Bobot Kriteria Agregasi': 'Aggregated Criteria Weights',
    'Bobot Kriteria per Pakar': 'Criteria Weights per Expert',
    'Agregasi': 'Aggregate',
    'Heatmap Konsistensi (CR per Pakar)': 'Consistency Heatmap (CR per Expert)',
    'Bobot Pakar vs Bobot Agregasi': 'Expert Weights vs Aggregated Weights',
    'Garis diagonal = kesesuaian sempurna': 'Diagonal line = perfect agreement',
    'Sensitivitas Terdeteksi': 'Sensitivity Detected',
    'Perubahan bobot menyebabkan': 'Weight changes cause',
    'alternatif bergeser posisi. Lihat perbandingan di bawah untuk detail perubahan.':
      'alternatives to shift position. See the comparison below for details.',
    'Atur Bobot Kriteria': 'Adjust Criteria Weights',
    'Reset ke Agregasi': 'Reset to Aggregate',
    'basis:': 'basis:',
    'Tip:': 'Tip:',
    'Geser bobot untuk melihat bagaimana ranking berubah secara real-time. Bobot dinormalisasi otomatis.':
      'Drag the weights to see how the ranking changes in real time. Weights are normalized automatically.',
    'Ranking Real-time (Saat Ini)': 'Real-time Ranking (Current)',
    'Perubahan bobot menyebabkan pergeseran ranking — keputusan ini sensitif terhadap bobot kriteria.':
      'Weight changes shift the ranking — this decision is sensitive to criteria weights.',
    'Ranking Dasar (Agregasi)': 'Baseline Ranking (Aggregate)',
    'Ranking Baru (Dengan Penyesuaian)': 'New Ranking (Adjusted)',

    // ---- Creator: divergence tab ----
    'Belum ada data divergensi expert tersedia': 'No expert divergence data available yet',
    'Status Konsistensi Pakar': 'Expert Consistency Status',
    'Analisis Divergensi per Kriteria': 'Divergence Analysis per Criterion',
    'Mean:': 'Mean:',
    'Std Dev:': 'Std Dev:',
    'Min:': 'Min:',
    'Max:': 'Max:',
    'Divergensi': 'Divergence',
    'Matrix Bobot Kriteria per Pakar': 'Criteria Weight Matrix per Expert',
    'Merah = Outlier': 'Red = Outlier',
    'Sel berwarna merah menunjukkan pakar yang nilainya >1 std dev dari rata-rata':
      'Red cells mark experts whose value is more than 1 standard deviation from the mean',
    '✓ Total pakar:': '✓ Total experts:',
    '✓ Pakar dengan CR konsisten (≤0.10):': '✓ Experts with consistent CR (≤0.10):',
    '⚠️ Kriteria dengan divergensi tinggi:': '⚠️ Criteria with high divergence:',
    'Rekomendasi:': 'Recommendation:',
    'pakar@institusi.ac.id': 'expert@institution.edu',
    'Akademisi SI, Praktisi, dll': 'IS academic, practitioner, etc.',

    // ---- Wizard: steps, validation, toasts ----
    'Metode & deadline': 'Method & deadline',
    'Elemen / Faktor': 'Elements / Factors',
    'Elemen · relasi kontekstual': 'Elements · contextual relation',
    'Hierarki': 'Hierarchy',
    'Goal · kriteria · alternatif': 'Goal · criteria · alternatives',
    'Email & bobot agregasi': 'Email & aggregation weight',
    'Periksa kembali': 'Review',
    'Ringkasan Agregasi': 'Aggregation Summary',
    'Analisis Divergensi': 'Divergence Analysis',
    'Perbandingan Pakar': 'Expert Comparison',
    'Kasus Tanpa Nama': 'Untitled Case',
    'Wajib diisi': 'Required',
    'Minimal 3 karakter': 'At least 3 characters',
    'Harus tanggal di masa depan': 'Must be a future date',
    'Email tidak valid': 'Invalid email',
    'Minimal 3 elemen': 'At least 3 elements',
    'Minimal 2 kriteria': 'At least 2 criteria',
    'Minimal 2 alternatif': 'At least 2 alternatives',
    'Minimal 1 pakar': 'At least 1 expert',
    'Nama kasus wajib diisi': 'Case name is required',
    'Deadline wajib diisi': 'Deadline is required',
    'Relasi kontekstual wajib diisi': 'Contextual relation is required',
    'Gagal memuat kasus': 'Failed to load case',
    'Gagal menyimpan draft': 'Failed to save draft',
    'Perubahan disimpan & kasus dipublikasikan!': 'Changes saved & case published!',
    'Perubahan tersimpan': 'Changes saved',
    'Draft tersimpan': 'Draft saved',
    'Gagal menyimpan': 'Failed to save',
    'Nama kasus valid': 'Case name is valid',
    'Deadline valid': 'Deadline is valid',
    'Elemen Baru': 'New Element',
    'Kriteria Baru': 'New Criterion',
    'Alternatif Baru': 'New Alternative',
    'Minimal 3 dan maksimal': 'At least 3 and at most',
    'Minimal 2 kriteria dan 2 alternatif diperlukan untuk analisis.':
      'At least 2 criteria and 2 alternatives are required for analysis.',
    'Daftar Elemen': 'Element List',
    'Daftar Kriteria & Sub-Kriteria': 'Criteria & Sub-criteria List',
    'Total Pakar': 'Total Experts',
    'bobot': 'weight',
    'Kasus berhasil dipublikasikan ke': 'Case published successfully to',
    'pakar!': 'experts!',
    'Kasus dipublikasikan. Undangan untuk pakar': 'Case published. Invitations for experts',
    'gagal karena email tidak terdaftar.': 'failed because the email is not registered.',
    'Kasus dipublikasikan dengan beberapa kegagalan undangan.':
      'Case published with some invitation failures.',
    'Kasus berhasil dipublikasikan!': 'Case published successfully!',
    'Gagal menyimpan kasus': 'Failed to save case',
    'Detail:': 'Details:',
    '⚠️ Deadline Sudah Lewat': '⚠️ Deadline Has Passed',
    'jam lalu. Secepatnya selesaikan penilaian pakar.':
      'hours ago. Complete the expert judgments as soon as possible.',
    'jam tersisa. Pastikan semua pakar telah menyelesaikan penilaian.':
      'hours left. Make sure all experts have completed their judgments.',
    'Goal, Kriteria, Alternatif': 'Goal, Criteria, Alternatives',
    'Pakar isi penilaian': 'Experts submit judgments',
    'Kriteria ditambahkan (2+)': 'Criteria added (2+)',
    'Alternatif ditambahkan (2+)': 'Alternatives added (2+)',
    'Pakar diundang': 'Experts invited',
    'pakar selesai': 'experts completed',
    'Semua CR acceptable': 'All CR acceptable',
    'Tunggu semua pakar menyelesaikan penilaian': 'Wait for all experts to complete their judgments',
    'Pakar Tanpa Nama': 'Unnamed Expert',
    'Tidak ada email': 'No email',
    'Bobot per Pakar': 'Weight per Expert',
    'Bobot Agregasi': 'Aggregate Weight',
    'PDF library tidak tersedia': 'PDF library unavailable',
    'Hasil Agregasi': 'Aggregation Results',
    'Gagal mengekspor PDF': 'Failed to export PDF',
    'Gagal mengekspor JSON': 'Failed to export JSON',
    'RINGKASAN HASIL AGREGASI': 'AGGREGATION RESULTS SUMMARY',
    'Kasus:': 'Case:',
    'Metode:': 'Method:',
    'Alternatif:': 'Alternatives:',
    'BOBOT KRITERIA AKHIR': 'FINAL CRITERIA WEIGHTS',
    'PERINGKAT ALTERNATIF': 'ALTERNATIVE RANKING',
    'Gagal mengekspor Excel:': 'Failed to export Excel:',
    'Ranking Alternatif:': 'Alternative Ranking:',
    'Gagal mengekspor PNG:': 'Failed to export PNG:',
    'Ringkasan eksekutif + detail bobot, hierarki, & sensitivity (12 hal)':
      'Executive summary + weight, hierarchy & sensitivity details (12 pages)',
    'Matriks per pakar, bobot lokal/global, CR — siap di-replikasi':
      'Per-expert matrices, local/global weights, CR — ready to replicate',
    'Diagram pohon transparan, 1920×1080, untuk slide':
      'Transparent tree diagram, 1920×1080, for slides',
    'Seluruh konfigurasi & hasil — untuk dijalankan ulang di tools lain':
      'Full configuration & results — to rerun in other tools',
    'Unduh': 'Download',
    'Konsensus pakar cukup baik': 'Expert consensus is reasonably good',
    'Pertimbangkan diskusi dengan pakar untuk kriteria yang divergen':
      'Consider discussing divergent criteria with the experts',
    'Tanggal Export:': 'Export Date:',

    // ---- Expert: judgment fill ----
    '(antara)': '(between)',
    '💡 Tips:': '💡 Tips:',
    '• Gunakan nilai 2, 4, 6, 8 untuk skala antara':
      '• Use 2, 4, 6, 8 for intermediate scale values',
    '• Gunakan nilai resiprok (1/x) jika baris kurang penting':
      '• Use reciprocal values (1/x) when the row is less important',
    '• Ingat: konsistensi lebih penting dari presisi':
      '• Remember: consistency matters more than precision',
    'Navigasi Level': 'Level Navigation',
    'Goal vs Kriteria': 'Goal vs Criteria',
    'Tahap Penilaian': 'Judgment Stage',
    'Bandingkan pengaruh tiap pasangan kriteria terhadap':
      'Compare the influence of each criterion pair on',
    'Bandingkan tiap pasangan': 'Compare each pair of',
    'relatif terhadap': 'relative to',
    'Petunjuk Fuzzy:': 'Fuzzy Guide:',
    'Atur tiga nilai (lower, mode, upper) untuk menangkap ketidakpastian Anda.':
      'Set three values (lower, mode, upper) to capture your uncertainty.',
    'Lower (L)': 'Lower (L)',
    ': Nilai minimum (paling pesimis)': ': Minimum value (most pessimistic)',
    'Mode (M)': 'Mode (M)',
    ': Nilai yang paling mungkin (penilaian utama Anda)':
      ': Most likely value (your main judgment)',
    'Upper (U)': 'Upper (U)',
    ': Nilai maksimum (paling optimis)': ': Maximum value (most optimistic)',
    'Pastikan L ≤ M ≤ U. Nilai reciprocal di bawah diagonal otomatis terisi.':
      'Ensure L ≤ M ≤ U. Reciprocal values below the diagonal are filled automatically.',
    'geser slider ke kanan jika item baris lebih dominan, ke kiri jika kolom lebih dominan. Sel diagonal otomatis bernilai 1; nilai di bawah diagonal otomatis terisi sebagai 1/x. Sistem memvalidasi konsistensi setelah seluruh sel terisi.':
      'drag the slider right if the row item is more dominant, left if the column item is more dominant. Diagonal cells are automatically 1; cells below the diagonal are filled as 1/x. The system validates consistency once all cells are filled.',
    'Petunjuk Saaty:': 'Saaty Guide:',
    'Level sebelumnya': 'Previous level',
    'Batalkan perubahan terakhir (Ctrl+Z)': 'Undo the last change (Ctrl+Z)',
    'Batalkan': 'Undo',
    'Simpan': 'Save',
    'Selesai & Kirim': 'Finish & Submit',
    'Simpan & Lanjut': 'Save & Next',
    'Bobot Lokal (Real-time)': 'Local Weights (Real-time)',
    'Lengkapi seluruh sel untuk melihat bobot lokal.':
      'Fill in all cells to see local weights.',
    'Konsistensi & CR': 'Consistency & CR',
    'CR hanya berlaku untuk 3+ item. Level ini hanya memiliki':
      'CR applies only to 3+ items. This level has only',
    'item.': 'items.',
    'Petunjuk': 'Guide',
    'CR ≤ 0.10 — OK': 'CR ≤ 0.10 — OK',
    '0.10 < CR ≤ 0.15 — Review': '0.10 < CR ≤ 0.15 — Review',
    'CR > 0.15 — Perbaiki': 'CR > 0.15 — Fix',
    'Lengkapi semua sel untuk melihat CR.': 'Fill in all cells to see CR.',
    'Catatan Pribadi': 'Personal Notes',
    'Tuliskan catatan atau asumsi...': 'Write notes or assumptions...',
    'Kirim Penilaian Anda?': 'Submit Your Judgment?',
    'Tinjau Lagi': 'Review Again',
    'Ya, Kirim': 'Yes, Submit',
    'Setelah dikirim, penilaian Anda akan dikunci dan dikirim ke pembuat kasus untuk diagregasi. Anda tetap dapat melihat hasil agregasi setelah seluruh pakar selesai.':
      'After submission, your judgment is locked and sent to the case creator for aggregation. You can still view the aggregated results once all experts are done.',
    'Total perbandingan': 'Total comparisons',
    'Estimasi CR keseluruhan': 'Estimated overall CR',
    'Waktu pengisian': 'Fill time',
    'Skala Saaty 1–9': 'Saaty Scale 1–9',
    'arahkan ke item untuk contoh': 'hover an item for an example',

    // ---- ISM views ----
    'Kembali': 'Back',
    'Matriks SSIM': 'SSIM Matrix',
    'Relasi antar elemen': 'Relations between elements',
    'Untuk tiap pasangan, pilih simbol yang menggambarkan apakah elemen baris':
      'For each pair, choose the symbol describing whether the row element',
    'elemen kolom.': 'the column element.',
    'Penilaian sudah dikirim dan dikunci.': 'Judgment submitted and locked.',
    'Memuat penilaian...': 'Loading judgments...',
    'Simpan Draf': 'Save Draft',
    'Sel terisi': 'Filled cells',
    'Sel kosong': 'Empty cells',
    'Lengkapi semua sel sebelum mengirim.': 'Complete all cells before submitting.',
    'Digraf hierarki ISM': 'ISM hierarchy digraph',
    'Daftar elemen yang akan dipetakan hubungannya oleh pakar (minimal 3, maksimal':
      'List of elements whose relationships experts will map (minimum 3, maximum',
    'Relasi kontekstual': 'Contextual relation',
    'Skor kesepakatan': 'Agreement score',
    'sel reachability yang disepakati semua pakar':
      'reachability cells agreed by all experts',
    'sudah submit': 'submitted',
    'elemen ·': 'elements ·',
    'Aturan seri:': 'Tie rule:',
    'sel dengan suara tepat 50% dianggap tidak berhubungan (0).':
      'cells with exactly 50% votes are treated as unrelated (0).',
    'Ditemukan': 'Found',
    'sel seri:': 'tie cells:',
    'Level 1 di atas (paling dipengaruhi). Panah: elemen asal':
      'Level 1 at the top (most influenced). Arrows: source element',
    'elemen tujuan.': 'target element.',
    'Partisi level': 'Level partition',
    'Elemen': 'Element',
    '= relasi hasil transitivitas.': '= transitive closure relations.',
    'SSIM konsensus': 'Consensus SSIM',
    'Kesesuaian pakar terhadap konsensus': 'Expert agreement with consensus',
    'ELEMEN': 'ELEMENTS',
    'Batas =': 'Boundary =',
    'Kuadran': 'Quadrant',
    'Tambah Elemen': 'Add Element',
    'di batas': 'on the boundary',
    'Belum ada pakar yang submit': 'No experts have submitted yet',
    'Hasil ISM dihitung dari penilaian pakar yang sudah dikirim (':
      'ISM results are computed from submitted expert judgments (',
    'pakar).': 'experts).',
    'Deskripsi (opsional)...': 'Description (optional)...',

    // ---- Tutorial page chrome ----
    'Keluar': 'Sign out',
    'Panduan Penggunaan': 'User Guide',
    'Pelajari cara menggunakan setiap metode': 'Learn how to use each method',

    // ---- Expert tutorials: AHP ----
    'Apa itu AHP?': 'What is AHP?',
    'AHP membandingkan dua item sekaligus pakai skala 1-9 untuk tentukan mana lebih penting. Fokus satu perbandingan di satu waktu membuat penilaian lebih akurat.':
      'AHP compares two items at a time on a 1–9 scale to determine which is more important. Focusing on one comparison at a time makes judgments more accurate.',
    'Skala 1-9:': '1–9 Scale:',
    '1=sama penting, 3=sedikit lebih penting, 5=lebih penting, 7=sangat penting, 9=mutlak penting':
      '1=equal importance, 3=slightly more important, 5=more important, 7=strongly important, 9=absolutely important',
    'Cara Mengisi': 'How to Fill In',
    'Baca pertanyaan: "Item A vs B, mana lebih penting?"':
      'Read the question: "Item A vs B, which is more important?"',
    'Tentukan yang lebih penting dan intensitasnya (1-9)':
      'Decide which is more important and its intensity (1–9)',
    'Geser slider sesuai nilai pilihan Anda': 'Drag the slider to your chosen value',
    'Lanjut ke perbandingan berikutnya': 'Move on to the next comparison',
    'Periksa CR (Consistency Ratio) real-time': 'Check the CR (Consistency Ratio) in real time',
    'Klik Submit setelah semua selesai dan CR baik':
      'Click Submit once everything is complete and CR is good',
    'Tips:': 'Tips:',
    'Konsisten dalam penilaian. Jika A > B dan B > C, maka A > C. Kalau tidak, CR akan tinggi.':
      'Be consistent. If A > B and B > C, then A > C. Otherwise CR will be high.',
    'CR mengukur konsistensi penilaian Anda. Semakin kecil CR, semakin konsisten. Sistem hitung CR real-time saat Anda isi.':
      'CR measures how consistent your judgments are. The smaller the CR, the more consistent you are. The system computes CR in real time as you fill in.',
    'Sempurna': 'Perfect',
    'Boleh lanjut': 'Acceptable',
    'Perlu diperbaiki': 'Needs fixing',
    'Contoh: Memilih Varietas Padi': 'Example: Choosing a Rice Variety',
    'Petani ingin pilih varietas padi terbaik. Ada 3 pilihan varietas. Pakar harus bandingkan berdasarkan: Hasil Panen, Tahan Hama, Harga Benih. Pakar bandingkan dua-dua: "Hasil Panen vs Tahan Hama?" Jawab nilai 5 (Hasil Panen lebih penting). Lalu "Tahan Hama vs Harga Benih?" Sistem hitung bobot setiap kriteria, lalu ranking varietas. Hasilnya: Varietas A 45%, B 35%, C 20%. Petani pilih Varietas A.':
      'A farmer wants to choose the best rice variety. There are 3 options. Experts compare them on: Yield, Pest Resistance, Seed Price. Experts compare them pairwise: "Yield vs Pest Resistance?" Answer 5 (Yield is more important). Then "Pest Resistance vs Seed Price?" The system computes each criterion\'s weight, then ranks the varieties. Result: Variety A 45%, B 35%, C 20%. The farmer picks Variety A.',

    // ---- Expert tutorials: Fuzzy AHP ----
    'Apa itu Fuzzy AHP?': 'What is Fuzzy AHP?',
    'Seperti AHP tapi Anda kasih RENTANG nilai (L,M,U) alih-alih satu nilai pasti. Cocok ketika tidak 100% yakin dengan penilaian.':
      'Like AHP, but you give a RANGE of values (L, M, U) instead of one exact value. Suited to cases where you are not 100% sure of your judgment.',
    'L=Lower (pesimis), M=Mode (normal), U=Upper (optimis)':
      'L=Lower (pessimistic), M=Mode (normal), U=Upper (optimistic)',
    'Contoh: L=2, M=5, U=8 berarti "antara 2-8, tapi saya pikir 5"':
      'Example: L=2, M=5, U=8 means "between 2–8, but I think 5"',
    'Tentukan nilai TERENDAH (L) yang masuk akal': 'Set the LOWEST reasonable value (L)',
    'Tentukan nilai TERTINGGI (U) yang masuk akal': 'Set the HIGHEST reasonable value (U)',
    'Tentukan nilai PALING MUNGKIN (M) — harus antara L dan U':
      'Set the MOST LIKELY value (M) — it must be between L and U',
    'Rentang sempit = yakin; rentang lebar = kurang yakin':
      'Narrow range = confident; wide range = less confident',
    'Submit setelah semua terisi': 'Submit once everything is filled in',
    'Contoh: Memilih Jenis Pupuk': 'Example: Choosing a Fertilizer Type',
    'Petani mau pilih pupuk: Organik, Kimia, Campuran. Pakar tidak 100% yakin dengan nilai pasti (pasar berfluktuasi). Pakar bandingkan Organik vs Kimia: "Mana lebih penting untuk hasil jangka panjang?" Isi rentang L=2, M=5, U=8 (tidak pasti antara 2-8, tapi pikir 5). Sistem calculate dengan fuzzy logic. Hasil bukan satu nilai tapi range: Organik 25-35%, Kimia 30-40%, Campuran 28-40%. Petani tahu ada ketidakpastian dan bisa plan dengan lebih flexible.':
      'A farmer wants to choose a fertilizer: Organic, Chemical, Mixed. Experts are not 100% sure of exact values (the market fluctuates). Experts compare Organic vs Chemical: "Which is more important for long-term yield?" They enter the range L=2, M=5, U=8 (uncertain between 2–8, but think 5). The system calculates with fuzzy logic. The result is not one value but a range: Organic 25–35%, Chemical 30–40%, Mixed 28–40%. The farmer knows there is uncertainty and can plan more flexibly.',

    // ---- Expert tutorials: ANP ----
    'Apa itu ANP?': 'What is ANP?',
    'Seperti AHP, tapi MENANGANI DEPENDENSI antar kriteria. Kriteria bisa saling mempengaruhi. Hasil lebih akurat untuk keputusan kompleks.':
      'Like AHP, but it HANDLES DEPENDENCIES between criteria. Criteria can influence each other. Results are more accurate for complex decisions.',
    'Contoh dependensi:': 'Dependency example:',
    'Biaya pupuk mempengaruhi Hasil Panen (biaya tinggi = biasanya kualitas lebih baik = hasil lebih tinggi)':
      'Fertilizer cost influences Yield (higher cost = usually better quality = higher yield)',
    'SAMA SEPERTI AHP — bandingkan dua item dengan skala 1-9. Perbedaannya: Sistem otomatis hitung network effect dari dependensi kriteria.':
      'SAME AS AHP — compare two items on a 1–9 scale. The difference: the system automatically computes network effects from criteria dependencies.',
    'Hasil bisa berbeda dari AHP': 'Results can differ from AHP',
    'karena mempertimbangkan dependensi antar kriteria.':
      'because it accounts for dependencies between criteria.',
    'Contoh: Memilih Sistem Irigasi': 'Example: Choosing an Irrigation System',
    'Petani mau pilih sistem irigasi: Drip, Sprinkler, Flood. Dependensi: Biaya Awal mempengaruhi Efisiensi Air (sistem mahal biasanya lebih efisien). Efisiensi mempengaruhi Hasil Panen. Pakar bandingkan pakai AHP style (1-9), tapi sistem calculate ANP dengan network effect. Hasilnya bisa berbeda: ANP mungkin pilih Drip (mahal tapi efisien → hasil tinggi), sedangkan AHP mungkin pilih Flood (murah). ANP lebih akurat untuk keputusan jangka panjang.':
      'A farmer wants to choose an irrigation system: Drip, Sprinkler, Flood. Dependencies: Initial Cost influences Water Efficiency (expensive systems are usually more efficient). Efficiency influences Yield. Experts compare using the AHP style (1–9), but the system calculates ANP with network effects. Results can differ: ANP might pick Drip (expensive but efficient → high yield), while AHP might pick Flood (cheap). ANP is more accurate for long-term decisions.',

    // ---- Expert tutorials: Fuzzy ANP ----
    'Apa itu Fuzzy ANP?': 'What is Fuzzy ANP?',
    'Kombinasi PALING LENGKAP: Anda kasih RENTANG nilai (Fuzzy) DENGAN mempertimbangkan DEPENDENSI (Network). Paling akurat tapi juga butuh pikiran paling matang.':
      'The MOST COMPLETE combination: you give a RANGE of values (Fuzzy) WHILE accounting for DEPENDENCIES (Network). Most accurate, but it demands the most mature thinking.',
    'Isi rentang L, M, U untuk setiap perbandingan (seperti Fuzzy AHP). Sistem otomatis hitung dengan fuzzy logic PLUS network effect dependensi.':
      'Enter the L, M, U range for each comparison (like Fuzzy AHP). The system automatically calculates with fuzzy logic PLUS dependency network effects.',
    'Catatan:': 'Note:',
    'Gunakan HANYA untuk keputusan SANGAT penting. Untuk keputusan sederhana, AHP saja sudah cukup.':
      'Use ONLY for VERY important decisions. For simple decisions, AHP alone is enough.',
    'Contoh: Investasi Agribisnis (Besar)': 'Example: Agribusiness Investment (Large)',
    'Investor besar mau invest di agribisnis: Padi, Sayuran, Ternak. Investasi miliaran rupiah. Ada ketidakpastian market & dependensi kompleks: Harga berfluktuasi, Supply chain mempengaruhi Profit, Risiko berpengaruh Return. Pakar isi rentang L,M,U untuk setiap penilaian (karena uncertain). Sistem calculate dengan fuzzy logic + network effect. Hasil: bukan satu number tapi range dengan uncertainty. Investor tahu risk-return profile dan bisa decide lebih informed.':
      'A large investor wants to invest in agribusiness: Rice, Vegetables, Livestock. The investment is in billions of rupiah. There is market uncertainty and complex dependencies: Prices fluctuate, the supply chain influences Profit, Risk influences Return. Experts enter L, M, U ranges for each judgment (because of uncertainty). The system calculates with fuzzy logic + network effects. The result is not one number but a range with uncertainty. The investor understands the risk-return profile and can decide more confidently.',

    // ---- Creator tutorials: AHP ----
    'Kapan Gunakan AHP?': 'When to Use AHP?',
    '✓ Kriteria independen (tidak saling pengaruh)': '✓ Criteria are independent (no mutual influence)',
    '✓ Keputusan sederhana sampai menengah': '✓ Simple to medium decisions',
    '✓ Pakar yakin dengan penilaian': '✓ Experts are confident in their judgments',
    '✓ Waktu terbatas': '✓ Limited time',
    'Setup Kasus AHP': 'Setting Up an AHP Case',
    '1. Struktur:': '1. Structure:',
    'Goal → Kriteria (3-7) → Alternatif (2-5)': 'Goal → Criteria (3–7) → Alternatives (2–5)',
    '2. Pakar:': '2. Experts:',
    'Minimal 2, maksimal 8. Pilih yang sungguh expert.':
      'Minimum 2, maximum 8. Choose genuine experts.',
    '3. Deadline:': '3. Deadline:',
    '1-2 minggu biar pakar berpikir tenang.': '1–2 weeks so experts can think calmly.',
    '4. Instruksi:': '4. Instructions:',
    'Jelaskan skala 1-9 dengan contoh konkret.': 'Explain the 1–9 scale with concrete examples.',
    'Interpretasi Hasil': 'Interpreting Results',
    'Ranking:': 'Ranking:',
    'Urutan alternatif dari tertinggi ke terendah.': 'Alternatives ordered from highest to lowest.',
    'Bobot Kriteria:': 'Criteria Weights:',
    'Persentase kepentingan setiap kriteria.': 'The importance percentage of each criterion.',
    'CR Agregasi:': 'Aggregate CR:',
    'Rata-rata konsistensi pakar. ≤0.10 baik, >0.15 minta revisi.':
      'Average expert consistency. ≤0.10 is good, >0.15 needs revision.',
    'Contoh Kasus: Memilih Supplier Benih Padi': 'Case Example: Choosing a Rice Seed Supplier',
    'Koperasi pertanian ingin pilih supplier benih padi terbaik. Ada 3 supplier kandidat. Kriteria yang penting: Harga Benih, Kualitas Benih, Layanan Purna Jual. Undang 2-3 pakar (ketua koperasi, petani senior, agronomist). Pakar bandingkan dua-dua pakai skala 1-9. Hasilnya: Supplier A ranking 1 (45%), B ranking 2 (35%), C ranking 3 (20%). Bobot kriteria: Harga (25%), Kualitas (50%), Layanan (25%). Keputusan: Pilih Supplier A, atau negosiasi harga dengan B jika ingin kualitas lebih tinggi.':
      'An agricultural cooperative wants to choose the best rice seed supplier. There are 3 candidate suppliers. Important criteria: Seed Price, Seed Quality, After-Sales Service. Invite 2–3 experts (cooperative chair, senior farmer, agronomist). Experts compare pairwise on a 1–9 scale. Result: Supplier A rank 1 (45%), B rank 2 (35%), C rank 3 (20%). Criteria weights: Price (25%), Quality (50%), Service (25%). Decision: choose Supplier A, or negotiate price with B if higher quality is desired.',

    // ---- Creator tutorials: Fuzzy AHP ----
    'Kapan Gunakan Fuzzy AHP?': 'When to Use Fuzzy AHP?',
    '✓ Ada ketidakpastian dalam penilaian': '✓ There is uncertainty in the judgments',
    '✓ Pakar sulit kasih nilai pasti': '✓ Experts find it hard to give exact values',
    '✓ Ingin capture variabilitas/uncertainty': '✓ You want to capture variability/uncertainty',
    '✓ Pakar punya waktu cukup (30-40 menit)': '✓ Experts have enough time (30–40 minutes)',
    'Setup Kasus Fuzzy AHP': 'Setting Up a Fuzzy AHP Case',
    '1. Brief Pakar:': '1. Brief the Experts:',
    'Jelaskan L,M,U dengan contoh konkret.': 'Explain L, M, U with concrete examples.',
    '2. Pre-Example:': '2. Pre-Example:',
    'Tunjukkan satu contoh perbandingan lengkap dulu.':
      'Show one complete comparison example first.',
    '3. Waktu:': '3. Time:',
    'Alokasikan 30-40 menit per pakar.': 'Allocate 30–40 minutes per expert.',
    '4. Guidance:': '4. Guidance:',
    'Rentang sempit = yakin, lebar = kurang yakin.':
      'Narrow range = confident, wide = less confident.',
    'Contoh Kasus: Evaluasi Varietas Cabai': 'Case Example: Evaluating Chili Varieties',
    'Petani mau pilih varietas cabai terbaik tapi uncertain dengan market (harga berfluktuasi). Ada 3 varietas: Lokal, Import A, Import B. Kriteria: Hasil Panen, Harga Jual, Tahan Hama, Durasi Panen. Pakar tidak 100% yakin dengan nilai pasti jadi kasih rentang. Contoh: "Hasil Panen vs Harga Jual?" Jawab L=2, M=4, U=6 (tidak pasti antara 2-6, pikir 4). Sistem calculate fuzzy logic. Hasil bukan persentase pasti tapi range (misal: Import A 28-38%, Import B 30-42%, Lokal 25-35%). Petani tahu ada uncertainty dan decide dengan lebih hati-hati.':
      'A farmer wants to choose the best chili variety but is uncertain about the market (prices fluctuate). There are 3 varieties: Local, Import A, Import B. Criteria: Yield, Selling Price, Pest Resistance, Harvest Duration. Experts are not 100% sure of exact values, so they give ranges. Example: "Yield vs Selling Price?" Answer L=2, M=4, U=6 (uncertain between 2–6, think 4). The system calculates with fuzzy logic. The result is not an exact percentage but a range (e.g. Import A 28–38%, Import B 30–42%, Local 25–35%). The farmer knows there is uncertainty and decides more carefully.',

    // ---- Creator tutorials: ANP ----
    'Kapan Gunakan ANP?': 'When to Use ANP?',
    '✓ Ada dependensi antar kriteria': '✓ There are dependencies between criteria',
    '✓ Keputusan kompleks': '✓ Complex decisions',
    '✓ Pakar expert di bidangnya': '✓ Experts are specialists in the field',
    '✓ Ingin hasil comprehensive': '✓ You want comprehensive results',
    'Setup Kasus ANP': 'Setting Up an ANP Case',
    '1. Define Dependensi:': '1. Define Dependencies:',
    'Tentukan kriteria mana saling mempengaruhi.': 'Determine which criteria influence each other.',
    '2. Dokumentasikan KENAPA:': '2. Document WHY:',
    'Jelaskan logika setiap dependensi.': 'Explain the logic behind each dependency.',
    '3. Brief Pakar:': '3. Brief the Experts:',
    'Jelaskan network & cara fillnya (input tetap 1-9).':
      'Explain the network and how to fill it (input remains 1–9).',
    '4. Jangan Overdo:': "4. Don't Overdo It:",
    'Maksimal 3-4 dependensi utama saja.': 'Keep it to 3–4 main dependencies at most.',
    'Contoh Kasus: Memilih Sistem Pertanian': 'Case Example: Choosing a Farming System',
    'Petani mau pilih sistem: Konvensional, Organik, Precision Farming. Dependensi ada: Biaya Awal mempengaruhi Hasil Panen (investasi tinggi biasanya hasil lebih baik). Hasil mempengaruhi ROI. Pakar bandingkan pakai AHP style (1-9), tapi sistem calculate ANP. Hasilnya beda: ANP mungkin pilih Precision (investasi tinggi tapi ROI bagus jangka panjang), sedangkan AHP mungkin pilih Konvensional (investasi rendah). ANP lebih akurat untuk decision kompleks dengan dependensi.':
      'A farmer wants to choose a system: Conventional, Organic, Precision Farming. There are dependencies: Initial Cost influences Yield (higher investment usually means better yield). Yield influences ROI. Experts compare using the AHP style (1–9), but the system calculates ANP. Results differ: ANP might pick Precision (high investment but good long-term ROI), while AHP might pick Conventional (low investment). ANP is more accurate for complex decisions with dependencies.',

    // ---- Creator tutorials: Fuzzy ANP ----
    'Kapan Gunakan Fuzzy ANP?': 'When to Use Fuzzy ANP?',
    '✓ Keputusan SANGAT penting (nilai tinggi)': '✓ VERY important decisions (high stakes)',
    '✓ Ada KEDUA: uncertainty & dependensi': '✓ BOTH uncertainty & dependencies exist',
    '✓ Pakar senior tersedia': '✓ Senior experts are available',
    'Setup Kasus Fuzzy ANP': 'Setting Up a Fuzzy ANP Case',
    '1. Combine Semua:': '1. Combine Everything:',
    'Define dependensi + brief fuzzy L,M,U.': 'Define dependencies + brief fuzzy L, M, U.',
    '2. Pakar Senior:': '2. Senior Experts:',
    'Gunakan 2-4 pakar sungguh expert.': 'Use 2–4 genuine experts.',
    '3. Alokasi Waktu:': '3. Time Allocation:',
    '40+ menit per pakar.': '40+ minutes per expert.',
    '4. Pre-Meeting:': '4. Pre-Meeting:',
    'Diskusi penjelasan dependensi & konsep fuzzy dulu.':
      'Discuss the dependencies and fuzzy concepts first.',
    'Contoh Kasus: Investasi Agribisnis Besar (Miliaran)':
      'Case Example: Large Agribusiness Investment (Billions)',
    'Investor besar invest di agroindustri: Pabrik Pupuk, Peternakan Sapi, Perkebunan Sawit. Investasi miliaran rupiah. Ada uncertainty tinggi (pasar volatile, policy bisa berubah). Ada dependensi kompleks: Harga Input mempengaruhi Margin Profit, Supply Chain mempengaruhi Efficiency, Market Demand mempengaruhi Revenue. Pakar isi rentang L,M,U untuk setiap penilaian. Sistem calculate fuzzy logic + network effect. Hasil: range score dengan uncertainty level. Investor tahu risk-return profile jelas dan bisa negotiate dengan investor lain atau bank lebih confident.':
      'A large investor invests in agro-industry: Fertilizer Plant, Cattle Farm, Oil Palm Plantation. The investment is in billions of rupiah. There is high uncertainty (volatile markets, policy can change). There are complex dependencies: Input Prices influence Profit Margin, the Supply Chain influences Efficiency, Market Demand influences Revenue. Experts enter L, M, U ranges for each judgment. The system calculates fuzzy logic + network effects. Result: a score range with an uncertainty level. The investor understands the risk-return profile clearly and can negotiate with other investors or banks more confidently.',

    // ---- Remaining screen copy ----
    'Menyimpan...': 'Saving...',
    'Edit Kasus': 'Edit Case',
    'Kasus Baru': 'New Case',
    'Buat Kasus Baru': 'Create New Case',
    'pakar': 'experts',
    'elemen': 'elements',
    'kriteria': 'criteria',
    'alternatif': 'alternatives',
    'dari': 'of',
    'Goal didefinisikan': 'Goal defined',
    'Respons diterima': 'Response received',
    'Kasus tidak dipilih. Silakan buka hasil dari dashboard.':
      'No case selected. Please open the results from the dashboard.',
    'Gagal memuat hasil': 'Failed to load results',
    'Ringkasan': 'Summary',
    'Divergensi Pakar': 'Expert Divergence',
    'Data Pakar': 'Expert Data',
    'Analisis Sensitivitas': 'Sensitivity Analysis',
    'Ekspor': 'Export',
    '✓ Konsisten (≤ 0.10)': '✓ Consistent (≤ 0.10)',
    '✗ Inkonsisten (> 0.10)': '✗ Inconsistent (> 0.10)',
    '✓ Konsisten': '✓ Consistent',
    '✗ Tidak Konsisten': '✗ Inconsistent',
    'Selesai': 'Completed',
    'Menunggu': 'Waiting',
    'Gagal mengekspor Excel: ': 'Failed to export Excel: ',
    'Gagal mengekspor PNG: ': 'Failed to export PNG: ',
    'Sub-Kriteria': 'Sub-Criteria',
    'Penilaian disimpan': 'Judgment saved',
    'Tersimpan di browser, tetapi gagal disimpan ke server':
      'Saved in the browser, but failed to save to the server',
    'Gagal menyimpan penilaian': 'Failed to save judgment',
    'Gagal menyimpan level ': 'Failed to save level ',
    'Penilaian berhasil dikirim. Terima kasih, Pakar!':
      'Judgment submitted successfully. Thank you, Expert!',
    'Gagal mengirim penilaian: ': 'Failed to submit judgment: ',
    'Laptop jauh lebih cepat dari kalkulator': 'A laptop is far faster than a calculator',
    'Cloud lebih aman dari lokal storage': 'The cloud is safer than local storage',
    'Framework lebih efisien dari koding manual': 'A framework is more efficient than manual coding',
    'API REST sedikit lebih mudah dari RPC': 'REST API is slightly easier than RPC',
    'Kedua opsi tidak ada perbedaan': 'Both options are equally good',
    'baris i ': 'row i ',
    'kolom j ': 'column j ',
    'tidak berhubungan': 'unrelated',
    'Contoh: "memengaruhi" — dibaca "elemen i memengaruhi elemen j".':
      'Example: "influences" — read as "element i influences element j".',
    'Nama elemen ': 'Element name ',
    'Hapus ': 'Delete ',
    'Draf gagal disimpan ke server': 'Draft failed to save to the server',
    'Masih ada ': 'There are still ',
    ' sel kosong': ' empty cells',
    'Menyimpan draf...': 'Saving draft...',
    'Draf tersimpan ': 'Draft saved ',
    ' Tidak ada sel seri.': ' No tie cells.',
    'Ekspor PDF': 'Export PDF',
    'Pengaturan': 'Settings',
    'Panduan': 'Guide',
    'Bandingkan sub': 'Compare sub-criteria',
    'Bandingkan vendor': 'Compare vendors',
    'Mutlak Lebih': 'Absolutely More',
    'Sangat Penting': 'Strongly Important',
    'Lebih Penting': 'More Important',
    'Sedikit Lebih': 'Slightly More',
    'Sama Penting': 'Equally Important',
    'Pustaka': 'Library',
    'Menyiapkan...': 'Preparing...',
    'Deskripsi elemen ': 'Element description ',
    'saling': 'mutually',
    '(dua arah)': '(both directions)',
    'memengaruhi': 'influences',
    'baris i': 'row i',
    'kolom j': 'column j',
    'Maksimal': 'Maximum',
    'elemen, plus relasi kontekstual.': 'elements, plus a contextual relation.',
    '\n\nDetail: ': '\n\nDetails: ',
    'Error publikasi: ': 'Publish error: ',
    'Mengisi': 'Filling',
    'Tanggal:': 'Date:',
    'Ringkasan Eksekutif': 'Executive Summary',
    'Rekomendasi Teratas:': 'Top Recommendation:',
    'Skor Kepercayaan:': 'Confidence Score:',
    'Tingkat Konsistensi:': 'Consistency Level:',
    'Peringkat Alternatif': 'Alternative Ranking',
    'Peringkat': 'Rank',
    'Skor': 'Score',
    'Bobot Kriteria': 'Criteria Weights',
    'Laporan ini dibuat oleh Think Decision': 'This report was generated by Think Decision',
    'Kasus Saya': 'My Cases',
    'Simpan Perubahan': 'Save Changes',
    'Simpan Draft': 'Save Draft',
    'Sensitivity Analysis': 'Sensitivity Analysis',
    'Status:': 'Status:',
    'sub-kriteria': 'sub-criteria',
    'Nama elemen': 'Element name',
    'REKOMENDASI TERATAS': 'TOP RECOMMENDATION',
    'Skor:': 'Score:',
    'CR (Konsistensi):': 'CR (Consistency):',
    'Persentase': 'Percentage',
    'Relasi': 'Relation',
    'Harga (Alt)': 'Price (Alt)',
    'Kualitas (Alt)': 'Quality (Alt)',
    'Reputasi (Alt)': 'Reputation (Alt)',
    'Total CR': 'Total CR',
    '📚 Tutorial Pakar': '📚 Expert Tutorial',
    '📚 Panduan Pembuat': '📚 Creator Guide',
    'Minimal': 'Minimum',
    'karakter': 'characters',
    'item': 'item',
    'CR terlalu tinggi (>0.15)': 'CR is too high (>0.15)',
    'Struktur hierarki sederhana tanpa dependensi silang. Metode paling umum untuk pengambilan keputusan multi-kriteria.':
      'A simple hierarchy without cross-dependencies. The most common method for multi-criteria decision making.',
    'Memungkinkan dependensi dan feedback antar elemen. Cocok untuk keputusan kompleks dengan hubungan saling ketergantungan.':
      'Allows dependencies and feedback between elements. Suited to complex decisions with interdependent relationships.',
    'AHP dengan dukungan Triangular Fuzzy Numbers untuk menangkap ketidakpastian dan penilaian linguistik pakar.':
      "AHP with Triangular Fuzzy Numbers to capture uncertainty and experts' linguistic judgments.",
    'Kombinasi ANP dan Fuzzy logic untuk skenario dengan ketidakpastian tinggi dan hubungan kompleks antar kriteria.':
      'A combination of ANP and fuzzy logic for scenarios with high uncertainty and complex relationships between criteria.',
    'Interpretive Structural Modelling: memetakan relasi pengaruh antar-elemen menjadi hierarki level.':
      'Interpretive Structural Modelling: maps influence relations between elements into a level hierarchy.',
    'Analisis driving power dan dependence power dari hasil ISM.':
      'Analysis of driving power and dependence power from ISM results.',
    'Berpikir bersama, memutuskan dengan yakin.':
      'Thinking together, deciding with confidence.',
    'terisi': 'filled',
    'Dr. Budi Hartono': 'Dr. Jane Doe',
    'Perubahan tersimpan, tetapi undangan gagal untuk:': 'Changes saved, but invitations failed for:',
    'Kasus dipublikasikan, tetapi undangan gagal untuk:': 'Case published, but invitations failed for:',
    'Memeriksa sesi...': 'Checking session...',
    'memengaruhi': 'influences',
    'bobot': 'weight',
    'Review & Analisis': 'Review & Analysis',
    'Keputusan': 'Decision',
    'Export & Dokumentasi': 'Export & Documentation',
    'Hierarki Keputusan': 'Decision Hierarchy',
    'Laporan PDF': 'PDF Report',
    'Excel (Data Mentah)': 'Excel (Raw Data)',
    'Gambar Hierarki PNG': 'PNG Hierarchy Image',
    'Bundle JSON': 'JSON Bundle',
    'Bandingkan kriteria': 'Compare criteria',
    'Pembuat': 'Creator',
  },
};

function tx(text) {
  if (!text) return text;
  const lang = window.__DECIDEAI_LANG__ || (document.documentElement.lang === 'id' ? 'id' : 'en');
  if (lang === 'id') return text;
  return UI_TEXT.en[text] ?? text;
}

Object.assign(window, { UI_TEXT, tx });
