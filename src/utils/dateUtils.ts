/**
 * Utilitas Tanggal & Waktu WIB (UTC+7) Berperforma Tinggi
 * Menggunakan aritmetika UTC+7 langsung + cache memoization agar
 * tidak memicu alokasi Intl.DateTimeFormat berulang di dalam loop render mobile.
 */

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const shortDateTimeCache = new Map<string, string>();
const mediumDateTimeCache = new Map<string, string>();

const pad2 = (n: number): string => (n < 10 ? `0${n}` : String(n));

/**
 * Menghasilkan kunci tanggal hari ini dalam zona waktu WIB (UTC+7) berformat YYYY-MM-DD
 */
export function getWibTodayKey(nowMs: number = Date.now()): string {
  const wib = new Date(nowMs + WIB_OFFSET_MS);
  const y = wib.getUTCFullYear();
  const m = pad2(wib.getUTCMonth() + 1);
  const d = pad2(wib.getUTCDate());
  return `${y}-${m}-${d}`;
}

/**
 * Memformat ISO timestamp atau string tanggal ke format ringkas WIB (dd/MM/yy HH.mm)
 * dengan memoization cache.
 */
export function formatWibDateTimeShort(input?: string | number | null): string {
  if (input === undefined || input === null || input === '') return '-';
  const key = String(input);
  const cached = shortDateTimeCache.get(key);
  if (cached !== undefined) return cached;

  const ms = typeof input === 'number' ? input : Date.parse(key);
  if (Number.isNaN(ms)) {
    return key;
  }

  const wib = new Date(ms + WIB_OFFSET_MS);
  const dd = pad2(wib.getUTCDate());
  const mm = pad2(wib.getUTCMonth() + 1);
  const yy = String(wib.getUTCFullYear()).slice(-2);
  const hh = pad2(wib.getUTCHours());
  const min = pad2(wib.getUTCMinutes());
  const formatted = `${dd}/${mm}/${yy} ${hh}.${min}`;

  if (shortDateTimeCache.size > 1000) {
    shortDateTimeCache.clear();
  }
  shortDateTimeCache.set(key, formatted);
  return formatted;
}

/**
 * Memformat ISO timestamp atau string tanggal ke format WIB lengkap detik (dd/MM/yy HH.mm.ss)
 * dengan memoization cache.
 */
export function formatWibDateTimeMedium(input?: string | number | null): string {
  if (input === undefined || input === null || input === '') return '-';
  const key = String(input);
  const cached = mediumDateTimeCache.get(key);
  if (cached !== undefined) return cached;

  const ms = typeof input === 'number' ? input : Date.parse(key);
  if (Number.isNaN(ms)) {
    return key;
  }

  const wib = new Date(ms + WIB_OFFSET_MS);
  const dd = pad2(wib.getUTCDate());
  const mm = pad2(wib.getUTCMonth() + 1);
  const yy = String(wib.getUTCFullYear()).slice(-2);
  const hh = pad2(wib.getUTCHours());
  const min = pad2(wib.getUTCMinutes());
  const sec = pad2(wib.getUTCSeconds());
  const formatted = `${dd}/${mm}/${yy} ${hh}.${min}.${sec}`;

  if (mediumDateTimeCache.size > 1000) {
    mediumDateTimeCache.clear();
  }
  mediumDateTimeCache.set(key, formatted);
  return formatted;
}
