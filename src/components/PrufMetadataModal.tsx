import React, {useEffect, useMemo, useRef, useState} from 'react';
import {FileDown, Link2, RotateCcw, X} from 'lucide-react';
import {exportPrufPdf} from '../services/pdfExportService';
import type {PrufDocument, RBACUser} from '../types/tsc';
import {
  toGoogleDriveDownloadUrl,
  triggerDirectFileDownload,
} from '../utils/formatters';

interface PrufMetadataModalProps {
  doc: PrufDocument;
  activeUser: RBACUser;
  focusLinkInput?: boolean;
  onResetLinkToSheet?: () => void;
  onClose: () => void;
  onSave: (patch: Partial<PrufDocument>) => void;
}

function extractDriveFileId(url: string): string | null {
  const m =
    /[?&]id=([a-zA-Z0-9_-]+)/.exec(url) ||
    /\/d\/([a-zA-Z0-9_-]+)/.exec(url);
  return m?.[1] || null;
}

export const PrufMetadataModal: React.FC<PrufMetadataModalProps> = ({
  doc,
  activeUser,
  focusLinkInput = false,
  onResetLinkToSheet,
  onClose,
  onSave,
}) => {
  const [namaTbkBlend, setNamaTbkBlend] = useState(doc.namaTbkBlend);
  const [noDokumen, setNoDokumen] = useState(doc.noDokumen);
  const [pelaksanaanPruf, setPelaksanaanPruf] = useState(doc.pelaksanaanPruf);
  const [periodePruf, setPeriodePruf] = useState(doc.periodePruf);
  const [tglBlend, setTglBlend] = useState(doc.tglBlend);
  const [peruntukanMerk, setPeruntukanMerk] = useState(doc.peruntukanMerk);
  const [targetKg, setTargetKg] = useState(String(doc.targetKg));
  const [catatan, setCatatan] = useState(doc.catatan);
  const [lokasiTanggal, setLokasiTanggal] = useState(doc.lokasiTanggal);
  const [rawDriveLink, setRawDriveLink] = useState(doc.prufDownloadUrl || '');

  const linkInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (focusLinkInput && linkInputRef.current) {
      linkInputRef.current.focus();
      linkInputRef.current.select();
    }
  }, [focusLinkInput]);

  const convertedDownloadUrl = useMemo(
    () => toGoogleDriveDownloadUrl(rawDriveLink),
    [rawDriveLink]
  );

  const driveFileId = useMemo(
    () => extractDriveFileId(convertedDownloadUrl),
    [convertedDownloadUrl]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedKg = Number.parseFloat(targetKg.replace(',', '.'));
    const linkChanged = convertedDownloadUrl !== (doc.prufDownloadUrl || '');
    onSave({
      namaTbkBlend: namaTbkBlend.trim() || doc.namaTbkBlend,
      noDokumen: noDokumen.trim(),
      pelaksanaanPruf: pelaksanaanPruf.trim(),
      periodePruf: periodePruf.trim(),
      tglBlend: tglBlend.trim(),
      peruntukanMerk: peruntukanMerk.trim(),
      targetKg: Number.isFinite(parsedKg) && parsedKg > 0 ? parsedKg : doc.targetKg,
      catatan: catatan.trim(),
      lokasiTanggal: lokasiTanggal.trim(),
      prufDownloadUrl: convertedDownloadUrl,
      prufLinkSource: linkChanged
        ? convertedDownloadUrl
          ? 'webapp'
          : 'sheet'
        : doc.prufLinkSource,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Edit Informasi Ketetapan PRUF"
    >
      <div className="w-full max-w-2xl max-h-[90dvh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 px-5 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
            Edit Header &amp; Link Download PRUF ({doc.tab})
          </h2>
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
          {/* Google Drive PDF Link Auto-Converter */}
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/30 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-300">
                <Link2 className="w-4 h-4" />
                <span>Link File PDF PRUF (Google Drive — Direct Download)</span>
              </label>
              <span className="px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-900 border border-emerald-300/60 dark:border-emerald-800 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                Sumber:{' '}
                {doc.prufLinkSource === 'webapp'
                  ? 'Diatur via Web App'
                  : doc.prufDownloadUrl
                  ? 'Otomatis dari Google Sheet'
                  : 'Belum ada link'}
              </span>
            </div>

            <input
              ref={linkInputRef}
              type="text"
              value={rawDriveLink}
              onChange={(e) => setRawDriveLink(e.target.value)}
              onBlur={() => {
                if (convertedDownloadUrl) setRawDriveLink(convertedDownloadUrl);
              }}
              placeholder="Tempel link Google Drive (/file/d/.../view, open?id=..., atau ID file)"
              className="w-full min-h-[44px] rounded-xl border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-900 px-3 font-mono text-xs text-slate-900 dark:text-white"
            />

            {convertedDownloadUrl && (
              <div className="space-y-1 text-[11px] font-mono break-all text-emerald-800 dark:text-emerald-300">
                <div>Link Direct Download: {convertedDownloadUrl}</div>
                {driveFileId && (
                  <div className="text-slate-600 dark:text-slate-400">
                    ID File Drive: <strong>{driveFileId}</strong>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {convertedDownloadUrl && (
                <button
                  type="button"
                  onClick={() =>
                    triggerDirectFileDownload(
                      convertedDownloadUrl,
                      `PRUF_${doc.tab.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
                    )
                  }
                  className="min-h-[40px] px-3 rounded-lg bg-slate-900 dark:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Uji Download Link Ini</span>
                </button>
              )}

              {onResetLinkToSheet && doc.prufLinkSource === 'webapp' && (
                <button
                  type="button"
                  onClick={onResetLinkToSheet}
                  className="min-h-[40px] px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-medium inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Kembalikan ke Link Google Sheet</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Nama Tbk. Blend
              </label>
              <input
                type="text"
                value={namaTbkBlend}
                onChange={(e) => setNamaTbkBlend(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Nomor Dokumen
              </label>
              <input
                type="text"
                value={noDokumen}
                onChange={(e) => setNoDokumen(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 font-mono text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                1. Pelaksanaan Pruf
              </label>
              <input
                type="text"
                value={pelaksanaanPruf}
                onChange={(e) => setPelaksanaanPruf(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                2. Periode Pruf
              </label>
              <input
                type="text"
                value={periodePruf}
                onChange={(e) => setPeriodePruf(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                3. Tgl Blend
              </label>
              <input
                type="text"
                value={tglBlend}
                onChange={(e) => setTglBlend(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Kapasitas Tembakau (Kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="1"
                value={targetKg}
                onChange={(e) => setTargetKg(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-right font-mono tabular-nums text-sm font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              4. Peruntukan Merk
            </label>
            <input
              type="text"
              value={peruntukanMerk}
              onChange={(e) => setPeruntukanMerk(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Catatan Alur Proses
            </label>
            <textarea
              rows={2}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Lokasi &amp; Tanggal Tanda Tangan
            </label>
            <input
              type="text"
              value={lokasiTanggal}
              onChange={(e) => setLokasiTanggal(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 pb-[env(safe-area-inset-bottom)]">
            <button
              type="button"
              onClick={() => exportPrufPdf(doc, activeUser)}
              className="min-h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5"
            >
              <FileDown className="w-4 h-4" />
              Cetak PDF Lokal
            </button>

            <div className="flex items-center gap-2">
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
                Simpan Perubahan
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
