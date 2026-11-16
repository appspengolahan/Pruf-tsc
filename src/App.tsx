import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {FileDown, FileSpreadsheet, Globe, History, Plus} from 'lucide-react';
import {Footer} from './components/Footer';
import {GASCenterModal} from './components/GASCenterModal';
import {Header} from './components/Header';
import {MobileBottomNav} from './components/MobileBottomNav';
import {PrufHistoryModal} from './components/PrufHistoryModal';
import {PrufMetadataModal} from './components/PrufMetadataModal';
import {PrufRowModal} from './components/PrufRowModal';
import {PrufSheetTable} from './components/PrufSheetTable';
import {PublicPortalModal} from './components/PublicPortalModal';
import {Sidebar} from './components/Sidebar';
import {UserManagementModal} from './components/UserManagementModal';
import {SHEET_TABS} from './data/seedData';
import {exportPrufPdf} from './services/pdfExportService';
import {
  downloadIndonesianCsv,
  pushHistorySettingsToGas,
  pushHistoryToGas,
  pushPrufDocToGas,
  syncAllTabs,
} from './services/gasSyncService';
import {
  createManualHistoryEntry,
  detectSyncHistoryEntries,
  mergeHistoryEntries,
} from './services/historyService';
import {
  loadActiveUserId,
  loadCachedHistory,
  loadCachedPrufDocs,
  loadCachedUsers,
  loadGasConfig,
  loadHistoryPortalSettings,
  loadSidebarCollapsed,
  loadSyncLogs,
  loadThemePreference,
  saveActiveUserId,
  saveCachedHistory,
  saveCachedPrufDocs,
  saveCachedUsers,
  saveGasConfig,
  saveHistoryPortalSettings,
  saveSidebarCollapsed,
  saveSyncLogs,
  saveThemePreference,
} from './services/storageCache';
import type {
  GASConfig,
  HistoryPortalSettings,
  PrufChangeHistoryEntry,
  PrufDocument,
  PrufGroupKey,
  PrufHistoryKind,
  PrufRow,
  RBACUser,
  RoleType,
  SheetTabKey,
  SyncLogEntry,
} from './types/tsc';
import {
  calcRowGr,
  calcRowKg,
  computePrufTotals,
  formatInt,
  formatKg,
  formatPct,
  roundKg,
  roundPct,
  triggerDirectFileDownload,
} from './utils/formatters';

function detectPublicPortalFromLocation(): boolean {
  try {
    const path = window.location.pathname;
    if (/^\/(publik|portal|public)(\/|$)/i.test(path)) return true;
    const params = new URLSearchParams(window.location.search);
    const mode = (params.get('mode') || '').toLowerCase();
    if (mode === 'publik' || mode === 'public' || mode === 'readonly') return true;
    if (params.get('public') === '1' || params.get('public') === 'true') return true;
    if (params.get('portal') === '1' || params.get('portal') === 'true') return true;
    const hash = window.location.hash.toLowerCase();
    if (hash === '#publik' || hash.startsWith('#/publik')) return true;
  } catch {
    // ignore
  }
  return false;
}

function detectTabFromLocation(): SheetTabKey {
  try {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get('tab');
    if (requested && SHEET_TABS.some((t) => t.key === requested)) {
      return requested as SheetTabKey;
    }
  } catch {
    // ignore
  }
  return '153 BK';
}

