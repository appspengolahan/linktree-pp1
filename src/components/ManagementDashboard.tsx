import React, { useState, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  LayoutDashboard,
  ListPlus,
  Users,
  CloudUpload,
  BarChart3,
  Search,
  Plus,
  FolderPlus,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Save,
  RotateCcw,
  Smartphone,
  Download,
  Upload,
  Lock,
  LogOut,
  Check,
  CheckSquare,
  Square,
  RefreshCw,
  Share2,
  Copy,
  Info,
} from 'lucide-react';
import {
  LinkItem,
  StaffMember,
  StatistikData,
  GasConfig,
  Role,
  DEFAULT_STAFF_PIN,
} from '../types';
import { Logo153 } from './Logo153';
import {
  saveOrUpdateLink,
  deleteStoredLink,
  toggleLinkVisibility,
  getStoredStaffList,
  saveOrUpdateStaff,
  deleteStoredStaff,
  resetStaffPinByAdmin,
  resetAllStaffPinsToDefault,
  resetAllStatistics,
  factoryResetAll,
  saveStoredLinks,
  normalizeAndFlattenLinks,
  setLinkStaffPermissions,
  saveUserRole,
  setActiveStaffSession,
  changeStaffPin,
  canStaffEditLink,
  updateLinkByStaff,
} from '../services/storage';
import { pushGasLink, pushGasDeleteLink, pushGasAllLinks, fetchGasLinks } from '../services/gasApi';
import { hasFullAccessRole } from '../services/rbac';

interface ManagementDashboardProps {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
  activeStaff: StaffMember | null;
  onStaffSessionChange: (staff: StaffMember | null) => void;
  allLinks: LinkItem[];
  stats: StatistikData;
  gasConfig: GasConfig;
  onGasConfigUpdated: (config: GasConfig) => void;
  onDataChanged: () => void;
  onBackToPortal: () => void;
  onSwitchToPublic: () => void;
  showToast: (msg: string) => void;
  initialTab?: 'links' | 'staff' | 'mystaff' | 'gas' | 'stats';
}

