/* Utilities for AHP / ANP / Fuzzy + mock data + small helpers
   Exported to window so other Babel scripts can use them.        */

// ---------- Saaty RI table ----------
const RI_TABLE = [0, 0, 0, 0.58, 0.9, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49, 1.51, 1.48, 1.56, 1.57, 1.59];

// ---------- AHP: priority via geometric mean (row geo-mean / sum) ----------
function ahpPriorities(matrix) {
  const n = matrix.length;
  if (!n) return [];
  const geo = matrix.map(row => {
    const prod = row.reduce((a, v) => a * (v > 0 ? v : 1e-9), 1);
    return Math.pow(prod, 1 / n);
  });
  const sum = geo.reduce((a, b) => a + b, 0) || 1;
  return geo.map(g => g / sum);
}

// lambda_max approx: average of (Aw)/w
function ahpLambdaMax(matrix, w) {
  const n = matrix.length;
  if (!n) return n;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const row = matrix[i];
    let aw = 0;
    for (let j = 0; j < n; j++) aw += row[j] * w[j];
    sum += aw / (w[i] || 1e-9);
  }
  return sum / n;
}

function ahpCRfromMatrix(matrix) {
  const n = matrix.length;
  if (n < 3) return { CI: 0, CR: 0, lambda: n };
  const w = ahpPriorities(matrix);
  const lambda = ahpLambdaMax(matrix, w);
  const CI = (lambda - n) / (n - 1);
  const RI = RI_TABLE[n] || 1.59;
  const CR = CI / RI;
  return { CI, CR, lambda, w };
}

// build full pairwise matrix from upper-triangular sparse object {`${i}-${j}`: value}
function buildMatrix(n, upper) {
  const M = Array.from({ length: n }, () => Array(n).fill(1));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const v = upper[`${i}-${j}`];
      if (v && v > 0) {
        M[i][j] = v;
        M[j][i] = 1 / v;
      }
    }
  }
  return M;
}

// Detect which pairs have biggest impact on CR
function calculateCRImpact(matrix, itemNames = null) {
  const n = matrix.length;
  if (n < 3) return { topPairs: [], currentCR: 0 };

  const baseCR = ahpCRfromMatrix(matrix).CR;
  const impacts = [];

  // For each pair in upper triangle, test impact of slight adjustment
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const originalValue = matrix[i][j];

      // Test adjustments: multiply by 0.8 and 1.2
      const testValues = [originalValue * 0.8, originalValue * 1.2];
      let bestReduction = 0;

      for (const testVal of testValues) {
        if (testVal <= 0) continue;

        // Create modified matrix
        const testM = matrix.map(row => [...row]);
        testM[i][j] = testVal;
        testM[j][i] = 1 / testVal;

        const newCR = ahpCRfromMatrix(testM).CR;
        const reduction = baseCR - newCR;
        bestReduction = Math.max(bestReduction, reduction);
      }

      if (bestReduction > 0) {
        impacts.push({
          i,
          j,
          itemA: itemNames?.[i] || `Item ${i + 1}`,
          itemB: itemNames?.[j] || `Item ${j + 1}`,
          crReductionPotential: bestReduction,
          originalValue: originalValue
        });
      }
    }
  }

  // Sort by impact potential, take top 2
  const topPairs = impacts
    .sort((a, b) => b.crReductionPotential - a.crReductionPotential)
    .slice(0, 2);

  return { topPairs, currentCR: baseCR };
}

// ---------- Fuzzy Triangular: Chang's extent analysis (simplified) ----------
function tfnMul(a, b) { return [a[0]*b[0], a[1]*b[1], a[2]*b[2]]; }
function tfnAdd(a, b) { return [a[0]+b[0], a[1]+b[1], a[2]+b[2]]; }
function tfnInv(a)    { return [1/a[2], 1/a[1], 1/a[0]]; }

