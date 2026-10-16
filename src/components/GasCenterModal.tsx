import React, { useState } from 'react';
import {
  X,
  Database,
  Check,
  Copy,
  Zap,
  Globe,
  KeyRound,
  FileCode2,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import { GasConfig } from '../types';
import { saveGasConfig } from '../services/storage';
import { pingGasEndpoint, generateProductionCodeGs } from '../services/gasApi';

interface GasCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  gasConfig: GasConfig;
  onConfigUpdated: (config: GasConfig) => void;
  onTriggerSync: () => void;
  isSyncing: boolean;
}

export const GasCenterModal: React.FC<GasCenterModalProps> = ({
  isOpen,
  onClose,
  gasConfig,
  onConfigUpdated,
  onTriggerSync,
  isSyncing,
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'code' | 'guide'>('config');
  const [urlInput, setUrlInput] = useState(gasConfig.webAppUrl || '');
  const [passcodeInput, setPasscodeInput] = useState(gasConfig.adminPasscode || 'bkr153');

  const [pingStatus, setPingStatus] = useState<{
    testing: boolean;
    result?: { success: boolean; latencyMs: number; message: string };
  }>({ testing: false });

  const [copiedCode, setCopiedCode] = useState(false);
  const codeGsContent = generateProductionCodeGs();

  if (!isOpen) return null;

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: GasConfig = {
      ...gasConfig,
      webAppUrl: urlInput.trim(),
      adminPasscode: passcodeInput.trim(),
    };
    saveGasConfig(updated);
    onConfigUpdated(updated);
  };

  const handleTestPing = async () => {
    setPingStatus({ testing: true });
    const res = await pingGasEndpoint(urlInput.trim(), passcodeInput.trim());
    setPingStatus({ testing: false, result: res });

    if (res.success) {
      const updated: GasConfig = {
        ...gasConfig,
        webAppUrl: urlInput.trim(),
        adminPasscode: passcodeInput.trim(),
        lastPingMs: res.latencyMs,
        syncStatus: 'online',
        lastSyncTimestamp: Date.now(),
      };
      saveGasConfig(updated);
      onConfigUpdated(updated);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeGsContent);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-sm sm:text-base tracking-tight leading-tight">
                  Headless GAS Center
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Google Apps Script
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Pusat integrasi REST API Google Sheets untuk Divisi Produksi I PT Batu Karang
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="px-6 pt-3 pb-0 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'config'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Endpoint &amp; Koneksi</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'code'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileCode2 className="w-4 h-4" />
            <span>Kode Code.gs (Siap Pakai)</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'guide'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Panduan Setup 1-2-3</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* TAB 1: CONFIGURATION */}
          {activeTab === 'config' && (
            <div className="space-y-6">
              {/* Status Box */}
              <div className="bg-slate-900 rounded-2xl p-4 sm:p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800 shadow-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="font-bold text-sm">
                      {gasConfig.webAppUrl ? 'Endpoint Terpasang' : 'Mode Offline-First Standalone'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {gasConfig.webAppUrl
                      ? `Terhubung ke Google Apps Script: ${gasConfig.webAppUrl.slice(0, 48)}...`
                      : 'Data berjalan dengan cache super cepat (0.01 detik) di browser. Masukkan Web App URL di bawah untuk sinkronisasi ke Google Sheets.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={onTriggerSync}
                    disabled={isSyncing || !gasConfig.webAppUrl}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    <Zap className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
                  </button>
                </div>
              </div>

              {/* Form Input URL & Passcode */}
              <form onSubmit={handleSaveConfig} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <h3 className="font-bold text-sm text-slate-800">Pengaturan Endpoint Web App</h3>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Google Apps Script Web App URL (/exec)
                  </label>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Didapat dari menu: Deploy &gt; Manage Deployments / New deployment &gt; Web app.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Admin Passcode (Script Properties: ADMIN_PASSCODE)
                  </label>
                  <div className="relative max-w-xs">
                    <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={passcodeInput}
                      onChange={(e) => setPasscodeInput(e.target.value)}
                      placeholder="bkr153"
                      className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3.5 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Ping Result Box */}
                {pingStatus.result && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                      pingStatus.result.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}
                  >
                    <span>{pingStatus.result.message}</span>
                    {pingStatus.result.success && (
                      <span className="font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px]">
                        Latency: {pingStatus.result.latencyMs} ms
                      </span>
                    )}
                  </div>
                )}

                {/* Buttons */}
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestPing}
                    disabled={pingStatus.testing || !urlInput}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold transition-colors"
                  >
                    <Zap className={`w-3.5 h-3.5 text-amber-400 ${pingStatus.testing ? 'animate-spin' : ''}`} />
                    <span>{pingStatus.testing ? 'Sedang Tes...' : 'Uji Ping & Koneksi'}</span>
                  </button>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs"
                  >
                    <span>Simpan Pengaturan</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: CODE.GS GENERATOR */}
          {activeTab === 'code' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Kode Google Apps Script (Code.gs)</h3>
                  <p className="text-xs text-slate-500">
                    Kode ini lengkap dengan penanganan <code className="font-mono text-blue-600">doGet</code>, <code className="font-mono text-blue-600">doPost</code>, token admin, dan struktur sheet PT Batu Karang.
                  </p>
                </div>

                <button
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
                >
                  {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCode ? 'Tersalin ke Clipboard!' : '1-Click Salin Kode'}</span>
                </button>
              </div>

              <div className="relative rounded-2xl bg-slate-950 p-4 border border-slate-800 font-mono text-[11px] text-slate-300 max-h-[420px] overflow-y-auto custom-scrollbar">
                <pre>{codeGsContent}</pre>
              </div>
            </div>
          )}

          {/* TAB 3: STEP-BY-STEP SETUP GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-800">
                Langkah Cepat Deployment Google Sheets PT Batu Karang
              </h3>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                  <span className="w-7 h-7 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">Buka Spreadsheet &amp; Apps Script</h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Buka Google Spreadsheet Divisi Produksi I. Klik menu <strong>Extensions &gt; Apps Script</strong>. Hapus semua baris kode default di file <code className="font-mono">Code.gs</code>.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                  <span className="w-7 h-7 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">Tempel Kode &amp; Simpan Passcode</h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Salin kode dari tab <strong>Kode Code.gs</strong> di atas lalu tempel. Buka <strong>Project Settings (ikon roda gigi) &gt; Script Properties &gt; Add script property</strong>:
                      <br />
                      <span className="font-mono text-blue-700 bg-blue-50 px-1 py-0.5 rounded text-[11px] mt-1 inline-block">
                        ADMIN_PASSCODE = bkr153
                      </span>
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                  <span className="w-7 h-7 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    3
                  </span>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">Otorisasi &amp; Deploy Web App</h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Pilih fungsi <code className="font-mono">authorizeApp</code> di toolbar editor lalu klik <strong>Run</strong> untuk menyetujui izin akses spreadsheet.
                      <br />
                      Klik <strong>Deploy &gt; New deployment</strong>:
                      <br />
                      - Type: <strong>Web app</strong>
                      <br />
                      - Execute as: <strong>Me</strong>
                      <br />
                      - Who has access: <strong>Anyone</strong> (Wajib Anyone agar browser dapat memuat data)
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/70 flex items-start gap-3">
                  <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    4
                  </span>
                  <div>
                    <h4 className="font-bold text-xs text-blue-950">Salin Web App URL ke Aplikasi Ini</h4>
                    <p className="text-xs text-blue-800 mt-0.5 leading-relaxed">
                      Salin URL Web App yang berakhiran <code className="font-mono text-blue-900 font-bold">/exec</code> dan tempelkan ke tab <strong>Endpoint &amp; Koneksi</strong> di atas, lalu klik <strong>Simpan</strong>. Selesai!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
