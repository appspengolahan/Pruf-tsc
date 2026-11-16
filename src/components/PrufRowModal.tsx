import React, {useMemo, useState} from 'react';
import {X} from 'lucide-react';
import type {PrufGroupKey, PrufRow} from '../types/tsc';
import {
  buildIndoGrFormula,
  buildIndoKgFormula,
  calcRowGr,
  calcRowKg,
  formatGr,
  formatKg,
  roundPct,
} from '../utils/formatters';

interface PrufRowModalProps {
  baseGr: number;
  targetKg: number;
  defaultGroup?: PrufGroupKey;
  initialRow?: PrufRow | null;
  onClose: () => void;
  onSave: (row: PrufRow) => void;
}

const GROUPS: Array<{key: PrufGroupKey; label: string}> = [
  {key: 'GROUP 1', label: 'GROUP 1 (Tembakau Utama)'},
  {key: 'GROUP 2', label: 'GROUP 2 (Tembakau Pendukung)'},
  {key: 'GROUP 3', label: 'GROUP 3 (Virginia / Impor / Trial)'},
  {key: 'GROUP 4', label: 'GROUP 4 (Kasturi / Garut / Boyolali)'},
  {key: 'GROUP 6', label: 'GROUP 6 (Garut / Ploso)'},
  {key: 'SAOS', label: 'Saos Cassing Jadi & Top Jadi'},
  {key: 'REFRESH', label: 'Tembakau Blend Refresh'},
  {key: 'CENGKEH', label: 'Cengkeh Rajang Kering'},
];

export const PrufRowModal: React.FC<PrufRowModalProps> = ({
  baseGr,
  targetKg,
  defaultGroup = 'GROUP 1',
  initialRow,
  onClose,
  onSave,
}) => {
  const isEditing = Boolean(initialRow);
  const [group, setGroup] = useState<PrufGroupKey>(
    initialRow?.group || defaultGroup
  );
  const [rincian, setRincian] = useState(initialRow?.rincian || '');
  const [kodeIntern, setKodeIntern] = useState(initialRow?.kodeIntern || '');
  const [pctInput, setPctInput] = useState(
    initialRow ? String(initialRow.pct) : '1.00'
  );
  const [keterangan, setKeterangan] = useState(initialRow?.keterangan || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const parsedPct = useMemo(() => {
    const val = Number.parseFloat(pctInput.replace(',', '.'));
    return Number.isFinite(val) && val >= 0 ? roundPct(val) : 0;
  }, [pctInput]);

  const previewGr = calcRowGr(parsedPct, baseGr);
  const previewKg = calcRowKg(parsedPct, targetKg);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rincian.trim()) {
      setErrorMsg('Nama stock bahan (Rincian) wajib diisi.');
      return;
    }
    if (parsedPct <= 0) {
      setErrorMsg('Persentase (%) harus lebih besar dari 0,00%.');
      return;
    }

    onSave({
      id: initialRow?.id || `row-${Date.now()}`,
      group,
      rincian: rincian.trim(),
      kodeIntern: kodeIntern.trim(),
      pct: parsedPct,
      keterangan: keterangan.trim(),
      verified: initialRow?.verified ?? false,
      verifiedBy: initialRow?.verifiedBy,
      verifiedAt: initialRow?.verifiedAt,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={isEditing ? 'Edit Bahan PRUF' : 'Tambah Bahan PRUF'}
    >
      <div className="w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 px-5 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
              {isEditing ? 'Edit Baris Bahan PRUF' : 'Tambah Baris Bahan PRUF'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Persentase 2 desimal · Kapasitas Gr &amp; Kg otomatis 1 desimal
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Kelompok / Group
            </label>
            <select
              value={group}
              onChange={(e) => setGroup(e.target.value as PrufGroupKey)}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-white"
            >
              {GROUPS.map((g) => (
                <option key={g.key} value={g.key}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Nama Stock Bahan (Rincian)
            </label>
            <input
              type="text"
              value={rincian}
              onChange={(e) => setRincian(e.target.value)}
              placeholder="Contoh: Madura 2024 (BAT) R"
              className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Kode Intern (Opsional)
              </label>
              <input
                type="text"
                value={kodeIntern}
                onChange={(e) => setKodeIntern(e.target.value)}
                placeholder="BO1 / B1L / A"
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 font-mono text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Komposisi (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={pctInput}
                onChange={(e) => setPctInput(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-right font-mono tabular-nums text-sm font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Keterangan (Opsional)
            </label>
            <input
              type="text"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Contoh: Catatan 4"
              className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-white"
            />
          </div>

          {/* Live Calculated Gr & Kg + Semicolon Formula */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3.5 space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Kapasitas ({formatGr(baseGr)})
                </div>
                <div className="font-mono tabular-nums text-base font-bold text-slate-900 dark:text-white">
                  {formatGr(previewGr)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Kapasitas ({formatKg(targetKg)})
                </div>
                <div className="font-mono tabular-nums text-base font-bold text-emerald-700 dark:text-emerald-400">
                  {formatKg(previewKg)}
                </div>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] font-mono text-slate-500 dark:text-slate-400 space-y-0.5">
              <div>Gr: {buildIndoGrFormula('D7', '$E$6')}</div>
              <div>Kg: {buildIndoKgFormula('D7', '$F$6')}</div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 pb-[env(safe-area-inset-bottom)]">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Batal
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
            >
              Simpan Baris
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
