// ============================================================
// STANDARDIZED MESSAGES & ERROR HANDLING
// ============================================================

export const MESSAGES = {
  // ============================================================
  // VALIDATION ERRORS
  // ============================================================
  validation: {
    required: (field) => `${field} wajib diisi`,
    email: 'Format email tidak valid',
    minLength: (field, min) => `${field} minimal ${min} karakter`,
    maxLength: (field, max) => `${field} maksimal ${max} karakter`,
    minValue: (field, min) => `${field} minimal ${min}`,
    maxValue: (field, max) => `${field} maksimal ${max}`,
    minItems: (field, count) => `Minimal ${count} ${field} diperlukan`,
    maxItems: (field, count) => `Maksimal ${count} ${field} diizinkan`,
    pattern: (field) => `Format ${field} tidak valid`,
    unique: (field) => `${field} sudah digunakan`,
    noWhitespace: 'Tidak boleh hanya spasi kosong',
    futureDate: 'Tanggal harus di masa depan',
    pastDate: 'Tanggal harus di masa lalu',
  },

  // ============================================================
  // NETWORK & API ERRORS
  // ============================================================
  error: {
    // Network issues
    network: 'Gagal terhubung ke server. Periksa koneksi internet Anda.',
    timeout: 'Permintaan melampaui batas waktu. Coba lagi dalam beberapa saat.',
    offline: 'Anda sedang offline. Periksa koneksi internet Anda.',

    // Authentication
    auth: 'Sesi Anda berakhir. Silakan login kembali.',
    unauthorized: 'Anda tidak memiliki akses ke resource ini.',
    forbidden: 'Akses ditolak. Hubungi administrator.',
    invalidCredentials: 'Email atau password salah.',
    tokenExpired: 'Token Anda telah kadaluarsa. Silakan login kembali.',

    // Resource errors
    notFound: 'Resource tidak ditemukan atau telah dihapus.',
    conflict: 'Data sudah ada atau terjadi konflik dengan data lain.',
    gone: 'Resource telah dihapus secara permanen.',

    // Validation
    validation: 'Data tidak valid. Periksa kembali input Anda.',
    unprocessable: 'Tidak dapat memproses request. Periksa data Anda.',
    badRequest: 'Request tidak valid.',

    // Server errors
    server: 'Terjadi kesalahan server. Tim kami sedang mengatasinya.',
    notImplemented: 'Fitur ini belum tersedia.',
    unavailable: 'Server sedang dalam pemeliharaan. Coba lagi nanti.',

    // Generic fallback
    generic: 'Terjadi kesalahan yang tidak terduga. Coba lagi.',
    unknown: 'Kesalahan tidak diketahui. Hubungi support jika masalah berlanjut.',
  },

  // ============================================================
  // SUCCESS MESSAGES
  // ============================================================
  success: {
    created: (name) => `${name} berhasil dibuat`,
    saved: (name) => `${name} berhasil disimpan`,
    updated: (name) => `${name} berhasil diperbarui`,
    deleted: (name) => `${name} berhasil dihapus`,
    submitted: (name) => `${name} berhasil dikirim`,
    published: (name) => `${name} berhasil dipublikasikan`,
    completed: (name) => `${name} telah selesai`,
    copied: 'Disalin ke clipboard',
    exported: 'Data berhasil diekspor',
    imported: 'Data berhasil diimpor',
  },

  // ============================================================
  // CONFIRMATION MESSAGES
  // ============================================================
  confirm: {
    delete: (name) => `Apakah Anda yakin ingin menghapus ${name}? Tindakan ini tidak dapat dibatalkan.`,
    discard: 'Anda memiliki perubahan yang belum disimpan. Apakah Anda yakin ingin meninggalkan?',
    proceed: (action) => `Apakah Anda yakin ingin ${action}?`,
  },

  // ============================================================
  // INFO MESSAGES
  // ============================================================
  info: {
    loading: 'Memuat data...',
    processing: 'Sedang memproses...',
    searching: 'Mencari...',
    noResults: 'Tidak ada hasil yang ditemukan',
    empty: 'Belum ada data',
    noSelection: 'Silakan pilih minimal satu item',
  },

  // ============================================================
  // WARNING MESSAGES
  // ============================================================
  warning: {
    unsaved: 'Anda memiliki perubahan yang belum disimpan',
    crHigher: 'Tingkat konsistensi tinggi. Pertimbangkan untuk meninjau kembali penilaian Anda.',
    crTooHigh: 'Tingkat konsistensi terlalu tinggi (>0.15). Silakan perbaiki penilaian Anda.',
    incomplete: 'Data belum lengkap. Periksa kembali semua field yang wajib diisi.',
    pendingChanges: 'Ada perubahan yang menunggu untuk disimpan',
  },

  // ============================================================
  // DOMAIN-SPECIFIC MESSAGES
  // ============================================================
  case: {
    noExperts: 'Tambahkan minimal satu pakar sebelum mempublikasikan',
    noCriteria: 'Tambahkan minimal satu kriteria',
    noAlternatives: 'Tambahkan minimal dua alternatif',
    incompleteHierarchy: 'Hierarki keputusan belum lengkap',
    expertAlreadyInvited: 'Pakar ini sudah diundang ke kasus ini',
    cannotModifyPublished: 'Tidak dapat mengubah kasus yang sudah dipublikasikan',
  },

  judgment: {
    crInvalid: 'Tingkat konsistensi tidak valid. Silakan periksa penilaian Anda.',
    incomplete: 'Belum semua perbandingan terisi. Lengkapi terlebih dahulu.',
    reciprocalError: 'Nilai reciprocal tidak valid',
    invalidRange: 'Nilai harus antara 1/9 dan 9',
  },

  expert: {
    invalidEmail: 'Format email tidak valid',
    selfInvite: 'Tidak dapat mengundang diri sendiri',
    alreadyExpert: 'User ini sudah terdaftar sebagai pakar',
    noInvitations: 'Anda tidak memiliki undangan yang tertunda',
  },

  results: {
    noData: 'Belum ada hasil agregasi. Tunggu hingga semua pakar selesai memberikan penilaian.',
    waitingForExperts: 'Menunggu penilaian dari pakar...',
    allComplete: 'Semua pakar telah selesai memberikan penilaian',
  },
};