function fuzzyPriorities(tfnMatrix) {
  // tfnMatrix: n x n of [l,m,u]
  const n = tfnMatrix.length;
  if (!n) return [];
  // row-sum
  const rowSums = tfnMatrix.map(row => row.reduce((acc, v) => tfnAdd(acc, v), [0,0,0]));
  const total = rowSums.reduce((acc, v) => tfnAdd(acc, v), [0,0,0]);
  const totalInv = tfnInv(total);
  const S = rowSums.map(r => tfnMul(r, totalInv));
  // defuzzify by centroid (l+m+u)/3, then normalize
  const centroids = S.map(s => (s[0] + s[1] + s[2]) / 3);
  const sum = centroids.reduce((a,b)=>a+b,0) || 1;
  return centroids.map(c => c / sum);
}

// ---------- Aggregation ----------
// AIJ: geometric mean of judgments across experts (per cell), then compute priorities
function aggregateAIJ(matricesByExpert) {
  if (!matricesByExpert.length) return [];
  const n = matricesByExpert[0].length;
  const out = Array.from({ length: n }, () => Array(n).fill(1));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const prod = matricesByExpert.reduce((p, M) => p * M[i][j], 1);
      out[i][j] = Math.pow(prod, 1 / matricesByExpert.length);
    }
  }
  return out;
}

// AIP: weighted geometric mean of individual priority vectors
function aggregateAIP(priorityVectors, weights) {
  if (!priorityVectors.length) return [];
  const n = priorityVectors[0].length;
  const ws = weights || priorityVectors.map(() => 1 / priorityVectors.length);
  const wsSum = ws.reduce((a,b)=>a+b,0) || 1;
  const wn = ws.map(w => w / wsSum);
  const out = Array(n).fill(0).map((_, i) => {
    let p = 1;
    priorityVectors.forEach((vec, k) => { p *= Math.pow(vec[i] || 1e-9, wn[k]); });
    return p;
  });
  const s = out.reduce((a,b)=>a+b,0) || 1;
  return out.map(v => v / s);
}

// ---------- Mock data ----------
const MOCK_CASE = {
  id: 'erp-vendor',
  name: 'Pemilihan Vendor ERP Terbaik',
  description: 'Evaluasi 4 vendor ERP untuk implementasi di unit Manufaktur PT Nusantara.',
  goal: 'Memilih Vendor ERP Terbaik',
  method: 'AHP',
  deadline: '2026-05-22',
  status: 'Aktif',
  createdAt: '2026-04-30',
  criteria: [
    { id: 'c1', name: 'Harga',    description: 'Total cost of ownership 5 tahun', weight: 0.35 },
    { id: 'c2', name: 'Kualitas', description: 'Fitur, modul, performa',          weight: 0.30 },
    { id: 'c3', name: 'Support',  description: 'Layanan teknis & SLA lokal',       weight: 0.20 },
    { id: 'c4', name: 'Reputasi', description: 'Track record industri sejenis',    weight: 0.15 },
  ],
  alternatives: [
    { id: 'a1', name: 'SAP S/4HANA',         vendor: 'SAP' },
    { id: 'a2', name: 'Oracle Fusion Cloud', vendor: 'Oracle' },
    { id: 'a3', name: 'MS Dynamics 365',     vendor: 'Microsoft' },
    { id: 'a4', name: 'Odoo Enterprise',     vendor: 'Odoo SA' },
  ],
  experts: [
    { id: 'e1', name: 'Dr. Budi Hartono', email: 'budi.h@univ.ac.id', role: 'Akademisi SI',  status: 'completed', cr: 0.06, weight: 1.0, avatarColor: '#6366f1' },
    { id: 'e2', name: 'Prof. Sari Wijaya', email: 'sari.w@institut.ac.id', role: 'Pakar ERP',  status: 'completed', cr: 0.09, weight: 1.0, avatarColor: '#0ea5e9' },
    { id: 'e3', name: 'Ir. Ahmad Rahman',  email: 'ahmad.r@konsultan.id', role: 'Praktisi',    status: 'in_progress', cr: 0.11, weight: 0.8, avatarColor: '#f59e0b' },
    { id: 'e4', name: 'Dra. Lina Pratiwi', email: 'lina.p@perusahaan.com', role: 'IT Manager',  status: 'invited',     cr: null, weight: 1.0, avatarColor: '#10b981' },
  ],
  // per-expert criteria-weights (mock)
  expertCriteriaWeights: {
    e1: [0.36, 0.31, 0.19, 0.14],
    e2: [0.33, 0.32, 0.21, 0.14],
    e3: [0.40, 0.27, 0.18, 0.15],
  },
  // alternatives weight per criterion (aggregated mock)
  altWeightsByCrit: {
    c1: [0.18, 0.20, 0.27, 0.35], // Harga: Odoo cheapest
    c2: [0.34, 0.30, 0.22, 0.14], // Kualitas: SAP top
    c3: [0.30, 0.27, 0.28, 0.15], // Support
    c4: [0.36, 0.32, 0.22, 0.10], // Reputasi
  },
};

