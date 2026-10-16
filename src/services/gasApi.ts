import { LinkItem, StatistikData } from '../types';

export interface PingResult {
  success: boolean;
  latencyMs: number;
  message: string;
  data?: unknown;
}

/**
 * Test koneksi ping ke Web App Google Apps Script
 */
export async function pingGasEndpoint(url: string, passcode?: string): Promise<PingResult> {
  const start = performance.now();
  if (!url || !url.startsWith('http')) {
    return {
      success: false,
      latencyMs: 0,
      message: 'URL Web App tidak valid. Pastikan diawali dengan https://script.google.com/macros/s/.../exec',
    };
  }

  try {
    const testUrl = new URL(url);
    testUrl.searchParams.set('action', 'ping');
    if (passcode) {
      testUrl.searchParams.set('passcode', passcode);
    }

    const response = await fetch(testUrl.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    const elapsed = Math.round(performance.now() - start);

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        latencyMs: elapsed,
        message: `Terhubung dengan sukses (${elapsed} ms)`,
        data,
      };
    } else {
      return {
        success: false,
        latencyMs: elapsed,
        message: `Server merespons status ${response.status} ${response.statusText}`,
      };
    }
  } catch (err: unknown) {
    const elapsed = Math.round(performance.now() - start);
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      latencyMs: elapsed,
      message: `Gagal menjangkau server: ${msg}. Periksa izin deployment "Execute as: Me" & "Who has access: Anyone".`,
    };
  }
}

/**
 * Sinkronisasi data publik dari Google Apps Script
 */
export async function fetchGasLinks(url: string): Promise<{ success: boolean; links?: LinkItem[]; error?: string }> {
  if (!url) return { success: false, error: 'URL GAS belum dikonfigurasi' };

  try {
    const targetUrl = new URL(url);
    targetUrl.searchParams.set('action', 'getPublicLinks');

    const res = await fetch(targetUrl.toString());
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);

    const json = await res.json();
    if (json && json.ok && Array.isArray(json.links)) {
      return { success: true, links: json.links };
    }
    return { success: false, error: json.errorMessage || 'Format data GAS tidak cocok' };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: msg };
  }
}

/**
 * Sinkronisasi data statistik dari Google Apps Script
 */
export async function fetchGasStats(url: string, token: string): Promise<{ success: boolean; stats?: StatistikData; error?: string }> {
  if (!url) return { success: false, error: 'URL GAS belum dikonfigurasi' };

  try {
    const targetUrl = new URL(url);
    targetUrl.searchParams.set('action', 'getStatistik');
    targetUrl.searchParams.set('token', token);

    const res = await fetch(targetUrl.toString());
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);

    const json = await res.json();
    if (json && json.ok) {
      return {
        success: true,
        stats: {
          totalKunjungan: json.totalKunjungan || 0,
          kunjunganHariIni: json.kunjunganHariIni || 0,
          totalKlik: json.totalKlik || 0,
          totalLinkAktif: json.totalLinkAktif || 0,
          trend14Hari: json.trend14Hari || [],
          topLinks: json.topLinks || [],
        },
      };
    }
    return { success: false, error: json.message || 'Gagal memuat statistik' };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: msg };
  }
}

/**
 * Hasilkan kode Code.gs yang sudah dioptimalkan untuk Google Spreadsheet PT Batu Karang
 */
