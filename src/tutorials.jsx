/* Tutorials - Simplified with Box Headers & Agroindustry Examples */

function ExpertTutorials({ method = 'AHP' }) {
  const Header = ({ children }) => (
    <div className="rounded-lg p-3 bg-blue-600 dark:bg-blue-700 mb-3 shadow-md">
      <h3 className="font-semibold text-[14px] text-white">{children}</h3>
    </div>
  );

  const content = {
    AHP: {
      overview: (
        <div className="space-y-4">
          <div>
            <h2 className="font-semibold text-[15px] text-ink-900 dark:text-ink-50 mb-3">Apa itu AHP?</h2>
            <p className="text-[13px] text-ink-700 dark:text-ink-300 leading-relaxed mb-3">AHP membandingkan dua item sekaligus pakai skala 1-9 untuk tentukan mana lebih penting. Fokus satu perbandingan di satu waktu membuat penilaian lebih akurat.</p>
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-[12px] text-blue-900 dark:text-blue-100"><b>Skala 1-9:</b> 1=sama penting, 3=sedikit lebih penting, 5=lebih penting, 7=sangat penting, 9=mutlak penting</p>
            </div>
          </div>
          <Header>Cara Mengisi</Header>
          <ol className="text-[13px] text-ink-700 dark:text-ink-300 space-y-2 list-decimal list-inside">
            <li>Baca pertanyaan: "Item A vs B, mana lebih penting?"</li>
            <li>Tentukan yang lebih penting dan intensitasnya (1-9)</li>
            <li>Geser slider sesuai nilai pilihan Anda</li>
            <li>Lanjut ke perbandingan berikutnya</li>
            <li>Periksa CR (Consistency Ratio) real-time</li>
            <li>Klik Submit setelah semua selesai dan CR baik</li>
          </ol>
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <p className="text-[12px] text-amber-900 dark:text-amber-100"><b>Tips:</b> Konsisten dalam penilaian. Jika A > B dan B > C, maka A > C. Kalau tidak, CR akan tinggi.</p>
          </div>
        </div>
      ),
      cr: (
        <div className="space-y-3">
          <Header>Consistency Ratio (CR)</Header>
          <p className="text-[13px] text-ink-700 dark:text-ink-300 mb-3">CR mengukur konsistensi penilaian Anda. Semakin kecil CR, semakin konsisten. Sistem hitung CR real-time saat Anda isi.</p>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
              <div className="text-[13px] font-semibold text-green-700 dark:text-green-100">CR ≤ 0.10</div>
              <div className="text-[12px] text-green-900/80 dark:text-green-100/80">Sempurna</div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
              <div className="text-[13px] font-semibold text-yellow-700 dark:text-yellow-100">0.10 - 0.15</div>
              <div className="text-[12px] text-yellow-900/80 dark:text-yellow-100/80">Boleh lanjut</div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
              <div className="text-[13px] font-semibold text-red-700 dark:text-red-100">CR > 0.15</div>
              <div className="text-[12px] text-red-900/80 dark:text-red-100/80">Perlu diperbaiki</div>
            </div>
          </div>
        </div>
      ),
      example: (
        <div className="bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <Header>Contoh: Memilih Varietas Padi</Header>
          <p className="text-[12px] text-blue-900/80 dark:text-blue-100/80 leading-relaxed">Petani ingin pilih varietas padi terbaik. Ada 3 pilihan varietas. Pakar harus bandingkan berdasarkan: Hasil Panen, Tahan Hama, Harga Benih. Pakar bandingkan dua-dua: "Hasil Panen vs Tahan Hama?" Jawab nilai 5 (Hasil Panen lebih penting). Lalu "Tahan Hama vs Harga Benih?" Sistem hitung bobot setiap kriteria, lalu ranking varietas. Hasilnya: Varietas A 45%, B 35%, C 20%. Petani pilih Varietas A.</p>
        </div>
      ),
    },
    'Fuzzy AHP': {
      overview: (
        <div className="space-y-4">
          <div>
            <h2 className="font-semibold text-[15px] text-ink-900 dark:text-ink-50 mb-3">Apa itu Fuzzy AHP?</h2>
            <p className="text-[13px] text-ink-700 dark:text-ink-300 leading-relaxed mb-3">Seperti AHP tapi Anda kasih RENTANG nilai (L,M,U) alih-alih satu nilai pasti. Cocok ketika tidak 100% yakin dengan penilaian.</p>
            <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
              <p className="text-[12px] text-purple-900/80 dark:text-purple-100/80"><b>L=Lower (pesimis), M=Mode (normal), U=Upper (optimis)</b><br/>Contoh: L=2, M=5, U=8 berarti "antara 2-8, tapi saya pikir 5"</p>
            </div>
          </div>
          <Header>Cara Mengisi</Header>
          <ol className="text-[13px] text-ink-700 dark:text-ink-300 space-y-2 list-decimal list-inside">
            <li>Tentukan nilai TERENDAH (L) yang masuk akal</li>
            <li>Tentukan nilai TERTINGGI (U) yang masuk akal</li>
            <li>Tentukan nilai PALING MUNGKIN (M) — harus antara L dan U</li>
            <li>Rentang sempit = yakin; rentang lebar = kurang yakin</li>
            <li>Submit setelah semua terisi</li>
          </ol>
        </div>
      ),
      example: (
        <div className="bg-purple-50 dark:bg-purple-950/30 border-2 border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <Header>Contoh: Memilih Jenis Pupuk</Header>
          <p className="text-[12px] text-purple-900/80 dark:text-purple-100/80 leading-relaxed">Petani mau pilih pupuk: Organik, Kimia, Campuran. Pakar tidak 100% yakin dengan nilai pasti (pasar berfluktuasi). Pakar bandingkan Organik vs Kimia: "Mana lebih penting untuk hasil jangka panjang?" Isi rentang L=2, M=5, U=8 (tidak pasti antara 2-8, tapi pikir 5). Sistem calculate dengan fuzzy logic. Hasil bukan satu nilai tapi range: Organik 25-35%, Kimia 30-40%, Campuran 28-40%. Petani tahu ada ketidakpastian dan bisa plan dengan lebih flexible.</p>
        </div>
      ),
    },
    ANP: {
      overview: (
        <div className="space-y-4">
          <div>
            <h2 className="font-semibold text-[15px] text-ink-900 dark:text-ink-50 mb-3">Apa itu ANP?</h2>
            <p className="text-[13px] text-ink-700 dark:text-ink-300 leading-relaxed mb-3">Seperti AHP, tapi MENANGANI DEPENDENSI antar kriteria. Kriteria bisa saling mempengaruhi. Hasil lebih akurat untuk keputusan kompleks.</p>
            <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
              <p className="text-[12px] text-orange-900/80 dark:text-orange-100/80"><b>Contoh dependensi:</b> Biaya pupuk mempengaruhi Hasil Panen (biaya tinggi = biasanya kualitas lebih baik = hasil lebih tinggi)</p>
            </div>
          </div>
          <Header>Cara Mengisi</Header>
          <p className="text-[13px] text-ink-700 dark:text-ink-300 mb-3">SAMA SEPERTI AHP — bandingkan dua item dengan skala 1-9. Perbedaannya: Sistem otomatis hitung network effect dari dependensi kriteria.</p>
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <p className="text-[12px] text-amber-900/80 dark:text-amber-100/80"><b>Hasil bisa berbeda dari AHP</b> karena mempertimbangkan dependensi antar kriteria.</p>
          </div>
        </div>
      ),
      example: (
        <div className="bg-orange-50 dark:bg-orange-950/30 border-2 border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <Header>Contoh: Memilih Sistem Irigasi</Header>
          <p className="text-[12px] text-orange-900/80 dark:text-orange-100/80 leading-relaxed">Petani mau pilih sistem irigasi: Drip, Sprinkler, Flood. Dependensi: Biaya Awal mempengaruhi Efisiensi Air (sistem mahal biasanya lebih efisien). Efisiensi mempengaruhi Hasil Panen. Pakar bandingkan pakai AHP style (1-9), tapi sistem calculate ANP dengan network effect. Hasilnya bisa berbeda: ANP mungkin pilih Drip (mahal tapi efisien → hasil tinggi), sedangkan AHP mungkin pilih Flood (murah). ANP lebih akurat untuk keputusan jangka panjang.</p>
        </div>
      ),
    },
    'Fuzzy ANP': {
      overview: (
        <div className="space-y-4">
          <div>
            <h2 className="font-semibold text-[15px] text-ink-900 dark:text-ink-50 mb-3">Apa itu Fuzzy ANP?</h2>
            <p className="text-[13px] text-ink-700 dark:text-ink-300 leading-relaxed mb-3">Kombinasi PALING LENGKAP: Anda kasih RENTANG nilai (Fuzzy) DENGAN mempertimbangkan DEPENDENSI (Network). Paling akurat tapi juga butuh pikiran paling matang.</p>
          </div>
          <Header>Cara Mengisi</Header>
          <p className="text-[13px] text-ink-700 dark:text-ink-300 mb-3">Isi rentang L, M, U untuk setiap perbandingan (seperti Fuzzy AHP). Sistem otomatis hitung dengan fuzzy logic PLUS network effect dependensi.</p>
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <p className="text-[12px] text-amber-900/80 dark:text-amber-100/80"><b>Catatan:</b> Gunakan HANYA untuk keputusan SANGAT penting. Untuk keputusan sederhana, AHP saja sudah cukup.</p>
          </div>
        </div>
      ),
      example: (
        <div className="bg-pink-50 dark:bg-pink-950/30 border-2 border-pink-200 dark:border-pink-800 rounded-lg p-4">
          <Header>Contoh: Investasi Agribisnis (Besar)</Header>
          <p className="text-[12px] text-pink-900/80 dark:text-pink-100/80 leading-relaxed">Investor besar mau invest di agribisnis: Padi, Sayuran, Ternak. Investasi miliaran rupiah. Ada ketidakpastian market & dependensi kompleks: Harga berfluktuasi, Supply chain mempengaruhi Profit, Risiko berpengaruh Return. Pakar isi rentang L,M,U untuk setiap penilaian (karena uncertain). Sistem calculate dengan fuzzy logic + network effect. Hasil: bukan satu number tapi range dengan uncertainty. Investor tahu risk-return profile dan bisa decide lebih informed.</p>
        </div>
      ),
    },
  };

  const sections = content[method] || content.AHP;

  return (
    <div className="space-y-6">
      <div>{sections.overview}</div>
      {method === 'AHP' && <div className="border-t border-ink-200 dark:border-ink-800 pt-6">{sections.cr}</div>}
      <div className="border-t border-ink-200 dark:border-ink-800 pt-6">{sections.example}</div>
    </div>
  );
}

