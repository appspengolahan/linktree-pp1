import { LinkItem, StatistikData, UserAccessRecord, ActivityLogEntry } from '../types';

export interface PingResult {
  success: boolean;
  latencyMs: number;
  message: string;
  data?: unknown;
}

export const FALLBACK_GAS_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GAS_URL
    ? String(import.meta.env.VITE_GAS_URL).trim()
    : '') ||
  'https://script.google.com/macros/s/AKfycbyJUOR2Tfxwazv2wdOLCSqAUNu6P4GSLLNVZy8E6Ps-oQ_skI8yRxvmLdu5FJ7TAUMKsQ/exec';

// Cache flag jika aplikasi berjalan di Static Hosting (misal Cloudflare Workers Static Assets)
// sehingga panggilan berikutnya ke /api/* tidak mengulang request HTML yang sia-sia.
let isStaticHostingMode = false;

function isInternalApiRoute(urlStr: string): boolean {
  const trimmed = (urlStr || '').trim();
  if (!trimmed) return true;
  if (trimmed.startsWith('/api')) return true;
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://localhost';
    const parsed = new URL(trimmed, origin);
    if (
      (typeof window !== 'undefined' && parsed.origin === window.location.origin && parsed.pathname.startsWith('/api')) ||
      (!trimmed.startsWith('http://') && !trimmed.startsWith('https://'))
    ) {
      return true;
    }
  } catch {
    return trimmed.startsWith('/');
  }
  return false;
}

function isHtmlPayload(contentType: string | null, rawText: string): boolean {
  const ct = (contentType || '').toLowerCase();
  if (ct.includes('text/html')) return true;
  const trimmed = rawText.trim().toLowerCase();
  return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html') || trimmed.startsWith('<');
}

function resolveDirectGasUrl(inputUrl: string, params?: Record<string, string>): string {
  const baseUrl = isInternalApiRoute(inputUrl) ? FALLBACK_GAS_URL : inputUrl;
  const target = new URL(baseUrl);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        target.searchParams.set(k, v);
      }
    });
  }
  return target.toString();
}

/**
 * Fetch wrapper untuk Cloudflare Pages / Workers:
 * Jika panggilan melewati rute internal /api/* dan mengembalikan HTML
 * (karena Cloudflare SPA fallback tanpa proxy Express), otomatis menyimpan flag static hosting
 * lalu fallback melakukan direct fetch langsung ke endpoint GAS (JSON/CSV) dengan CORS.
 */
async function fetchGasWithFallback(
  url: string,
  options?: {
    method?: 'GET' | 'POST';
    params?: Record<string, string>;
    body?: unknown;
  }
): Promise<{ ok: boolean; status: number; statusText: string; data: Record<string, any> }> {
  const method = options?.method || 'GET';

  const executeDirectFetch = async (targetEndpoint: string) => {
    const fetchUrl =
      method === 'GET'
        ? resolveDirectGasUrl(targetEndpoint, options?.params)
        : isInternalApiRoute(targetEndpoint)
        ? FALLBACK_GAS_URL
        : targetEndpoint;

    const init: RequestInit = {
      method,
      mode: 'cors',
      redirect: 'follow',
      headers:
        method === 'POST'
          ? { 'Content-Type': 'text/plain;charset=utf-8', Accept: 'application/json, text/csv, text/plain' }
          : { Accept: 'application/json, text/csv, text/plain' },
    };

    if (method === 'POST' && options?.body !== undefined) {
      init.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    }

    const res = await fetch(fetchUrl, init);
    const contentType = res.headers.get('content-type');
    const rawText = await res.text();

    if (isHtmlPayload(contentType, rawText)) {
      throw new Error('HTML_RESPONSE_RECEIVED');
    }

    let parsed: Record<string, any> = {};
    const trimmed = rawText.trim();
    if (trimmed) {
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          parsed = JSON.parse(trimmed);
        } catch {
          throw new Error('INVALID_JSON_RESPONSE');
        }
      } else {
        // Mendukung respons non-HTML seperti Google Sheets CSV / plain text
        parsed = { ok: res.ok, rawText: trimmed };
      }
    }

    return {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      data: parsed,
    };
  };

  if (isInternalApiRoute(url)) {
    if (!isStaticHostingMode) {
      try {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://localhost';
        const apiUrl = new URL(url || '/api', origin);
        if (method === 'GET' && options?.params) {
          Object.entries(options.params).forEach(([k, v]) => apiUrl.searchParams.set(k, v));
        }
        const res = await fetch(apiUrl.toString(), {
          method,
          mode: 'cors',
          redirect: 'follow',
          headers:
            method === 'POST'
              ? { 'Content-Type': 'text/plain;charset=utf-8', Accept: 'application/json, text/csv, text/plain' }
              : { Accept: 'application/json, text/csv, text/plain' },
          body:
            method === 'POST' && options?.body !== undefined
              ? typeof options.body === 'string'
                ? options.body
                : JSON.stringify(options.body)
              : undefined,
        });
        const contentType = res.headers.get('content-type');
        const rawText = await res.text();

        if (!isHtmlPayload(contentType, rawText) && res.ok) {
          const trimmed = rawText.trim();
          const parsed =
            trimmed && (trimmed.startsWith('{') || trimmed.startsWith('['))
              ? JSON.parse(trimmed)
              : { ok: res.ok, rawText: trimmed };
          return {
            ok: res.ok,
            status: res.status,
            statusText: res.statusText,
            data: parsed,
          };
        }

        // Terdeteksi respons HTML dari SPA fallback Cloudflare -> aktifkan mode static hosting permanen
        if (isHtmlPayload(contentType, rawText)) {
          isStaticHostingMode = true;
        }
      } catch {
        isStaticHostingMode = true;
      }
    }

    return executeDirectFetch(FALLBACK_GAS_URL);
  }

  try {
    return await executeDirectFetch(url);
  } catch (err) {
    if (err instanceof Error && err.message === 'HTML_RESPONSE_RECEIVED' && url !== FALLBACK_GAS_URL) {
      isStaticHostingMode = true;
      return executeDirectFetch(FALLBACK_GAS_URL);
    }
    throw err;
  }
}

