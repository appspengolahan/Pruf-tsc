import React, {useState} from 'react';
import {Check, Copy, Database, Play, Terminal, X} from 'lucide-react';
import {GAS_TEMPLATE_SCRIPT, SHEET_TABS} from '../data/seedData';
import {
  fetchFromGasEndpoint,
  fetchTabFromGoogleSheetCsv,
  isStaticHostingMode,
  pushPrufDocToGas,
} from '../services/gasSyncService';
import type {GASConfig, PrufDocument, SheetTabKey, SyncLogEntry} from '../types/tsc';
import {formatWibDateTime} from '../utils/formatters';

interface GASCenterModalProps {
  config: GASConfig;
  activeTab: SheetTabKey;
  allDocs: Record<SheetTabKey, PrufDocument>;
  syncLogs: SyncLogEntry[];
  onSaveConfig: (next: GASConfig) => void;
  onTriggerSync: () => Promise<void>;
  onClose: () => void;
}

export const GASCenterModal: React.FC<GASCenterModalProps> = ({
  config,
  activeTab,
  allDocs,
  syncLogs,
  onSaveConfig,
  onTriggerSync,
  onClose,
}) => {
  const [innerTab, setInnerTab] = useState<'config' | 'tester' | 'script'>('config');
  const [spreadsheetId, setSpreadsheetId] = useState(config.spreadsheetId);
  const [gasUrl, setGasUrl] = useState(config.gasUrl);
  const [autoSync, setAutoSync] = useState(config.autoSync);
  const [testOutput, setTestOutput] = useState<string>('');
  const [testing, setTesting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      ...config,
      spreadsheetId: spreadsheetId.trim(),
      gasUrl: gasUrl.trim(),
      autoSync,
    });
    await onTriggerSync();
  };

  const handleTestGet = async () => {
    setTesting(true);
    setTestOutput('Menguji GET ke Headless GAS...');
    try {
      const res = await fetchFromGasEndpoint(gasUrl, allDocs, activeTab);
      const docHit = res.docs[activeTab];
      setTestOutput(
        JSON.stringify(
          {
            status: 'OK',
            tab: activeTab,
            jumlahBarisTerbaca: docHit?.rows.length || 0,
            samplePayload: res.rawPayload,
          },
          null,
          2
        )
      );
    } catch (err) {
      setTestOutput(
        `ERROR GET GAS: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setTesting(false);
    }
  };

  const handleTestCsv = async () => {
    setTesting(true);
    setTestOutput(`Menguji fallback CSV Google Sheets untuk tab "${activeTab}"...`);
    try {
      const parsedDoc = await fetchTabFromGoogleSheetCsv(
        spreadsheetId,
        activeTab,
        allDocs[activeTab]
      );
      setTestOutput(
        JSON.stringify(
          {
            status: 'OK (CSV Fallback)',
            tab: activeTab,
            jumlahBarisTerbaca: parsedDoc.rows.length,
            targetKg: parsedDoc.targetKg,
            previewRows: parsedDoc.rows.slice(0, 4),
          },
          null,
          2
        )
      );
    } catch (err) {
      setTestOutput(
        `ERROR CSV FALLBACK: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setTesting(false);
    }
  };

  const handleTestPost = async () => {
    setTesting(true);
    setTestOutput(`Menguji POST PRUF tab "${activeTab}" ke GAS...`);
    try {
      const res = await pushPrufDocToGas(gasUrl, activeTab, allDocs[activeTab]);
      setTestOutput(JSON.stringify({status: 'OK POST', response: res}, null, 2));
    } catch (err) {
      setTestOutput(
        `ERROR POST GAS: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setTesting(false);
    }
  };

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(GAS_TEMPLATE_SCRIPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Headless GAS Center"
    >
      <div className="w-full max-w-3xl max-h-[90dvh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white truncate">
                Headless GAS Center
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Google Apps Script API · Fallback CSV · Hosting:{' '}
                {isStaticHostingMode() ? 'Static Cloudflare' : 'Direct / Hybrid'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Tutup GAS Center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 pt-4 flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
          {(
            [
              {key: 'config', label: 'Konfigurasi Endpoint'},
              {key: 'tester', label: 'Payload & CSV Tester'},
              {key: 'script', label: 'Skrip Code.gs (;)'},
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setInnerTab(t.key)}
              className={`min-h-[44px] px-4 py-2 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
                innerTab === t.key
                  ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] space-y-4">
          {innerTab === 'config' && (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Google Spreadsheet ID
                </label>
                <input
                  type="text"
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 font-mono text-xs sm:text-sm text-slate-900 dark:text-white"
                />
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Tab terhubung: {SHEET_TABS.map((t) => t.key).join(' · ')}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  URL Endpoint Web App GAS (`doGet` / `doPost`)
                </label>
                <input
                  type="url"
                  value={gasUrl}
                  onChange={(e) => setGasUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 font-mono text-xs sm:text-sm text-slate-900 dark:text-white"
                />
              </div>

              <label className="min-h-[44px] flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  className="w-5 h-5 rounded accent-emerald-600"
                />
                <span className="text-sm text-slate-700 dark:text-slate-200">
                  Aktifkan silent background sync saat membuka aplikasi
                </span>
              </label>

              {config.lastSyncError && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300">
                  Catatan Sinkronisasi Terakhir: {config.lastSyncError}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
                >
                  Simpan &amp; Sinkronkan
                </button>
              </div>
            </form>
          )}

          {innerTab === 'tester' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={testing}
                  onClick={handleTestGet}
                  className="min-h-[44px] px-4 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-2 hover:bg-slate-800"
                >
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  Test GET GAS ({activeTab})
                </button>
                <button
                  type="button"
                  disabled={testing}
                  onClick={handleTestCsv}
                  className="min-h-[44px] px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold inline-flex items-center gap-2"
                >
                  <Terminal className="w-3.5 h-3.5 text-sky-500" />
                  Test Fallback CSV ({activeTab})
                </button>
                <button
                  type="button"
                  disabled={testing}
                  onClick={handleTestPost}
                  className="min-h-[44px] px-4 rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold inline-flex items-center gap-2"
                >
                  <Play className="w-3.5 h-3.5" />
                  Test POST PRUF
                </button>
              </div>

              <pre className="p-3.5 rounded-xl bg-slate-950 text-emerald-300 font-mono text-xs overflow-x-auto max-h-56">
                {testOutput || '// Klik tombol uji di atas untuk melihat payload JSON / CSV.'}
              </pre>

              <div>
                <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Riwayat Aktivitas Sinkronisasi
                </h3>
                <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {syncLogs.length === 0 ? (
                    <div className="p-3 text-slate-500">Belum ada log sinkronisasi.</div>
                  ) : (
                    syncLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 flex items-center justify-between gap-2"
                      >
                        <span className="truncate text-slate-700 dark:text-slate-200">
                          [{log.action}] {log.tab} — {log.message}
                        </span>
                        <span className="font-mono tabular-nums text-[11px] text-slate-400 shrink-0">
                          {formatWibDateTime(log.timestamp)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {innerTab === 'script' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Salin kode berikut ke <strong>Extensions → Apps Script</strong> pada Spreadsheet Anda, lalu Deploy sebagai <strong>Web App (Access: Anyone)</strong>.
                </p>
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="min-h-[44px] px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Tersalin
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Salin Code.gs
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3.5 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto max-h-80">
                {GAS_TEMPLATE_SCRIPT}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
