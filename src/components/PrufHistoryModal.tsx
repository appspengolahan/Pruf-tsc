import React, {useMemo, useState} from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  History,
  Plus,
  Search,
  Tag,
  X,
} from 'lucide-react';
import {SHEET_TABS} from '../data/seedData';
import {downloadHistoryCsv} from '../services/historyService';
import type {
  PrufChangeHistoryEntry,
  PrufDocument,
  PrufHistoryKind,
  SheetTabKey,
} from '../types/tsc';
import {formatPct, formatWibDateTime} from '../utils/formatters';

interface PrufHistoryModalProps {
  activeTab: SheetTabKey;
  activeDoc: PrufDocument;
  entries: PrufChangeHistoryEntry[];
  isPublicPortal: boolean;
  canModify: boolean;
  showHistoryInPublicPortal: boolean;
  onToggleHistoryVisibility: (nextVisible: boolean) => void;
  onAddManualEntry: (entry: {
    jenisPerubahan: PrufHistoryKind;
    group: string;
    bahanLama: string;
    bahanBaru: string;
    pctLama: number | null;
    pctBaru: number | null;
    catatanRef: string;
    faktorAlasan: string;
  }) => void;
  onClose: () => void;
}

const KIND_LABELS: Record<PrufHistoryKind, string> = {
  CATATAN_AKTIF: 'Catatan Aktif',
  GANTI_BAHAN: 'Ganti Bahan',
  UBAH_PERSENTASE: 'Ubah %',
  TAMBAH_BAHAN: 'Bahan Masuk',
  HAPUS_BAHAN: 'Bahan Keluar',
  EKSEKUSI_CATATAN: 'Eksekusi Catatan',
};

function kindBadgeClass(kind: PrufHistoryKind): string {
  switch (kind) {
    case 'GANTI_BAHAN':
      return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800';
    case 'UBAH_PERSENTASE':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800';
    case 'TAMBAH_BAHAN':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800';
    case 'HAPUS_BAHAN':
      return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800';
    case 'EKSEKUSI_CATATAN':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800';
    case 'CATATAN_AKTIF':
    default:
      return 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800';
  }
}