export function generateProductionCodeGs(): string {
  return `/**
 * ============================================================
 * PT BATU KARANG — DIVISI PRODUKSI I
 * HEADLESS REST WEB APP & GOOGLE SPREADSHEET BACKEND
 * ============================================================
 *
 * CARA DEPLOY:
 * 1. Buka Google Spreadsheet Divisi Produksi I.
 * 2. Klik Extensions > Apps Script.
 * 3. Hapus semua kode default dan tempel kode ini (Code.gs).
 * 4. Buka Project Settings (ikon roda gigi) > Script Properties > Add script property:
 *      Property : ADMIN_PASSCODE
 *      Value    : (passcode pilihan Anda, misal: bkr153)
 * 5. Jalankan fungsi "authorizeApp" sekali dari editor untuk otorisasi izin Sheets.
 * 6. (Opsional) Jalankan "seedInitialData" untuk mengisi struktur link & grup awal.
 * 7. Klik Deploy > New deployment:
 *      - Select type  : Web app
 *      - Description  : Production Link Hub API v1
 *      - Execute as   : Me (divisi1.BKR@gmail.com)
 *      - Who has access: Anyone (agar app frontend bisa membaca data)
 * 8. Salin "Web app URL" (akhiran /exec) dan masukkan ke menu "Headless GAS Center" di Web App.
 * ============================================================
 */

const SHEET_NAME = 'LinkTree';
const SHEET_STATISTIK = 'Statistik';

const KATEGORI_OPTIONS = [
  'Operasional & Lini',
  'Formulir & Shift',
  'Kendali Mutu (QC)',
  'K3LH & SOP',
  'Kontak & Database'
];

const HEADERS = [
  'ID', 'Label', 'URL', 'Icon', 'Kategori', 'Deskripsi', 'Urutan', 'Aktif', 'Pinned', 'Klik', 'TerakhirUpdate',
  'Tipe', 'ParentID'
];

const STATISTIK_HEADERS = ['Tanggal', 'Kunjungan'];
const ADMIN_TOKEN_TTL_SECONDS = 6 * 60 * 60; // 6 Jam
const PUBLIC_LINKS_CACHE_KEY = 'bkr_public_links_v2';
const PUBLIC_LINKS_CACHE_TTL = 120; // 2 Menit

// ------------------------------------------------------------
// REST API ENDPOINTS: doGet & doPost
// ------------------------------------------------------------

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'getPublicLinks';
    const token = (e && e.parameter && e.parameter.token) || '';

    // Ping check
    if (action === 'ping') {
      return jsonResponse_({ ok: true, message: 'PT Batu Karang GAS API Online', timestamp: new Date().toISOString() });
    }

    // Ambil data publik
    if (action === 'getPublicLinks') {
      const links = getPublicLinksArray_();
      return jsonResponse_({ ok: true, links: links });
    }

    // Ambil statistik (admin only)
    if (action === 'getStatistik') {
      checkToken_(token);
      const stats = getStatistik_();
      return jsonResponse_(stats);
    }

    // Ambil data admin lengkap (flat links + groups)
    if (action === 'getAdminData') {
      checkToken_(token);
      const data = getAdminData_();
      return jsonResponse_(data);
    }

    return jsonResponse_({ ok: false, message: 'Aksi tidak dikenal: ' + action });
  } catch (err) {
    return jsonResponse_({ ok: false, error: err.message });
  }
}

function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action || '';
    const token = payload.token || '';

    // Verifikasi passcode admin
    if (action === 'verifyPasscode') {
      const passcode = payload.passcode || '';
      const result = verifyAdminPasscode_(passcode);
      return jsonResponse_(result);
    }

    // Record visit (publik, fire-and-forget)
    if (action === 'recordVisit') {
      recordVisit_();
      return jsonResponse_({ ok: true });
    }

    // Record click link/grup (publik, fire-and-forget)
    if (action === 'recordClick') {
      const id = payload.id;
      recordClick_(id);
      return jsonResponse_({ ok: true });
    }

    // Admin Privileged Operations
    checkToken_(token);

    if (action === 'saveLink') {
      const res = saveLink_(payload.link);
      return jsonResponse_(res);
    }

    if (action === 'deleteLink') {
      const res = deleteLink_(payload.id);
      return jsonResponse_(res);
    }

    if (action === 'reorderLinks') {
      const res = reorderLinks_(payload.orderedIds);
      return jsonResponse_(res);
    }

    return jsonResponse_({ ok: false, message: 'Aksi POST tidak dikenal' });
  } catch (err) {
    return jsonResponse_({ ok: false, error: err.message });
  }
}

function jsonResponse_(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ------------------------------------------------------------
// PASSCODE & TOKEN AUTHENTICATION
// ------------------------------------------------------------

function getStoredPasscode_() {
  return PropertiesService.getScriptProperties().getProperty('ADMIN_PASSCODE') || 'bkr153';
}

function verifyAdminPasscode_(passcode) {
  const stored = getStoredPasscode_();
  if (String(passcode).trim() !== String(stored).trim()) {
    return { success: false, message: 'Passcode admin salah.' };
  }
  const token = Utilities.getUuid();
  CacheService.getScriptCache().put('admintoken_' + token, 'valid', ADMIN_TOKEN_TTL_SECONDS);
  return { success: true, token: token };
}

function checkToken_(token) {
  if (!token) throw new Error('Token admin diperlukan. Silakan login kembali.');
  const cached = CacheService.getScriptCache().get('admintoken_' + token);
  if (cached !== 'valid') {
    throw new Error('Sesi admin kedaluwarsa atau tidak valid.');
  }
}

// ------------------------------------------------------------
// DATABASE LOGIC (GOOGLE SHEETS)
// ------------------------------------------------------------

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getStatistikSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_STATISTIK);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_STATISTIK);
    sheet.appendRow(STATISTIK_HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function rowToObject_(headers, row) {
  const obj = {};
  headers.forEach(function(h, i) {
    const key = h.toLowerCase().replace(/[^a-z0-9]/g, '');
    obj[key] = row[i];
  });
  if (!obj.tipe) obj.tipe = 'Link';
  return {
    id: obj.id,
    label: obj.label,
    url: obj.url || '',
    icon: obj.icon || '🔗',
    kategori: obj.kategori || 'Operasional & Lini',
    deskripsi: obj.deskripsi || '',
    urutan: Number(obj.urutan) || 0,
    aktif: String(obj.aktif).toUpperCase() === 'TRUE',
    pinned: String(obj.pinned).toUpperCase() === 'TRUE',
    klik: Number(obj.klik) || 0,
    terakhirUpdate: obj.terakhirupdate ? String(obj.terakhirupdate) : '',
    tipe: obj.tipe,
    parentId: obj.parentid || ''
  };
}

function getPublicLinksArray_() {
  const sheet = getSheet_();
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data.shift();
  const all = data
    .filter(function(r) { return r[0]; })
    .map(function(r) { return rowToObject_(headers, r); })
    .filter(function(l) { return l.aktif; });

  const byParent = {};
  all.forEach(function(l) {
    const key = l.parentId ? String(l.parentId) : '';
    if (!byParent[key]) byParent[key] = [];
    byParent[key].push(l);
  });

  function sortDisplay(arr) {
    return arr.slice().sort(function(a, b) {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return (a.urutan || 0) - (b.urutan || 0);
    });
  }

  const topLevel = sortDisplay(byParent[''] || []);
  return topLevel.map(function(l) {
    if (l.tipe === 'Grup') {
      l.children = sortDisplay(byParent[String(l.id)] || []);
    }
    return l;
  });
}

function getAdminData_() {
  const sheet = getSheet_();
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const links = data
    .filter(function(r) { return r[0]; })
    .map(function(r) { return rowToObject_(headers, r); });

  links.sort(function(a, b) { return (a.urutan || 0) - (b.urutan || 0); });
  const grupList = links.filter(function(l) { return l.tipe === 'Grup'; }).map(function(g) { return { id: g.id, label: g.label }; });

  return { ok: true, links: links, grupList: grupList, kategoriOptions: KATEGORI_OPTIONS };
}

function saveLink_(link) {
  const sheet = getSheet_();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIdx = headers.indexOf('ID');
  const nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');

  const tipe = (link && link.tipe === 'Grup') ? 'Grup' : 'Link';
  const parentId = tipe === 'Grup' ? '' : ((link && link.parentId) || '');
  const id = (link && link.id) || ((tipe === 'Grup' ? 'GRP-' : 'LNK-') + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyMMddHHmmss'));

  const rowValues = [
    id,
    link.label || '',
    tipe === 'Grup' ? '' : (link.url || ''),
    link.icon || (tipe === 'Grup' ? '🗂️' : '🔗'),
    link.kategori || 'Operasional & Lini',
    link.deskripsi || '',
    Number(link.urutan) || 10,
    link.aktif ? 'TRUE' : 'FALSE',
    link.pinned ? 'TRUE' : 'FALSE',
    Number(link.klik) || 0,
    nowStr,
    tipe,
    parentId
  ];

  if (link && link.id) {
    for (let r = 1; r < data.length; r++) {
      if (String(data[r][idIdx]) === String(link.id)) {
        rowValues[HEADERS.indexOf('Klik')] = data[r][HEADERS.indexOf('Klik')] || 0;
        sheet.getRange(r + 1, 1, 1, HEADERS.length).setValues([rowValues]);
        return { success: true, id: id };
      }
    }
  }

  sheet.appendRow(rowValues);
  return { success: true, id: id };
}

function deleteLink_(id) {
  const sheet = getSheet_();
  const data = sheet.getDataRange().getValues();
  const idIdx = HEADERS.indexOf('ID');
  const parentIdx = HEADERS.indexOf('ParentID');

  const rowsToDelete = [];
  for (let r = 1; r < data.length; r++) {
    if (String(data[r][idIdx]) === String(id) || String(data[r][parentIdx]) === String(id)) {
      rowsToDelete.push(r + 1);
    }
  }
  if (!rowsToDelete.length) return { success: false, message: 'ID tidak ditemukan' };

  rowsToDelete.sort(function(a, b) { return b - a; }).forEach(function(r) { sheet.deleteRow(r); });
  return { success: true, deletedCount: rowsToDelete.length };
}

function reorderLinks_(orderedIds) {
  const sheet = getSheet_();
  const data = sheet.getDataRange().getValues();
  const urutanIdx = HEADERS.indexOf('Urutan');

  (orderedIds || []).forEach(function(id, i) {
    for (let r = 1; r < data.length; r++) {
      if (String(data[r][0]) === String(id)) {
        sheet.getRange(r + 1, urutanIdx + 1).setValue((i + 1) * 10);
        break;
      }
    }
  });
  return { success: true };
}

function recordVisit_() {
  const sheet = getStatistikSheet_();
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const data = sheet.getDataRange().getValues();

  for (let r = 1; r < data.length; r++) {
    const cellDate = data[r][0] instanceof Date
      ? Utilities.formatDate(data[r][0], Session.getScriptTimeZone(), 'yyyy-MM-dd')
      : String(data[r][0]).trim();
    if (cellDate === today) {
      sheet.getRange(r + 1, 2).setValue((Number(data[r][1]) || 0) + 1);
      return;
    }
  }

  const newRow = sheet.getLastRow() + 1;
  sheet.getRange(newRow, 1).setNumberFormat('@').setValue(today);
  sheet.getRange(newRow, 2).setValue(1);
}

function recordClick_(id) {
  const sheet = getSheet_();
  const data = sheet.getDataRange().getValues();
  const klikIdx = HEADERS.indexOf('Klik');

  for (let r = 1; r < data.length; r++) {
    if (String(data[r][0]) === String(id)) {
      sheet.getRange(r + 1, klikIdx + 1).setValue((Number(data[r][klikIdx]) || 0) + 1);
      return;
    }
  }
}

function getStatistik_() {
  const statSheet = getStatistikSheet_();
  const statData = statSheet.getDataRange().getValues();
  statData.shift();

  let totalKunjungan = 0;
  let kunjunganHariIni = 0;
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const last14 = [];

  statData.forEach(function(row) {
    const tgl = row[0] instanceof Date
      ? Utilities.formatDate(row[0], Session.getScriptTimeZone(), 'yyyy-MM-dd')
      : String(row[0]);
    const jml = Number(row[1]) || 0;
    totalKunjungan += jml;
    if (tgl === today) kunjunganHariIni = jml;
    last14.push({ tanggal: tgl, jumlah: jml });
  });

  last14.sort(function(a, b) { return a.tanggal < b.tanggal ? 1 : -1; });
  const trend = last14.slice(0, 14).reverse();

  const linkSheet = getSheet_();
  const linkData = linkSheet.getDataRange().getValues();
  linkData.shift();
  const links = linkData.filter(function(r) { return r[0]; }).map(function(r) {
    return { label: r[1], klik: Number(r[9]) || 0, tipe: r[11], aktif: String(r[7]).toUpperCase() === 'TRUE' };
  });

  const totalKlik = links.reduce(function(sum, l) { return sum + l.klik; }, 0);
  const top = links.slice().sort(function(a, b) { return b.klik - a.klik; }).slice(0, 5);

  return {
    ok: true,
    totalKunjungan: totalKunjungan,
    kunjunganHariIni: kunjunganHariIni,
    totalKlik: totalKlik,
    totalLinkAktif: links.filter(function(l) { return l.aktif && l.tipe !== 'Grup'; }).length,
    trend14Hari: trend,
    topLinks: top
  };
}

function authorizeApp() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getSheet_();
  const stat = getStatistikSheet_();
  Logger.log('PT Batu Karang Hub diinisialisasi pada: ' + ss.getName());
}

function seedInitialData() {
  // Isi data awal otomatis jika sheet kosong
  const sheet = getSheet_();
  if (sheet.getLastRow() > 1) {
    Logger.log('Sheet sudah memiliki data. Seeding dibatalkan.');
    return;
  }
  // Tambah grup & link awal pabrik
  saveLink_({ label: 'Sistem Monitoring & Lini Produksi', tipe: 'Grup', icon: '🏭', kategori: 'Operasional & Lini', deskripsi: 'Akses SCADA, stock monitoring & OEE', urutan: 10, aktif: true });
  saveLink_({ label: 'Formulir & Logbook Shift Kerja', tipe: 'Grup', icon: '📝', kategori: 'Formulir & Shift', deskripsi: 'Form ritase per jam & lapor downtime', urutan: 20, aktif: true });
  Logger.log('Seeding data awal PT Batu Karang berhasil.');
}
`;
}