export default function App() {
  const [isPublicPortal, setIsPublicPortal] = useState<boolean>(
    detectPublicPortalFromLocation
  );
  const [docsByTab, setDocsByTab] = useState<Record<SheetTabKey, PrufDocument>>(
    loadCachedPrufDocs
  );
  const [users, setUsers] = useState<RBACUser[]>(loadCachedUsers);
  const [activeUserId, setActiveUserId] = useState<string>(loadActiveUserId);
  const [gasConfig, setGasConfig] = useState<GASConfig>(loadGasConfig);
  const [syncLogs, setSyncLogs] = useState<SyncLogEntry[]>(loadSyncLogs);
  const [historyEntries, setHistoryEntries] = useState<PrufChangeHistoryEntry[]>(
    loadCachedHistory
  );
  const [historySettings, setHistorySettings] = useState<HistoryPortalSettings>(
    loadHistoryPortalSettings
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(
    loadSidebarCollapsed
  );
  const [theme, setTheme] = useState<'light' | 'dark'>(loadThemePreference);
  const [activeTab, setActiveTab] = useState<SheetTabKey>(detectTabFromLocation);

  const [isSyncing, setIsSyncing] = useState(false);
  const [showRowModal, setShowRowModal] = useState(false);
  const [editingRow, setEditingRow] = useState<PrufRow | null>(null);
  const [defaultRowGroup, setDefaultRowGroup] = useState<PrufGroupKey>('GROUP 1');
  const [showMetaModal, setShowMetaModal] = useState(false);
  const [showGasModal, setShowGasModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPublicModal, setShowPublicModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [toast, setToast] = useState<{
    type: 'success' | 'info' | 'error';
    text: string;
  } | null>(null);

  const initialSyncDoneRef = useRef(false);

  const showToast = useCallback(
    (type: 'success' | 'info' | 'error', text: string) => {
      setToast({type, text});
    },
    []
  );

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    saveThemePreference(theme);
  }, [theme]);

  useEffect(() => {
    const onPopState = () => {
      setIsPublicPortal(detectPublicPortalFromLocation());
      setActiveTab(detectTabFromLocation());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const activeUser = useMemo(() => {
    return users.find((u) => u.id === activeUserId) || users[0];
  }, [users, activeUserId]);

  const activeDoc = docsByTab[activeTab];
  const activeTotals = useMemo(() => computePrufTotals(activeDoc), [activeDoc]);

  const tabCounts = useMemo(() => {
    const countActive = (doc?: PrufDocument) =>
      (doc?.rows || []).filter(
        (r) =>
          r.pct > 0 &&
          calcRowGr(r.pct, doc?.baseGr || 1000) > 0 &&
          calcRowKg(r.pct, doc?.targetKg || 600) > 0
      ).length;
    return {
      '153 BK': countActive(docsByTab['153 BK']),
      'TIS KBT24': countActive(docsByTab['TIS KBT24']),
      'KARANG BK': countActive(docsByTab['KARANG BK']),
      'F REGULER (LN, AVE)': countActive(docsByTab['F REGULER (LN, AVE)']),
    };
  }, [docsByTab]);

  const appendLog = useCallback(
    (entry: Omit<SyncLogEntry, 'id' | 'timestamp'>) => {
      setSyncLogs((prev) => {
        const next: SyncLogEntry[] = [
          {
            id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: new Date().toISOString(),
            ...entry,
          },
          ...prev,
        ].slice(0, 25);
        saveSyncLogs(next);
        return next;
      });
    },
    []
  );

  const appendHistoryRecord = useCallback(
    (entries: PrufChangeHistoryEntry[]) => {
      if (entries.length === 0) return;
      setHistoryEntries((prev) => {
        const merged = mergeHistoryEntries(entries, prev);
        saveCachedHistory(merged);
        return merged;
      });
      if (gasConfig.gasUrl.trim()) {
        void pushHistoryToGas(gasConfig.gasUrl, entries).catch(() => {
          // Cached locally; will sync later when GAS is reachable
        });
      }
    },
    [gasConfig.gasUrl]
  );

  const handleToggleHistoryVisibility = useCallback(
    (nextVisible: boolean) => {
      if (isPublicPortal) return;
      const next: HistoryPortalSettings = {
        showHistoryInPublicPortal: nextVisible,
        updatedAt: new Date().toISOString(),
        updatedBy: activeUser.name,
      };
      setHistorySettings(next);
      saveHistoryPortalSettings(next);
      if (gasConfig.gasUrl.trim()) {
        void pushHistorySettingsToGas(gasConfig.gasUrl, next).catch(() => {
          // Kept locally
        });
      }
      showToast(
        'info',
        nextVisible
          ? 'Riwayat Perubahan ditampilkan (Read-Only) di Portal Publik.'
          : 'Riwayat Perubahan disembunyikan dari Portal Publik.'
      );
    },
    [isPublicPortal, activeUser.name, gasConfig.gasUrl, showToast]
  );

  const handleSyncNow = useCallback(
    async (silent = false) => {
      if (isSyncing) return;
      setIsSyncing(true);
      try {
        const res = await syncAllTabs(gasConfig, docsByTab);

        // Detect composition & Catatan changes across all 4 tabs before overwriting state
        const clientDetected: PrufChangeHistoryEntry[] = [];
        for (const t of SHEET_TABS) {
          const prevDoc = docsByTab[t.key];
          const nextDoc = res.docs[t.key];
          if (prevDoc && nextDoc) {
            clientDetected.push(...detectSyncHistoryEntries(prevDoc, nextDoc));
          }
        }

        const remoteHistory = Array.isArray(res.history) ? res.history : [];
        if (remoteHistory.length > 0 || clientDetected.length > 0) {
          setHistoryEntries((prev) => {
            const merged = mergeHistoryEntries(
              [...remoteHistory, ...clientDetected],
              prev
            );
            saveCachedHistory(merged);
            return merged;
          });

          if (res.source === 'gas' && gasConfig.gasUrl.trim() && clientDetected.length > 0) {
            const remoteIds = new Set(remoteHistory.map((h) => h.id));
            const unsynced = clientDetected.filter((d) => !remoteIds.has(d.id));
            if (unsynced.length > 0) {
              void pushHistoryToGas(gasConfig.gasUrl, unsynced).catch(() => {
                // Non-blocking sync
              });
            }
          }
        }

        if (res.historySettings) {
          setHistorySettings(res.historySettings);
          saveHistoryPortalSettings(res.historySettings);
        }

        setDocsByTab(res.docs);
        saveCachedPrufDocs(res.docs);

        const nextConfig: GASConfig = {
          ...gasConfig,
          lastSyncAt: new Date().toISOString(),
          lastSyncSource: res.source,
          lastSyncError: res.warnings[0] || null,
        };
        setGasConfig(nextConfig);
        saveGasConfig(nextConfig);

        appendLog({
          action: res.source === 'gas' ? 'GET' : 'CSV',
          tab: 'ALL',
          status: 'ok',
          message: `Sinkronisasi 4 sheet PRUF berhasil (${res.source.toUpperCase()}).`,
        });
        if (!silent) {
          showToast(
            'success',
            `Berhasil sinkron sheet PRUF via ${res.source.toUpperCase()}.`
          );
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Gagal sinkronisasi ke Google Sheets.';
        const nextConfig: GASConfig = {
          ...gasConfig,
          lastSyncError: message,
        };
        setGasConfig(nextConfig);
        saveGasConfig(nextConfig);
        appendLog({
          action: gasConfig.gasUrl ? 'GET' : 'CSV',
          tab: 'ALL',
          status: 'error',
          message,
        });
        if (!silent) {
          showToast('info', `Mode cache lokal aktif (${message})`);
        }
      } finally {
        setIsSyncing(false);
      }
    },
    [isSyncing, gasConfig, docsByTab, appendLog, showToast]
  );

  const lastAutoSyncAtRef = useRef<number>(0);
  const handleSyncNowRef = useRef(handleSyncNow);
  handleSyncNowRef.current = handleSyncNow;

  useEffect(() => {
    if (initialSyncDoneRef.current) return;
    initialSyncDoneRef.current = true;
    if (gasConfig.autoSync && navigator.onLine) {
      lastAutoSyncAtRef.current = Date.now();
      void handleSyncNowRef.current(true);
    }
  }, [gasConfig.autoSync]);

  // Silent re-sync on resume/focus (5s cooldown) and every 60s while tab is active
  useEffect(() => {
    if (!gasConfig.autoSync) return;
    const maybeSyncNow = (cooldownMs: number) => {
      if (document.visibilityState === 'hidden') return;
      if (!navigator.onLine) return;
      const now = Date.now();
      if (now - lastAutoSyncAtRef.current < cooldownMs) return;
      lastAutoSyncAtRef.current = now;
      void handleSyncNowRef.current(true);
    };
    const onResume = () => maybeSyncNow(5_000);
    window.addEventListener('focus', onResume);
    window.addEventListener('online', onResume);
    document.addEventListener('visibilitychange', onResume);
    const intervalId = window.setInterval(() => maybeSyncNow(55_000), 60_000);
    return () => {
      window.removeEventListener('focus', onResume);
      window.removeEventListener('online', onResume);
      document.removeEventListener('visibilitychange', onResume);
      window.clearInterval(intervalId);
    };
  }, [gasConfig.autoSync]);

  const updateActiveDoc = useCallback(
    async (updater: (prev: PrufDocument) => PrufDocument, toastText?: string) => {
      if (isPublicPortal) return;
      let updatedDoc: PrufDocument | null = null;
      setDocsByTab((prev) => {
        const current = prev[activeTab];
        updatedDoc = updater(current);
        const next = {...prev, [activeTab]: updatedDoc};
        saveCachedPrufDocs(next);
        return next;
      });

      if (toastText) showToast('success', toastText);

      if (updatedDoc && gasConfig.gasUrl.trim()) {
        try {
          await pushPrufDocToGas(gasConfig.gasUrl, activeTab, updatedDoc);
          appendLog({
            action: 'POST',
            tab: activeTab,
            status: 'ok',
            message: `Pembaruan PRUF ${activeTab} disinkronkan ke GAS.`,
          });
        } catch (err) {
          appendLog({
            action: 'POST',
            tab: activeTab,
            status: 'error',
            message: err instanceof Error ? err.message : 'Gagal POST ke GAS.',
          });
        }
      }
    },
    [isPublicPortal, activeTab, gasConfig.gasUrl, appendLog, showToast]
  );

  const handleToggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      saveSidebarCollapsed(next);
      return next;
    });
  };

  const handleSelectUser = (userId: string) => {
    setActiveUserId(userId);
    saveActiveUserId(userId);
  };

  const handleAddUser = (name: string, role: RoleType) => {
    const newUser: RBACUser = {
      id: `usr-${Date.now()}`,
      name,
      role,
      createdBy: activeUser.name,
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => {
      const next = [...prev, newUser];
      saveCachedUsers(next);
      return next;
    });
    showToast('success', `Pengguna "${name}" (${role}) ditambahkan.`);
  };

  const handleRemoveUser = (userId: string) => {
    setUsers((prev) => {
      const next = prev.filter((u) => u.id !== userId);
      saveCachedUsers(next);
      return next;
    });
    showToast('info', 'Pengguna telah dihapus.');
  };

  const handleChangeTargetKg = (nextKg: number) => {
    const safeKg = roundKg(Math.max(1, nextKg));
    void updateActiveDoc((doc) => ({
      ...doc,
      targetKg: safeKg,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleToggleRowVerify = (rowId: string) => {
    if (activeUser.role === 'User') return;
    void updateActiveDoc(
      (doc) => ({
        ...doc,
        rows: doc.rows.map((r) =>
          r.id === rowId
            ? {
                ...r,
                verified: !r.verified,
                verifiedBy: !r.verified ? activeUser.name : undefined,
                verifiedAt: !r.verified ? new Date().toISOString() : undefined,
              }
            : r
        ),
        updatedAt: new Date().toISOString(),
      }),
      'Status verifikasi bahan diperbarui.'
    );
  };

  const handleSaveRow = (savedRow: PrufRow, historyReason?: string) => {
    setShowRowModal(false);
    setEditingRow(null);

    const prevRow = activeDoc.rows.find((r) => r.id === savedRow.id) || null;
    let detectedKind: PrufHistoryKind | null = null;
    if (!prevRow) {
      detectedKind = 'TAMBAH_BAHAN';
    } else if (
      prevRow.rincian.trim().toLowerCase() !== savedRow.rincian.trim().toLowerCase()
    ) {
      detectedKind = 'GANTI_BAHAN';
    } else if (Math.abs(roundPct(savedRow.pct - prevRow.pct)) >= 0.01) {
      detectedKind = 'UBAH_PERSENTASE';
    } else if (
      savedRow.keterangan &&
      /catatan/i.test(savedRow.keterangan) &&
      savedRow.keterangan !== prevRow.keterangan
    ) {
      detectedKind = 'CATATAN_AKTIF';
    } else if (
      prevRow.keterangan &&
      /catatan/i.test(prevRow.keterangan) &&
      !savedRow.keterangan
    ) {
      detectedKind = 'EKSEKUSI_CATATAN';
    }

    if (detectedKind) {
      const historyEntry = createManualHistoryEntry({
        doc: activeDoc,
        prevRow,
        nextRow: savedRow,
        jenisPerubahan: detectedKind,
        faktorAlasan:
          historyReason ||
          (detectedKind === 'GANTI_BAHAN'
            ? `Penggantian bahan ${prevRow?.rincian} → ${savedRow.rincian}`
            : detectedKind === 'UBAH_PERSENTASE'
            ? `Penyesuaian persentase ${savedRow.rincian}`
            : `Pembaruan baris ${savedRow.rincian}`),
        catatanRef: savedRow.keterangan || prevRow?.keterangan || '',
        actor: activeUser.name,
      });
      appendHistoryRecord([historyEntry]);
    }

    void updateActiveDoc((doc) => {
      const exists = doc.rows.some((r) => r.id === savedRow.id);
      const rows = exists
        ? doc.rows.map((r) => (r.id === savedRow.id ? savedRow : r))
        : [...doc.rows, savedRow];
      return {
        ...doc,
        rows,
        updatedAt: new Date().toISOString(),
      };
    }, `Baris "${savedRow.rincian}" disimpan.`);
  };

  const handleDeleteRow = (rowId: string) => {
    const targetRow = activeDoc.rows.find((r) => r.id === rowId);
    if (targetRow && targetRow.pct > 0) {
      const entry = createManualHistoryEntry({
        doc: activeDoc,
        prevRow: targetRow,
        nextRow: null,
        jenisPerubahan: 'HAPUS_BAHAN',
        faktorAlasan: `Menghapus bahan ${targetRow.rincian} (${formatPct(
          targetRow.pct
        )}) dari komposisi ${activeDoc.peruntukanMerk || activeTab}`,
        catatanRef: targetRow.keterangan || '',
        actor: activeUser.name,
      });
      appendHistoryRecord([entry]);
    }

    void updateActiveDoc(
      (doc) => ({
        ...doc,
        rows: doc.rows.filter((r) => r.id !== rowId),
        updatedAt: new Date().toISOString(),
      }),
      'Baris bahan dihapus.'
    );
  };

  const handleAddManualHistory = (payload: {
    jenisPerubahan: PrufHistoryKind;
    group: string;
    bahanLama: string;
    bahanBaru: string;
    pctLama: number | null;
    pctBaru: number | null;
    catatanRef: string;
    faktorAlasan: string;
  }) => {
    const delta =
      payload.pctLama !== null && payload.pctBaru !== null
        ? roundPct(payload.pctBaru - payload.pctLama)
        : null;
    const entry: PrufChangeHistoryEntry = {
      id: `hist-manual-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      tab: activeTab,
      namaTbkBlend: activeDoc.namaTbkBlend || activeTab,
      peruntukanMerk: activeDoc.peruntukanMerk || '-',
      noDokumen: activeDoc.noDokumen || '-',
      periodePruf: activeDoc.periodePruf || activeDoc.tglBlend || '-',
      jenisPerubahan: payload.jenisPerubahan,
      status:
        payload.jenisPerubahan === 'CATATAN_AKTIF'
          ? 'Rencana (Catatan Aktif)'
          : 'Sudah Dieksekusi',
      group: payload.group || 'GROUP 1',
      bahanLama: payload.bahanLama,
      bahanBaru: payload.bahanBaru,
      pctLama: payload.pctLama,
      pctBaru: payload.pctBaru,
      deltaPct: delta,
      catatanRef: payload.catatanRef,
      faktorAlasan: payload.faktorAlasan,
      sumber: 'Web App',
      oleh: activeUser.name,
    };
    appendHistoryRecord([entry]);
    showToast('success', `Riwayat untuk merk (${activeTab}) disimpan ke RIWAYAT_PRUF.`);
  };

  const handleSaveMetadata = (patch: Partial<PrufDocument>) => {
    setShowMetaModal(false);
    void updateActiveDoc(
      (doc) => ({
        ...doc,
        ...patch,
      }),
      'Metadata dokumen PRUF diperbarui.'
    );
  };

  const handleToggleApproval = (which: 'operasional' | 'direktur') => {
    if (activeUser.role === 'User') return;
    const nowIso = new Date().toISOString();
    void updateActiveDoc(
      (doc) => {
        if (which === 'operasional') {
          const nextApproved = !doc.accOperasional.approved;
          return {
            ...doc,
            accOperasional: {
              ...doc.accOperasional,
              approved: nextApproved,
              approvedBy: nextApproved ? activeUser.name : undefined,
              approvedAt: nextApproved ? nowIso : undefined,
            },
            updatedAt: nowIso,
          };
        }
        const nextApproved = !doc.accDirektur.approved;
        return {
          ...doc,
          accDirektur: {
            ...doc.accDirektur,
            approved: nextApproved,
            approvedBy: nextApproved ? activeUser.name : undefined,
            approvedAt: nextApproved ? nowIso : undefined,
          },
          updatedAt: nowIso,
        };
      },
      which === 'operasional'
        ? 'Status ACC Manajer Operasional diperbarui.'
        : 'Status ACC Direktur diperbarui.'
    );
  };

  const handleDownloadPruf = () => {
    const safeFile = `PRUF_${activeTab.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    if (activeDoc.prufDownloadUrl && triggerDirectFileDownload(activeDoc.prufDownloadUrl, safeFile)) {
      showToast('success', `Mengunduh file PDF ${activeTab}...`);
      return;
    }
    if (isPublicPortal) {
      exportPrufPdf(activeDoc, activeUser);
      showToast('success', `Mengunduh dokumen PRUF ${activeTab} (PDF)...`);
      return;
    }
    setShowMetaModal(true);
    showToast(
      'info',
      'Tempel link Google Drive PDF pada kolom "Link File PDF PRUF" lalu simpan.'
    );
  };

  const handleExportCsv = () => {
    if (isPublicPortal) return;
    downloadIndonesianCsv(activeDoc);
    showToast('success', `CSV PRUF ${activeTab} (separasi ;) diunduh.`);
  };

  const handleEnterPublicPreview = (tab?: SheetTabKey) => {
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set('mode', 'publik');
    if (tab) {
      nextUrl.searchParams.set('tab', tab);
    }
    window.history.pushState({}, '', nextUrl.toString());
    setShowPublicModal(false);
    setShowRowModal(false);
    setShowMetaModal(false);
    setShowGasModal(false);
    setShowUserModal(false);
    setIsPublicPortal(true);
    if (tab) setActiveTab(tab);
    showToast('info', 'Menampilkan Portal Publik (Mode Read-Only).');
  };

  const canModify = !isPublicPortal && activeUser.role !== 'User';
  const activeTabMeta =
    SHEET_TABS.find((t) => t.key === activeTab) || SHEET_TABS[0];

  return (
    <div className="h-[100dvh] flex overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        onOpenGasCenter={() => setShowGasModal(true)}
        onOpenUserModal={() => setShowUserModal(true)}
        onOpenPublicPortal={() => setShowPublicModal(true)}
        currentRole={activeUser.role}
        tabCounts={tabCounts}
        isPublicPortal={isPublicPortal}
      />

      <div className="flex-1 flex flex-col min-w-0 h-[100dvh]">
        <Header
          activeTab={activeTab}
          users={users}
          activeUser={activeUser}
          onSelectUser={handleSelectUser}
          onRefreshSync={() => void handleSyncNow(false)}
          isSyncing={isSyncing}
          gasConfig={gasConfig}
          theme={theme}
          onToggleTheme={() =>
            setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
          }
          onOpenGasCenter={() => setShowGasModal(true)}
          onOpenUserModal={() => setShowUserModal(true)}
          isPublicPortal={isPublicPortal}
        />

        <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 pb-24 md:pb-6 space-y-5">
          {/* Top Page Context & Actions */}
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div className="min-w-0">
              <h2 className="font-display text-lg sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {activeDoc.namaTbkBlend
                  ? `NAMA TBK. BLEND : ${activeDoc.namaTbkBlend}`
                  : activeTabMeta.blendTitle}
              </h2>
              <p className="mt-0.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {activeDoc.judulUtama || activeTabMeta.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {canModify && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingRow(null);
                    setDefaultRowGroup('GROUP 1');
                    setShowRowModal(true);
                  }}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Bahan</span>
                </button>
              )}

              {(!isPublicPortal || historySettings.showHistoryInPublicPortal) && (
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(true)}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-300 text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap"
                  title="Lihat Riwayat Perubahan Komposisi & Catatan PRUF per Merk"
                >
                  <History className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Riwayat Perubahan</span>
                  {historyEntries.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-md bg-amber-600 text-white font-mono text-[11px] tabular-nums">
                      {historyEntries.length}
                    </span>
                  )}
                </button>
              )}

              {!isPublicPortal && (
                <button
                  type="button"
                  onClick={() => setShowPublicModal(true)}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap"
                  title="Salin Link Portal Publik (Read-Only)"
                >
                  <Globe className="w-4 h-4" />
                  <span>Portal Publik</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleDownloadPruf}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap"
                title={
                  activeDoc.prufDownloadUrl
                    ? `Download langsung file PDF PRUF ${activeTab}`
                    : isPublicPortal
                    ? `Download dokumen PDF PRUF ${activeTab}`
                    : 'Atur & Download Link PDF PRUF Google Drive'
                }
              >
                <FileDown className="w-4 h-4 text-emerald-400" />
                <span>Download Pruf</span>
              </button>

              {!isPublicPortal && (
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap"
                  title="Download CSV dengan pemisah titik koma (;) lokal Indonesia"
                >
                  <FileSpreadsheet className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>CSV (;)</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile Quick Tab Switcher Strip */}
          <div className="flex md:hidden items-center gap-1.5 overflow-x-auto pb-1">
            {SHEET_TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={`min-h-[44px] px-3.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                  activeTab === t.key
                    ? 'bg-slate-900 dark:bg-emerald-600 text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {t.key} (<span className="font-mono tabular-nums">{tabCounts[t.key]}</span>)
              </button>
            ))}
          </div>

          {/* 4-Column Executive KPI Summary Strip */}
          <section
            aria-label="Ringkasan PRUF Aktif"
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
          >
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Total Tembakau
              </div>
              <div className="mt-1.5 font-mono tabular-nums text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {formatKg(activeTotals.tobaccoKg)}
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                {formatInt(activeTotals.tobaccoCount)} Jenis ·{' '}
                {formatPct(activeTotals.tobaccoPct)}
              </div>
            </div>

            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Saos Cassing &amp; Top
              </div>
              <div className="mt-1.5 font-mono tabular-nums text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {formatKg(activeTotals.saosKg)}
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                Komposisi {formatPct(activeTotals.saosPct)}
              </div>
            </div>

            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Cengkeh Rajang Kering
              </div>
              <div className="mt-1.5 font-mono tabular-nums text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {formatKg(activeTotals.cengkehKg)}
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                Komposisi {formatPct(activeTotals.cengkehPct)}
              </div>
            </div>

            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Grand Total Blend
              </div>
              <div className="mt-1.5 font-mono tabular-nums text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                {formatKg(activeTotals.grandKg)}
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                {formatPct(activeTotals.grandPct)} · Cek{' '}
                {formatPct(activeTotals.verifiedPct)}
              </div>
            </div>
          </section>

          {/* Authentic KETETAPAN PRUF Table */}
          <PrufSheetTable
            doc={activeDoc}
            currentRole={activeUser.role}
            isPublicPortal={isPublicPortal}
            isSyncing={isSyncing}
            onRefreshSync={() => void handleSyncNow(false)}
            onChangeTargetKg={handleChangeTargetKg}
            onToggleRowVerify={handleToggleRowVerify}
            onAddRow={(group) => {
              if (isPublicPortal) return;
              setEditingRow(null);
              setDefaultRowGroup(group || 'GROUP 1');
              setShowRowModal(true);
            }}
            onEditRow={(row) => {
              if (isPublicPortal) return;
              setEditingRow(row);
              setShowRowModal(true);
            }}
            onDeleteRow={handleDeleteRow}
            onEditMetadata={() => {
              if (!isPublicPortal) setShowMetaModal(true);
            }}
            onToggleApproval={handleToggleApproval}
          />

          <Footer />
        </main>
      </div>

      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenUserModal={() => setShowUserModal(true)}
        isPublicPortal={isPublicPortal}
      />

      {/* Modals (disabled completely in read-only Public Portal) */}
      {!isPublicPortal && showRowModal && (
        <PrufRowModal
          baseGr={activeDoc.baseGr}
          targetKg={activeDoc.targetKg}
          defaultGroup={defaultRowGroup}
          initialRow={editingRow}
          onClose={() => {
            setShowRowModal(false);
            setEditingRow(null);
          }}
          onSave={handleSaveRow}
        />
      )}

      {!isPublicPortal && showMetaModal && (
        <PrufMetadataModal
          doc={activeDoc}
          activeUser={activeUser}
          onClose={() => setShowMetaModal(false)}
          onSave={handleSaveMetadata}
        />
      )}

      {!isPublicPortal && showGasModal && (
        <GASCenterModal
          config={gasConfig}
          activeTab={activeTab}
          allDocs={docsByTab}
          syncLogs={syncLogs}
          onSaveConfig={(next) => {
            setGasConfig(next);
            saveGasConfig(next);
          }}
          onTriggerSync={() => handleSyncNow(false)}
          onClose={() => setShowGasModal(false)}
        />
      )}

      {!isPublicPortal && showUserModal && (
        <UserManagementModal
          users={users}
          activeUser={activeUser}
          onAddUser={handleAddUser}
          onRemoveUser={handleRemoveUser}
          onSelectUser={handleSelectUser}
          onClose={() => setShowUserModal(false)}
        />
      )}

      {!isPublicPortal && showPublicModal && (
        <PublicPortalModal
          activeTab={activeTab}
          showHistoryInPublicPortal={historySettings.showHistoryInPublicPortal}
          onToggleHistoryVisibility={handleToggleHistoryVisibility}
          onEnterPublicPreview={handleEnterPublicPreview}
          onClose={() => setShowPublicModal(false)}
        />
      )}

      {showHistoryModal && (!isPublicPortal || historySettings.showHistoryInPublicPortal) && (
        <PrufHistoryModal
          activeTab={activeTab}
          activeDoc={activeDoc}
          entries={historyEntries}
          isPublicPortal={isPublicPortal}
          canModify={canModify}
          showHistoryInPublicPortal={historySettings.showHistoryInPublicPortal}
          onToggleHistoryVisibility={handleToggleHistoryVisibility}
          onAddManualEntry={handleAddManualHistory}
          onClose={() => setShowHistoryModal(false)}
        />
      )}

      {toast && (
        <div
          role="status"
          className={`fixed bottom-20 md:bottom-6 right-4 z-50 max-w-sm rounded-xl px-4 py-3 text-xs font-semibold shadow-lg border ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : toast.type === 'error'
              ? 'bg-red-600 text-white border-red-500'
              : 'bg-slate-900 text-white border-slate-700'
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