/**
 * Test koneksi ping ke Web App Google Apps Script
 */
export async function pingGasEndpoint(url: string, passcode?: string): Promise<PingResult> {
  const start = performance.now();
  const effectiveUrl = isInternalApiRoute(url) ? FALLBACK_GAS_URL : url;
  if (!effectiveUrl || !effectiveUrl.startsWith('http')) {
    return {
      success: false,
      latencyMs: 0,
      message: 'URL Web App tidak valid. Pastikan diawali dengan https://script.google.com/macros/s/.../exec',
    };
  }

  try {
    const params: Record<string, string> = { action: 'ping' };
    if (passcode) {
      params.passcode = passcode;
    }

    const res = await fetchGasWithFallback(url, { method: 'GET', params });
    const elapsed = Math.round(performance.now() - start);

    if (res.ok) {
      return {
        success: true,
        latencyMs: elapsed,
        message: `Terhubung dengan sukses (${elapsed} ms)`,
        data: res.data,
      };
    } else {
      return {
        success: false,
        latencyMs: elapsed,
        message: `Server merespons status ${res.status} ${res.statusText}`,
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
  const targetEndpoint = url || FALLBACK_GAS_URL;

  try {
    const res = await fetchGasWithFallback(targetEndpoint, {
      method: 'GET',
      params: { action: 'getPublicLinks' },
    });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);

    const json = res.data;
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
  const targetEndpoint = url || FALLBACK_GAS_URL;

  try {
    const res = await fetchGasWithFallback(targetEndpoint, {
      method: 'GET',
      params: { action: 'getStatistik', token },
    });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);

    const json = res.data;
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
 * Kirim / Simpan sebuah tautan langsung ke Google Spreadsheet via GAS (Push Single Link)
 */
export async function pushGasLink(
  url: string,
  link: Partial<LinkItem>,
  passcode: string = 'bkr153'
): Promise<{ success: boolean; id?: string; error?: string }> {
  const targetEndpoint = url || FALLBACK_GAS_URL;

  // 1. Coba via GET terlebih dahulu (aman terhadap CORS redirect Google Apps Script)
  try {
    const res = await fetchGasWithFallback(targetEndpoint, {
      method: 'GET',
      params: {
        action: 'saveLink',
        passcode,
        link: JSON.stringify(link),
      },
    });
    if (res.ok && res.data && (res.data.success || res.data.ok)) {
      return { success: true, id: res.data.id };
    }
  } catch (getErr) {
    console.warn('GET saveLink fallback to POST:', getErr);
  }

  // 2. Fallback via POST dengan direct CORS jika GET tidak merespons
  try {
    const payload = {
      action: 'saveLink',
      link,
      passcode,
    };

    const res = await fetchGasWithFallback(targetEndpoint, {
      method: 'POST',
      body: payload,
    });

    if (res.ok && res.data && (res.data.success || res.data.ok)) {
      return { success: true, id: res.data.id };
    }
  } catch (postErr) {
    console.warn('POST saveLink error:', postErr);
  }

  return { success: false, error: 'Gagal memperbarui data di spreadsheet' };
}

/**
 * Hapus sebuah tautan dari Google Spreadsheet via GAS (Push Delete Dua Arah)
 */
export async function pushGasDeleteLink(
  url: string,
  id: string,
  passcode: string = 'bkr153',
  label?: string,
  remainingLinks?: LinkItem[]
): Promise<{ success: boolean; error?: string }> {
  const targetEndpoint = url || FALLBACK_GAS_URL;

  // 1. Coba via GET terlebih dahulu
  try {
    const params: Record<string, string> = {
      action: 'deleteLink',
      id,
      passcode,
    };
    if (label) {
      params.label = label;
    }

    const res = await fetchGasWithFallback(targetEndpoint, {
      method: 'GET',
      params,
    });
    if (res.ok && res.data && (res.data.success || res.data.ok)) {
      return { success: true };
    }
  } catch (getErr) {
    console.warn('GET deleteLink fallback to POST:', getErr);
  }

  // 2. Fallback via POST
  try {
    const payload = {
      action: 'deleteLink',
      id,
      label: label || '',
      passcode,
      remainingLinksCount: remainingLinks ? remainingLinks.length : undefined,
    };
    const res = await fetchGasWithFallback(targetEndpoint, {
      method: 'POST',
      body: payload,
    });
    if (res.ok && res.data && (res.data.success || res.data.ok)) {
      return { success: true };
    }
  } catch {
    // ignore
  }

  return { success: false, error: 'Gagal menghapus baris di spreadsheet' };
}

/**
 * Unggah seluruh daftar tautan lokal ke Google Spreadsheet sekaligus (Push All / Seed)
 * Dilakukan per item via pushGasLink agar aman dari batas panjang URL & CORS redirect
 */
export async function pushGasAllLinks(
  url: string,
  links: LinkItem[],
  passcode: string = 'bkr153'
): Promise<{ success: boolean; count?: number; error?: string }> {
  const targetEndpoint = url || FALLBACK_GAS_URL;
  if (!links || links.length === 0) return { success: true, count: 0 };

  try {
    let successCount = 0;
    for (const item of links) {
      const res = await pushGasLink(targetEndpoint, item, passcode);
      if (res.success) {
        successCount++;
      }
      await new Promise((r) => setTimeout(r, 60));
    }
    return { success: successCount > 0, count: successCount };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Catat klik tautan ke spreadsheet (fire and forget)
 */
export function postGasRecordClick(url: string, id: string): void {
  const targetEndpoint = isInternalApiRoute(url) ? FALLBACK_GAS_URL : url;
  if (!targetEndpoint) return;
  try {
    const targetUrl = resolveDirectGasUrl(targetEndpoint, {
      action: 'recordClick',
      id,
    });
    fetch(targetUrl, { mode: 'no-cors', redirect: 'follow' }).catch(() => {});
  } catch {
    // Ignore error
  }
}

/**
 * Catat atau perbarui akses login user ke sheet User_Akses (Upsert via GAS - tanpa duplikasi email)
 */
export async function postGasRecordUserLogin(
  url: string,
  user: UserAccessRecord,
  passcode: string = 'bkr153'
): Promise<{ success: boolean; error?: string }> {
  const targetEndpoint = url || FALLBACK_GAS_URL;
  try {
    const payload = {
      action: 'recordUserAccess',
      user,
      passcode,
    };
    try {
      const res = await fetchGasWithFallback(targetEndpoint, {
        method: 'POST',
        body: payload,
      });
      if (res.ok && res.data && (res.data.success || res.data.ok)) {
        return { success: true };
      }
    } catch {
      // fallback to direct GET no-cors
    }

    const fallbackUrl = resolveDirectGasUrl(targetEndpoint, {
      action: 'recordUserAccess',
      user: JSON.stringify(user),
      passcode,
    });
    fetch(fallbackUrl, { mode: 'no-cors', redirect: 'follow' }).catch(() => {});
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Catat riwayat aktivitas tautan atau login ke sheet Log_Aktivitas (fire and forget)
 */
export function postGasRecordActivity(
  url: string,
  log: ActivityLogEntry,
  passcode: string = 'bkr153'
): void {
  const targetEndpoint = isInternalApiRoute(url) ? FALLBACK_GAS_URL : url;
  if (!targetEndpoint) return;
  try {
    const payload = {
      action: 'recordActivity',
      log,
      passcode,
    };
    fetch(targetEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      mode: 'no-cors',
      redirect: 'follow',
    }).catch(() => {
      const fallbackUrl = resolveDirectGasUrl(targetEndpoint, {
        action: 'recordActivity',
        log: JSON.stringify(log),
        passcode,
      });
      fetch(fallbackUrl, { mode: 'no-cors', redirect: 'follow' }).catch(() => {});
    });
  } catch {
    // Ignore error
  }
}


/**
 * Hasilkan kode Code.gs yang sudah dioptimalkan untuk Google Spreadsheet PT Batu Karang
 */
export function generateProductionCodeGs(): string {
  return `/**
 * ============================================================
 * PT BATU KARANG — DIVISI PRODUKSI I
 * HEADLESS REST WEB APP & GOOGLE SPREADSHEET BACKEND (TWO-WAY SYNC)
 * ============================================================
 *
 * FITUR DUA ARAH (TWO-WAY SYNC):
 * - PULL: Mengambil data real-time dari sheet ke web app secara instan
 * - PUSH: Menyimpan, memperbarui, & menghapus baris di sheet langsung dari web app
 * - CLICK & VISIT TRACKING: Mencatat statistik interaksi real-time ke sheet
 *
 * CARA DEPLOY:
 * 1. Buka Google Spreadsheet Divisi Produksi I.
 * 2. Klik Extensions > Apps Script.
 * 3. Hapus semua kode default dan tempel kode ini (Code.gs).
 * 4. Buka Project Settings (ikon roda gigi) > Script Properties > Add script property:
 *      Property : ADMIN_PASSCODE
 *      Value    : (passcode pilihan Anda, misal: bkr153)
 * 5. Jalankan fungsi "authorizeApp" sekali dari toolbar editor untuk menyetujui izin Sheets.
 * 6. Klik Deploy > New deployment:
 *      - Select type  : Web app
 *      - Description  : Two-Way Sync API PT Batu Karang v2
 *      - Execute as   : Me (divisi1.BKR@gmail.com)
 *      - Who has access: Anyone (agar app frontend bisa membaca dan menulis data)
 * 7. Salin "Web app URL" (akhiran /exec) dan tempelkan ke menu "Integrasi GAS" di Web App.
 * ============================================================
 */

const SHEET_NAME = 'LinkTree';
const SHEET_STATISTIK = 'Statistik';
const SHEET_USER_AKSES = 'User_Akses';
const SHEET_LOG_AKTIVITAS = 'Log_Aktivitas';

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
const USER_AKSES_HEADERS = ['Email', 'Nama', 'Peran', 'TotalAkses', 'PertamaLogin', 'TerakhirAkses', 'Status'];
const LOG_AKTIVITAS_HEADERS = ['Waktu', 'Email', 'Nama', 'Aksi', 'TargetLabel', 'TargetURL'];
const ADMIN_TOKEN_TTL_SECONDS = 6 * 60 * 60; // 6 Jam

// ------------------------------------------------------------
// REST API ENDPOINTS: doGet & doPost
// ------------------------------------------------------------

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'getPublicLinks';
    const token = (e && e.parameter && e.parameter.token) || '';
    const passcode = (e && e.parameter && e.parameter.passcode) || '';

    // Ping check
    if (action === 'ping') {
      return jsonResponse_({ ok: true, message: 'PT Batu Karang GAS API Online (Two-Way Sync)', timestamp: new Date().toISOString() });
    }

    // Ambil data publik (Pull)
    if (action === 'getPublicLinks') {
      const links = getPublicLinksArray_();
      return jsonResponse_({ ok: true, links: links });
    }

    // Catat klik (Public)
    if (action === 'recordClick') {
      const id = (e && e.parameter && e.parameter.id) || '';
      if (id) recordClick_(id);
      return jsonResponse_({ ok: true });
    }

    // Ambil statistik (admin only)
    if (action === 'getStatistik') {
      checkAuth_({ token: token, passcode: passcode });
      const stats = getStatistik_();
      return jsonResponse_(stats);
    }

    // Ambil data admin lengkap (flat links + groups)
    if (action === 'getAdminData') {
      checkAuth_({ token: token, passcode: passcode });
      const data = getAdminData_();
      return jsonResponse_(data);
    }

    // Simpan link via GET (fallback jika POST diblokir CORS)
    if (action === 'saveLink') {
      checkAuth_({ token: token, passcode: passcode });
      const rawLink = e.parameter.link;
      const linkObj = typeof rawLink === 'string' ? JSON.parse(rawLink) : rawLink;
      const res = saveLink_(linkObj);
      return jsonResponse_(res);
    }

    // Hapus link via GET
    if (action === 'deleteLink') {
      checkAuth_({ token: token, passcode: passcode });
      const id = e.parameter.id || '';
      const label = e.parameter.label || '';
      const res = deleteLink_(id, label);
      return jsonResponse_(res);
    }

    // Simpan semua link sekaligus (Push All) via GET
    if (action === 'saveAllLinks') {
      checkAuth_({ token: token, passcode: passcode });
      const rawData = e.parameter.data;
      const linksArr = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      const res = saveAllLinks_(linksArr);
      return jsonResponse_(res);
    }

    // Catat / update login pengguna tanpa duplikasi email (fallback GET)
    if (action === 'recordUserAccess') {
      const rawUser = (e && e.parameter && e.parameter.user) || '{}';
      const userObj = typeof rawUser === 'string' ? JSON.parse(rawUser) : rawUser;
      const res = recordUserAccess_(userObj);
      return jsonResponse_(res);
    }

    // Catat log aktivitas tautan / kunjungan (fallback GET)
    if (action === 'recordActivity') {
      const rawLog = (e && e.parameter && e.parameter.log) || '{}';
      const logObj = typeof rawLog === 'string' ? JSON.parse(rawLog) : rawLog;
      const res = recordActivity_(logObj);
      return jsonResponse_(res);
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
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (ex) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action || '';

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
      if (id) recordClick_(id);
      return jsonResponse_({ ok: true });
    }

    // Catat / update login pengguna (upsert tanpa duplikasi email)
    if (action === 'recordUserAccess') {
      const res = recordUserAccess_(payload.user);
      return jsonResponse_(res);
    }

    // Catat riwayat audit aktivitas tautan
    if (action === 'recordActivity') {
      const res = recordActivity_(payload.log);
      return jsonResponse_(res);
    }

    // Admin Privileged Operations (Push to Sheet)
    checkAuth_(payload);

    if (action === 'saveLink') {
      const res = saveLink_(payload.link);
      return jsonResponse_(res);
    }

    if (action === 'saveAllLinks') {
      const res = saveAllLinks_(payload.links);
      return jsonResponse_(res);
    }

    if (action === 'deleteLink') {
      const res = deleteLink_(payload.id, payload.label);
      return jsonResponse_(res);
    }

    if (action === 'reorderLinks') {
      const res = reorderLinks_(payload.orderedIds);
      return jsonResponse_(res);
    }

    return jsonResponse_({ ok: false, message: 'Aksi POST tidak dikenal: ' + action });
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

function checkAuth_(payload) {
  const token = (payload && payload.token) || '';
  const passcode = (payload && payload.passcode) || '';

  if (passcode) {
    const stored = getStoredPasscode_();
    if (String(passcode).trim() === String(stored).trim()) {
      return true;
    }
  }

  if (token) {
    const cached = CacheService.getScriptCache().get('admintoken_' + token);
    if (cached === 'valid') return true;
  }

  throw new Error('Otorisasi gagal: Passcode atau token admin tidak valid.');
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

function saveAllLinks_(links) {
  const sheet = getSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, HEADERS.length).clearContent();
  }
  if (!links || !links.length) return { success: true, count: 0 };

  const nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
  const rows = links.map(function(l) {
    const tipe = (l && l.tipe === 'Grup') ? 'Grup' : 'Link';
    const parentId = tipe === 'Grup' ? '' : ((l && l.parentId) || '');
    const id = (l && l.id) || ((tipe === 'Grup' ? 'GRP-' : 'LNK-') + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyMMddHHmmss'));
    return [
      id,
      l.label || '',
      tipe === 'Grup' ? '' : (l.url || ''),
      l.icon || (tipe === 'Grup' ? '🗂️' : '🔗'),
      l.kategori || 'Operasional & Lini',
      l.deskripsi || '',
      Number(l.urutan) || 10,
      String(l.aktif).toUpperCase() === 'TRUE' ? 'TRUE' : 'FALSE',
      String(l.pinned).toUpperCase() === 'TRUE' ? 'TRUE' : 'FALSE',
      Number(l.klik) || 0,
      nowStr,
      tipe,
      parentId
    ];
  });

  sheet.getRange(2, 1, rows.length, HEADERS.length).setValues(rows);
  return { success: true, count: rows.length };
}

function deleteLink_(id, label) {
  const sheet = getSheet_();
  const data = sheet.getDataRange().getValues();
  const idIdx = HEADERS.indexOf('ID');
  const labelIdx = HEADERS.indexOf('Label');
  const parentIdx = HEADERS.indexOf('ParentID');

  const cleanId = id ? String(id).trim() : '';
  const cleanLabel = label ? String(label).trim().toLowerCase() : '';

  const rowsToDelete = [];
  for (let r = 1; r < data.length; r++) {
    const rowId = String(data[r][idIdx] || '').trim();
    const rowLabel = String(data[r][labelIdx] || '').trim().toLowerCase();
    const rowParent = String(data[r][parentIdx] || '').trim();

    const matchId = cleanId && (rowId === cleanId || rowParent === cleanId);
    const matchLabel = cleanLabel && (rowLabel === cleanLabel || rowLabel.indexOf(cleanLabel) !== -1 || cleanLabel.indexOf(rowLabel) !== -1);

    if (matchId || matchLabel) {
      rowsToDelete.push(r + 1);
    }
  }
  if (!rowsToDelete.length) return { success: false, message: 'ID atau Label tidak ditemukan di spreadsheet' };

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

function getUserAksesSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_USER_AKSES);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_USER_AKSES);
    sheet.appendRow(USER_AKSES_HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getLogAktivitasSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_LOG_AKTIVITAS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_LOG_AKTIVITAS);
    sheet.appendRow(LOG_AKTIVITAS_HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function recordUserAccess_(user) {
  if (!user || !user.email) return { success: false, message: 'Email tidak boleh kosong' };
  const sheet = getUserAksesSheet_();
  const data = sheet.getDataRange().getValues();
  const targetEmail = String(user.email).trim().toLowerCase();
  const nowIso = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');

  // Cari baris email yang sama (Anti-Duplikasi baris baru)
  for (let r = 1; r < data.length; r++) {
    const rowEmail = String(data[r][0] || '').trim().toLowerCase();
    if (rowEmail === targetEmail) {
      // Sudah pernah login sebelumnya: update jumlah login (+1) dan waktu terakhir akses
      const currentCount = Number(data[r][3]) || 1;
      const updatedCount = currentCount + 1;
      sheet.getRange(r + 1, 2).setValue(user.nama || data[r][1]);
      if (user.peran) sheet.getRange(r + 1, 3).setValue(user.peran);
      sheet.getRange(r + 1, 4).setValue(updatedCount);
      sheet.getRange(r + 1, 6).setValue(nowIso);
      sheet.getRange(r + 1, 7).setValue('Aktif');
      return { success: true, updated: true, totalAkses: updatedCount };
    }
  }

  // Belum pernah login: tambahkan baris baru
  const newRow = sheet.getLastRow() + 1;
  sheet.getRange(newRow, 1).setNumberFormat('@').setValue(user.email.trim());
  sheet.getRange(newRow, 2).setValue(user.nama || '-');
  sheet.getRange(newRow, 3).setValue(user.peran || 'Pengguna');
  sheet.getRange(newRow, 4).setValue(Number(user.totalAkses) || 1);
  sheet.getRange(newRow, 5).setValue(user.pertamaLogin || nowIso);
  sheet.getRange(newRow, 6).setValue(user.terakhirAkses || nowIso);
  sheet.getRange(newRow, 7).setValue('Aktif');
  return { success: true, inserted: true, totalAkses: 1 };
}

function recordActivity_(log) {
  if (!log) return { success: false };
  const sheet = getLogAktivitasSheet_();
  const nowIso = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
  const newRow = sheet.getLastRow() + 1;
  sheet.getRange(newRow, 1).setValue(log.timestamp || nowIso);
  sheet.getRange(newRow, 2).setNumberFormat('@').setValue(log.userEmail || '-');
  sheet.getRange(newRow, 3).setValue(log.userName || '-');
  sheet.getRange(newRow, 4).setValue(log.actionType || 'AKSES');
  sheet.getRange(newRow, 5).setValue(log.targetLabel || '-');
  sheet.getRange(newRow, 6).setValue(log.targetUrl || '-');
  return { success: true };
}

function authorizeApp() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getSheet_();
  const stat = getStatistikSheet_();
  const userSheet = getUserAksesSheet_();
  const logSheet = getLogAktivitasSheet_();
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