// final ranking computation from aggregated mock
function computeFinalRanking(c) {
  const crits = c.criteria;
  const alts = c.alternatives;
  const scores = alts.map((_, ai) =>
    crits.reduce((s, cr, ci) => s + cr.weight * (c.altWeightsByCrit[cr.id][ai] || 0), 0)
  );
  return alts.map((a, i) => ({ ...a, score: scores[i] }))
    .sort((a, b) => b.score - a.score);
}

const ALL_CASES = [
  { ...MOCK_CASE },
  { id:'kampus', name:'Pemilihan Lokasi Kampus Cabang', method:'ANP',       status:'Draft',    deadline:'2026-06-10', expertsCount:5, progress:0,  description:'Evaluasi 3 kandidat lokasi kampus baru.' },
  { id:'beasiswa', name:'Prioritas Penerima Beasiswa S2', method:'Fuzzy AHP', status:'Aktif',   deadline:'2026-05-18', expertsCount:6, progress:67, description:'Penilaian 12 kandidat beasiswa S2.' },
  { id:'inovasi', name:'Roadmap Inovasi Produk 2027', method:'Fuzzy ANP',    status:'Selesai', deadline:'2026-04-12', expertsCount:8, progress:100,description:'Rangking 6 inisiatif produk strategis.' },
  { id:'cio',     name:'Seleksi Kandidat CIO Internal', method:'AHP',        status:'Aktif',   deadline:'2026-05-25', expertsCount:4, progress:42, description:'5 kandidat internal posisi CIO.' },
];

// notifications
const MOCK_NOTIFICATIONS = [
  { id:1, who:'Dr. Budi Hartono',  text:'menyelesaikan pengisian level Kriteria',     when:'5 menit lalu',    color:'#6366f1' },
  { id:2, who:'Prof. Sari Wijaya', text:'menyelesaikan seluruh penilaian (CR=0.09)',   when:'1 jam lalu',     color:'#0ea5e9' },
  { id:3, who:'Ir. Ahmad Rahman',  text:'meminta klarifikasi pada kriteria "Support"', when:'3 jam lalu',     color:'#f59e0b' },
  { id:4, who:'Sistem',            text:'Kasus "Roadmap Inovasi Produk 2027" selesai', when:'kemarin',        color:'#10b981' },
];

// expert mock invitations
const EXPERT_INBOX = [
  { caseId:'erp-vendor', name:'Pemilihan Vendor ERP Terbaik', method:'AHP', creator:'Rina Maulida — PT Nusantara', deadline:'2026-05-22', status:'in_progress', progress:60 },
  { caseId:'beasiswa',   name:'Prioritas Penerima Beasiswa S2', method:'Fuzzy AHP', creator:'Pasca-Sarjana UI', deadline:'2026-05-18', status:'invited', progress:0 },
  { caseId:'cio',        name:'Seleksi Kandidat CIO Internal', method:'AHP', creator:'Bina HR', deadline:'2026-05-25', status:'completed', progress:100 },
];

// ---------- helpers ----------
function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
function fmtPct(x, d=1) { return (x * 100).toFixed(d) + '%'; }
function fmtNum(x, d=0) { return parseFloat(x).toFixed(d); }

