import React, { useState } from 'react';
import {
  X,
  KeyRound,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Lock,
  RefreshCw,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { StaffMember, DEFAULT_STAFF_PIN } from '../types';
import {
  getStoredStaffList,
  authenticateStaff,
  changeStaffPin,
  setActiveStaffSession,
} from '../services/storage';

interface StaffAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStaff: StaffMember | null;
  onStaffSessionChange: (staff: StaffMember | null) => void;
  showToast: (msg: string) => void;
}

export const StaffAuthModal: React.FC<StaffAuthModalProps> = ({
  isOpen,
  onClose,
  activeStaff,
  onStaffSessionChange,
  showToast,
}) => {
  const staffList = getStoredStaffList().filter((s) => s.aktif);

  const [mode, setMode] = useState<'login' | 'changePin'>('login');
  const [selectedStaffId, setSelectedStaffId] = useState<string>(
    activeStaff ? activeStaff.id : (staffList[0]?.id || '')
  );
  const [pinInput, setPinInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Change PIN fields
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedStaffId) {
      setErrorMessage('Pilih staf terlebih dahulu.');
      return;
    }

    const res = authenticateStaff(selectedStaffId, pinInput);
    if (res.success && res.staff) {
      onStaffSessionChange(res.staff);
      showToast(`Mode Edit Aktif: Selamat bertugas, ${res.staff.nama}!`);
      setPinInput('');
      onClose();
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!activeStaff) return;

    if (newPin !== confirmPin) {
      setErrorMessage('Konfirmasi PIN baru tidak cocok.');
      return;
    }

    if (newPin.length < 4) {
      setErrorMessage('PIN baru minimal harus 4 digit angka.');
      return;
    }

    const res = changeStaffPin(activeStaff.id, oldPin, newPin);
    if (res.success) {
      showToast('PIN Anda berhasil diperbarui.');
      setOldPin('');
      setNewPin('');
      setConfirmPin('');
      setMode('login');
      onClose();
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleLogoutStaff = () => {
    setActiveStaffSession(null);
    onStaffSessionChange(null);
    showToast('Sesi staf telah ditutup.');
    onClose();
  };

  const selectedStaffObj = staffList.find((s) => s.id === selectedStaffId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                {activeStaff && mode === 'changePin' ? 'Ganti PIN Pribadi' : 'Masuk Mode Edit Staf'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {activeStaff
                  ? `Sesi Aktif: ${activeStaff.nama}`
                  : 'Autentikasi penanggung jawab unit untuk mengedit link'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {activeStaff && mode !== 'changePin' ? (
            /* Jika sudah login, tampilkan info staf aktif & aksi */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200/90 text-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-700 mb-1">
                  <UserCheck className="w-4 h-4" />
                  <span>Staf Sedang Bertugas</span>
                </div>
                <h4 className="font-black text-base text-slate-900">{activeStaff.nama}</h4>
                <p className="text-xs text-slate-600">{activeStaff.jabatan} · {activeStaff.unit}</p>
                <div className="mt-2 text-[11px] text-slate-500 font-mono">
                  Izin Edit: {activeStaff.allowedLinkIds.length} tautan/grup
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setMode('changePin')}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-colors"
                >
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Ganti PIN Saya</span>
                </button>

                <button
                  type="button"
                  onClick={handleLogoutStaff}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-xs font-bold text-slate-600 transition-colors"
                >
                  Keluar dari Sesi Staf
                </button>
              </div>
            </div>
          ) : mode === 'changePin' && activeStaff ? (
            /* Form Ganti PIN Mandiri */
            <form onSubmit={handleChangePin} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">PIN Lama</label>
                <input
                  type="password"
                  required
                  maxLength={10}
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value)}
                  placeholder="Masukkan PIN saat ini"
                  className="w-full text-center font-mono tracking-widest text-base bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">PIN Baru (Min. 4 digit)</label>
                <input
                  type="password"
                  required
                  maxLength={10}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="PIN baru Anda"
                  className="w-full text-center font-mono tracking-widest text-base bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Konfirmasi PIN Baru</label>
                <input
                  type="password"
                  required
                  maxLength={10}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="Ulangi PIN baru"
                  className="w-full text-center font-mono tracking-widest text-base bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {errorMessage && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage('');
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
                >
                  Simpan PIN Baru
                </button>
              </div>
            </form>
          ) : (
            /* Form Login Staf via PIN */
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pilih Akun Staf / Penanggung Jawab
                </label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => {
                    setSelectedStaffId(e.target.value);
                    setErrorMessage('');
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({s.jabatan}) — Unit {s.unit}
                    </option>
                  ))}
                </select>
                {selectedStaffObj && (
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Email: <span className="font-mono">{selectedStaffObj.email}</span> · Berhak edit:{' '}
                    <strong>{selectedStaffObj.allowedLinkIds.length} link</strong>
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Masukkan PIN Anda</label>
                  <span className="text-[10px] text-slate-400">PIN Standar: {DEFAULT_STAFF_PIN}</span>
                </div>
                <input
                  type="password"
                  required
                  autoFocus
                  maxLength={10}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="PIN 4-6 digit"
                  className="w-full text-center font-mono tracking-widest text-lg bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {errorMessage && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 justify-center">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>Masuk Mode Edit</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 border-t border-slate-100 text-center text-[11px] text-slate-500">
                Lupa PIN? Hubungi <strong>Developer / Super Admin</strong> untuk reset ke PIN standar.
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
