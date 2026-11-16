export type SheetTabKey =
  | '153 BK'
  | 'TIS KBT24'
  | 'KARANG BK'
  | 'F REGULER (LN, AVE)';

export type RoleType =
  | 'Developer/Site Enginer'
  | 'Bendahara Utama'
  | 'Admin'
  | 'User';

export interface RBACUser {
  id: string;
  name: string;
  role: RoleType;
  createdBy: string;
  createdAt: string;
}

export type PrufGroupKey =
  | 'GROUP 1'
  | 'GROUP 2'
  | 'GROUP 3'
  | 'GROUP 4'
  | 'GROUP 6'
  | 'SAOS'
  | 'REFRESH'
  | 'CENGKEH';

export interface PrufRow {
  id: string;
  group: PrufGroupKey;
  rincian: string;
  kodeIntern: string;
  pct: number; // 2 decimals (%)
  keterangan: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface PrufApproval {
  approved: boolean;
  jabatan: string;
  nama: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface PrufDocument {
  tab: SheetTabKey;
  judulUtama: string;
  namaTbkBlend: string;
  noDokumen: string;
  pelaksanaanPruf: string;
  periodePruf: string;
  tglBlend: string;
  peruntukanMerk: string;
  baseGr: number; // Default 1000 Gr
  targetKg: number; // e.g. 600, 140, 360
  rows: PrufRow[];
  catatan: string;
  lokasiTanggal: string;
  accOperasional: PrufApproval;
  accDirektur: PrufApproval;
  prufDownloadUrl: string;
  updatedAt: string;
  source: 'local' | 'gas' | 'csv';
}

export interface GASConfig {
  spreadsheetId: string;
  gasUrl: string;
  autoSync: boolean;
  lastSyncAt: string | null;
  lastSyncSource: 'cache' | 'gas' | 'csv' | 'none';
  lastSyncError: string | null;
}

export interface SyncLogEntry {
  id: string;
  timestamp: string;
  action: 'GET' | 'POST' | 'CSV';
  tab: SheetTabKey | 'ALL';
  status: 'ok' | 'error';
  message: string;
}

export interface SheetTabMeta {
  key: SheetTabKey;
  shortLabel: string;
  blendTitle: string;
  defaultTargetKg: number;
  description: string;
}
