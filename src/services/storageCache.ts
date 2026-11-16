import {
  createEmptyPrufDocuments,
  DEFAULT_GAS_URL,
  DEFAULT_SPREADSHEET_ID,
  DEFAULT_USERS,
} from '../data/seedData';
import type {
  GASConfig,
  HistoryPortalSettings,
  PrufChangeHistoryEntry,
  PrufDocument,
  RBACUser,
  SheetTabKey,
  SyncLogEntry,
} from '../types/tsc';
import {toGoogleDriveDownloadUrl} from '../utils/formatters';

const KEYS = {
  DOCS: 'pruf_tsc_docs_v4',
  USERS: 'pruf_tsc_users_v1',
  ACTIVE_USER_ID: 'pruf_tsc_active_user_id_v1',
  GAS_CONFIG: 'pruf_tsc_gas_config_v1',
  SIDEBAR_COLLAPSED: 'pruf_tsc_sidebar_collapsed_v1',
  THEME: 'pruf_tsc_theme',
  SYNC_LOGS: 'pruf_tsc_sync_logs_v1',
  HISTORY: 'pruf_tsc_history_v1',
  HISTORY_SETTINGS: 'pruf_tsc_history_settings_v1',
} as const;

interface MemoryEntry<T> {
  raw: string | null;
  parsed: T;
}

const memoryCache = new Map<string, MemoryEntry<unknown>>();

function readCached<T>(key: string, fallback: () => T): T {
  try {
    const raw = window.localStorage.getItem(key);
    const hit = memoryCache.get(key) as MemoryEntry<T> | undefined;
    if (hit && hit.raw === raw) {
      return hit.parsed;
    }
    if (raw !== null) {
      const parsed = JSON.parse(raw) as T;
      memoryCache.set(key, {raw, parsed});
      return parsed;
    }
    const fresh = fallback();
    const serialized = JSON.stringify(fresh);
    window.localStorage.setItem(key, serialized);
    memoryCache.set(key, {raw: serialized, parsed: fresh});
    return fresh;
  } catch {
    return fallback();
  }
}

function writeCached<T>(key: string, value: T): void {
  try {
    const serialized = JSON.stringify(value);
    window.localStorage.setItem(key, serialized);
    memoryCache.set(key, {raw: serialized, parsed: value});
  } catch {
    memoryCache.set(key, {raw: null, parsed: value});
  }
}

export function loadCachedPrufDocs(): Record<SheetTabKey, PrufDocument> {
  const docs = readCached<Record<SheetTabKey, PrufDocument>>(
    KEYS.DOCS,
    createEmptyPrufDocuments
  );
  const emptyTemplate = createEmptyPrufDocuments();
  const normalized = {...docs};
  (Object.keys(emptyTemplate) as SheetTabKey[]).forEach((k) => {
    const doc = normalized[k];
    if (!doc || !Array.isArray(doc.rows)) {
      normalized[k] = emptyTemplate[k];
    } else {
      normalized[k] = {
        ...doc,
        prufDownloadUrl: doc.prufDownloadUrl
          ? toGoogleDriveDownloadUrl(doc.prufDownloadUrl)
          : '',
      };
    }
  });
  return normalized;
}

export function saveCachedPrufDocs(
  docs: Record<SheetTabKey, PrufDocument>
): void {
  writeCached(KEYS.DOCS, docs);
}

export function loadCachedUsers(): RBACUser[] {
  return readCached<RBACUser[]>(KEYS.USERS, () => DEFAULT_USERS);
}

export function saveCachedUsers(users: RBACUser[]): void {
  writeCached(KEYS.USERS, users);
}

export function loadActiveUserId(): string {
  try {
    return window.localStorage.getItem(KEYS.ACTIVE_USER_ID) || DEFAULT_USERS[0].id;
  } catch {
    return DEFAULT_USERS[0].id;
  }
}

export function saveActiveUserId(userId: string): void {
  try {
    window.localStorage.setItem(KEYS.ACTIVE_USER_ID, userId);
  } catch {
    // ignore
  }
}

export function loadGasConfig(): GASConfig {
  const cfg = readCached<GASConfig>(KEYS.GAS_CONFIG, () => ({
    spreadsheetId: DEFAULT_SPREADSHEET_ID,
    gasUrl: DEFAULT_GAS_URL,
    autoSync: true,
    lastSyncAt: null,
    lastSyncSource: 'none',
    lastSyncError: null,
  }));
  if (!cfg.gasUrl || !cfg.gasUrl.trim()) {
    const updated: GASConfig = {...cfg, gasUrl: DEFAULT_GAS_URL};
    writeCached(KEYS.GAS_CONFIG, updated);
    return updated;
  }
  return cfg;
}

export function saveGasConfig(config: GASConfig): void {
  writeCached(KEYS.GAS_CONFIG, config);
}

export function loadSidebarCollapsed(): boolean {
  try {
    return window.localStorage.getItem(KEYS.SIDEBAR_COLLAPSED) === 'true';
  } catch {
    return false;
  }
}

export function saveSidebarCollapsed(collapsed: boolean): void {
  try {
    window.localStorage.setItem(KEYS.SIDEBAR_COLLAPSED, String(collapsed));
  } catch {
    // ignore
  }
}

export function loadThemePreference(): 'light' | 'dark' {
  try {
    const saved = window.localStorage.getItem(KEYS.THEME);
    return saved === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function saveThemePreference(theme: 'light' | 'dark'): void {
  try {
    window.localStorage.setItem(KEYS.THEME, theme);
  } catch {
    // ignore
  }
}

export function loadSyncLogs(): SyncLogEntry[] {
  return readCached<SyncLogEntry[]>(KEYS.SYNC_LOGS, () => []);
}

export function saveSyncLogs(logs: SyncLogEntry[]): void {
  writeCached(KEYS.SYNC_LOGS, logs.slice(0, 25));
}

export function loadCachedHistory(): PrufChangeHistoryEntry[] {
  return readCached<PrufChangeHistoryEntry[]>(KEYS.HISTORY, () => []);
}

export function saveCachedHistory(entries: PrufChangeHistoryEntry[]): void {
  writeCached(KEYS.HISTORY, entries.slice(0, 500));
}

export function loadHistoryPortalSettings(): HistoryPortalSettings {
  return readCached<HistoryPortalSettings>(KEYS.HISTORY_SETTINGS, () => ({
    showHistoryInPublicPortal: true,
    updatedAt: '',
    updatedBy: 'System',
  }));
}

export function saveHistoryPortalSettings(
  settings: HistoryPortalSettings
): void {
  writeCached(KEYS.HISTORY_SETTINGS, settings);
}
