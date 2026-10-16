import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  BarChart3,
  ListPlus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  LogOut,
  FolderPlus,
  CheckCircle2,
  AlertCircle,
  Pin,
  Users,
  KeyRound,
  RotateCcw,
  CheckSquare,
  Square,
  ShieldAlert,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { LinkItem, StatistikData, GasConfig, StaffMember, DEFAULT_STAFF_PIN } from '../types';
import { Logo153 } from './Logo153';
import {
  saveOrUpdateLink,
  deleteStoredLink,
  reorderStoredLinks,
  getStoredStaffList,
  saveOrUpdateStaff,
  deleteStoredStaff,
  resetStaffPinByAdmin,
  resetAllStaffPinsToDefault,
} from '../services/storage';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  allLinks: LinkItem[];
  stats: StatistikData;
  gasConfig: GasConfig;
  onDataChanged: () => void;
  initialTab?: 'stats' | 'links' | 'staff';
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  allLinks,
  stats,
  gasConfig,
  onDataChanged,
  initialTab,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('bkr_admin_token') === 'valid';
  });
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [activeTab, setActiveTab] = useState<'stats' | 'links' | 'staff'>(initialTab || 'stats');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // Staff State
  const [staffList, setStaffList] = useState<StaffMember[]>(getStoredStaffList());
  const [isStaffFormOpen, setIsStaffFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Partial<StaffMember> | null>(null);
  const [staffNama, setStaffNama] = useState('');
  const [staffJabatan, setStaffJabatan] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPin, setStaffPin] = useState(DEFAULT_STAFF_PIN);
  const [staffUnit, setStaffUnit] = useState('Operasional & Lini');
  const [staffAllowedLinkIds, setStaffAllowedLinkIds] = useState<string[]>([]);
  const [staffAktif, setStaffAktif] = useState(true);

  // Show/Hide PIN State
  const [showPins, setShowPins] = useState<Record<string, boolean>>({});

  // Developer Reset PIN Modal State
  const [resetPinTarget, setResetPinTarget] = useState<StaffMember | null>(null);
  const [resetPinChoice, setResetPinChoice] = useState<'standard' | 'custom'>('standard');
  const [customResetPinValue, setCustomResetPinValue] = useState<string>('');

  // Link Form Modal State (Add/Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<Partial<LinkItem> | null>(null);
  const [formTipe, setFormTipe] = useState<'Link' | 'Grup'>('Link');
  const [formLabel, setFormLabel] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formParentId, setFormParentId] = useState('');
  const [formIcon, setFormIcon] = useState('🔗');
  const [formKategori, setFormKategori] = useState('Operasional & Lini');
  const [formDeskripsi, setFormDeskripsi] = useState('');
  const [formUrutan, setFormUrutan] = useState(10);
  const [formAktif, setFormAktif] = useState(true);
  const [formPinned, setFormPinned] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleVerifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    setPasscodeError('');
    const validCode = gasConfig.adminPasscode || 'bkr153';

    if (passcode.trim() === validCode.trim()) {
      sessionStorage.setItem('bkr_admin_token', 'valid');
      setIsAuthenticated(true);
      setPasscode('');
    } else {
      setPasscodeError('Passcode salah. Silakan periksa kembali passcode admin Anda.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('bkr_admin_token');
    setIsAuthenticated(false);
    setPasscode('');
  };

  const grupList = allLinks.filter((l) => l.tipe === 'Grup');

  // ---------- LINK CRUD ----------
  const openAddModal = (parentId = '', tipe: 'Link' | 'Grup' = 'Link') => {
    setEditingLink(null);
    setFormTipe(tipe);
    setFormLabel('');
    setFormUrl('');
    setFormParentId(parentId);
    setFormIcon(tipe === 'Grup' ? '🗂️' : '🔗');
    setFormKategori('Operasional & Lini');
    setFormDeskripsi('');
    setFormUrutan((allLinks.length + 1) * 10);
    setFormAktif(true);
    setFormPinned(false);
    setIsFormOpen(true);
  };

  const openEditModal = (link: LinkItem) => {
    setEditingLink(link);
    setFormTipe(link.tipe);
    setFormLabel(link.label);
    setFormUrl(link.url || '');
    setFormParentId(link.parentId || '');
    setFormIcon(link.icon || (link.tipe === 'Grup' ? '🗂️' : '🔗'));
    setFormKategori(link.kategori || 'Operasional & Lini');
    setFormDeskripsi(link.deskripsi || '');
    setFormUrutan(link.urutan || 10);
    setFormAktif(String(link.aktif).toUpperCase() === 'TRUE');
    setFormPinned(String(link.pinned).toUpperCase() === 'TRUE');
    setIsFormOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (formTipe === 'Link' && !formUrl.trim()) {
      alert('URL wajib diisi untuk Tipe Link.');
      return;
    }

    const payload: Partial<LinkItem> = {
      id: editingLink?.id,
      label: formLabel,
      url: formTipe === 'Grup' ? '' : formUrl,
      icon: formIcon,
      kategori: formKategori,
      deskripsi: formDeskripsi,
      urutan: Number(formUrutan),
      aktif: formAktif,
      pinned: formTipe === 'Grup' ? false : formPinned,
      tipe: formTipe,
      parentId: formTipe === 'Grup' ? '' : formParentId,
    };

    saveOrUpdateLink(payload);
    setIsFormOpen(false);
    onDataChanged();
    showToast(editingLink ? 'Tautan berhasil diperbarui.' : 'Tautan baru berhasil disimpan.');
  };

  const handleDelete = (id: string, label: string, isGroup: boolean) => {
    const childCount = allLinks.filter((l) => l.parentId === id).length;
    let message = `Hapus "${label}"?`;
    if (isGroup && childCount > 0) {
      message = `Grup "${label}" memiliki ${childCount} tautan di dalamnya. Seluruh tautan anak akan IKUT TERHAPUS. Tindakan ini tidak dapat dibatalkan. Lanjutkan?`;
    }

    if (window.confirm(message)) {
      deleteStoredLink(id);
      onDataChanged();
      showToast('Data berhasil dihapus.');
    }
  };

  const handleMove = (id: string, direction: 'up' | 'down', parentId: string) => {
    const scopedLinks = allLinks
      .filter((l) => (parentId ? l.parentId === parentId : !l.parentId))
      .sort((a, b) => a.urutan - b.urutan);

    const currentIndex = scopedLinks.findIndex((l) => l.id === id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= scopedLinks.length) return;

    const reorderedIds = scopedLinks.map((l) => l.id);
    const temp = reorderedIds[currentIndex];
    reorderedIds[currentIndex] = reorderedIds[targetIndex];
    reorderedIds[targetIndex] = temp;

    reorderStoredLinks(reorderedIds);
    onDataChanged();
  };

  // ---------- STAFF & PIN CRUD ----------
  const openAddStaffModal = () => {
    setEditingStaff(null);
    setStaffNama('');
    setStaffJabatan('');
    setStaffEmail('');
    setStaffPin(DEFAULT_STAFF_PIN);
    setStaffUnit('Operasional & Lini');
    setStaffAllowedLinkIds([]);
    setStaffAktif(true);
    setIsStaffFormOpen(true);
  };

  const openEditStaffModal = (staff: StaffMember) => {
    setEditingStaff(staff);
    setStaffNama(staff.nama);
    setStaffJabatan(staff.jabatan);
    setStaffEmail(staff.email);
    setStaffPin(staff.pin);
    setStaffUnit(staff.unit);
    setStaffAllowedLinkIds(staff.allowedLinkIds || []);
    setStaffAktif(staff.aktif);
    setIsStaffFormOpen(true);
  };

  const handleSaveStaffForm = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Partial<StaffMember> = {
      id: editingStaff?.id,
      nama: staffNama,
      jabatan: staffJabatan,
      email: staffEmail,
      pin: staffPin || DEFAULT_STAFF_PIN,
      unit: staffUnit,
      allowedLinkIds: staffAllowedLinkIds,
      aktif: staffAktif,
    };

    saveOrUpdateStaff(payload);
    setStaffList(getStoredStaffList());
    setIsStaffFormOpen(false);
    showToast(editingStaff ? `Data staf ${staffNama} berhasil diperbarui.` : `Staf baru ${staffNama} berhasil ditambahkan.`);
  };

  const openResetPinModal = (staff: StaffMember) => {
    setResetPinTarget(staff);
    setResetPinChoice('standard');
    setCustomResetPinValue('');
  };

  const handleConfirmResetPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPinTarget) return;

    let targetPin = DEFAULT_STAFF_PIN;
    if (resetPinChoice === 'custom') {
      const trimmed = customResetPinValue.trim();
      if (!trimmed || trimmed.length < 4) {
        alert('PIN kustom minimal harus 4 digit angka.');
        return;
      }
      targetPin = trimmed;
    }

    const res = resetStaffPinByAdmin(resetPinTarget.id, targetPin);
    setStaffList(getStoredStaffList());
    setResetPinTarget(null);
    showToast(res.message);
  };

  const handleResetAllPins = () => {
    if (
      window.confirm(
        `PERINGATAN DEVELOPER / SUPER ADMIN:\n\nApakah Anda yakin ingin mereset PIN SELURUH staf (${staffList.length} orang) ke PIN standar (${DEFAULT_STAFF_PIN})?\n\nTindakan ini akan mengembalikan semua akun ke PIN awal pabrik.`
      )
    ) {
      const res = resetAllStaffPinsToDefault();
      setStaffList(getStoredStaffList());
      showToast(res.message);
    }
  };

  const handleDeleteStaff = (staff: StaffMember) => {
    if (window.confirm(`Hapus akses staf ${staff.nama} (${staff.jabatan})? Staf ini tidak akan dapat login lagi.`)) {
      deleteStoredStaff(staff.id);
      setStaffList(getStoredStaffList());
      showToast(`Staf ${staff.nama} telah dihapus.`);
    }
  };

  const toggleAllowedLinkId = (id: string) => {
    setStaffAllowedLinkIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Passcode Gate Screen */}
        {!isAuthenticated ? (
          <div className="p-6 sm:p-10 flex flex-col items-center justify-center text-center my-auto">
            <div className="mb-4">
              <Logo153 size="lg" />
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold mb-2">
              <Lock className="w-3.5 h-3.5 text-blue-600" />
              <span>Gerbang Akses Administrator</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Panel Pengelola Direktori PP1
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mt-1 leading-relaxed">
              Masukkan passcode admin untuk mengelola link, hak akses staf per unit, dan analitik pabrik.
            </p>

            <form onSubmit={handleVerifyPasscode} className="mt-6 w-full max-w-xs space-y-3">
              <div className="relative">
                <input
                  type="password"
                  placeholder="Passcode Admin"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  autoFocus
                  required
                  className="w-full text-center tracking-widest text-lg font-mono bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                />
              </div>

              {passcodeError && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 justify-center">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{passcodeError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-blue-600 text-white font-bold text-sm rounded-xl shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Masuk ke Panel Admin
              </button>
            </form>

            <div className="mt-6 text-[11px] text-slate-400">
              Passcode default: <span className="font-mono font-bold text-slate-600">bkr153</span>
            </div>

            <button
              onClick={onClose}
              className="mt-4 text-xs text-slate-500 hover:text-slate-800 underline underline-offset-4"
            >
              Kembali ke Halaman Publik
            </button>
          </div>
        ) : (
          /* Authenticated Admin Workspace */
          <>
            {/* Top Toolbar */}
            <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Logo153 size="sm" />
                <div>
                  <h2 className="font-black text-sm sm:text-base tracking-tight leading-tight">
                    Panel Admin — Divisi Produksi I
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Kelola tautan, hak edit staf per unit, dan pantau statistik kunjungan pabrik
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                  title="Keluar dari sesi admin"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs (3 Tabs) */}
            <div className="px-6 pt-3 pb-0 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <button
                onClick={() => setActiveTab('stats')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                  activeTab === 'stats'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Statistik &amp; Tren</span>
              </button>

              <button
                onClick={() => setActiveTab('links')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                  activeTab === 'links'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <ListPlus className="w-4 h-4" />
                <span>Kelola Link &amp; Grup ({allLinks.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('staff')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                  activeTab === 'staff'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Kelola Staf &amp; PIN ({staffList.length})</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              {/* TAB 1: STATISTIK */}
              {activeTab === 'stats' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="p-4 rounded-2xl bg-linear-to-br from-slate-900 to-blue-900 text-white shadow-sm">
                      <span className="text-xs text-blue-200 font-medium">Total Kunjungan</span>
                      <div className="text-2xl sm:text-3xl font-black font-mono-numbers mt-1">
                        {stats.totalKunjungan.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-blue-300">Sejak aplikasi diluncurkan</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-slate-800 shadow-xs">
                      <span className="text-xs text-blue-700 font-semibold">Kunjungan Hari Ini</span>
                      <div className="text-2xl sm:text-3xl font-black font-mono-numbers text-blue-900 mt-1">
                        {stats.kunjunganHariIni.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-blue-600">Shift 1, 2, dan 3</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-slate-800 shadow-xs">
                      <span className="text-xs text-emerald-700 font-semibold">Total Klik Tautan</span>
                      <div className="text-2xl sm:text-3xl font-black font-mono-numbers text-emerald-900 mt-1">
                        {stats.totalKlik.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-emerald-600">Aktivitas akses dokumen</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800 shadow-xs">
                      <span className="text-xs text-slate-600 font-semibold">Total Tautan Aktif</span>
                      <div className="text-2xl sm:text-3xl font-black font-mono-numbers text-slate-900 mt-1">
                        {stats.totalLinkAktif}
                      </div>
                      <span className="text-[10px] text-slate-500">Tampil di portal publik</span>
                    </div>
                  </div>

                  {/* Tren Kunjungan 14 Hari */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Tren Kunjungan Harian (14 Hari Terakhir)
                      </h4>
                      <span className="text-[11px] font-mono text-slate-500">1 baris/hari teragregasi</span>
                    </div>

                    {stats.trend14Hari.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center">Belum ada data kunjungan.</p>
                    ) : (
                      <div className="flex items-end gap-2 h-36 pt-4 px-2">
                        {(() => {
                          const maxCount = Math.max(...stats.trend14Hari.map((d) => d.jumlah), 1);
                          return stats.trend14Hari.map((day, idx) => {
                            const pct = Math.max(8, Math.round((day.jumlah / maxCount) * 100));
                            const shortDate = day.tanggal.slice(5).replace('-', '/');
                            return (
                              <div
                                key={idx}
                                className="flex-1 flex flex-col items-center justify-end h-full group"
                                title={`${day.tanggal}: ${day.jumlah} kunjungan`}
                              >
                                <span className="text-[10px] font-mono font-bold text-slate-700 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {day.jumlah}
                                </span>
                                <div
                                  style={{ height: `${pct}%` }}
                                  className="w-full bg-blue-600 group-hover:bg-blue-700 rounded-t-md transition-all shadow-xs"
                                />
                                <span className="text-[9px] font-mono text-slate-500 mt-1.5 truncate max-w-full">
                                  {shortDate}
                                </span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Top Tautan Terpopuler */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                      Tautan &amp; Grup Paling Sering Dibuka
                    </h4>
                    <div className="divide-y divide-slate-100">
                      {stats.topLinks.map((item, idx) => (
                        <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-400 w-4">{idx + 1}.</span>
                            <span className="font-bold text-slate-800">{item.label}</span>
                            {item.tipe === 'Grup' && (
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                                Grup
                              </span>
                            )}
                          </div>
                          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                            {item.klik.toLocaleString()} klik
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: KELOLA LINK & GRUP */}
              {activeTab === 'links' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                    <div className="text-xs text-slate-500">
                      Gunakan tombol panah <span className="font-mono">▲ ▼</span> untuk mengubah urutan tampilan.
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openAddModal('', 'Grup')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors"
                      >
                        <FolderPlus className="w-3.5 h-3.5 text-blue-600" />
                        <span>+ Tambah Grup</span>
                      </button>

                      <button
                        onClick={() => openAddModal('', 'Link')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Tambah Link</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {(() => {
                      const topLevel = allLinks
                        .filter((l) => !l.parentId)
                        .sort((a, b) => a.urutan - b.urutan);

                      return topLevel.map((item, idx) => {
                        const isFirst = idx === 0;
                        const isLast = idx === topLevel.length - 1;
                        const isGroup = item.tipe === 'Grup';
                        const children = allLinks
                          .filter((l) => l.parentId === item.id)
                          .sort((a, b) => a.urutan - b.urutan);

                        return (
                          <div key={item.id} className="space-y-1.5">
                            <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 flex items-center justify-between gap-3 hover:border-blue-300 transition-all">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="flex flex-col gap-0.5 shrink-0">
                                  <button
                                    onClick={() => handleMove(item.id, 'up', '')}
                                    disabled={isFirst}
                                    className="p-1 rounded text-slate-400 hover:text-slate-800 disabled:opacity-30"
                                    title="Pindahkan ke atas"
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleMove(item.id, 'down', '')}
                                    disabled={isLast}
                                    className="p-1 rounded text-slate-400 hover:text-slate-800 disabled:opacity-30"
                                    title="Pindahkan ke bawah"
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </button>
                                </div>

                                <span className="text-xl shrink-0">{item.icon || '🔗'}</span>

                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                                      {item.label}
                                    </span>
                                    {isGroup && (
                                      <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.2 rounded-full">
                                        🗂️ Grup ({children.length} anak)
                                      </span>
                                    )}
                                    {String(item.pinned).toUpperCase() === 'TRUE' && (
                                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                                        📌 Pin
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-slate-500 truncate max-w-sm">
                                    {isGroup ? `${children.length} tautan tersimpan` : item.url}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {isGroup && (
                                  <button
                                    onClick={() => openAddModal(item.id, 'Link')}
                                    className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                                    title="Tambah link di dalam grup ini"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => openEditModal(item)}
                                  className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
                                  title="Edit tautan"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id, item.label, isGroup)}
                                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                                  title="Hapus tautan"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Baris Anak di dalam Grup */}
                            {isGroup && children.length > 0 && (
                              <div className="ml-8 space-y-1.5 border-l-2 border-blue-200 pl-3">
                                {children.map((child, childIdx) => {
                                  const isChildFirst = childIdx === 0;
                                  const isChildLast = childIdx === children.length - 1;

                                  return (
                                    <div
                                      key={child.id}
                                      className="bg-white border border-slate-200 rounded-lg p-2.5 flex items-center justify-between gap-3 text-xs"
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className="flex flex-col gap-0.5 shrink-0">
                                          <button
                                            onClick={() => handleMove(child.id, 'up', item.id)}
                                            disabled={isChildFirst}
                                            className="p-0.5 rounded text-slate-400 hover:text-slate-800 disabled:opacity-30"
                                          >
                                            <ArrowUp className="w-2.5 h-2.5" />
                                          </button>
                                          <button
                                            onClick={() => handleMove(child.id, 'down', item.id)}
                                            disabled={isChildLast}
                                            className="p-0.5 rounded text-slate-400 hover:text-slate-800 disabled:opacity-30"
                                          >
                                            <ArrowDown className="w-2.5 h-2.5" />
                                          </button>
                                        </div>

                                        <span className="text-base shrink-0">{child.icon || '🔗'}</span>
                                        <div className="flex flex-col min-w-0">
                                          <span className="font-semibold text-slate-800 truncate">
                                            {child.label}
                                          </span>
                                          <span className="text-[10px] text-slate-400 truncate max-w-xs">
                                            {child.url}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1 shrink-0">
                                        <button
                                          onClick={() => openEditModal(child)}
                                          className="p-1 rounded text-slate-500 hover:bg-slate-100"
                                          title="Edit link anak"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleDelete(child.id, child.label, false)}
                                          className="p-1 rounded text-rose-600 hover:bg-rose-50"
                                          title="Hapus link anak"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {/* TAB 3: KELOLA STAF & PIN (DEVELOPER / SUPER ADMIN) */}
              {activeTab === 'staff' && (
                <div className="space-y-5">
                  {/* Top Bar with Info & Add Button */}
                  <div className="p-4 rounded-2xl bg-linear-to-r from-blue-50 to-slate-100 border border-blue-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                          Penanggung Jawab Unit &amp; Otorisasi PIN
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 max-w-xl">
                        Staf dapat masuk dengan PIN pribadinya dan HANYA bisa mengedit tautan yang diizinkan di bawah ini. Sebagai Super Admin/Developer, Anda memiliki akses penuh mereset PIN staf kapan saja.
                      </p>
                      <div className="mt-2 text-[11px] font-mono text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded inline-block">
                        PIN Standar Sistem: {DEFAULT_STAFF_PIN}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={handleResetAllPins}
                        className="px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs transition-colors shrink-0 flex items-center gap-1.5"
                        title="Reset seluruh PIN staf ke PIN standar (123456)"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                        <span>Reset Semua ke Standar</span>
                      </button>

                      <button
                        onClick={openAddStaffModal}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Tambah Staf Baru</span>
                      </button>
                    </div>
                  </div>

                  {/* Staff List Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {staffList.map((staff) => {
                      const allowedCount = (staff.allowedLinkIds || []).length;
                      const isPinVisible = !!showPins[staff.id];
                      const isStandardPin = String(staff.pin).trim() === DEFAULT_STAFF_PIN;

                      return (
                        <div
                          key={staff.id}
                          className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between"
                        >
                          <div>
                            {/* Staff Card Header */}
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h5 className="font-black text-sm text-slate-900">{staff.nama}</h5>
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                      staff.aktif ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                                    }`}
                                  >
                                    {staff.aktif ? 'Aktif' : 'Nonaktif'}
                                  </span>
                                </div>
                                <span className="text-xs text-blue-600 font-semibold">{staff.jabatan}</span>
                              </div>

                              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                {staff.id}
                              </span>
                            </div>

                            {/* Details */}
                            <div className="space-y-1.5 text-xs text-slate-600 pt-1 pb-3 border-b border-slate-100">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">Unit Bagian:</span>
                                <span className="font-semibold text-slate-800">{staff.unit}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">Email:</span>
                                <span className="font-mono text-slate-700">{staff.email}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">PIN Saat Ini:</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs tracking-wider">
                                    {isPinVisible ? staff.pin : '••••••'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setShowPins((prev) => ({ ...prev, [staff.id]: !prev[staff.id] }))}
                                    className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                    title={isPinVisible ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
                                  >
                                    {isPinVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                  {isStandardPin ? (
                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                                      Standar
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                                      Kustom
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">Wewenang Edit:</span>
                                <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.2 rounded-full border border-blue-200 text-[11px]">
                                  {allowedCount} tautan / grup
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons for this Staff */}
                          <div className="pt-3 flex items-center justify-between gap-2 mt-auto">
                            <button
                              onClick={() => openResetPinModal(staff)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50/80 hover:bg-amber-100 text-amber-800 text-[11px] font-bold transition-colors"
                              title="Buka opsi reset PIN oleh developer"
                            >
                              <RotateCcw className="w-3 h-3 text-amber-700" />
                              <span>Reset PIN</span>
                            </button>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => openEditStaffModal(staff)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors"
                                title="Edit data & atur wewenang tautan"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Izin Tautan</span>
                              </button>

                              <button
                                onClick={() => handleDeleteStaff(staff)}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Hapus staf"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Modal Form Tambah / Edit Link & Grup */}
        {isFormOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="font-bold text-base text-slate-900">
                  {editingLink ? `Edit ${formTipe}` : `Tambah ${formTipe} Baru`}
                </h3>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveForm} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipe Entri</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={!!editingLink}
                      onClick={() => setFormTipe('Link')}
                      className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                        formTipe === 'Link'
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      🔗 Link Biasa (Buka URL)
                    </button>
                    <button
                      type="button"
                      disabled={!!editingLink}
                      onClick={() => setFormTipe('Grup')}
                      className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                        formTipe === 'Grup'
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      🗂️ Sticky Grup (Kumpulan Link)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Label / Nama {formTipe} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formLabel}
                    onChange={(e) => setFormLabel(e.target.value)}
                    placeholder="Contoh: Logbook Shift Pagi"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {formTipe === 'Link' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">URL Tujuan *</label>
                    <input
                      type="url"
                      required={formTipe === 'Link'}
                      value={formUrl}
                      onChange={(e) => setFormUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {formTipe === 'Link' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Masukkan ke dalam Grup (Opsional)
                    </label>
                    <select
                      value={formParentId}
                      onChange={(e) => setFormParentId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Tampil mandiri di level utama --</option>
                      {grupList.map((g) => (
                        <option key={g.id} value={g.id}>
                          🗂️ {g.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Ikon (Emoji / Simbol)</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={formIcon}
                      onChange={(e) => setFormIcon(e.target.value)}
                      placeholder="📦"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-center text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                    <select
                      value={formKategori}
                      onChange={(e) => setFormKategori(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Operasional & Lini">Operasional &amp; Lini</option>
                      <option value="Formulir & Shift">Formulir &amp; Shift</option>
                      <option value="Kendali Mutu (QC)">Kendali Mutu (QC)</option>
                      <option value="K3LH & SOP">K3LH &amp; SOP</option>
                      <option value="Kontak & Database">Kontak &amp; Database</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Deskripsi Ringkas (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formDeskripsi}
                    onChange={(e) => setFormDeskripsi(e.target.value)}
                    placeholder="Keterangan singkat fungsi dokumen ini"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={formAktif}
                      onChange={(e) => setFormAktif(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span>Aktif (Tampilkan di portal publik)</span>
                  </label>

                  {formTipe === 'Link' && (
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-amber-800">
                      <input
                        type="checkbox"
                        checked={formPinned}
                        onChange={(e) => setFormPinned(e.target.checked)}
                        className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
                      />
                      <span className="flex items-center gap-1">
                        <Pin className="w-3.5 h-3.5" />
                        Sematkan di Atas (Aksen PIN Khusus)
                      </span>
                    </label>
                  )}
                </div>

                <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 font-semibold text-slate-600 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-xs"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Form Tambah / Edit Staf & Checklist Hak Akses Tautan */}
        {isStaffFormOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[92vh] overflow-y-auto border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-base text-slate-900">
                    {editingStaff ? `Atur Akses: ${editingStaff.nama}` : 'Tambah Staf & Hak Edit Baru'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsStaffFormOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveStaffForm} className="space-y-4 text-xs">
                {/* Data Identitas Staf */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Staf *</label>
                    <input
                      type="text"
                      required
                      value={staffNama}
                      onChange={(e) => setStaffNama(e.target.value)}
                      placeholder="Contoh: Budi Santoso"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Jabatan / Posisi *</label>
                    <input
                      type="text"
                      required
                      value={staffJabatan}
                      onChange={(e) => setStaffJabatan(e.target.value)}
                      placeholder="Contoh: Supervisor QC & Lab"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email Perusahaan *</label>
                    <input
                      type="email"
                      required
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      placeholder="budi.qc@batukarang.co.id"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Unit / Bagian</label>
                    <select
                      value={staffUnit}
                      onChange={(e) => setStaffUnit(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Operasional & Lini">Operasional &amp; Lini</option>
                      <option value="Formulir & Shift">Formulir &amp; Shift</option>
                      <option value="Kendali Mutu (QC)">Kendali Mutu (QC)</option>
                      <option value="K3LH & SOP">K3LH &amp; SOP</option>
                      <option value="Kontak & Database">Kontak &amp; Database</option>
                    </select>
                  </div>
                </div>

                {/* PIN Staf */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">
                      PIN Akses Staf (Default: {DEFAULT_STAFF_PIN})
                    </label>
                    <button
                      type="button"
                      onClick={() => setStaffPin(DEFAULT_STAFF_PIN)}
                      className="text-[10px] text-blue-600 font-bold hover:underline"
                    >
                      Gunakan PIN Standar ({DEFAULT_STAFF_PIN})
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={staffPin}
                    onChange={(e) => setStaffPin(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono tracking-widest text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Staf dapat mengganti PIN ini sendiri setelah masuk, dan Developer/Admin dapat meresetnya kapan saja.
                  </span>
                </div>

                {/* Checklist Tautan yang Diizinkan Diedit */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-bold text-slate-800">
                      Pilih Tautan / Dokumen yang Boleh Diedit Staf Ini ({staffAllowedLinkIds.length} dipilih)
                    </label>
                    <div className="flex gap-2 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setStaffAllowedLinkIds(allLinks.map((l) => l.id))}
                        className="text-blue-600 font-bold hover:underline"
                      >
                        Pilih Semua
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setStaffAllowedLinkIds([])}
                        className="text-rose-600 font-bold hover:underline"
                      >
                        Bersihkan
                      </button>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl max-h-52 overflow-y-auto p-2 space-y-1.5 bg-slate-50 custom-scrollbar">
                    {allLinks.map((link) => {
                      const isChecked = staffAllowedLinkIds.includes(link.id);
                      return (
                        <div
                          key={link.id}
                          onClick={() => toggleAllowedLinkId(link.id)}
                          className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                            isChecked ? 'bg-blue-50 border border-blue-200 text-blue-950 font-bold' : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <div className="shrink-0 text-blue-600">
                            {isChecked ? <CheckSquare className="w-4 h-4 fill-blue-600 text-white" /> : <Square className="w-4 h-4 text-slate-400" />}
                          </div>
                          <span className="text-base shrink-0">{link.icon || '🔗'}</span>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="truncate">{link.label}</span>
                            <span className="text-[10px] text-slate-400 font-normal truncate">
                              ID: {link.id} · {link.kategori} {link.tipe === 'Grup' ? '(Grup)' : ''}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Status Aktif */}
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 pt-1">
                  <input
                    type="checkbox"
                    checked={staffAktif}
                    onChange={(e) => setStaffAktif(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span>Akun staf aktif dan diizinkan mengakses mode edit</span>
                </label>

                {/* Form Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsStaffFormOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 font-semibold text-slate-600"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-xs"
                  >
                    Simpan Data Staf
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Developer Reset PIN Staf */}
        {resetPinTarget && (
          <div className="fixed inset-0 z-65 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 leading-tight">
                      Developer: Reset PIN Staf
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Otorisasi pemulihan PIN untuk {resetPinTarget.nama}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setResetPinTarget(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Info Profil Staf */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Nama &amp; Jabatan:</span>
                  <span className="font-bold text-slate-800">{resetPinTarget.nama} ({resetPinTarget.jabatan})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Unit:</span>
                  <span className="text-slate-700">{resetPinTarget.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status PIN Sekarang:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {String(resetPinTarget.pin).trim() === DEFAULT_STAFF_PIN
                      ? `Standar (${DEFAULT_STAFF_PIN})`
                      : `Kustom (${resetPinTarget.pin})`}
                  </span>
                </div>
              </div>

              <form onSubmit={handleConfirmResetPin} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-2">
                    Pilih Metode Reset PIN:
                  </label>
                  <div className="space-y-2">
                    <label
                      onClick={() => setResetPinChoice('standard')}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        resetPinChoice === 'standard'
                          ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="resetPinOption"
                        checked={resetPinChoice === 'standard'}
                        onChange={() => setResetPinChoice('standard')}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>Kembalikan ke PIN Standar Sistem</span>
                          <span className="text-[10px] font-mono bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-bold">
                            {DEFAULT_STAFF_PIN}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          PIN akan dikembalikan ke nilai awal pabrik. Staf dapat menggantinya kembali mandiri saat login.
                        </p>
                      </div>
                    </label>

                    <label
                      onClick={() => setResetPinChoice('custom')}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        resetPinChoice === 'custom'
                          ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="resetPinOption"
                        checked={resetPinChoice === 'custom'}
                        onChange={() => setResetPinChoice('custom')}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="font-bold text-slate-900">
                          Tentukan PIN Kustom Baru oleh Developer
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Developer menetapkan PIN sementara khusus atas permintaan staf.
                        </p>
                        {resetPinChoice === 'custom' && (
                          <div className="mt-2.5">
                            <input
                              type="text"
                              required
                              maxLength={10}
                              value={customResetPinValue}
                              onChange={(e) => setCustomResetPinValue(e.target.value.replace(/[^0-9]/g, ''))}
                              placeholder="Ketik 4-6 digit angka baru"
                              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-mono text-center tracking-widest text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setResetPinTarget(null)}
                    className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 font-semibold text-slate-600"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Konfirmasi Reset PIN</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Toast Notifikasi */}
        {toastMessage && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-70 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-bottom duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