// ============================================================
// ERROR CODE MAPPING
// ============================================================
export const ERROR_CODE_MAP = {
  // Network
  'NETWORK_ERROR': MESSAGES.error.network,
  'TIMEOUT': MESSAGES.error.timeout,
  'OFFLINE': MESSAGES.error.offline,

  // Auth
  'UNAUTHORIZED': MESSAGES.error.auth,
  'AUTH_FAILED': MESSAGES.error.invalidCredentials,
  'TOKEN_EXPIRED': MESSAGES.error.tokenExpired,
  'FORBIDDEN': MESSAGES.error.forbidden,

  // Resource
  'NOT_FOUND': MESSAGES.error.notFound,
  'CONFLICT': MESSAGES.error.conflict,
  'GONE': MESSAGES.error.gone,

  // Validation
  'VALIDATION_ERROR': MESSAGES.error.validation,
  'BAD_REQUEST': MESSAGES.error.badRequest,
  'UNPROCESSABLE': MESSAGES.error.unprocessable,

  // Server
  'SERVER_ERROR': MESSAGES.error.server,
  'INTERNAL_ERROR': MESSAGES.error.server,
  'NOT_IMPLEMENTED': MESSAGES.error.notImplemented,
  'UNAVAILABLE': MESSAGES.error.unavailable,
};

// ============================================================
// GET MESSAGE BASED ON HTTP STATUS
// ============================================================
export function getErrorMessage(error) {
  // Check custom error code first
  if (error.code && ERROR_CODE_MAP[error.code]) {
    return ERROR_CODE_MAP[error.code];
  }

  // Check error message property
  if (error.message && error.message !== 'Unknown error' && error.message !== 'API Error') {
    return error.message;
  }

  // Map by HTTP status
  const status = error.status || error.statusCode;
  switch (status) {
    case 400: return MESSAGES.error.badRequest;
    case 401: return MESSAGES.error.auth;
    case 403: return MESSAGES.error.forbidden;
    case 404: return MESSAGES.error.notFound;
    case 409: return MESSAGES.error.conflict;
    case 410: return MESSAGES.error.gone;
    case 422: return MESSAGES.error.validation;
    case 429: return 'Terlalu banyak permintaan. Coba lagi dalam beberapa saat.';
    case 500: return MESSAGES.error.server;
    case 502: return 'Bad Gateway. Server sedang bermasalah.';
    case 503: return MESSAGES.error.unavailable;
    case 504: return MESSAGES.error.timeout;
    default:
      // Network errors
      if (!navigator.onLine) return MESSAGES.error.offline;
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return MESSAGES.error.network;
      }
      return MESSAGES.error.generic;
  }
}

// ============================================================
// HELPER: Format error for user display
// ============================================================
export function formatErrorForUser(error) {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return getErrorMessage(error);
  }

  if (typeof error === 'object') {
    // Try to extract message
    if (error.message) return getErrorMessage(error);
    if (error.error?.message) return getErrorMessage(error.error);
    if (error.detail) return error.detail;
    if (error.msg) return error.msg;
  }

  return MESSAGES.error.generic;
}

// ============================================================
// HELPER: Check if error is retryable
// ============================================================
export function isRetryableError(error) {
  const status = error.status || error.statusCode;
  const code = error.code;

  // Retryable status codes
  if ([408, 429, 502, 503, 504].includes(status)) return true;

  // Retryable error codes
  if (['TIMEOUT', 'NETWORK_ERROR', 'OFFLINE'].includes(code)) return true;

  // Network errors are usually retryable
  if (error.name === 'TypeError' && error.message.includes('fetch')) return true;

  return false;
}

// ============================================================
// HELPER: Get icon for message type
// ============================================================
export function getMessageIcon(type) {
  const icons = {
    success: 'check',
    error: 'alert',
    warning: 'warn',
    info: 'info',
  };
  return icons[type] || 'info';
}

export default MESSAGES;