export const PrufHistoryModal: React.FC<PrufHistoryModalProps> = ({
  activeTab,
  activeDoc,
  entries,
  isPublicPortal,
  canModify,
  showHistoryInPublicPortal,
  onToggleHistoryVisibility,
  onAddManualEntry,
  onClose,
}) => {
  const [tabFilter, setTabFilter] = useState<'ALL' | SheetTabKey>(activeTab);
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'Rencana (Catatan Aktif)' | 'Sudah Dieksekusi'
  >('ALL');
  const [kindFilter, setKindFilter] = useState<'ALL' | PrufHistoryKind>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Quick manual entry form (Edit Mode only)
  const [showAddForm, setShowAddForm] = useState(false);
  const [jenisPerubahan, setJenisPerubahan] =
    useState<PrufHistoryKind>('GANTI_BAHAN');
  const [groupName, setGroupName] = useState('GROUP 2');
  const [bahanLama, setBahanLama] = useState('');
  const [bahanBaru, setBahanBaru] = useState('');
  const [pctLamaStr, setPctLamaStr] = useState('');
  const [pctBaruStr, setPctBaruStr] = useState('');
  const [catatanRef, setCatatanRef] = useState('');
  const [faktorAlasan, setFaktorAlasan] = useState('');

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return entries.filter((item) => {
      if (tabFilter !== 'ALL' && item.tab !== tabFilter) return false;
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (kindFilter !== 'ALL' && item.jenisPerubahan !== kindFilter) return false;
      if (!q) return true;
      return (
        item.tab.toLowerCase().includes(q) ||
        item.namaTbkBlend.toLowerCase().includes(q) ||
        item.peruntukanMerk.toLowerCase().includes(q) ||
        item.noDokumen.toLowerCase().includes(q) ||
        item.bahanLama.toLowerCase().includes(q) ||
        item.bahanBaru.toLowerCase().includes(q) ||
        item.catatanRef.toLowerCase().includes(q) ||
        item.faktorAlasan.toLowerCase().includes(q)
      );
    });
  }, [entries, tabFilter, statusFilter, kindFilter, searchQuery]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!faktorAlasan.trim() && !bahanLama.trim() && !bahanBaru.trim()) return;
    const parseOpt = (raw: string): number | null => {
      if (!raw.trim()) return null;
      const n = Number.parseFloat(raw.replace(',', '.'));
      return Number.isFinite(n) ? n : null;
    };
    onAddManualEntry({
      jenisPerubahan,
      group: groupName,
      bahanLama: bahanLama.trim(),
      bahanBaru: bahanBaru.trim(),
      pctLama: parseOpt(pctLamaStr),
      pctBaru: parseOpt(pctBaruStr),
      catatanRef: catatanRef.trim(),
      faktorAlasan: faktorAlasan.trim() || 'Pencatatan riwayat komposisi PRUF',
    });
    setBahanLama('');
    setBahanBaru('');
    setPctLamaStr('');
    setPctBaruStr('');
    setCatatanRef('');
    setFaktorAlasan('');
    setShowAddForm(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Riwayat Perubahan Komposisi & Catatan PRUF"
    >
      <div className="w-full max-w-4xl max-h-[92dvh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                Riwayat Perubahan Komposisi &amp; Catatan PRUF
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Arsip catatan Kolom M, penggantian bahan, dan penyesuaian % per merk
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
            aria-label="Tutup Riwayat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] space-y-4">
          {/* Edit Mode Controls: Checkbox Visibilitas Portal Publik + Actions */}
          {!isPublicPortal && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-3.5 space-y-3">
              <label className="min-h-[44px] flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showHistoryInPublicPortal}
                  onChange={(e) => onToggleHistoryVisibility(e.target.checked)}
                  className="mt-0.5 w-5 h-5 rounded accent-emerald-600 shrink-0"
                />
                <div className="text-xs leading-relaxed">
                  <div className="font-semibold text-slate-900 dark:text-white">
                    Tampilkan Riwayat Perubahan ini di Portal Publik (Read-Only)
                  </div>
                  <div className="text-slate-500 dark:text-slate-400">
                    {showHistoryInPublicPortal
                      ? 'Aktif — pengunjung Portal Publik dapat melihat riwayat ini (tanpa tombol edit/CSV).'
                      : 'Nonaktif — riwayat hanya terlihat di mode internal/edit dan disembunyikan dari Portal Publik.'}
                  </div>
                </div>
              </label>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="flex flex-wrap items-center gap-2">
                  {canModify && (
                    <button
                      type="button"
                      onClick={() => setShowAddForm((prev) => !prev)}
                      className="min-h-[44px] px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{showAddForm ? 'Tutup Form' : 'Catat Riwayat Manual'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={filteredEntries.length === 0}
                    onClick={() => downloadHistoryCsv(filteredEntries)}
                    className="min-h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 text-slate-700 dark:text-slate-200 text-xs font-medium inline-flex items-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <span>Export CSV Riwayat (;)</span>
                  </button>
                </div>

                <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                  {filteredEntries.length} dari {entries.length} entri
                </span>
              </div>

              {showAddForm && canModify && (
                <form
                  onSubmit={handleManualSubmit}
                  className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3"
                >
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    Mencatat untuk Tab <strong>{activeTab}</strong> · Merk:{' '}
                    <span className="font-medium">{activeDoc.peruntukanMerk || '-'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <select
                      value={jenisPerubahan}
                      onChange={(e) =>
                        setJenisPerubahan(e.target.value as PrufHistoryKind)
                      }
                      className="min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs sm:text-sm text-slate-900 dark:text-white"
                    >
                      <option value="GANTI_BAHAN">Ganti Bahan</option>
                      <option value="UBAH_PERSENTASE">Ubah Persentase (%)</option>
                      <option value="CATATAN_AKTIF">Rencana / Catatan Aktif</option>
                      <option value="EKSEKUSI_CATATAN">Eksekusi Catatan</option>
                      <option value="TAMBAH_BAHAN">Bahan Masuk</option>
                      <option value="HAPUS_BAHAN">Bahan Keluar</option>
                    </select>
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="Group (misal: GROUP 2)"
                      className="min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs sm:text-sm text-slate-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={catatanRef}
                      onChange={(e) => setCatatanRef(e.target.value)}
                      placeholder="Ref Catatan (misal: Catatan 1)"
                      className="min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs sm:text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    <input
                      type="text"
                      value={bahanLama}
                      onChange={(e) => setBahanLama(e.target.value)}
                      placeholder="Bahan Lama"
                      className="min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs sm:text-sm text-slate-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={bahanBaru}
                      onChange={(e) => setBahanBaru(e.target.value)}
                      placeholder="Bahan Baru / Pengganti"
                      className="min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs sm:text-sm text-slate-900 dark:text-white"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={pctLamaStr}
                      onChange={(e) => setPctLamaStr(e.target.value)}
                      placeholder="% Lama (misal 0.5)"
                      className="min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 font-mono text-xs sm:text-sm text-slate-900 dark:text-white"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={pctBaruStr}
                      onChange={(e) => setPctBaruStr(e.target.value)}
                      placeholder="% Baru (misal 1.5)"
                      className="min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 font-mono text-xs sm:text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={faktorAlasan}
                      onChange={(e) => setFaktorAlasan(e.target.value)}
                      placeholder="Penjelasan / Faktor (misal: Stok Besuki 2024 habis, beralih ke Besuki 2025)"
                      className="flex-1 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs sm:text-sm text-slate-900 dark:text-white"
                    />
                    <button
                      type="submit"
                      className="min-h-[44px] px-4 rounded-xl bg-slate-900 dark:bg-emerald-600 text-white text-xs font-semibold shrink-0"
                    >
                      Simpan ke RIWAYAT_PRUF
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Filter Strip */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari merk (mis. Kabel, Lista KML), bahan, atau catatan..."
                className="w-full min-h-[44px] pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div className="md:col-span-3">
              <select
                value={tabFilter}
                onChange={(e) =>
                  setTabFilter(e.target.value as 'ALL' | SheetTabKey)
                }
                aria-label="Filter Tab PRUF"
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs sm:text-sm text-slate-900 dark:text-white"
              >
                <option value="ALL">Semua Tab PRUF</option>
                {SHEET_TABS.map((t) => (
                  <option key={t.key} value={t.key}>
                    Tab: {t.key}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as
                      | 'ALL'
                      | 'Rencana (Catatan Aktif)'
                      | 'Sudah Dieksekusi'
                  )
                }
                aria-label="Filter Status Riwayat"
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs sm:text-sm text-slate-900 dark:text-white"
              >
                <option value="ALL">Semua Status</option>
                <option value="Rencana (Catatan Aktif)">Catatan Aktif</option>
                <option value="Sudah Dieksekusi">Sudah Dieksekusi</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <select
                value={kindFilter}
                onChange={(e) =>
                  setKindFilter(e.target.value as 'ALL' | PrufHistoryKind)
                }
                aria-label="Filter Jenis Perubahan"
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs sm:text-sm text-slate-900 dark:text-white"
              >
                <option value="ALL">Semua Jenis</option>
                <option value="GANTI_BAHAN">Ganti Bahan</option>
                <option value="UBAH_PERSENTASE">Ubah %</option>
                <option value="CATATAN_AKTIF">Catatan Aktif</option>
                <option value="EKSEKUSI_CATATAN">Eksekusi Catatan</option>
                <option value="TAMBAH_BAHAN">Bahan Masuk</option>
                <option value="HAPUS_BAHAN">Bahan Keluar</option>
              </select>
            </div>
          </div>

          {/* History Timeline Cards */}
          {filteredEntries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center space-y-2">
              <History className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Belum ada riwayat perubahan pada filter ini
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Setiap kali ada penanda <strong>Catatan 1, Catatan 2</strong> pada Kolom M, penjelasan di bawah <strong>Catatan :</strong>, penggantian jenis bahan, atau perubahan persentase (%) di Google Sheets maupun Web App, riwayatnya otomatis tersimpan ke tab <strong>RIWAYAT_PRUF</strong>.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEntries.map((item) => {
                const isExecuted = item.status === 'Sudah Dieksekusi';
                return (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 space-y-2.5 shadow-sm"
                  >
                    {/* Top badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold">
                          {item.tab}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-lg border text-[11px] font-semibold ${kindBadgeClass(
                            item.jenisPerubahan
                          )}`}
                        >
                          {KIND_LABELS[item.jenisPerubahan] || item.jenisPerubahan}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold ${
                            isExecuted
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                          }`}
                        >
                          {isExecuted ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {item.status}
                        </span>
                        {item.catatanRef && (
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[11px] font-semibold">
                            {item.catatanRef}
                          </span>
                        )}
                      </div>

                      <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {formatWibDateTime(item.timestamp)}
                      </span>
                    </div>

                    {/* Explicit Brand / Peruntukan Merk Identity */}
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 px-3 py-2 text-xs space-y-0.5">
                      <div className="flex items-start gap-1.5 text-slate-800 dark:text-slate-100">
                        <Tag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>
                          <strong>Peruntukan Merk:</strong>{' '}
                          {item.peruntukanMerk || '-'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 pl-5 flex flex-wrap gap-x-3 gap-y-0.5">
                        <span>Blend: {item.namaTbkBlend || item.tab}</span>
                        {item.noDokumen && item.noDokumen !== '-' && (
                          <span className="font-mono">No: {item.noDokumen}</span>
                        )}
                        {item.periodePruf && item.periodePruf !== '-' && (
                          <span>Periode: {item.periodePruf}</span>
                        )}
                        {item.group && <span>Grup: {item.group}</span>}
                      </div>
                    </div>

                    {/* Material & Percentage Diff */}
                    {(item.bahanLama ||
                      item.bahanBaru ||
                      item.pctLama !== null ||
                      item.pctBaru !== null) && (
                      <div className="flex flex-wrap items-center gap-2 text-xs sm:text-[13px] font-medium text-slate-900 dark:text-white">
                        {item.bahanLama && (
                          <span
                            className={
                              item.bahanBaru &&
                              item.bahanBaru.toLowerCase() !==
                                item.bahanLama.toLowerCase()
                                ? 'line-through text-rose-600 dark:text-rose-400'
                                : ''
                            }
                          >
                            {item.bahanLama}
                            {item.pctLama !== null && (
                              <span className="ml-1 font-mono text-xs text-slate-500 dark:text-slate-400">
                                ({formatPct(item.pctLama)})
                              </span>
                            )}
                          </span>
                        )}

                        {item.bahanBaru && (
                          <>
                            {item.bahanLama && (
                              <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            )}
                            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                              {item.bahanBaru}
                              {item.pctBaru !== null && (
                                <span className="ml-1 font-mono text-xs">
                                  ({formatPct(item.pctBaru)})
                                </span>
                              )}
                            </span>
                          </>
                        )}

                        {item.deltaPct !== null &&
                          Math.abs(item.deltaPct) >= 0.01 && (
                            <span
                              className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold ${
                                item.deltaPct > 0
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                              }`}
                            >
                              {item.deltaPct > 0 ? '+' : ''}
                              {formatPct(item.deltaPct)}
                            </span>
                          )}
                      </div>
                    )}

                    {/* Reason / Catatan explanation */}
                    {item.faktorAlasan && (
                      <p className="text-xs italic text-slate-700 dark:text-slate-300 bg-amber-50/40 dark:bg-amber-950/20 border-l-2 border-amber-400 pl-2.5 py-1">
                        {item.faktorAlasan}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Sumber: {item.sumber}</span>
                      <span>Oleh: {item.oleh}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
