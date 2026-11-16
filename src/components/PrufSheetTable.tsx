import React, {useEffect, useMemo, useState} from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Edit3,
  FilePenLine,
  Plus,
  Search,
  Stamp,
  Trash2,
} from 'lucide-react';
import type {PrufDocument, PrufGroupKey, PrufRow, RoleType} from '../types/tsc';
import {
  calcRowGr,
  calcRowKg,
  computePrufTotals,
  formatGr,
  formatKg,
  formatPct,
  formatWibDateTime,
  TOBACCO_GROUPS,
  toGoogleDriveDownloadUrl,
  triggerDirectFileDownload,
} from '../utils/formatters';

interface PrufSheetTableProps {
  doc: PrufDocument;
  currentRole: RoleType;
  isPublicPortal?: boolean;
  isSyncing?: boolean;
  onRefreshSync?: () => void;
  onChangeTargetKg: (nextKg: number) => void;
  onToggleRowVerify: (rowId: string) => void;
  onAddRow: (defaultGroup?: PrufGroupKey) => void;
  onEditRow: (row: PrufRow) => void;
  onDeleteRow: (rowId: string) => void;
  onEditMetadata: () => void;
  onToggleApproval: (which: 'operasional' | 'direktur') => void;
}

type VerifyFilter = 'all' | 'verified' | 'pending';

const CAPACITY_PRESETS = [140, 360, 600];