export const ManagementDashboard: React.FC<ManagementDashboardProps> = ({
  currentRole,
  onRoleChange,
  activeStaff,
  onStaffSessionChange,
  allLinks,
  stats,
  gasConfig,
  onGasConfigUpdated,
  onDataChanged,
  onBackToPortal,
  onSwitchToPublic,
  showToast,
  initialTab = 'links',
}) => {
  const isPrivileged = hasFullAccessRole(currentRole);

  // Tabs: 'links' (Semua Link) | 'staff' (Kelola Staf & PIN) | 'mystaff' (Tautan Wewenang Saya) | 'gas' (Integrasi Sheets) | 'stats' (Statistik)
  const [activeTab, setActiveTab] = useState<'links' | 'staff' | 'mystaff' | 'gas' | 'stats'>(() => {
    if (!isPrivileged && activeStaff) return 'mystaff';
    return initialTab;
  });

  // Master Staff List
  const [staffList, setStaffList] = useState<StaffMember[]>(() => getStoredStaffList());

  // Link Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'visible' | 'hidden'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('Semua');

  // Quick Add/Edit Modal
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
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
  const [formAllowedStaffIds, setFormAllowedStaffIds] = useState<string[]>([]);

  // Modal Atur Akses Staf Cepat (PIC)
  const [assigningLinkTarget, setAssigningLinkTarget] = useState<LinkItem | null>(null);
  const [assigningStaffIds, setAssigningStaffIds] = useState<string[]>([]);

  // Modal Kelola Staf (Add/Edit)
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Partial<StaffMember> | null>(null);
  const [staffNama, setStaffNama] = useState('');
  const [staffJabatan, setStaffJabatan] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffUnit, setStaffUnit] = useState('Operasional & Lini');
  const [staffPin, setStaffPin] = useState(DEFAULT_STAFF_PIN);
  const [staffAllowedLinkIds, setStaffAllowedLinkIds] = useState<string[]>([]);
  const [staffAktif, setStaffAktif] = useState(true);

  // Reset PIN Dialog
  const [resetPinTarget, setResetPinTarget] = useState<StaffMember | null>(null);
  const [customResetPin, setCustomResetPin] = useState('');

  // Self Staff Edit Link Target
  const [staffFastEditItem, setStaffFastEditItem] = useState<LinkItem | null>(null);
  const [fastEditUrl, setFastEditUrl] = useState('');
  const [fastEditLabel, setFastEditLabel] = useState('');
  const [fastEditDeskripsi, setFastEditDeskripsi] = useState('');

  // Self Staff Change PIN
  const [selfOldPin, setSelfOldPin] = useState('');
  const [selfNewPin, setSelfNewPin] = useState('');
  const [selfConfirmPin, setSelfConfirmPin] = useState('');
  const [selfPinError, setSelfPinError] = useState('');

  // Cloud Actions State
  const [isSyncingGas, setIsSyncingGas] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Trend Chart State
  const [trendRange, setTrendRange] = useState<'7d' | '14d'>('7d');
  const [selectedDayIdx, setSelectedDayIdx] = useState<number | null>(null);

  // Normalize links flatly
  const flatLinks = useMemo(() => normalizeAndFlattenLinks(allLinks), [allLinks]);
  const groupItems = useMemo(() => flatLinks.filter((l) => l.tipe === 'Grup'), [flatLinks]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    flatLinks.forEach((l) => {
      if (l.kategori && l.tipe !== 'Grup') set.add(l.kategori);
    });
    return ['Semua', ...Array.from(set)];
  }, [flatLinks]);

  // Filtered links
  const filteredTopLevel = useMemo(() => {
    const topLevel = flatLinks
      .filter((l) => !l.parentId)
      .sort((a, b) => (a.urutan || 0) - (b.urutan || 0));

    const q = searchQuery.toLowerCase().trim();
    const itemMatches = (item: LinkItem) => {
      if (!q) return true;
      const label = (item.label || '').toLowerCase();
      const url = (item.url || '').toLowerCase();
      const desc = (item.deskripsi || '').toLowerCase();
      const kat = (item.kategori || '').toLowerCase();
      return label.includes(q) || url.includes(q) || desc.includes(q) || kat.includes(q);
    };

    return topLevel.filter((item) => {
      const children = flatLinks.filter((c) => c.parentId === item.id);
      const matchesSearch = itemMatches(item) || children.some(itemMatches);
      if (!matchesSearch) return false;

      // Visibility filter
      const isItemAktif = String(item.aktif).toUpperCase() === 'TRUE';
      if (visibilityFilter === 'visible') {
        if (item.tipe === 'Grup') {
          const hasActiveChild = children.some((c) => String(c.aktif).toUpperCase() === 'TRUE');
          if (!isItemAktif && !hasActiveChild) return false;
        } else if (!isItemAktif) {
          return false;
        }
      } else if (visibilityFilter === 'hidden') {
        if (item.tipe === 'Grup') {
          const hasHiddenChild = children.some((c) => String(c.aktif).toUpperCase() !== 'TRUE');
          if (isItemAktif && !hasHiddenChild) return false;
        } else if (isItemAktif) {
          return false;
        }
      }

      // Category filter
      if (categoryFilter !== 'Semua' && item.tipe !== 'Grup') {
        if (item.kategori !== categoryFilter) return false;
      }

      return true;
    });
  }, [flatLinks, searchQuery, visibilityFilter, categoryFilter]);

  // Staff's assigned links
  const staffAssignedLinks = useMemo(() => {
    if (!activeStaff) return [];
    if (activeStaff.allowedLinkIds?.includes('*')) return flatLinks.filter((l) => l.tipe !== 'Grup');
    return flatLinks.filter((l) => {
      if (l.tipe === 'Grup') return false;
      const staffHasId = (activeStaff.allowedLinkIds || []).includes(l.id);
      const linkHasStaff = (l.allowedStaffIds || []).includes(activeStaff.id);
      return staffHasId || linkHasStaff;
    });
  }, [flatLinks, activeStaff]);

  // ---------------- Handlers: Link CRUD ----------------
  const handleOpenAddLink = (parentId = '', tipe: 'Link' | 'Grup' = 'Link') => {
    setEditingLink(null);
    setFormTipe(tipe);
    setFormLabel('');
    setFormUrl('');
    setFormParentId(parentId);
    setFormIcon(tipe === 'Grup' ? '🗂️' : '🔗');
    setFormKategori('Operasional & Lini');
    setFormDeskripsi('');
    setFormUrutan((flatLinks.length + 1) * 10);
    setFormAktif(true);
    setFormPinned(false);
    setFormAllowedStaffIds([]);
    setIsFormModalOpen(true);
  };

  const handleOpenEditLink = (item: LinkItem) => {
    setEditingLink(item);
    setFormTipe(item.tipe || 'Link');
    setFormLabel(item.label || '');
    setFormUrl(item.url || '');
    setFormParentId(item.parentId || '');
    setFormIcon(item.icon || (item.tipe === 'Grup' ? '🗂️' : '🔗'));
    setFormKategori(item.kategori || 'Operasional & Lini');
    setFormDeskripsi(item.deskripsi || '');
    setFormUrutan(item.urutan || 10);
    setFormAktif(String(item.aktif).toUpperCase() === 'TRUE');
    setFormPinned(String(item.pinned).toUpperCase() === 'TRUE');

    let initialStaffIds = Array.isArray(item.allowedStaffIds) ? [...item.allowedStaffIds] : [];
    if (initialStaffIds.length === 0) {
      initialStaffIds = staffList.filter((s) => s.allowedLinkIds?.includes(item.id)).map((s) => s.id);
    }
    setFormAllowedStaffIds(initialStaffIds);
    setIsFormModalOpen(true);
  };

  const handleSaveLinkForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLabel.trim()) {
      alert('Nama tautan atau grup tidak boleh kosong.');
      return;
    }
    if (formTipe === 'Link' && !formUrl.trim()) {
      alert('URL tautan wajib diisi untuk dokumen/link.');
      return;
    }

    const payload: Partial<LinkItem> = {
      id: editingLink?.id,
      label: formLabel.trim(),
      url: formTipe === 'Grup' ? '' : formUrl.trim(),
      icon: formIcon.trim() || (formTipe === 'Grup' ? '🗂️' : '🔗'),
      kategori: formKategori,
      deskripsi: formDeskripsi.trim(),
      urutan: Number(formUrutan) || 10,
      aktif: formAktif,
      pinned: formTipe === 'Grup' ? false : formPinned,
      tipe: formTipe,
      parentId: formTipe === 'Grup' ? '' : formParentId,
      allowedStaffIds: formAllowedStaffIds,
    };

    saveOrUpdateLink(payload);
    setStaffList(getStoredStaffList());
    setIsFormModalOpen(false);
    onDataChanged();
    showToast(editingLink ? 'Tautan berhasil diperbarui.' : 'Tautan baru berhasil disimpan.');

    // Auto-sync ke GAS
    if (gasConfig.webAppUrl) {
      pushGasLink(gasConfig.webAppUrl, payload, gasConfig.adminPasscode).then((res) => {
        if (res.success) {
          showToast('Data otomatis tersinkronkan ke Google Sheets.');
        }
      }).catch(() => {});
    }
  };

  const handleToggleVisibility = (item: LinkItem) => {
    const res = toggleLinkVisibility(item.id);
    if (res.success) {
      showToast(`${res.newStatus ? '🟢 Ditampilkan' : '⚪ Disembunyikan'}: "${res.label}"`);
      onDataChanged();
      if (gasConfig.webAppUrl) {
        pushGasLink(
          gasConfig.webAppUrl,
          { ...item, aktif: res.newStatus },
          gasConfig.adminPasscode
        ).catch(() => {});
      }
    }
  };

  const handleDeleteLink = (item: LinkItem) => {
    const isGroup = item.tipe === 'Grup';
    const msg = isGroup
      ? `Hapus grup "${item.label}" beserta seluruh tautan di dalamnya? Tindakan ini tidak dapat dibatalkan.`
      : `Hapus tautan "${item.label}"?`;

    if (!window.confirm(msg)) return;

    const res = deleteStoredLink(item.id);
    if (res.success) {
      showToast(`Berhasil menghapus ${res.deletedCount} item.`);
      onDataChanged();
      if (gasConfig.webAppUrl) {
        pushGasDeleteLink(gasConfig.webAppUrl, item.id, gasConfig.adminPasscode).catch(() => {});
      }
    }
  };

  const handleMoveUrutan = (id: string, direction: 'up' | 'down', parentId = '') => {
    const siblings = flatLinks
      .filter((l) => (parentId ? l.parentId === parentId : !l.parentId))
      .sort((a, b) => (a.urutan || 0) - (b.urutan || 0));

    const index = siblings.findIndex((l) => l.id === id);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= siblings.length) return;

    const temp = siblings[index];
    siblings[index] = siblings[targetIndex];
    siblings[targetIndex] = temp;

    // Recalculate
    siblings.forEach((item, idx) => {
      item.urutan = (idx + 1) * 10;
    });

    saveStoredLinks(flatLinks);
    onDataChanged();
    showToast('Urutan tampilan berhasil disesuaikan.');
  };

  // ---------------- Handlers: Quick Assign PIC Staff ----------------
  const handleOpenAssignStaff = (item: LinkItem) => {
    setAssigningLinkTarget(item);
    let ids = Array.isArray(item.allowedStaffIds) ? [...item.allowedStaffIds] : [];
    if (ids.length === 0) {
      ids = staffList.filter((s) => s.allowedLinkIds?.includes(item.id)).map((s) => s.id);
    }
    setAssigningStaffIds(ids);
  };

  const handleSaveAssignedStaff = () => {
    if (!assigningLinkTarget) return;
    const res = setLinkStaffPermissions(assigningLinkTarget.id, assigningStaffIds);
    setStaffList(getStoredStaffList());
    onDataChanged();
    setAssigningLinkTarget(null);
    showToast(res.message);

    if (gasConfig.webAppUrl) {
      pushGasLink(
        gasConfig.webAppUrl,
        { ...assigningLinkTarget, allowedStaffIds: assigningStaffIds },
        gasConfig.adminPasscode
      ).catch(() => {});
    }
  };

  // ---------------- Handlers: Staff RBAC & PIN ----------------
  const handleOpenAddStaff = () => {
    setEditingStaff(null);
    setStaffNama('');
    setStaffJabatan('');
    setStaffEmail('');
    setStaffUnit('Operasional & Lini');
    setStaffPin(DEFAULT_STAFF_PIN);
    setStaffAllowedLinkIds([]);
    setStaffAktif(true);
    setIsStaffModalOpen(true);
  };

  const handleOpenEditStaff = (staff: StaffMember) => {
    setEditingStaff(staff);
    setStaffNama(staff.nama || '');
    setStaffJabatan(staff.jabatan || '');
    setStaffEmail(staff.email || '');
    setStaffUnit(staff.unit || 'Operasional & Lini');
    setStaffPin(staff.pin || DEFAULT_STAFF_PIN);
    setStaffAllowedLinkIds(Array.isArray(staff.allowedLinkIds) ? [...staff.allowedLinkIds] : []);
    setStaffAktif(staff.aktif !== undefined ? staff.aktif : true);
    setIsStaffModalOpen(true);
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffNama.trim() || !staffJabatan.trim()) {
      alert('Nama dan Jabatan staf wajib diisi.');
      return;
    }

    const payload: Partial<StaffMember> = {
      id: editingStaff?.id,
      nama: staffNama.trim(),
      jabatan: staffJabatan.trim(),
      email: staffEmail.trim() || `${staffNama.toLowerCase().replace(/[^a-z0-9]/g, '')}@batukarang.co.id`,
      unit: staffUnit,
      pin: staffPin.trim() || DEFAULT_STAFF_PIN,
      allowedLinkIds: staffAllowedLinkIds,
      aktif: staffAktif,
    };

    saveOrUpdateStaff(payload);
    setStaffList(getStoredStaffList());
    setIsStaffModalOpen(false);
    onDataChanged();
    showToast(editingStaff ? `Data staf ${payload.nama} diperbarui.` : `Staf baru ${payload.nama} ditambahkan.`);
  };

  const handleDeleteStaff = (staff: StaffMember) => {
    if (!window.confirm(`Hapus akses staf ${staff.nama} (${staff.jabatan})? Staf tidak akan dapat login lagi.`)) {
      return;
    }
    deleteStoredStaff(staff.id);
    setStaffList(getStoredStaffList());
    onDataChanged();
    showToast(`Staf ${staff.nama} berhasil dihapus.`);
  };

  const handleExecuteResetPin = () => {
    if (!resetPinTarget) return;
    const res = resetStaffPinByAdmin(resetPinTarget.id, customResetPin);
    setStaffList(getStoredStaffList());
    setResetPinTarget(null);
    setCustomResetPin('');
    showToast(res.message);
  };

  const handleResetAllPins = () => {
    if (
      !window.confirm(
        `PERINGATAN SUPER ADMIN:\n\nReset PIN seluruh staf (${staffList.length} orang) ke PIN awal pabrik (${DEFAULT_STAFF_PIN})?`
      )
    ) {
      return;
    }
    const res = resetAllStaffPinsToDefault();
    setStaffList(getStoredStaffList());
    showToast(res.message);
  };

  // ---------------- Handlers: Staff Personal Workspace ----------------
  const handleOpenStaffFastEdit = (link: LinkItem) => {
    setStaffFastEditItem(link);
    setFastEditUrl(link.url || '');
    setFastEditLabel(link.label || '');
    setFastEditDeskripsi(link.deskripsi || '');
  };

  const handleSaveStaffFastEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffFastEditItem || !activeStaff) return;

    if (!fastEditUrl.trim()) {
      alert('URL tautan tidak boleh kosong.');
      return;
    }

    const res = updateLinkByStaff(
      staffFastEditItem.id,
      {
        url: fastEditUrl.trim(),
        label: fastEditLabel.trim() || staffFastEditItem.label,
        deskripsi: fastEditDeskripsi.trim(),
      },
      activeStaff
    );

    if (res.success) {
      onDataChanged();
      setStaffFastEditItem(null);
      showToast(res.message);

      if (gasConfig.webAppUrl && res.updatedLink) {
        pushGasLink(gasConfig.webAppUrl, res.updatedLink, gasConfig.adminPasscode).catch(() => {});
      }
    } else {
      alert(res.message);
    }
  };

  const handleSelfChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    setSelfPinError('');
    if (!activeStaff) return;

    if (selfNewPin !== selfConfirmPin) {
      setSelfPinError('Konfirmasi PIN baru tidak cocok.');
      return;
    }
    if (selfNewPin.length < 4) {
      setSelfPinError('PIN baru minimal harus 4 digit angka.');
      return;
    }

    const res = changeStaffPin(activeStaff.id, selfOldPin, selfNewPin);
    if (res.success) {
      showToast('PIN pribadi Anda berhasil diperbarui.');
      setSelfOldPin('');
      setSelfNewPin('');
      setSelfConfirmPin('');
      setStaffList(getStoredStaffList());
    } else {
      setSelfPinError(res.message);
    }
  };

  // ---------------- Handlers: GAS Sync & Backup ----------------
  const handlePullFromSheets = async () => {
    if (!gasConfig.webAppUrl) {
      alert('URL Web App Google Apps Script belum diisi.');
      return;
    }
    setIsSyncingGas(true);
    try {
      const res = await fetchGasLinks(gasConfig.webAppUrl);
      setIsSyncingGas(false);
      if (res.success && res.links) {
        const flat = normalizeAndFlattenLinks(res.links);
        saveStoredLinks(flat);
        onDataChanged();
        const updatedConfig = { ...gasConfig, syncStatus: 'online' as const, lastSyncTimestamp: Date.now() };
        onGasConfigUpdated(updatedConfig);
        showToast(`Berhasil menarik ${flat.length} data terbaru dari Google Sheets!`);
      } else {
        alert('Gagal mengambil data dari Google Sheets: ' + (res.error || 'Periksa koneksi'));
      }
    } catch (e) {
      setIsSyncingGas(false);
      alert('Terjadi kesalahan koneksi GAS: ' + (e as Error).message);
    }
  };

  const handlePushAllToSheets = async () => {
    if (!gasConfig.webAppUrl) {
      alert('URL Web App Google Apps Script belum diisi.');
      return;
    }
    if (!window.confirm(`Unggah ${flatLinks.length} tautan master saat ini ke Google Spreadsheet?`)) {
      return;
    }
    setIsSyncingGas(true);
    const res = await pushGasAllLinks(gasConfig.webAppUrl, flatLinks, gasConfig.adminPasscode);
    setIsSyncingGas(false);
    if (res.success) {
      const updatedConfig = { ...gasConfig, syncStatus: 'online' as const, lastSyncTimestamp: Date.now() };
      onGasConfigUpdated(updatedConfig);
      showToast(`Berhasil mengunggah ${res.count || flatLinks.length} tautan ke Google Sheets!`);
    } else {
      alert('Gagal mengunggah ke Google Sheets: ' + (res.error || 'Terjadi kesalahan'));
    }
  };

  const handleCopyHpSyncUrl = () => {
    if (!gasConfig.webAppUrl) {
      alert('URL Web App Google Apps Script belum diisi.');
      return;
    }
    const currentOrigin = window.location.origin + window.location.pathname;
    const hpUrl = `${currentOrigin}?gas=${encodeURIComponent(gasConfig.webAppUrl)}`;
    navigator.clipboard.writeText(hpUrl);
    showToast('Tautan Sinkronisasi HP berhasil disalin!');
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(flatLinks, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `batukarang_linktree_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(dl);
    dl.click();
    dl.remove();
    showToast('File backup JSON berhasil diunduh.');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          saveStoredLinks(parsed);
          onDataChanged();
          showToast(`Berhasil memulihkan ${parsed.length} tautan dari file JSON!`);
        } else {
          alert('Format JSON tidak sesuai struktur data tautan.');
        }
      } catch (err) {
        alert('Gagal membaca file: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Trend Data
  const trendDisplayData = useMemo(() => {
    if (!stats.trend14Hari || stats.trend14Hari.length === 0) return [];
    return trendRange === '7d' ? stats.trend14Hari.slice(-7) : stats.trend14Hari;
  }, [stats.trend14Hari, trendRange]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* 1. TOP HEADER & IDENTITY BAR */}
      <header className="bg-slate-950 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Brand & Page Title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToPortal}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
              title="Kembali ke Tampilan Utama Link Tree"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white p-1 flex items-center justify-center shrink-0 border border-white/20">
                <Logo153 size="sm" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-black tracking-tight leading-none text-white">
                    Dashboard Manajemen &amp; PIC
                  </h1>
                  <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    Divisi Produksi I
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  PT Batu Karang — Sistem Kontrol Tautan, Hak Akses Staf, &amp; Sinkronisasi
                </p>
              </div>
            </div>
          </div>

          {/* User Role Switcher & Action Controls */}
          <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end">
            {/* Role Badge & Switcher */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs">
              <span className="text-[11px] text-slate-400 font-medium">Peran:</span>
              <select
                value={currentRole}
                onChange={(e) => {
                  const newRole = e.target.value as Role;
                  onRoleChange(newRole);
                  saveUserRole(newRole);
                  showToast(`Peran dialihkan ke: ${newRole}`);
                }}
                className="bg-slate-800 text-white font-bold text-xs rounded-lg px-2 py-1 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="Developer">💻 Developer (Full)</option>
                <option value="Site Engineer">👷 Site Engineer (Full)</option>
                <option value="Project Manager">📋 Project Manager (Full)</option>
                <option value="Manajer operasional">🏭 Manajer Operasional</option>
                <option value="Admin">⚙️ Admin Sistem</option>
                <option value="Supervisor QC">🔬 Supervisor QC (Staf)</option>
                <option value="Foreman Lini">🏭 Foreman Lini (Staf)</option>
                <option value="Operator">⚙️ Operator</option>
              </select>
            </div>

            {/* Staf Session Indicator / Switcher */}
            {activeStaff ? (
              <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-600/40 text-emerald-300 rounded-xl px-2.5 py-1 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="truncate max-w-[120px] font-semibold">{activeStaff.nama}</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveStaffSession(null);
                    onStaffSessionChange(null);
                    showToast('Sesi staf diakhiri.');
                  }}
                  className="text-[10px] text-emerald-400 hover:text-white underline ml-1 cursor-pointer"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <select
                onChange={(e) => {
                  const s = staffList.find((item) => item.id === e.target.value);
                  if (s) {
                    setActiveStaffSession(s);
                    onStaffSessionChange(s);
                    showToast(`Masuk sebagai staf: ${s.nama}`);
                  }
                }}
                defaultValue=""
                className="bg-slate-900 text-slate-300 hover:text-white font-medium text-xs rounded-xl px-2.5 py-1.5 border border-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="" disabled>
                  🔑 Masuk Sbg Staf PIC...
                </option>
                {staffList
                  .filter((s) => s.aktif)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({s.jabatan})
                    </option>
                  ))}
              </select>
            )}

            {/* Button to View Public LinkTree */}
            <button
              type="button"
              onClick={onSwitchToPublic}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
              title="Lihat tampilan publik bersih seperti yang dilihat pengguna"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Lihat Publik</span>
            </button>
          </div>
        </div>

        {/* 2. SUB-NAVIGATION TABS */}
        <div className="bg-slate-900 border-t border-slate-800 px-3 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none py-1.5">
            {/* Tab 1: Manajemen Semua Link */}
            <button
              type="button"
              onClick={() => setActiveTab('links')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'links'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ListPlus className="w-4 h-4" />
              <span>Kelola Semua Link ({flatLinks.length})</span>
            </button>

            {/* Tab 2: Hak Akses Staf & PIN */}
            <button
              type="button"
              onClick={() => setActiveTab('staff')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'staff'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Hak Akses Staf &amp; PIN ({staffList.length})</span>
            </button>

            {/* Tab 3: Workspace Tautan Wewenang Saya (Khusus Staf atau jika Staf Aktif) */}
            <button
              type="button"
              onClick={() => setActiveTab('mystaff')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'mystaff'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                Tautan Wewenang Saya {activeStaff ? `(${staffAssignedLinks.length})` : ''}
              </span>
            </button>

            {/* Tab 4: Integrasi Google Sheets */}
            <button
              type="button"
              onClick={() => setActiveTab('gas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'gas'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <CloudUpload className="w-4 h-4" />
              <span>Sinkronisasi Google Sheets</span>
            </button>

            {/* Tab 5: Statistik & Tren */}
            <button
              type="button"
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'stats'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Statistik &amp; Analitik</span>
            </button>
          </div>
        </div>
      </header>

      {/* 3. MAIN DASHBOARD CONTENT */}
      <main className="max-w-7xl w-full mx-auto px-3 sm:px-6 py-5 sm:py-7 flex-1 min-w-0">
        {/* ============================== TAB 1: KELOLA SEMUA LINK ============================== */}
        {activeTab === 'links' && (
          <div className="space-y-4">
            {/* Metric Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
              <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Total Tautan
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                  {flatLinks.length}
                </div>
                <span className="text-[10px] text-slate-400">Termasuk tautan dalam grup</span>
              </div>

              <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-emerald-200 bg-emerald-50/20 shadow-2xs">
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                  Ditampilkan (Aktif)
                </span>
                <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5">
                  {flatLinks.filter((l) => String(l.aktif).toUpperCase() === 'TRUE').length}
                </div>
                <span className="text-[10px] text-emerald-600">Tampil di portal publik</span>
              </div>

              <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-amber-200 bg-amber-50/20 shadow-2xs">
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
                  Disembunyikan
                </span>
                <div className="text-xl sm:text-2xl font-black text-amber-700 mt-0.5">
                  {flatLinks.filter((l) => String(l.aktif).toUpperCase() !== 'TRUE').length}
                </div>
                <span className="text-[10px] text-amber-600">Disembunyikan dari publik</span>
              </div>

              <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-blue-200 bg-blue-50/20 shadow-2xs">
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
                  Total Grup
                </span>
                <div className="text-xl sm:text-2xl font-black text-blue-700 mt-0.5">
                  {groupItems.length}
                </div>
                <span className="text-[10px] text-blue-600">Penampung sub-link</span>
              </div>
            </div>

            {/* Action Bar: Search, Filters, +Tambah Link, +Tambah Grup */}
            <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama tautan, URL, atau kategori..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filters & Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end">
                {/* Visibility Filter Tabs */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setVisibilityFilter('all')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      visibilityFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibilityFilter('visible')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 ${
                      visibilityFilter === 'visible'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Eye className="w-3 h-3 text-emerald-600" />
                    <span>Aktif</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibilityFilter('hidden')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 ${
                      visibilityFilter === 'hidden'
                        ? 'bg-white text-amber-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <EyeOff className="w-3 h-3 text-amber-600" />
                    <span>Tersembunyi</span>
                  </button>
                </div>

                {/* Add Group & Add Link Buttons */}
                <button
                  type="button"
                  onClick={() => handleOpenAddLink('', 'Grup')}
                  className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Tambah grup penampung baru"
                >
                  <FolderPlus className="w-4 h-4 text-blue-600" />
                  <span>+ Tambah Grup</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenAddLink('', 'Link')}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Tambah link dokumen/formulir baru"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Tambah Link</span>
                </button>
              </div>
            </div>

            {/* List of Links & Groups */}
            <div className="space-y-2.5">
              {filteredTopLevel.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500 text-xs sm:text-sm">
                  Tidak ada tautan yang sesuai dengan filter atau kata kunci pencarian.
                </div>
              ) : (
                filteredTopLevel.map((item, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === filteredTopLevel.length - 1;
                  const isGroup = item.tipe === 'Grup';
                  const isAktif = String(item.aktif).toUpperCase() === 'TRUE';
                  const children = flatLinks
                    .filter((l) => l.parentId === item.id)
                    .sort((a, b) => (a.urutan || 0) - (b.urutan || 0));

                  // Assigned staff
                  const assignedStaff = staffList.filter(
                    (s) =>
                      (item.allowedStaffIds || []).includes(s.id) ||
                      (s.allowedLinkIds || []).includes(item.id) ||
                      s.allowedLinkIds?.includes('*')
                  );

                  return (
                    <div
                      key={item.id}
                      className={`bg-white rounded-2xl border transition-all shadow-2xs overflow-hidden ${
                        isAktif
                          ? 'border-slate-200 hover:border-slate-300'
                          : 'border-amber-200 bg-amber-50/20'
                      }`}
                    >
                      {/* Top-Level Item Row */}
                      <div className="p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                          {/* Urutan Move Buttons */}
                          <div className="flex flex-col gap-0.5 shrink-0 pt-0.5 sm:pt-0">
                            <button
                              type="button"
                              onClick={() => handleMoveUrutan(item.id, 'up', '')}
                              disabled={isFirst}
                              className="p-1 rounded text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                              title="Pindahkan naik"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveUrutan(item.id, 'down', '')}
                              disabled={isLast}
                              className="p-1 rounded text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                              title="Pindahkan turun"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Icon */}
                          <span className="text-2xl shrink-0">{item.icon || (isGroup ? '🗂️' : '🔗')}</span>

                          {/* Title & Metadata */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                                {item.label}
                              </h3>
                              {isGroup && (
                                <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                  🗂️ Grup ({children.length} anak)
                                </span>
                              )}
                              {/* Visibility Badge */}
                              <button
                                type="button"
                                onClick={() => handleToggleVisibility(item)}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 cursor-pointer transition-colors ${
                                  isAktif
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                                    : 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                                }`}
                                title="Klik untuk mengubah status sembunyikan/tampilkan"
                              >
                                {isAktif ? (
                                  <>
                                    <Eye className="w-3 h-3 text-emerald-600" /> Ditampilkan
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="w-3 h-3 text-amber-600" /> Disembunyikan
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Deskripsi & URL preview */}
                            {item.deskripsi && (
                              <p className="text-[11px] text-slate-500 truncate mt-0.5 max-w-xl">
                                {item.deskripsi}
                              </p>
                            )}

                            {item.url && (
                              <div className="flex items-center gap-1 text-[11px] text-blue-600 hover:underline mt-0.5 truncate max-w-xl">
                                <span className="truncate">{item.url}</span>
                                <ExternalLink className="w-3 h-3 shrink-0" />
                              </div>
                            )}

                            {/* Staff PIC list badge */}
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              <span className="text-[10px] font-semibold text-slate-400">
                                Staf PIC:
                              </span>
                              {assignedStaff.length > 0 ? (
                                assignedStaff.map((s) => (
                                  <span
                                    key={s.id}
                                    className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium border border-slate-200"
                                  >
                                    👤 {s.nama}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">
                                  Belum ada staf khusus (akses oleh Admin &amp; Engineer)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Control Actions: Assign Staff, Edit, Delete */}
                        <div className="flex items-center gap-1.5 self-end md:self-center shrink-0 flex-wrap">
                          {isGroup && (
                            <button
                              type="button"
                              onClick={() => handleOpenAddLink(item.id, 'Link')}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                              title="Tambah anak link ke dalam grup ini"
                            >
                              <Plus className="w-3 h-3" />
                              <span>+ Sub-link</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenAssignStaff(item)}
                            className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors border border-indigo-200"
                            title="Atur siapa staf yang boleh mengedit link ini"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>Atur Staf PIC</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditLink(item)}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 transition-colors cursor-pointer"
                            title="Edit informasi tautan"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteLink(item)}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition-colors cursor-pointer"
                            title="Hapus tautan/grup"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Sub-Links inside Group */}
                      {isGroup && children.length > 0 && (
                        <div className="bg-slate-50/70 border-t border-slate-200 px-3 sm:px-6 py-2.5 space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                            Daftar Sub-link di dalam {item.label}:
                          </span>

                          <div className="divide-y divide-slate-200/80">
                            {children.map((child, cIdx) => {
                              const isChildAktif = String(child.aktif).toUpperCase() === 'TRUE';
                              const isFirstChild = cIdx === 0;
                              const isLastChild = cIdx === children.length - 1;
                              const childStaff = staffList.filter(
                                (s) =>
                                  (child.allowedStaffIds || []).includes(s.id) ||
                                  (s.allowedLinkIds || []).includes(child.id) ||
                                  s.allowedLinkIds?.includes('*')
                              );

                              return (
                                <div
                                  key={child.id}
                                  className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="flex flex-col gap-0.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => handleMoveUrutan(child.id, 'up', item.id)}
                                        disabled={isFirstChild}
                                        className="text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                                      >
                                        <ArrowUp className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleMoveUrutan(child.id, 'down', item.id)}
                                        disabled={isLastChild}
                                        className="text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                                      >
                                        <ArrowDown className="w-3 h-3" />
                                      </button>
                                    </div>

                                    <span className="text-lg shrink-0">{child.icon || '🔗'}</span>

                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-bold text-xs text-slate-800 truncate">
                                          {child.label}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleToggleVisibility(child)}
                                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border inline-flex items-center gap-0.5 cursor-pointer ${
                                            isChildAktif
                                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                              : 'bg-amber-100 text-amber-800 border-amber-300'
                                          }`}
                                        >
                                          {isChildAktif ? '🟢 Aktif' : '⚪ Tersembunyi'}
                                        </button>
                                      </div>

                                      {child.url && (
                                        <p className="text-[11px] text-blue-600 truncate mt-0.5 max-w-md">
                                          {child.url}
                                        </p>
                                      )}

                                      {/* Assigned PIC staff badge for child */}
                                      {childStaff.length > 0 && (
                                        <div className="flex items-center gap-1 mt-1">
                                          <span className="text-[9px] text-slate-400">PIC:</span>
                                          {childStaff.map((s) => (
                                            <span
                                              key={s.id}
                                              className="text-[9px] bg-white text-slate-700 px-1.5 py-0.2 rounded border border-slate-200"
                                            >
                                              {s.nama}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenAssignStaff(child)}
                                      className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold border border-indigo-200 cursor-pointer"
                                    >
                                      PIC
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditLink(child)}
                                      className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 cursor-pointer"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteLink(child)}
                                      className="p-1 rounded-lg hover:bg-rose-100 text-rose-600 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ============================== TAB 2: HAK AKSES STAF & PIN ============================== */}
        {activeTab === 'staff' && (
          <div className="space-y-4">
            {/* Header Box: Actions & Info */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Daftar Staf Penanggung Jawab &amp; PIN Akses</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Atur tautan mana saja yang boleh diedit oleh masing-masing staf shift, supervisor, dan kendali mutu.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleResetAllPins}
                  className="px-3 py-1.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                  title="Reset seluruh PIN staf kembali ke 1234"
                >
                  <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
                  <span>Reset Semua PIN (1234)</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenAddStaff}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Tambah Staf Baru</span>
                </button>
              </div>
            </div>

            {/* Grid of Staff Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {staffList.map((staff) => {
                const assignedLinksCount = staff.allowedLinkIds?.includes('*')
                  ? flatLinks.filter((l) => l.tipe !== 'Grup').length
                  : (staff.allowedLinkIds || []).length;

                return (
                  <div
                    key={staff.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between gap-3 hover:border-slate-300 transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-sm text-slate-900 truncate">
                            {staff.nama}
                          </h4>
                          <p className="text-xs text-blue-600 font-semibold truncate mt-0.5">
                            {staff.jabatan}
                          </p>
                          <span className="text-[10px] font-mono text-slate-400 block truncate">
                            {staff.email}
                          </span>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            staff.aktif
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {staff.aktif ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>

                      {/* Unit & PIN display */}
                      <div className="mt-3 bg-slate-50 rounded-xl p-2.5 border border-slate-200 space-y-1 text-xs">
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="text-[11px]">Unit Kerja:</span>
                          <span className="font-semibold text-slate-800">{staff.unit || '-'}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="text-[11px]">PIN Akses:</span>
                          <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300">
                            {staff.pin || DEFAULT_STAFF_PIN}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="text-[11px]">Tautan Wewenang:</span>
                          <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {staff.allowedLinkIds?.includes('*')
                              ? 'Semua Tautan (*)'
                              : `${assignedLinksCount} Tautan`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setResetPinTarget(staff);
                          setCustomResetPin('');
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-200 cursor-pointer"
                        title="Reset PIN staf"
                      >
                        <KeyRound className="w-3 h-3 inline mr-1" />
                        <span>Reset PIN</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditStaff(staff)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 text-[11px] font-bold cursor-pointer"
                          title="Edit staf & hak akses"
                        >
                          <Edit2 className="w-3.5 h-3.5 inline mr-1" />
                          <span>Atur Akses</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteStaff(staff)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer"
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

        {/* ============================== TAB 3: WORKSPACE STAF / TAUTAN WEWENANG SAYA ============================== */}
        {activeTab === 'mystaff' && (
          <div className="space-y-4">
            {/* Header Staf Info Banner */}
            <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-md border border-emerald-700/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 text-2xl shrink-0">
                    👤
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-sm sm:text-base text-white">
                        {activeStaff ? activeStaff.nama : 'Pilih Profil Staf Anda'}
                      </h3>
                      {activeStaff && (
                        <span className="text-[10px] font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                          {activeStaff.jabatan}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {activeStaff
                        ? `Unit: ${activeStaff.unit || 'Operasional'} • Anda memiliki wewenang mengedit ${staffAssignedLinks.length} tautan berikut.`
                        : 'Silakan pilih nama staf Anda pada dropdown di kanan atas untuk mulai mengedit tautan tugas Anda.'}
                    </p>
                  </div>
                </div>

                {/* Quick Change PIN toggle button */}
                {activeStaff && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-emerald-200 font-mono">
                      PIN Aktif: <strong>{activeStaff.pin}</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* List of links for this staff */}
            {!activeStaff ? (
              <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
                <p className="text-sm text-slate-600 font-semibold">
                  Belum ada sesi staf yang aktif.
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Pilih salah satu nama staf di bawah ini untuk menguji dan mengisi URL tautan sesuai wewenang unit:
                </p>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  {staffList.filter((s) => s.aktif).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setActiveStaffSession(s);
                        onStaffSessionChange(s);
                        showToast(`Masuk sebagai: ${s.nama}`);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-800 text-xs font-bold border border-slate-300 transition-colors cursor-pointer"
                    >
                      {s.nama} ({s.jabatan})
                    </button>
                  ))}
                </div>
              </div>
            ) : staffAssignedLinks.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500 text-xs sm:text-sm">
                Belum ada tautan yang secara khusus ditugaskan kepada akun Anda. Hubungi Site Engineer atau Project Manager untuk menambahkan wewenang.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {staffAssignedLinks.map((link) => {
                  const isAktif = String(link.aktif).toUpperCase() === 'TRUE';
                  return (
                    <div
                      key={link.id}
                      className={`bg-white rounded-2xl border p-4 shadow-2xs flex flex-col justify-between gap-3 ${
                        isAktif ? 'border-slate-200' : 'border-amber-200 bg-amber-50/20'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-2xl">{link.icon || '🔗'}</span>
                            <div className="min-w-0">
                              <h4 className="font-extrabold text-sm text-slate-900 truncate">
                                {link.label}
                              </h4>
                              <span className="text-[10px] text-slate-400 font-medium">
                                Kategori: {link.kategori || 'Operasional'}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleVisibility(link)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 cursor-pointer ${
                              isAktif
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-amber-100 text-amber-800 border-amber-300'
                            }`}
                          >
                            {isAktif ? '🟢 Ditampilkan' : '⚪ Disembunyikan'}
                          </button>
                        </div>

                        {link.deskripsi && (
                          <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                            {link.deskripsi}
                          </p>
                        )}

                        {/* Current URL Box */}
                        <div className="mt-3 bg-slate-50 rounded-xl p-2.5 border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            URL Dokumen / Formulir Saat Ini:
                          </span>
                          {link.url ? (
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-semibold text-blue-600 hover:underline truncate block mt-0.5"
                            >
                              {link.url}
                            </a>
                          ) : (
                            <span className="text-xs font-semibold text-amber-600 italic block mt-0.5">
                              Belum ada URL (Perlu diisi)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Fast Edit Action Button */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">
                          Update: {link.terakhirUpdate || '-'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenStaffFastEdit(link)}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Perbarui URL &amp; Isi</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Self PIN Change Card */}
            {activeStaff && (
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs max-w-md">
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-600" />
                  <span>Ganti PIN Pribadi Anda</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ubah PIN mandiri untuk menjaga keamanan wewenang pengisian link Anda.
                </p>

                <form onSubmit={handleSelfChangePin} className="mt-3 space-y-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      PIN Lama
                    </label>
                    <input
                      type="password"
                      value={selfOldPin}
                      onChange={(e) => setSelfOldPin(e.target.value)}
                      placeholder="Masukkan PIN saat ini"
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        PIN Baru
                      </label>
                      <input
                        type="password"
                        value={selfNewPin}
                        onChange={(e) => setSelfNewPin(e.target.value)}
                        placeholder="Minimal 4 digit"
                        required
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Konfirmasi PIN
                      </label>
                      <input
                        type="password"
                        value={selfConfirmPin}
                        onChange={(e) => setSelfConfirmPin(e.target.value)}
                        placeholder="Ulangi PIN baru"
                        required
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {selfPinError && (
                    <p className="text-xs text-rose-600 font-semibold">{selfPinError}</p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Simpan PIN Baru
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ============================== TAB 4: INTEGRASI GOOGLE SHEETS ============================== */}
        {activeTab === 'gas' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <CloudUpload className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                      Integrasi Google Apps Script &amp; Spreadsheet Master
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Sinkronkan data secara real-time ke Google Spreadsheet Divisi Produksi I agar data antar-HP selalu sama.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      gasConfig.webAppUrl
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {gasConfig.webAppUrl ? '🟢 Terhubung' : '🟡 Perlu URL Web App'}
                  </span>
                </div>
              </div>

              {/* GAS Config Form */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    URL Exec Google Apps Script:
                  </label>
                  <input
                    type="url"
                    value={gasConfig.webAppUrl || ''}
                    onChange={(e) => {
                      const updated = { ...gasConfig, webAppUrl: e.target.value.trim() };
                      onGasConfigUpdated(updated);
                    }}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Deploy web app di Google Apps Script dengan akses: &quot;Anyone (Siapa saja)&quot;.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">
                      ID Spreadsheet Master:
                    </label>
                    <input
                      type="text"
                      readOnly
                      value="1dlpuMXPQEQcd4YKsmAUN7OrXc85wX7HJ9Pcd_3tlKFA"
                      className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">
                      Passcode Admin Verifikasi:
                    </label>
                    <input
                      type="text"
                      value={gasConfig.adminPasscode || 'bkr153'}
                      onChange={(e) => {
                        const updated = { ...gasConfig, adminPasscode: e.target.value.trim() };
                        onGasConfigUpdated(updated);
                      }}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Sync Actions Buttons */}
              <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handlePullFromSheets}
                  disabled={isSyncingGas}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingGas ? 'animate-spin' : ''}`} />
                  <span>{isSyncingGas ? 'Memproses...' : 'Tarik Data dari Google Sheets'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePushAllToSheets}
                  disabled={isSyncingGas}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <CloudUpload className="w-3.5 h-3.5" />
                  <span>Kirim Master Data ke Google Sheets</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyHpSyncUrl}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Salin link yang otomatis menghubungkan ponsel ke GAS"
                >
                  <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                  <span>Salin Link Sinkronisasi HP</span>
                </button>
              </div>
            </div>

            {/* Backup & Restore JSON Box */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 mb-1">
                Cadangan File Lokal (JSON)
              </h4>
              <p className="text-xs text-slate-500 mb-3">
                Unduh file cadangan untuk arsip lokal komputer atau pulihkan jika spreadsheet mengalami perubahan yang tidak disengaja.
              </p>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Ekspor Cadangan JSON</span>
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportJson}
                  accept=".json"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Impor File JSON</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================== TAB 5: STATISTIK & ANALITIK ============================== */}
        {activeTab === 'stats' && (
          <div className="space-y-4">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-xs">
                <span className="text-[11px] text-blue-300 font-bold block uppercase tracking-wider">
                  Total Kunjungan
                </span>
                <div className="text-2xl sm:text-3xl font-black mt-1">
                  {(stats.totalKunjungan || 0).toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-400">Semua perangkat</span>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 shadow-2xs">
                <span className="text-[11px] text-blue-700 font-bold block uppercase tracking-wider">
                  Kunjungan Hari Ini
                </span>
                <div className="text-2xl sm:text-3xl font-black text-blue-900 mt-1">
                  {(stats.kunjunganHariIni || 0).toLocaleString()}
                </div>
                <span className="text-[10px] text-blue-600">Shift 1, 2, dan 3</span>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-2xs">
                <span className="text-[11px] text-emerald-700 font-bold block uppercase tracking-wider">
                  Total Klik Tautan
                </span>
                <div className="text-2xl sm:text-3xl font-black text-emerald-900 mt-1">
                  {(stats.totalKlik || 0).toLocaleString()}
                </div>
                <span className="text-[10px] text-emerald-600">Akses dokumen pabrik</span>
              </div>

              <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 shadow-2xs">
                <span className="text-[11px] text-slate-600 font-bold block uppercase tracking-wider">
                  Tautan Aktif
                </span>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                  {flatLinks.filter((l) => String(l.aktif).toUpperCase() === 'TRUE').length}
                </div>
                <span className="text-[10px] text-slate-500">Tampil di portal publik</span>
              </div>
            </div>

            {/* Trend Chart */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Grafik Tren Kunjungan Harian
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Aktivitas personil membuka portal per hari
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setTrendRange('7d');
                      setSelectedDayIdx(null);
                    }}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      trendRange === '7d' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    7 Hari
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTrendRange('14d');
                      setSelectedDayIdx(null);
                    }}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      trendRange === '14d' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    14 Hari
                  </button>
                </div>
              </div>

              {trendDisplayData.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Belum ada riwayat kunjungan.</p>
              ) : (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <div className="flex items-end gap-1.5 sm:gap-3 h-36 pt-4 pb-1 w-full">
                    {(() => {
                      const maxVal = Math.max(...trendDisplayData.map((d) => d.jumlah), 1);
                      return trendDisplayData.map((day, idx) => {
                        const isSelected =
                          (selectedDayIdx === null && idx === trendDisplayData.length - 1) ||
                          selectedDayIdx === idx;
                        const pct = Math.max(12, Math.round((day.jumlah / maxVal) * 100));
                        const shortDate = (day.tanggal || '').slice(5).replace('-', '/');

                        return (
                          <div
                            key={day.tanggal || idx}
                            onClick={() => setSelectedDayIdx(idx)}
                            className="flex-1 flex flex-col items-center justify-end h-full cursor-pointer group"
                            title={`${day.tanggal}: ${day.jumlah} kunjungan`}
                          >
                            <span
                              className={`text-[9px] font-mono font-bold mb-1 ${
                                isSelected ? 'text-emerald-700' : 'text-slate-500'
                              }`}
                            >
                              {day.jumlah}
                            </span>
                            <div className="w-full max-w-[32px] flex items-end justify-center h-full">
                              <div
                                style={{ height: `${pct}%` }}
                                className={`w-full rounded-t-md transition-all ${
                                  isSelected
                                    ? 'bg-emerald-600 ring-2 ring-emerald-400'
                                    : 'bg-blue-600 group-hover:bg-blue-700'
                                }`}
                              />
                            </div>
                            <span className="text-[9px] font-mono mt-1 text-slate-500 truncate">
                              {shortDate}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* Top Links */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Tautan Paling Sering Diakses
              </h4>
              <div className="divide-y divide-slate-100">
                {(stats.topLinks || []).map((t, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 truncate">
                      {idx + 1}. {t.label}
                    </span>
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                      {(t.klik || 0).toLocaleString()} klik
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ============================== MODAL 1: ADD / EDIT LINK ============================== */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-black text-sm sm:text-base">
                {editingLink ? 'Edit Tautan / Grup' : '+ Tambah Tautan / Grup Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLinkForm} className="p-5 space-y-3.5 max-h-[80vh] overflow-y-auto">
              {/* Tipe Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tipe Item</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormTipe('Link');
                      if (formIcon === '🗂️') setFormIcon('🔗');
                    }}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      formTipe === 'Link'
                        ? 'bg-blue-50 border-blue-600 text-blue-700'
                        : 'border-slate-300 text-slate-600'
                    }`}
                  >
                    🔗 Link / Dokumen Langsung
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormTipe('Grup');
                      setFormIcon('🗂️');
                    }}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      formTipe === 'Grup'
                        ? 'bg-blue-50 border-blue-600 text-blue-700'
                        : 'border-slate-300 text-slate-600'
                    }`}
                  >
                    🗂️ Grup Penampung Sub-link
                  </button>
                </div>
              </div>

              {/* Label / Nama */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nama {formTipe === 'Grup' ? 'Grup' : 'Tautan'} *
                </label>
                <input
                  type="text"
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  placeholder="Contoh: Logbook Ritase Shift 1"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* URL (Link only) */}
              {formTipe === 'Link' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    URL Tautan (Google Sheets / Form / Drive) *
                  </label>
                  <input
                    type="url"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    placeholder="https://docs.google.com/..."
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Parent Grup Selector (Link only) */}
              {formTipe === 'Link' && groupItems.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Masukkan ke dalam Grup (Opsional)
                  </label>
                  <select
                    value={formParentId}
                    onChange={(e) => setFormParentId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— Tidak Masuk Grup (Tautan Mandiri) —</option>
                    {groupItems.map((g) => (
                      <option key={g.id} value={g.id}>
                        🗂️ {g.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Icon & Kategori */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Ikon Emoji</label>
                  <input
                    type="text"
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value)}
                    placeholder="🔗, 📊, 📋, 🏭"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-center text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Kategori</label>
                  <select
                    value={formKategori}
                    onChange={(e) => setFormKategori(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Operasional & Lini">Operasional &amp; Lini</option>
                    <option value="Formulir & Shift">Formulir &amp; Shift</option>
                    <option value="Kendali Mutu (QC)">Kendali Mutu (QC)</option>
                    <option value="K3LH & SOP">K3LH &amp; SOP</option>
                    <option value="Kontak & Database">Kontak &amp; Database</option>
                  </select>
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Deskripsi / Catatan</label>
                <textarea
                  value={formDeskripsi}
                  onChange={(e) => setFormDeskripsi(e.target.value)}
                  rows={2}
                  placeholder="Keterangan singkat mengenai formulir atau dokumen ini..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Status Ditampilkan vs Disembunyikan */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Status Visibilitas Publik
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {formAktif ? '🟢 Ditampilkan di portal publik' : '⚪ Disembunyikan dari publik'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormAktif(!formAktif)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    formAktif
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-600 text-white'
                  }`}
                >
                  {formAktif ? 'Aktif' : 'Sembunyi'}
                </button>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Simpan Tautan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================== MODAL 2: ATUR STAF PIC CEPAT ============================== */}
      {assigningLinkTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-5 py-4 bg-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-300" />
                <h3 className="font-black text-sm">Atur Staf PIC Berwenang</h3>
              </div>
              <button
                type="button"
                onClick={() => setAssigningLinkTarget(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3.5">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Tautan yang Diatur:
                </span>
                <span className="text-xs font-extrabold text-slate-900 block mt-0.5">
                  {assigningLinkTarget.label}
                </span>
              </div>

              <p className="text-xs text-slate-600">
                Centang staf yang diberikan wewenang untuk mengisi atau memperbarui link ini:
              </p>

              <div className="max-h-60 overflow-y-auto space-y-1.5 divide-y divide-slate-100">
                {staffList.map((st) => {
                  const isChecked = assigningStaffIds.includes(st.id);
                  return (
                    <label
                      key={st.id}
                      className="pt-2 first:pt-0 flex items-center justify-between gap-2 text-xs cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAssigningStaffIds((prev) => [...prev, st.id]);
                            } else {
                              setAssigningStaffIds((prev) => prev.filter((id) => id !== st.id));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-slate-800 block truncate">
                            {st.nama}
                          </span>
                          <span className="text-[10px] text-slate-500 block truncate">
                            {st.jabatan} • {st.unit}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        PIN: {st.pin}
                      </span>
                    </label>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setAssigningStaffIds(staffList.map((s) => s.id))}
                  className="text-xs text-blue-600 hover:underline font-semibold"
                >
                  Pilih Semua
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAssigningLinkTarget(null)}
                    className="px-3 py-1.5 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAssignedStaff}
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Simpan Wewenang
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================== MODAL 3: KELOLA STAF RBAC ============================== */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-black text-sm sm:text-base">
                {editingStaff ? 'Edit Profil Staf' : '+ Tambah Staf Penanggung Jawab'}
              </h3>
              <button
                type="button"
                onClick={() => setIsStaffModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="p-5 space-y-3.5 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  value={staffNama}
                  onChange={(e) => setStaffNama(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Jabatan *</label>
                  <input
                    type="text"
                    value={staffJabatan}
                    onChange={(e) => setStaffJabatan(e.target.value)}
                    placeholder="Supervisor QC / Leader"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Unit Kerja</label>
                  <select
                    value={staffUnit}
                    onChange={(e) => setStaffUnit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Operasional & Lini">Operasional &amp; Lini</option>
                    <option value="Kendali Mutu (QC)">Kendali Mutu (QC)</option>
                    <option value="Planing & Gudang">Planing &amp; Gudang</option>
                    <option value="K3LH & Lingkungan">K3LH &amp; Lingkungan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">PIN Akses Staf</label>
                  <input
                    type="text"
                    value={staffPin}
                    onChange={(e) => setStaffPin(e.target.value)}
                    placeholder="1234"
                    maxLength={8}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-center text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Status Akun</label>
                  <select
                    value={staffAktif ? 'true' : 'false'}
                    onChange={(e) => setStaffAktif(e.target.value === 'true')}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="true">🟢 Aktif</option>
                    <option value="false">⚪ Nonaktif</option>
                  </select>
                </div>
              </div>

              {/* Tautan yang Boleh Diedit Staf Ini */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Pilih Tautan yang Boleh Diedit Staf Ini:
                </label>
                <div className="max-h-40 overflow-y-auto bg-slate-50 rounded-xl border border-slate-200 p-2 space-y-1">
                  {flatLinks
                    .filter((l) => l.tipe !== 'Grup')
                    .map((item) => {
                      const isChecked = staffAllowedLinkIds.includes(item.id);
                      return (
                        <label
                          key={item.id}
                          className="flex items-center gap-2 text-xs text-slate-700 hover:bg-white p-1 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setStaffAllowedLinkIds((prev) => [...prev, item.id]);
                              } else {
                                setStaffAllowedLinkIds((prev) => prev.filter((id) => id !== item.id));
                              }
                            }}
                            className="w-3.5 h-3.5 text-blue-600 rounded"
                          />
                          <span className="truncate">{item.label}</span>
                        </label>
                      );
                    })}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Simpan Staf
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================== MODAL 4: RESET PIN STAF ============================== */}
      {resetPinTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-5 border border-slate-200 space-y-3">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-amber-600" />
              <span>Reset PIN Staf</span>
            </h3>
            <p className="text-xs text-slate-600">
              Reset PIN untuk <strong>{resetPinTarget.nama}</strong> ({resetPinTarget.jabatan}).
            </p>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                PIN Baru (Kosongkan jika ingin kembali ke default &quot;1234&quot;)
              </label>
              <input
                type="text"
                value={customResetPin}
                onChange={(e) => setCustomResetPin(e.target.value)}
                placeholder="1234"
                maxLength={8}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-center text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResetPinTarget(null)}
                className="px-3 py-1.5 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteResetPin}
                className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer"
              >
                Reset Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================== MODAL 5: FAST EDIT LINK OLEH STAF ============================== */}
      {staffFastEditItem && activeStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-5 py-4 bg-emerald-800 text-white flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm">Perbarui Tautan Tugas</h3>
                <p className="text-[11px] text-emerald-200">
                  PIC: {activeStaff.nama} ({activeStaff.jabatan})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStaffFastEditItem(null)}
                className="text-slate-300 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStaffFastEdit} className="p-5 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  URL Google Sheets / Form Baru *
                </label>
                <input
                  type="url"
                  value={fastEditUrl}
                  onChange={(e) => setFastEditUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nama Dokumen
                </label>
                <input
                  type="text"
                  value={fastEditLabel}
                  onChange={(e) => setFastEditLabel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Catatan / Keterangan
                </label>
                <textarea
                  value={fastEditDeskripsi}
                  onChange={(e) => setFastEditDeskripsi(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStaffFastEditItem(null)}
                  className="px-3 py-1.5 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Simpan &amp; Sinkronkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
