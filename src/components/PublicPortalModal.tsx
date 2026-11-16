import React, {useMemo, useState} from 'react';
import {Check, Copy, Eye, Globe, Lock, X} from 'lucide-react';
import type {SheetTabKey} from '../types/tsc';

interface PublicPortalModalProps {
  activeTab: SheetTabKey;
  showHistoryInPublicPortal: boolean;
  onToggleHistoryVisibility: (nextVisible: boolean) => void;
  onEnterPublicPreview: (tab?: SheetTabKey) => void;
  onClose: () => void;
}

export const PublicPortalModal: React.FC<PublicPortalModalProps> = ({
  activeTab,
  showHistoryInPublicPortal,
  onToggleHistoryVisibility,
  onEnterPublicPreview,
  onClose,
}) => {
  const [copiedKey, setCopiedKey] = useState<'all' | 'tab' | 'path' | null>(null);

  const urls = useMemo(() => {
    const base = `${window.location.origin}${window.location.pathname}`.replace(
      /\/(publik|portal|public)(\/.*)?$/i,
      '/'
    );
    const normalizedBase = base.endsWith('/') ? base : `${base}/`;
    return {
      allTabs: `${normalizedBase}?mode=publik`,
      activeTabOnly: `${normalizedBase}?mode=publik&tab=${encodeURIComponent(activeTab)}`,
      cleanPath: `${window.location.origin}/publik`,
    };
  }, [activeTab]);

  const handleCopy = async (key: 'all' | 'tab' | 'path', value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 2200);
    } catch {
      // Fallback copy via temporary input
      const el = document.createElement('input');
      el.value = value;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 2200);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Link Portal Publik Read-Only"
    >
      <div className="w-full max-w-xl max-h-[90dvh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 px-5 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white truncate">
                Portal Publik (Read-Only)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Seluruh tombol edit, tambah, hapus, ACC, dan pengaturan disembunyikan.
              </p>
            </div>
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

        <div className="p-5 space-y-4">
          <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/30 p-3.5 text-xs text-emerald-900 dark:text-emerald-200">
            <Lock className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            <div>
              Pengunjung yang membuka link di bawah ini hanya dapat melihat komposisi PRUF, memfilter pencarian, mengganti tab blend, dan mengunduh file PDF resmi tanpa bisa mengubah data apa pun.
            </div>
          </div>

          <label className="min-h-[44px] flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 p-3.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showHistoryInPublicPortal}
              onChange={(e) => onToggleHistoryVisibility(e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded accent-emerald-600 shrink-0"
            />
            <div className="text-xs leading-relaxed">
              <div className="font-semibold text-slate-900 dark:text-white">
                Tampilkan Riwayat Perubahan Komposisi di Portal Publik (Read-Only)
              </div>
              <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                {showHistoryInPublicPortal
                  ? 'Aktif — pengunjung Portal Publik dapat melihat riwayat catatan & perubahan bahan/persentase per merk (tetap read-only).'
                  : 'Nonaktif — tombol dan panel Riwayat Perubahan disembunyikan dari Portal Publik.'}
              </div>
            </div>
          </label>

          {/* Link Semua Tab */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              1. Link Portal Publik — Semua Tab PRUF (Rekomendasi untuk Linkin.bio / Karyawan)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={urls.allTabs}
                onFocus={(e) => e.currentTarget.select()}
                className="flex-1 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 font-mono text-xs text-slate-800 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={() => void handleCopy('all', urls.allTabs)}
                className="min-h-[44px] px-3.5 rounded-xl bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 shrink-0"
              >
                {copiedKey === 'all' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400 dark:text-white" />
                    <span>Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Salin</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Link Khusus Tab Aktif */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              2. Link Langsung Tab Aktif ({activeTab})
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={urls.activeTabOnly}
                onFocus={(e) => e.currentTarget.select()}
                className="flex-1 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 font-mono text-xs text-slate-800 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={() => void handleCopy('tab', urls.activeTabOnly)}
                className="min-h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold inline-flex items-center gap-1.5 shrink-0"
              >
                {copiedKey === 'tab' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Salin</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Link Path Pendek (/publik) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              3. Link Path Pendek (Cloudflare Workers / Domain Resmi)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={urls.cleanPath}
                onFocus={(e) => e.currentTarget.select()}
                className="flex-1 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 font-mono text-xs text-slate-800 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={() => void handleCopy('path', urls.cleanPath)}
                className="min-h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold inline-flex items-center gap-1.5 shrink-0"
              >
                {copiedKey === 'path' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Salin</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom)]">
            <button
              type="button"
              onClick={() => onEnterPublicPreview(activeTab)}
              className="min-h-[44px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              <span>Pratinjau Mode Portal Publik</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