// =====================================================
// CREATOR TUTORIALS
// =====================================================

function CreatorTutorials({ method = 'AHP' }) {
  const Header = ({ children }) => (
    <div className="rounded-lg p-3 bg-blue-600 dark:bg-blue-700 mb-3 shadow-md">
      <h3 className="font-semibold text-[14px] text-white">{children}</h3>
    </div>
  );

  const content = {
    AHP: {
      overview: (
        <div className="space-y-4">
          <Header>Kapan Gunakan AHP?</Header>
          <ul className="text-[13px] text-ink-700 dark:text-ink-300 space-y-2">
            <li>✓ Kriteria independen (tidak saling pengaruh)</li>
            <li>✓ Keputusan sederhana sampai menengah</li>
            <li>✓ Pakar yakin dengan penilaian</li>
            <li>✓ Waktu terbatas</li>
          </ul>
        </div>
      ),
      setup: (
        <div className="space-y-4">
          <Header>Setup Kasus AHP</Header>
          <div className="text-[13px] text-ink-700 dark:text-ink-300 space-y-2">
            <p><b>1. Struktur:</b> Goal → Kriteria (3-7) → Alternatif (2-5)</p>
            <p><b>2. Pakar:</b> Minimal 2, maksimal 8. Pilih yang sungguh expert.</p>
            <p><b>3. Deadline:</b> 1-2 minggu biar pakar berpikir tenang.</p>
            <p><b>4. Instruksi:</b> Jelaskan skala 1-9 dengan contoh konkret.</p>
          </div>
        </div>
      ),
      interpret: (
        <div className="space-y-4">
          <Header>Interpretasi Hasil</Header>
          <div className="text-[13px] text-ink-700 dark:text-ink-300 space-y-2">
            <p><b>Ranking:</b> Urutan alternatif dari tertinggi ke terendah.</p>
            <p><b>Bobot Kriteria:</b> Persentase kepentingan setiap kriteria.</p>
            <p><b>CR Agregasi:</b> Rata-rata konsistensi pakar. ≤0.10 baik, >0.15 minta revisi.</p>
          </div>
        </div>
      ),
      example: (
        <div className="bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <Header>Contoh Kasus: Memilih Supplier Benih Padi</Header>
          <p className="text-[12px] text-blue-900/80 dark:text-blue-100/80 leading-relaxed">Koperasi pertanian ingin pilih supplier benih padi terbaik. Ada 3 supplier kandidat. Kriteria yang penting: Harga Benih, Kualitas Benih, Layanan Purna Jual. Undang 2-3 pakar (ketua koperasi, petani senior, agronomist). Pakar bandingkan dua-dua pakai skala 1-9. Hasilnya: Supplier A ranking 1 (45%), B ranking 2 (35%), C ranking 3 (20%). Bobot kriteria: Harga (25%), Kualitas (50%), Layanan (25%). Keputusan: Pilih Supplier A, atau negosiasi harga dengan B jika ingin kualitas lebih tinggi.</p>
        </div>
      ),
    },
    'Fuzzy AHP': {
      overview: (
        <div className="space-y-4">
          <Header>Kapan Gunakan Fuzzy AHP?</Header>
          <ul className="text-[13px] text-ink-700 dark:text-ink-300 space-y-2">
            <li>✓ Ada ketidakpastian dalam penilaian</li>
            <li>✓ Pakar sulit kasih nilai pasti</li>
            <li>✓ Ingin capture variabilitas/uncertainty</li>
            <li>✓ Pakar punya waktu cukup (30-40 menit)</li>
          </ul>
        </div>
      ),
      setup: (
        <div className="space-y-4">
          <Header>Setup Kasus Fuzzy AHP</Header>
          <div className="text-[13px] text-ink-700 dark:text-ink-300 space-y-2">
            <p><b>1. Brief Pakar:</b> Jelaskan L,M,U dengan contoh konkret.</p>
            <p><b>2. Pre-Example:</b> Tunjukkan satu contoh perbandingan lengkap dulu.</p>
            <p><b>3. Waktu:</b> Alokasikan 30-40 menit per pakar.</p>
            <p><b>4. Guidance:</b> Rentang sempit = yakin, lebar = kurang yakin.</p>
          </div>
        </div>
      ),
      example: (
        <div className="bg-purple-50 dark:bg-purple-950/30 border-2 border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <Header>Contoh Kasus: Evaluasi Varietas Cabai</Header>
          <p className="text-[12px] text-purple-900/80 dark:text-purple-100/80 leading-relaxed">Petani mau pilih varietas cabai terbaik tapi uncertain dengan market (harga berfluktuasi). Ada 3 varietas: Lokal, Import A, Import B. Kriteria: Hasil Panen, Harga Jual, Tahan Hama, Durasi Panen. Pakar tidak 100% yakin dengan nilai pasti jadi kasih rentang. Contoh: "Hasil Panen vs Harga Jual?" Jawab L=2, M=4, U=6 (tidak pasti antara 2-6, pikir 4). Sistem calculate fuzzy logic. Hasil bukan persentase pasti tapi range (misal: Import A 28-38%, Import B 30-42%, Lokal 25-35%). Petani tahu ada uncertainty dan decide dengan lebih hati-hati.</p>
        </div>
      ),
    },
    ANP: {
      overview: (
        <div className="space-y-4">
          <Header>Kapan Gunakan ANP?</Header>
          <ul className="text-[13px] text-ink-700 dark:text-ink-300 space-y-2">
            <li>✓ Ada dependensi antar kriteria</li>
            <li>✓ Keputusan kompleks</li>
            <li>✓ Pakar expert di bidangnya</li>
            <li>✓ Ingin hasil comprehensive</li>
          </ul>
        </div>
      ),
      setup: (
        <div className="space-y-4">
          <Header>Setup Kasus ANP</Header>
          <div className="text-[13px] text-ink-700 dark:text-ink-300 space-y-2">
            <p><b>1. Define Dependensi:</b> Tentukan kriteria mana saling mempengaruhi.</p>
            <p><b>2. Dokumentasikan KENAPA:</b> Jelaskan logika setiap dependensi.</p>
            <p><b>3. Brief Pakar:</b> Jelaskan network & cara fillnya (input tetap 1-9).</p>
            <p><b>4. Jangan Overdo:</b> Maksimal 3-4 dependensi utama saja.</p>
          </div>
        </div>
      ),
      example: (
        <div className="bg-orange-50 dark:bg-orange-950/30 border-2 border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <Header>Contoh Kasus: Memilih Sistem Pertanian</Header>
          <p className="text-[12px] text-orange-900/80 dark:text-orange-100/80 leading-relaxed">Petani mau pilih sistem: Konvensional, Organik, Precision Farming. Dependensi ada: Biaya Awal mempengaruhi Hasil Panen (investasi tinggi biasanya hasil lebih baik). Hasil mempengaruhi ROI. Pakar bandingkan pakai AHP style (1-9), tapi sistem calculate ANP. Hasilnya beda: ANP mungkin pilih Precision (investasi tinggi tapi ROI bagus jangka panjang), sedangkan AHP mungkin pilih Konvensional (investasi rendah). ANP lebih akurat untuk decision kompleks dengan dependensi.</p>
        </div>
      ),
    },
    'Fuzzy ANP': {
      overview: (
        <div className="space-y-4">
          <Header>Kapan Gunakan Fuzzy ANP?</Header>
          <ul className="text-[13px] text-ink-700 dark:text-ink-300 space-y-2">
            <li>✓ Keputusan SANGAT penting (nilai tinggi)</li>
            <li>✓ Ada KEDUA: uncertainty & dependensi</li>
            <li>✓ Pakar senior tersedia</li>
            <li>✓ Quality > Speed</li>
          </ul>
        </div>
      ),
      setup: (
        <div className="space-y-4">
          <Header>Setup Kasus Fuzzy ANP</Header>
          <div className="text-[13px] text-ink-700 dark:text-ink-300 space-y-2">
            <p><b>1. Combine Semua:</b> Define dependensi + brief fuzzy L,M,U.</p>
            <p><b>2. Pakar Senior:</b> Gunakan 2-4 pakar sungguh expert.</p>
            <p><b>3. Alokasi Waktu:</b> 40+ menit per pakar.</p>
            <p><b>4. Pre-Meeting:</b> Diskusi penjelasan dependensi & konsep fuzzy dulu.</p>
          </div>
        </div>
      ),
      example: (
        <div className="bg-pink-50 dark:bg-pink-950/30 border-2 border-pink-200 dark:border-pink-800 rounded-lg p-4">
          <Header>Contoh Kasus: Investasi Agribisnis Besar (Miliaran)</Header>
          <p className="text-[12px] text-pink-900/80 dark:text-pink-100/80 leading-relaxed">Investor besar invest di agroindustri: Pabrik Pupuk, Peternakan Sapi, Perkebunan Sawit. Investasi miliaran rupiah. Ada uncertainty tinggi (pasar volatile, policy bisa berubah). Ada dependensi kompleks: Harga Input mempengaruhi Margin Profit, Supply Chain mempengaruhi Efficiency, Market Demand mempengaruhi Revenue. Pakar isi rentang L,M,U untuk setiap penilaian. Sistem calculate fuzzy logic + network effect. Hasil: range score dengan uncertainty level. Investor tahu risk-return profile jelas dan bisa negotiate dengan investor lain atau bank lebih confident.</p>
        </div>
      ),
    },
  };

  const sections = content[method] || content.AHP;

  return (
    <div className="space-y-6">
      <div>{sections.overview}</div>
      <div className="border-t border-ink-200 dark:border-ink-800 pt-6">{sections.setup}</div>
      <div className="border-t border-ink-200 dark:border-ink-800 pt-6">{sections.interpret}</div>
      <div className="border-t border-ink-200 dark:border-ink-800 pt-6">{sections.example}</div>
    </div>
  );
}

// Export
window.ExpertTutorials = ExpertTutorials;
window.CreatorTutorials = CreatorTutorials;
