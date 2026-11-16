import React, {useState} from 'react';
import {
  Database,
  Download,
  Maximize2,
  Minimize2,
  Moon,
  RefreshCw,
  Share,
  Sun,
  UserCheck,
  WifiOff,
  X,
} from 'lucide-react';
import {useFullscreen, useOnlineStatus, usePWAInstall} from '../hooks/usePWAInstall';
import type {GASConfig, RBACUser, SheetTabKey} from '../types/tsc';
import {formatWibDateTime} from '../utils/formatters';

interface HeaderProps {
  activeTab: SheetTabKey;
  users: RBACUser[];
  activeUser: RBACUser;
  onSelectUser: (userId: string) => void;
  onRefreshSync: () => void;
  isSyncing: boolean;
  gasConfig: GASConfig;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenGasCenter: () => void;
  onOpenUserModal: () => void;
  isPublicPortal?: boolean;
}

export const Header: React.FC<HeaderProps> = React.memo(({
  activeTab,
  users,
  activeUser,
  onSelectUser,
  onRefreshSync,
  isSyncing,
  gasConfig,
  theme,
  onToggleTheme,
  onOpenGasCenter,
  onOpenUserModal,
  isPublicPortal = false,
}) => {
  const isOnline = useOnlineStatus();
  const {isFullscreen, toggleFullscreen} = useFullscreen();
  const {isInstallable, isInstalled, isIOS, install} = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const canManageUsers =
    !isPublicPortal &&
    (activeUser.role === 'Developer/Site Enginer' ||
      activeUser.role === 'Bendahara Utama');

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Page Context & Live Sync Telemetry */}
        <div className="min-w-0 flex items-center gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                PRUF - KOMPOSISI TSC
              </h1>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-700" aria-hidden="true">
                /
              </span>
              <span className="hidden sm:inline text-xs font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                {activeTab}
              </span>
              {isPublicPortal && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                  Portal Publik · Read-Only
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {!isOnline ? (
                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                  <WifiOff className="w-3 h-3" />
                  Offline · Cache Lokal
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full bg-emerald-500 ${
                      isSyncing ? 'animate-pulse' : ''
                    }`}
                    aria-hidden="true"
                  />
                  <span>
                    {isSyncing
                      ? 'Menyinkronkan...'
                      : gasConfig.lastSyncSource === 'gas'
                      ? 'Live GAS'
                      : gasConfig.lastSyncSource === 'csv'
                      ? 'Live CSV Sheet'
                      : 'Cache Instan'}
                  </span>
                </span>
              )}
              {gasConfig.lastSyncAt && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="hidden md:inline font-mono tabular-nums">
                    {formatWibDateTime(gasConfig.lastSyncAt)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: RBAC Selector & Quick Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* RBAC User/Role Selector (hidden in read-only Public Portal) */}
          {!isPublicPortal && (
            <div className="flex items-center gap-1">
              <label htmlFor="rbac-user-select" className="sr-only">
                Pilih Peran RBAC
              </label>
              <select
                id="rbac-user-select"
                value={activeUser.id}
                onChange={(e) => onSelectUser(e.target.value)}
                className="min-h-[44px] max-w-[116px] sm:max-w-[200px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 truncate"
                title={`Peran aktif: ${activeUser.role}`}
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>

              {canManageUsers && (
                <button
                  type="button"
                  onClick={onOpenUserModal}
                  className="hidden sm:flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  title="Tambah / Kelola Pengguna RBAC"
                  aria-label="Kelola Pengguna RBAC"
                >
                  <UserCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                </button>
              )}
            </div>
          )}

          {/* Manual Refresh Sync */}
          <button
            type="button"
            onClick={onRefreshSync}
            disabled={isSyncing}
            className="min-h-[44px] min-w-[44px] sm:px-3 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-60 transition-colors text-xs font-medium whitespace-nowrap shrink-0"
            title="Refresh & Sinkronisasi ke Google Sheets"
            aria-label="Refresh Sinkronisasi"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden lg:inline">Refresh</span>
          </button>

          {/* Headless GAS Center (hidden in read-only Public Portal) */}
          {!isPublicPortal && (
            <button
              type="button"
              onClick={onOpenGasCenter}
              className="min-h-[44px] min-w-[44px] lg:px-3 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-xs font-medium whitespace-nowrap shrink-0"
              title="Headless GAS Center"
              aria-label="Headless GAS Center"
            >
              <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden lg:inline">GAS Center</span>
            </button>
          )}

          {/* Light / Dark Mode Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0"
            title={
              theme === 'light'
                ? 'Aktifkan Mode Gelap'
                : 'Aktifkan Mode Terang'
            }
            aria-label={
              theme === 'light'
                ? 'Aktifkan Mode Gelap'
                : 'Aktifkan Mode Terang'
            }
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="hidden sm:flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh'}
            aria-label={isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          {/* PWA Install Button (Chromium / iOS) */}
          {!isInstalled && isInstallable && (
            <button
              type="button"
              onClick={install}
              className="min-h-[44px] px-3 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
              title="Install Aplikasi ke Perangkat"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Install App</span>
            </button>
          )}

          {!isInstalled && !isInstallable && isIOS && (
            <button
              type="button"
              onClick={() => setShowIOSGuide(true)}
              className="min-h-[44px] px-2.5 flex items-center justify-center gap-1 rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold whitespace-nowrap shrink-0"
              title="Cara Install di iPhone / iPad"
            >
              <Share className="w-4 h-4" />
              <span className="hidden sm:inline">Install iOS</span>
            </button>
          )}
        </div>
      </header>

      {/* iOS Safari Install Guide Modal */}
      {showIOSGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Panduan Install iOS"
        >
          <div className="w-full max-w-sm max-h-[90dvh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Install di iPhone / iPad
              </h2>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ol className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300 list-decimal list-inside">
              <li>
                Ketuk tombol <strong>Bagikan (Share)</strong> pada bilah Safari.
              </li>
              <li>
                Gulir ke bawah lalu pilih <strong>Tambahkan ke Layar Utama</strong>{' '}
                (<em>Add to Home Screen</em>).
              </li>
              <li>
                Ketuk <strong>Tambah</strong> agar PRUF TSC berjalan layar penuh.
              </li>
            </ol>
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full min-h-[44px] rounded-xl bg-slate-900 dark:bg-emerald-600 text-white text-sm font-semibold"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
});