// Deadline helpers
function getDeadlineStatus(deadline) {
  if (!deadline) return { status: 'none', hoursLeft: null, isDue: false, isOverdue: false };
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const hoursLeft = Math.ceil((deadlineDate - now) / 3600000);

  return {
    status: hoursLeft < 0 ? 'overdue' : hoursLeft < 24 ? 'urgent' : hoursLeft < 72 ? 'warning' : 'ok',
    hoursLeft: Math.max(0, hoursLeft),
    isDue: hoursLeft > 0 && hoursLeft < 24,
    isOverdue: hoursLeft < 0,
    daysLeft: Math.ceil(hoursLeft / 24)
  };
}

function formatDeadlineMessage(deadline) {
  const status = getDeadlineStatus(deadline);
  if (status.isOverdue) return `Lewat deadline ${Math.abs(status.hoursLeft)} jam lalu`;
  if (status.isDue) return `Deadline dalam ${status.hoursLeft} jam`;
  if (status.status === 'warning') return `Deadline dalam ${status.daysLeft} hari`;
  return `Deadline: ${new Date(deadline).toLocaleDateString('id-ID')}`;
}
function classNames(...xs) { return xs.filter(Boolean).join(' '); }

// Saaty 1..9 + reciprocals as steps
const SAATY_STEPS = [1/9,1/8,1/7,1/6,1/5,1/4,1/3,1/2, 1, 2,3,4,5,6,7,8,9];
function saatyLabel(v) {
  if (v === 1) return 'Sama Penting';
  if (v >= 9 || v <= 1/9) return 'Mutlak';
  if (v >= 7 || v <= 1/7) return 'Sangat Kuat';
  if (v >= 5 || v <= 1/5) return 'Kuat';
  if (v >= 3 || v <= 1/3) return 'Agak Lebih';
  return 'Sedikit';
}
function saatyToFraction(v) {
  if (v >= 1) return Math.round(v).toString();
  return '1/' + Math.round(1/v).toString();
}

// Validation helpers for real-time form validation
const validators = {
  required: (val) => {
    return !val || !val.toString().trim() ? 'Wajib diisi' : null;
  },
  email: (val) => {
    if (!val) return null;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? null : 'Email tidak valid';
  },
  minLength: (min) => (val) => {
    return !val || val.length < min ? `Minimal ${min} karakter` : null;
  },
  maxLength: (max) => (val) => {
    return val && val.length > max ? `Maksimal ${max} karakter` : null;
  },
  minValue: (min) => (val) => {
    return val && Number(val) < min ? `Minimal ${min}` : null;
  },
  maxValue: (max) => (val) => {
    return val && Number(val) > max ? `Maksimal ${max}` : null;
  },
  future: (val) => {
    if (!val) return null;
    return new Date(val) > new Date() ? null : 'Harus tanggal di masa depan';
  },
  minItems: (min) => (arr) => {
    return !arr || arr.length < min ? `Minimal ${min} item` : null;
  },
  maxItems: (max) => (arr) => {
    return arr && arr.length > max ? `Maksimal ${max} item` : null;
  },
  cr: (val) => {
    if (!val || isNaN(Number(val))) return null;
    const crNum = Number(val);
    if (crNum > 0.15) return 'CR terlalu tinggi (>0.15)';
    if (crNum > 0.10) return 'warning'; // Return warning state
    return null;
  },
};

// Debounce helper for validation
function debounce(fn, delay = 300) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

Object.assign(window, {
  RI_TABLE, ahpPriorities, ahpLambdaMax, ahpCRfromMatrix, buildMatrix, calculateCRImpact,
  tfnMul, tfnAdd, tfnInv, fuzzyPriorities,
  aggregateAIJ, aggregateAIP,
  MOCK_CASE, ALL_CASES, MOCK_NOTIFICATIONS, EXPERT_INBOX, computeFinalRanking,
  clamp, fmtPct, fmtNum, classNames, SAATY_STEPS, saatyLabel, saatyToFraction,
  getDeadlineStatus, formatDeadlineMessage,
  validators, debounce,
});
