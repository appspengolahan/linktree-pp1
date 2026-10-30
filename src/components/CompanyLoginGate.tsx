import React, { useState } from 'react';
import {
  Lock,
  User,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Building2,
} from 'lucide-react';
import { CompanyUser, Role, StaffMember, DEFAULT_STAFF_PIN } from '../types';
import {
  getStoredStaffList,
  saveAuthenticatedCompanyUser,
  setActiveStaffSession,
  saveUserRole,
} from '../services/storage';
import { Logo153 } from './Logo153';

interface CompanyLoginGateProps {
  onLoginSuccess: (user: CompanyUser) => void;
  showToast?: (msg: string) => void;
}

export const CompanyLoginGate: React.FC<CompanyLoginGateProps> = ({
  onLoginSuccess,
  showToast,
}) => {
  const staffList = getStoredStaffList().filter((s) => s.aktif);

  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanNama = nama.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPin = pin.trim();

    if (!cleanNama) {
      setErrorMessage('Silakan masukkan nama lengkap Anda.');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Silakan masukkan alamat email yang valid.');
      return;
    }

    if (!cleanPin) {
      setErrorMessage('Silakan masukkan PIN akses Anda.');
      return;
    }

    setIsSubmitting(true);

    // Cari apakah profil cocok dengan daftar staf internal
    const matchedStaff = staffList.find(
      (s) =>
        s.email.toLowerCase() === cleanEmail ||
        s.nama.toLowerCase() === cleanNama.toLowerCase()
    );

    // Verifikasi PIN:
    // 1. PIN Standar Perusahaan: DEFAULT_STAFF_PIN ('123456')
    // 2. PIN Staf kustom jika staf telah mengganti PIN sendiri
    // 3. Master passcode 'bkr153'
    let isPinValid = false;
    if (cleanPin === DEFAULT_STAFF_PIN || cleanPin === 'bkr153') {
      isPinValid = true;
    } else if (matchedStaff && String(matchedStaff.pin).trim() === cleanPin) {
      isPinValid = true;
    }

    if (!isPinValid) {
      setIsSubmitting(false);
      setErrorMessage('PIN akses salah. Masukkan PIN yang valid.');
      return;
    }

    // Tentukan Role & Unit
    // FULL AKSES HANYA: Developer, Site Engineer, Manajer operasional
    let determinedRole: Role = 'Admin';
    let determinedJabatan = 'Karyawan Operasional';
    let determinedUnit = 'Divisi Produksi I';
    let staffId: string | undefined = undefined;

    if (matchedStaff) {
      staffId = matchedStaff.id;
      determinedJabatan = matchedStaff.jabatan;
      determinedUnit = matchedStaff.unit;
      if (['Developer', 'Site Engineer', 'Manajer operasional'].includes(matchedStaff.jabatan)) {
        determinedRole = matchedStaff.jabatan as Role;
      } else {
        determinedRole = 'Admin';
      }
    } else if (cleanEmail === 'divisi1.bkr@gmail.com' || cleanPin === 'bkr153') {
      determinedRole = 'Developer';
      determinedJabatan = 'Site Engineer & Developer';
      determinedUnit = 'DevOps & Engineering';
    } else {
      determinedRole = 'Admin';
      determinedJabatan = 'Karyawan / Pengunjung Terverifikasi';
      determinedUnit = 'Divisi Produksi I';
    }

    const companyUser: CompanyUser = {
      nama: cleanNama,
      email: cleanEmail,
      jabatan: determinedJabatan,
      unit: determinedUnit,
      role: determinedRole,
      staffId: staffId,
      loginAt: new Date().toISOString(),
    };

    // Simpan ke local cache agar kunjungan berikutnya otomatis lolos tanpa login ulang
    if (rememberMe) {
      saveAuthenticatedCompanyUser(companyUser);
    }

    // Jika user adalah staf terdaftar, aktifkan sesi staf sekaligus agar wewenang edit langsung terbuka
    if (matchedStaff) {
      setActiveStaffSession(matchedStaff);
    } else {
      // Buat sesi staf standar (tanpa wildcard, hanya baca)
      const autoStaff: StaffMember = {
        id: staffId || `STF-${Date.now().toString().slice(-4)}`,
        nama: cleanNama,
        jabatan: determinedJabatan,
        email: cleanEmail,
        pin: cleanPin,
        unit: determinedUnit,
        allowedLinkIds: determinedRole === 'Developer' || determinedRole === 'Site Engineer' ? ['*'] : [],
        aktif: true,
      };
      setActiveStaffSession(autoStaff);
    }

    saveUserRole(determinedRole);

    if (showToast) {
      showToast(`Selamat datang, ${cleanNama}!`);
    }

    setIsSubmitting(false);
    onLoginSuccess(companyUser);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background Lighting Effects */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-slate-950 to-slate-950 pointer-events-none" />

      {/* Main Container */}
      <div className="relative w-full max-w-lg z-10">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl">
          {/* Header Banner */}
          <div className="px-6 sm:px-8 pt-8 pb-6 text-center border-b border-slate-800/80 bg-linear-to-b from-slate-800/40 to-transparent">
            <div className="flex justify-center mb-4">
              <div className="p-1 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-lg">
                <Logo153 size="lg" />
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Akses Internal Terproteksi</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
              PT. BATU KARANG
            </h1>
            <p className="text-sm font-bold text-blue-400 tracking-wide uppercase mt-0.5">
              Divisi Produksi I — Portal Terpadu 153
            </p>
            <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
              Direktori tautan khusus karyawan &amp; staf operasional. Masuk menggunakan identitas Anda untuk mengelola dan mengakses tautan internal.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="p-6 sm:p-8 space-y-4">
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div className="leading-relaxed">{errorMessage}</div>
              </div>
            )}

            {/* Nama Input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Nama Lengkap / Panggilan
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Masukkan nama lengkap Anda"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition"
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Perusahaan / Email Aktif
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan alamat email Anda"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition"
                />
              </div>
            </div>

            {/* PIN Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  PIN Akses
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPin ? 'text' : 'password'}
                  required
                  autoComplete="off"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Masukkan PIN Anda"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition font-mono tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition"
                  tabIndex={-1}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-xs text-slate-300 leading-snug">
                  <strong className="text-white">Simpan sesi di perangkat ini</strong> — berikutnya langsung masuk otomatis tanpa perlu login ulang.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <Lock className="w-4 h-4" />
              <span>Masuk ke Portal Internal Divisi Produksi I</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Footer Info */}
          <div className="px-6 sm:px-8 py-3.5 bg-slate-950/70 border-t border-slate-800/70 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>PT Batu Karang — Hak Cipta Divisi Produksi I &copy; {new Date().getFullYear()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