export const PrufSheetTable: React.FC<PrufSheetTableProps> = React.memo(({
  doc,
  currentRole,
  isPublicPortal = false,
  isSyncing = false,
  onRefreshSync,
  onChangeTargetKg,
  onToggleRowVerify,
  onAddRow,
  onEditRow,
  onDeleteRow,
  onEditMetadata,
  onToggleApproval,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [verifyFilter, setVerifyFilter] = useState<VerifyFilter>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'table' | 'cards'>('table');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<25 | 50>(50);

  const canModify = !isPublicPortal && currentRole !== 'User';
  const canDelete =
    !isPublicPortal &&
    (currentRole === 'Developer/Site Enginer' ||
      currentRole === 'Bendahara Utama');

  const totals = useMemo(() => computePrufTotals(doc), [doc]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return doc.rows.filter((r) => {
      // Jangan tampilkan bahan yang nilainya kosong / 0 pada Kolom G (Gr) maupun Kapasitas (Kg)
      if (
        r.pct <= 0 ||
        calcRowGr(r.pct, doc.baseGr) <= 0 ||
        calcRowKg(r.pct, doc.targetKg) <= 0
      ) {
        return false;
      }
      if (verifyFilter === 'verified' && !r.verified) return false;
      if (verifyFilter === 'pending' && r.verified) return false;
      if (!q) return true;
      return (
        r.rincian.toLowerCase().includes(q) ||
        r.kodeIntern.toLowerCase().includes(q) ||
        r.group.toLowerCase().includes(q) ||
        r.keterangan.toLowerCase().includes(q)
      );
    });
  }, [doc.rows, doc.targetKg, searchQuery, verifyFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    setPage(1);
  }, [doc.tab, searchQuery, verifyFilter, pageSize]);

  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, safePage, pageSize]);

  const rowsByGroup = useMemo(() => {
    const map: Record<PrufGroupKey, PrufRow[]> = {
      'GROUP 1': [],
      'GROUP 2': [],
      'GROUP 3': [],
      'GROUP 4': [],
      'GROUP 6': [],
      SAOS: [],
      REFRESH: [],
      CENGKEH: [],
    };
    for (const r of paginatedRows) {
      map[r.group].push(r);
    }
    return map;
  }, [paginatedRows]);

  const renderRowActions = (r: PrufRow) => (
    <div className="inline-flex items-center justify-end gap-1">
      <button
        type="button"
        disabled={!canModify}
        onClick={() => onToggleRowVerify(r.id)}
        title={r.verified ? 'Terverifikasi (klik untuk batal)' : 'Klik untuk ceklist verifikasi'}
        className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg transition-colors ${
          r.verified
            ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            : 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
        } disabled:opacity-60 disabled:cursor-default`}
        aria-label={r.verified ? 'Batalkan verifikasi' : 'Verifikasi bahan'}
      >
        {r.verified ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : (
          <Circle className="w-4 h-4" />
        )}
      </button>

      {canModify && (
        <button
          type="button"
          onClick={() => onEditRow(r)}
          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Edit Baris"
          aria-label="Edit Baris"
        >
          <Edit3 className="w-4 h-4" />
        </button>
      )}

      {canDelete && (
        confirmDeleteId === r.id ? (
          <button
            type="button"
            onClick={() => {
              onDeleteRow(r.id);
              setConfirmDeleteId(null);
            }}
            className="min-h-[44px] px-2.5 rounded-lg bg-red-600 text-white text-xs font-semibold"
          >
            Hapus
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDeleteId(r.id)}
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
            title="Hapus Baris"
            aria-label="Hapus Baris"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )
      )}
    </div>
  );

  return (
    <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Interactive Toolbar */}
      <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari bahan, kode intern, atau keterangan..."
              className="w-full min-h-[44px] pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            />
          </div>

          <div
            className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800 self-start sm:self-auto"
            role="group"
            aria-label="Filter Ceklist Bahan"
          >
            {(
              [
                {key: 'all', label: 'Semua'},
                {key: 'verified', label: 'Terverifikasi'},
                {key: 'pending', label: 'Belum Cek'},
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setVerifyFilter(opt.key)}
                className={`min-h-[44px] px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  verifyFilter === opt.key
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Target Capacity (Kg) Scaler (read-only badge in Public Portal) & Mobile View Switch */}
        <div className="flex flex-wrap items-center gap-2">
          {isPublicPortal ? (
            <div className="min-h-[44px] flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-xs">
              <span className="font-medium text-slate-500 dark:text-slate-400">
                Kapasitas Blend:
              </span>
              <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                {formatKg(doc.targetKg)}
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                Kapasitas (Kg):
              </span>
              {CAPACITY_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onChangeTargetKg(preset)}
                  className={`min-h-[44px] px-2.5 rounded-lg font-mono tabular-nums text-xs font-semibold transition-colors ${
                    doc.targetKg === preset
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {preset}
                </button>
              ))}
              <input
                type="number"
                min="1"
                step="1"
                aria-label="Custom Kapasitas Target Kg"
                value={doc.targetKg}
                onChange={(e) => {
                  const v = Number.parseFloat(e.target.value);
                  if (Number.isFinite(v) && v > 0) onChangeTargetKg(v);
                }}
                className="w-20 min-h-[44px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 text-right font-mono tabular-nums text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>
          )}

          {/* Mobile table/card toggle */}
          <div className="sm:hidden flex items-center gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setMobileView('table')}
              className={`min-h-[44px] px-3 rounded-lg text-xs font-medium ${
                mobileView === 'table'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Tabel Asli
            </button>
            <button
              type="button"
              onClick={() => setMobileView('cards')}
              className={`min-h-[44px] px-3 rounded-lg text-xs font-medium ${
                mobileView === 'cards'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Kartu
            </button>
          </div>
        </div>
      </div>

      {/* Authentic PRUF Document Header Block */}
      <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 text-center">
            <h3 className="font-display text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
              {doc.judulUtama || 'KETETAPAN PRUF TEMBAKAU BLEND JENIS SKT ( LOW FLAVOUR )'}
            </h3>
            <p className="mt-0.5 font-display text-sm sm:text-base font-bold text-slate-900 dark:text-emerald-400">
              NAMA TBK. BLEND : {doc.namaTbkBlend || doc.tab}
            </p>
            {doc.noDokumen && (
              <p className="mt-0.5 font-mono text-xs text-slate-600 dark:text-slate-300">
                No : {doc.noDokumen}
              </p>
            )}
          </div>

          {canModify && (
            <button
              type="button"
              onClick={onEditMetadata}
              className="min-h-[44px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 shrink-0"
              title="Ubah Nomor & Metadata PRUF"
            >
              <FilePenLine className="w-4 h-4" />
              <span className="hidden sm:inline">Edit Info Pruf</span>
            </button>
          )}
        </div>

        {/* 2x2 Authentic Metadata Grid */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1.5 text-xs sm:text-[13px] text-slate-800 dark:text-slate-200">
          <div className="grid grid-cols-[128px_1fr] sm:grid-cols-[140px_1fr] gap-2 min-w-0">
            <span className="font-medium text-slate-600 dark:text-slate-400">
              1. Pelaksanaan Pruf
            </span>
            <span className="font-medium min-w-0 break-words">: {doc.pelaksanaanPruf}</span>
          </div>
          <div className="grid grid-cols-[128px_1fr] sm:grid-cols-[140px_1fr] gap-2 min-w-0">
            <span className="font-medium text-slate-600 dark:text-slate-400">
              3. Tgl Blend
            </span>
            <span className="font-medium min-w-0 break-words">: {doc.tglBlend}</span>
          </div>
          <div className="grid grid-cols-[128px_1fr] sm:grid-cols-[140px_1fr] gap-2 min-w-0">
            <span className="font-medium text-slate-600 dark:text-slate-400">
              2. Periode Pruf
            </span>
            <span className="font-medium min-w-0 break-words">: {doc.periodePruf}</span>
          </div>
          <div className="grid grid-cols-[128px_1fr] sm:grid-cols-[140px_1fr] gap-2 min-w-0">
            <span className="font-medium text-slate-600 dark:text-slate-400">
              4. Peruntukan Merk
            </span>
            <span className="font-medium min-w-0 break-words">: {doc.peruntukanMerk}</span>
          </div>
        </div>
      </div>

      {/* Authentic PRUF Table View (Desktop/Tablet always, Mobile when mobileView === 'table') */}
      <div className={`${mobileView === 'cards' ? 'hidden sm:block' : 'block'} overflow-x-auto`}>
        <table className="w-full min-w-[780px] border-collapse text-xs sm:text-[13px]">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-b border-slate-300 dark:border-slate-700">
              <th
                rowSpan={2}
                className="py-2 px-3 text-left font-bold border-r border-slate-300 dark:border-slate-700"
              >
                <div>NAMA STOCK BAHAN</div>
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                  RINCIAN · Grade · Tahun
                </div>
              </th>
              <th
                rowSpan={2}
                className="py-2 px-2.5 text-center font-bold border-r border-slate-300 dark:border-slate-700 whitespace-nowrap w-24"
              >
                Kode Intern
              </th>
              <th
                rowSpan={2}
                className="py-2 px-3 text-right font-bold border-r border-slate-300 dark:border-slate-700 whitespace-nowrap w-20"
              >
                %
              </th>
              <th
                colSpan={2}
                className="py-1.5 px-3 text-center font-bold border-b border-r border-slate-300 dark:border-slate-700"
              >
                Kapasitas
              </th>
              <th
                rowSpan={2}
                className={`py-2 px-3 text-center font-bold w-36 ${
                  !isPublicPortal ? 'border-r border-slate-300 dark:border-slate-700' : ''
                }`}
              >
                KETERANGAN
              </th>
              {!isPublicPortal && (
                <th
                  rowSpan={2}
                  className="py-2 px-3 text-right font-bold whitespace-nowrap w-28"
                >
                  Verifikasi / Aksi
                </th>
              )}
            </tr>
            <tr className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-b-2 border-slate-400 dark:border-slate-600 font-mono tabular-nums text-xs">
              <th className="py-1.5 px-3 text-right font-bold border-r border-slate-300 dark:border-slate-700 whitespace-nowrap w-28">
                {formatGr(doc.baseGr)}
              </th>
              <th className="py-1.5 px-3 text-right font-bold border-r border-slate-300 dark:border-slate-700 whitespace-nowrap w-28">
                {formatKg(doc.targetKg)}
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {doc.rows.length === 0 && (
              <tr>
                <td
                  colSpan={isPublicPortal ? 6 : 7}
                  className="py-10 px-4 text-center text-sm text-slate-500 dark:text-slate-400"
                >
                  {isSyncing ? (
                    <span>Menyelaraskan data asli dari Google Sheets PRUF ({doc.tab})...</span>
                  ) : (
                    <div className="space-y-3">
                      <p>
                        {doc.source === 'local'
                          ? 'Belum ada data tersinkron dari Google Sheets PRUF.'
                          : 'Tidak ada bahan aktif dengan nilai pada Kolom G di sheet ini.'}
                      </p>
                      {onRefreshSync && (
                        <button
                          type="button"
                          onClick={onRefreshSync}
                          className="min-h-[44px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-2"
                        >
                          Sinkronkan dari Google Sheets
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            )}
            {/* GROUP 1..GROUP 6 */}
            {TOBACCO_GROUPS.map((groupKey) => {
              const groupRows = rowsByGroup[groupKey];
              const gTot = totals.groupTotals[groupKey];
              if (groupRows.length === 0) return null;

              return (
                <React.Fragment key={groupKey}>
                  {/* Group Subtotal Header Row */}
                  <tr className="bg-slate-100/90 dark:bg-slate-800/70 font-bold text-slate-900 dark:text-white border-t border-slate-300 dark:border-slate-700">
                    <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700">
                      {groupKey} (<span className="font-mono tabular-nums">{formatPct(gTot.pct)}</span>)
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-200 dark:border-slate-700" />
                    <td className="py-2 px-3 text-right font-mono tabular-nums border-r border-slate-200 dark:border-slate-700">
                      {formatPct(gTot.pct, false)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums border-r border-slate-200 dark:border-slate-700">
                      {formatGr(gTot.gr)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums border-r border-slate-200 dark:border-slate-700">
                      {formatKg(gTot.kg)}
                    </td>
                    <td
                      className={`py-2 px-3 ${
                        !isPublicPortal ? 'border-r border-slate-200 dark:border-slate-700' : ''
                      }`}
                    />
                    {!isPublicPortal && (
                      <td className="py-1 px-2 text-right">
                        {canModify && (
                          <button
                            type="button"
                            onClick={() => onAddRow(groupKey)}
                            className="min-h-[44px] px-2.5 rounded-lg text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 inline-flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Bahan
                          </button>
                        )}
                      </td>
                    )}
                  </tr>

                  {/* Member Rows */}
                  {groupRows.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2 px-3 pl-5 text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800">
                        {r.rincian}
                      </td>
                      <td className="py-2 px-2.5 text-center font-mono text-xs text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                        {r.kodeIntern}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800">
                        {formatPct(r.pct, false)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800">
                        {formatGr(calcRowGr(r.pct, doc.baseGr))}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums font-medium text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800">
                        {formatKg(calcRowKg(r.pct, doc.targetKg))}
                      </td>
                      <td
                        className={`py-2 px-3 text-center text-xs text-slate-600 dark:text-slate-300 ${
                          !isPublicPortal ? 'border-r border-slate-200 dark:border-slate-800' : ''
                        }`}
                      >
                        {r.keterangan}
                      </td>
                      {!isPublicPortal && (
                        <td className="py-1 px-2 text-right">{renderRowActions(r)}</td>
                      )}
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}

            {/* TOTAL TEMBAKAU ROW */}
            <tr className="bg-slate-200/70 dark:bg-slate-800 font-bold text-slate-900 dark:text-white border-t-2 border-slate-400 dark:border-slate-600">
              <td
                colSpan={2}
                className="py-2.5 px-3 text-right tracking-wide border-r border-slate-300 dark:border-slate-700"
              >
                TOTAL TEMBAKAU
              </td>
              <td className="py-2.5 px-3 text-right font-mono tabular-nums border-r border-slate-300 dark:border-slate-700">
                {formatPct(totals.tobaccoPct, false)}
              </td>
              <td className="py-2.5 px-3 text-right font-mono tabular-nums border-r border-slate-300 dark:border-slate-700">
                {formatGr(totals.tobaccoGr)}
              </td>
              <td className="py-2.5 px-3 text-right font-mono tabular-nums border-r border-slate-300 dark:border-slate-700">
                {formatKg(totals.tobaccoKg)}
              </td>
              <td
                className={`py-2.5 px-3 text-center ${
                  !isPublicPortal ? 'border-r border-slate-300 dark:border-slate-700' : ''
                }`}
              >
                {totals.tobaccoCount} JENIS TEMBAKAU
              </td>
              {!isPublicPortal && <td />}
            </tr>

            {/* SAOS CASSING JADI & TOP JADI */}
            {rowsByGroup.SAOS.length > 0 && (
              <>
                {rowsByGroup.SAOS.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="py-2 px-3 text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800">
                      {r.rincian}
                    </td>
                    <td className="py-2 px-2.5 text-center font-mono text-xs border-r border-slate-200 dark:border-slate-800">
                      {r.kodeIntern}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums border-r border-slate-200 dark:border-slate-800">
                      {formatPct(r.pct, false)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums border-r border-slate-200 dark:border-slate-800">
                      {formatGr(calcRowGr(r.pct, doc.baseGr))}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums font-medium border-r border-slate-200 dark:border-slate-800">
                      {formatKg(calcRowKg(r.pct, doc.targetKg))}
                    </td>
                    <td
                      className={`py-2 px-3 text-center text-xs text-slate-600 dark:text-slate-300 ${
                        !isPublicPortal ? 'border-r border-slate-200 dark:border-slate-800' : ''
                      }`}
                    >
                      {r.keterangan}
                    </td>
                    {!isPublicPortal && (
                      <td className="py-1 px-2 text-right">{renderRowActions(r)}</td>
                    )}
                  </tr>
                ))}
                <tr className="bg-slate-100/90 dark:bg-slate-800/60 font-bold text-slate-900 dark:text-white">
                  <td
                    colSpan={2}
                    className="py-2 px-3 text-right border-r border-slate-200 dark:border-slate-700"
                  >
                    Total Saos Cassing Jadi &amp; Top Jadi
                  </td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums border-r border-slate-200 dark:border-slate-700">
                    {formatPct(totals.saosPct, false)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums border-r border-slate-200 dark:border-slate-700">
                    {formatGr(totals.saosGr)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums border-r border-slate-200 dark:border-slate-700">
                    {formatKg(totals.saosKg)}
                  </td>
                  <td
                    className={`py-2 px-3 ${
                      !isPublicPortal ? 'border-r border-slate-200 dark:border-slate-700' : ''
                    }`}
                  />
                  {!isPublicPortal && (
                    <td className="py-1 px-2 text-right">
                      {canModify && (
                        <button
                          type="button"
                          onClick={() => onAddRow('SAOS')}
                          className="min-h-[44px] px-2.5 rounded-lg text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 inline-flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Saos
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              </>
            )}

            {/* TEMBAKAU BLEND REFRESH (when present) */}
            {rowsByGroup.REFRESH.length > 0 && (
              <>
                <tr className="bg-slate-100/90 dark:bg-slate-800/70 font-bold text-slate-900 dark:text-white">
                  <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700">
                    Tembakau Blend Refresh
                  </td>
                  <td className="py-2 px-2.5 border-r border-slate-200 dark:border-slate-700" />
                  <td className="py-2 px-3 text-right font-mono tabular-nums border-r border-slate-200 dark:border-slate-700">
                    {formatPct(totals.refreshPct, false)}
                  </td>
                  <td colSpan={isPublicPortal ? 3 : 4} />
                </tr>
                {rowsByGroup.REFRESH.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="py-2 px-3 pl-5 border-r border-slate-200 dark:border-slate-800">
                      {r.rincian}
                    </td>
                    <td className="py-2 px-2.5 text-center font-mono text-xs border-r border-slate-200 dark:border-slate-800">
                      {r.kodeIntern}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums border-r border-slate-200 dark:border-slate-800">
                      {formatPct(r.pct, false)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums border-r border-slate-200 dark:border-slate-800">
                      {formatGr(calcRowGr(r.pct, doc.baseGr))}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums font-medium border-r border-slate-200 dark:border-slate-800">
                      {formatKg(calcRowKg(r.pct, doc.targetKg))}
                    </td>
                    <td
                      className={`py-2 px-3 text-center text-xs ${
                        !isPublicPortal ? 'border-r border-slate-200 dark:border-slate-800' : ''
                      }`}
                    >
                      {r.keterangan}
                    </td>
                    {!isPublicPortal && (
                      <td className="py-1 px-2 text-right">{renderRowActions(r)}</td>
                    )}
                  </tr>
                ))}
                <tr className="bg-slate-100/90 dark:bg-slate-800/60 font-bold text-slate-900 dark:text-white">
                  <td
                    colSpan={2}
                    className="py-2 px-3 text-right border-r border-slate-200 dark:border-slate-700"
                  >
                    Total Tembakau Blend Refresh
                  </td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums border-r border-slate-200 dark:border-slate-700">
                    {formatPct(totals.refreshPct, false)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums border-r border-slate-200 dark:border-slate-700">
                    {formatGr(totals.refreshGr)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums border-r border-slate-200 dark:border-slate-700">
                    {formatKg(totals.refreshKg)}
                  </td>
                  <td colSpan={isPublicPortal ? 1 : 2} />
                </tr>
              </>
            )}

            {/* CENGKEH RAJANG KERING */}
            {rowsByGroup.CENGKEH.length > 0 && (
              <>
                {rowsByGroup.CENGKEH.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800">
                      {r.rincian}
                    </td>
                    <td className="py-2 px-2.5 text-center font-mono text-xs border-r border-slate-200 dark:border-slate-800">
                      {r.kodeIntern}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums border-r border-slate-200 dark:border-slate-800">
                      {formatPct(r.pct, false)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums border-r border-slate-200 dark:border-slate-800">
                      {formatGr(calcRowGr(r.pct, doc.baseGr))}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums font-medium border-r border-slate-200 dark:border-slate-800">
                      {formatKg(calcRowKg(r.pct, doc.targetKg))}
                    </td>
                    <td
                      className={`py-2 px-3 text-center text-xs ${
                        !isPublicPortal ? 'border-r border-slate-200 dark:border-slate-800' : ''
                      }`}
                    >
                      {r.keterangan}
                    </td>
                    {!isPublicPortal && (
                      <td className="py-1 px-2 text-right">{renderRowActions(r)}</td>
                    )}
                  </tr>
                ))}
                <tr className="bg-slate-100/90 dark:bg-slate-800/60 font-bold text-slate-900 dark:text-white">
                  <td
                    colSpan={2}
                    className="py-2 px-3 text-right border-r border-slate-200 dark:border-slate-700"
                  >
                    Total Cengkeh Rajang Kering
                  </td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums border-r border-slate-200 dark:border-slate-700">
                    {formatPct(totals.cengkehPct, false)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums border-r border-slate-200 dark:border-slate-700">
                    {formatGr(totals.cengkehGr)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums border-r border-slate-200 dark:border-slate-700">
                    {formatKg(totals.cengkehKg)}
                  </td>
                  <td colSpan={isPublicPortal ? 1 : 2} />
                </tr>
              </>
            )}

            {/* GRAND TOTAL */}
            <tr className="bg-slate-900 text-white dark:bg-emerald-950/80 font-extrabold border-t-2 border-slate-900 dark:border-emerald-600">
              <td colSpan={2} className="py-3 px-3 text-right tracking-wide">
                GRAND TOTAL
              </td>
              <td className="py-3 px-3 text-right font-mono tabular-nums">
                {formatPct(totals.grandPct, false)}
              </td>
              <td className="py-3 px-3 text-right font-mono tabular-nums">
                {formatGr(totals.grandGr)}
              </td>
              <td className="py-3 px-3 text-right font-mono tabular-nums text-emerald-300">
                {formatKg(totals.grandKg)}
              </td>
              <td
                colSpan={isPublicPortal ? 1 : 2}
                className="py-3 px-3 text-right text-xs font-normal text-slate-300"
              >
                {totals.verifiedCount}/{totals.totalRows} Terverifikasi
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Card Mode (< 640px when selected) */}
      {mobileView === 'cards' && (
        <div className="sm:hidden divide-y divide-slate-200 dark:divide-slate-800">
          {paginatedRows.map((r) => (
            <div key={r.id} className="p-3.5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    {r.group}
                    {r.kodeIntern ? ` · ${r.kodeIntern}` : ''}
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {r.rincian}
                  </div>
                  {r.keterangan && (
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {r.keterangan}
                    </div>
                  )}
                </div>
                {!isPublicPortal && renderRowActions(r)}
              </div>

              <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 p-2.5 text-xs font-mono tabular-nums">
                <div>
                  <div className="text-[10px] text-slate-500">%</div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    {formatPct(r.pct)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Kapasitas Gr</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatGr(calcRowGr(r.pct, doc.baseGr))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500">Kapasitas Kg</div>
                  <div className="font-bold text-emerald-700 dark:text-emerald-400">
                    {formatKg(calcRowKg(r.pct, doc.targetKg))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Bar (bounded DOM rows per page: 25 or 50 for fast mobile/tablet scrolling) */}
      {filteredRows.length > 25 && (
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-600 dark:text-slate-400 font-mono tabular-nums">
            Menampilkan {(safePage - 1) * pageSize + 1}–
            {Math.min(safePage * pageSize, filteredRows.length)} dari{' '}
            {filteredRows.length} bahan
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
              {([25, 50] as const).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setPageSize(sz)}
                  className={`min-h-[44px] px-3 rounded-lg font-mono text-xs font-semibold transition-colors ${
                    pageSize === sz
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {sz}/hal
                </button>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="inline-flex items-center gap-1">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40"
                  aria-label="Halaman Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-200">
                  {safePage}/{totalPages}
                </span>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40"
                  aria-label="Halaman Berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Authentic PRUF Catatan & Signature Footer */}
      <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900 space-y-5">
        <div className="text-xs italic text-slate-700 dark:text-slate-300">
          <strong>Catatan :</strong> {doc.catatan || '-'}
        </div>

        {doc.lokasiTanggal && (
          <div className="text-center text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
            {doc.lokasiTanggal}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-center text-xs sm:text-sm">
          {/* Ditetapkan, Manajer Operasional */}
          <div className="flex flex-col items-center space-y-2">
            <div>
              <div className="text-slate-600 dark:text-slate-400">Ditetapkan,</div>
              <div className="font-semibold text-slate-900 dark:text-white">
                {doc.accOperasional.jabatan}
              </div>
            </div>

            {doc.accOperasional.approved ? (
              isPublicPortal ? (
                <div className="min-h-[40px] px-3.5 py-2 rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold inline-flex items-center gap-1.5">
                  <Stamp className="w-3.5 h-3.5" />
                  <span>
                    {/\bACC\b/i.test(doc.accOperasional.approvedAt || '')
                      ? doc.accOperasional.approvedAt
                      : `ACC Online · ${formatWibDateTime(doc.accOperasional.approvedAt)}`}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={!canModify}
                  onClick={() => onToggleApproval('operasional')}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-75 disabled:cursor-default"
                >
                  <Stamp className="w-3.5 h-3.5" />
                  <span>
                    {/\bACC\b/i.test(doc.accOperasional.approvedAt || '')
                      ? doc.accOperasional.approvedAt
                      : `ACC Online · ${formatWibDateTime(doc.accOperasional.approvedAt)}`}
                  </span>
                </button>
              )
            ) : (
              <div className="min-h-[40px]" aria-hidden="true" />
            )}

            {doc.accOperasional.nama && (
              <div className="font-semibold text-slate-900 dark:text-white">
                ( {doc.accOperasional.nama} )
              </div>
            )}
          </div>

          {/* Diketahui, Direktur */}
          <div className="flex flex-col items-center space-y-2">
            <div>
              <div className="text-slate-600 dark:text-slate-400">Diketahui,</div>
              <div className="font-semibold text-slate-900 dark:text-white">
                {doc.accDirektur.jabatan}
              </div>
            </div>

            {doc.accDirektur.approved ? (
              isPublicPortal ? (
                <div className="min-h-[40px] px-3.5 py-2 rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold inline-flex items-center gap-1.5">
                  <Stamp className="w-3.5 h-3.5" />
                  <span>
                    {/\bACC\b/i.test(doc.accDirektur.approvedAt || '')
                      ? doc.accDirektur.approvedAt
                      : `ACC Direktur · ${formatWibDateTime(doc.accDirektur.approvedAt)}`}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={!canModify}
                  onClick={() => onToggleApproval('direktur')}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-75 disabled:cursor-default"
                >
                  <Stamp className="w-3.5 h-3.5" />
                  <span>
                    {/\bACC\b/i.test(doc.accDirektur.approvedAt || '')
                      ? doc.accDirektur.approvedAt
                      : `ACC Direktur · ${formatWibDateTime(doc.accDirektur.approvedAt)}`}
                  </span>
                </button>
              )
            ) : (
              <div className="min-h-[40px]" aria-hidden="true" />
            )}

            {doc.accDirektur.nama && (
              <div className="font-semibold text-slate-900 dark:text-white">
                ( {doc.accDirektur.nama} )
              </div>
            )}
          </div>
        </div>

        <div className="text-center space-y-1.5">
          <p className="text-xs font-bold italic text-red-600 dark:text-red-400">
            Pruf berlaku hanya yang telah ditandatangani.
          </p>
          {doc.prufDownloadUrl ? (
            <div className="space-y-1">
              <p className="text-[11px] italic text-red-600 dark:text-red-400">
                Silahkan download melalui link dibawah ini
              </p>
              <button
                type="button"
                onClick={() =>
                  triggerDirectFileDownload(
                    toGoogleDriveDownloadUrl(doc.prufDownloadUrl),
                    `PRUF_${doc.tab.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
                  )
                }
                className="inline-flex min-h-[44px] items-center justify-center px-4 text-sm font-bold underline text-sky-700 dark:text-sky-400 hover:text-sky-900 dark:hover:text-sky-300"
              >
                PRUF {doc.tab}
              </button>
            </div>
          ) : (
            canModify && (
              <button
                type="button"
                onClick={onEditMetadata}
                className="text-xs underline text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 min-h-[44px]"
              >
                + Atur Link Download PDF Google Drive ({doc.tab})
              </button>
            )
          )}
        </div>
      </div>
    </section>
  );
});
