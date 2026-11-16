import type {
  PrufDocument,
  PrufGroupKey,
  PrufRow,
  RBACUser,
  SheetTabKey,
  SheetTabMeta,
} from '../types/tsc';

export const DEFAULT_SPREADSHEET_ID =
  '1qnTh5PL0oitFtH7tx7pI1r4jBnWk9vgVuUVJnWUAvk4';

export const DEFAULT_GAS_URL =
  'https://script.google.com/macros/s/AKfycbySzMSgDrxT2NYwpl7tH1ROcdN51weVgGP7ZuF3lcSpoMTluD3skODMY6VlGC-NzDvv/exec';

export const SHEET_TABS: SheetTabMeta[] = [
  {
    key: '153 BK',
    shortLabel: '153 BK',
    blendTitle: 'NAMA TBK. BLEND : 153 - BK',
    defaultTargetKg: 600,
    description: 'Ketetapan Pruf Tembakau Blend Jenis SKT (Low Flavour) — 153 BK.',
  },
  {
    key: 'TIS KBT24',
    shortLabel: 'TIS KBT24',
    blendTitle: 'NAMA TBK. BLEND : TIS - KBT24',
    defaultTargetKg: 140,
    description: 'Ketetapan Pruf Tembakau Blend Jenis SKT (Low Flavour) — TIS KBT24.',
  },
  {
    key: 'KARANG BK',
    shortLabel: 'KARANG BK',
    blendTitle: 'NAMA TBK. BLEND : KARANG - BK',
    defaultTargetKg: 600,
    description: 'Ketetapan Pruf Tembakau Blend Jenis SKT (Low Flavour) — KARANG BK.',
  },
  {
    key: 'F REGULER (LN, AVE)',
    shortLabel: 'F REGULER',
    blendTitle: 'NAMA TBK. BLEND : F REGULER (LN - AVE)',
    defaultTargetKg: 360,
    description:
      'Ketetapan Pruf Tembakau Blend Jenis SKT (Low Flavour) — F REGULER (LN, AVE).',
  },
];

export const DEFAULT_USERS: RBACUser[] = [
  {
    id: 'usr-dev-1',
    name: 'Lalu Mahendra AA.',
    role: 'Developer/Site Enginer',
    createdBy: 'System',
    createdAt: '2026-11-12T08:00:00+07:00',
  },
  {
    id: 'usr-ben-1',
    name: 'Bendahara Utama',
    role: 'Bendahara Utama',
    createdBy: 'System',
    createdAt: '2026-11-12T08:00:00+07:00',
  },
  {
    id: 'usr-adm-1',
    name: 'Admin QC Pengolahan',
    role: 'Admin',
    createdBy: 'Lalu Mahendra AA.',
    createdAt: '2026-11-12T08:00:00+07:00',
  },
  {
    id: 'usr-op-1',
    name: 'Operator Lini Produksi I',
    role: 'User',
    createdBy: 'Lalu Mahendra AA.',
    createdAt: '2026-11-12T08:00:00+07:00',
  },
];

function row(
  prefix: string,
  idx: number,
  group: PrufGroupKey,
  rincian: string,
  pct: number,
  kodeIntern = '',
  keterangan = '',
  verified = true
): PrufRow {
  return {
    id: `${prefix}-${idx}`,
    group,
    rincian,
    kodeIntern,
    pct,
    keterangan,
    verified,
    verifiedBy: verified ? 'Lalu Mahendra AA.' : undefined,
    verifiedAt: verified ? '2026-11-12T10:00:00+07:00' : undefined,
  };
}

const SHARED_TOBACCO_153_AND_TIS: PrufRow[] = [
  // GROUP 1
  row('t1', 1, 'GROUP 1', 'Madura 2024 (BAT) R', 32.0),
  row('t1', 2, 'GROUP 1', 'Hang Madura 2024 (BAT)', 0.5),
  row('t1', 3, 'GROUP 1', 'Maesan 2024 (HS)', 1.0),
  row('t1', 4, 'GROUP 1', 'Paiton 2024 (VJI)', 4.0),
  row('t1', 5, 'GROUP 1', 'Mranggen 2024 (LL)', 3.0),
  row('t1', 6, 'GROUP 1', 'Weleri 2024 (HK)', 4.5),
  row('t1', 7, 'GROUP 1', 'Weleri Grade B (2021)', 0.5),
  // GROUP 2
  row('t1', 8, 'GROUP 2', 'Sapudi 2024 (GF)', 1.5),
  row('t1', 9, 'GROUP 2', 'Besuki 2025 (ZN)', 0.5),
  row('t1', 10, 'GROUP 2', 'Beringin 2024 (HS)', 2.0),
  // GROUP 3
  row('t1', 11, 'GROUP 3', 'Amerika 2025 (BO1)', 6.0, 'BO1'),
  row('t1', 12, 'GROUP 3', 'Zimbabwe B1L (2023)', 5.0, 'B1L'),
  row('t1', 13, 'GROUP 3', 'Zimbabwe 2025 (L2OF/P)', 2.0),
  row('t1', 14, 'GROUP 3', 'Zimbabwe 2025 (HR) L1OF', 5.0, 'L1OF'),
  row('t1', 15, 'GROUP 3', 'Zimbabwe M1L (2023)', 3.0, 'M1L'),
  row('t1', 16, 'GROUP 3', 'Lombok 2024 (FS) - 1', 1.0, 'B1LF'),
  row('t1', 17, 'GROUP 3', 'Lombok 2024 (BE) - 1', 3.0, 'BO+OF'),
  row('t1', 18, 'GROUP 3', 'Zambia M1L (2023)', 2.0, 'M1L'),
  row('t1', 19, 'GROUP 3', 'Brazil Grade B (2022)', 1.0, 'X30F/B20F'),
  row('t1', 20, 'GROUP 3', 'Brazil 2025 (BOA)', 4.0, 'BOA'),
  row('t1', 21, 'GROUP 3', 'Diet Trial - 3 Plus (2026)', 1.0),
  // GROUP 4
  row('t1', 22, 'GROUP 4', 'Kasturi 2023 (ST)', 1.0),
  row('t1', 23, 'GROUP 4', 'Kasturi 2024 (BE) - 1', 3.5),
  row('t1', 24, 'GROUP 4', 'Hang Boyolali 2024 (FS)', 0.5),
  row('t1', 25, 'GROUP 4', 'Krs. Garut 2025 (MYN)', 1.5),
  row('t1', 26, 'GROUP 4', 'Krs. Garut 2024 (MYN)', 1.5),
  row('t1', 27, 'GROUP 4', 'Janturan Jombang 2024 (MYN)', 0.5),
  row('t1', 28, 'GROUP 4', 'Janturan Boyolali 2024 (VJI)', 1.0),
  // GROUP 6
  row('t1', 29, 'GROUP 6', 'Joning 2024 (AR)', 0.5),
  row('t1', 30, 'GROUP 6', 'Garut 2024 (FR)', 1.0),
  row('t1', 31, 'GROUP 6', 'Garut 2025 (FR)', 1.0),
  row('t1', 32, 'GROUP 6', 'Ploso 2024 (MYN)', 5.5),
];

export function createSeedPrufDocuments(): Record<SheetTabKey, PrufDocument> {
  const nowIso = '2026-11-12T11:10:00+07:00';

  const doc153: PrufDocument = {
    tab: '153 BK',
    judulUtama: 'KETETAPAN PRUF TEMBAKAU BLEND JENIS SKT ( LOW FLAVOUR )',
    namaTbkBlend: '153 - BK',
    noDokumen: '26A/P-153BK/PPI/BKR/XI/2026',
    pelaksanaanPruf: '12 November 2026',
    periodePruf: '16 - 28 Nov 2026',
    tglBlend: '16 - 28 Nov 2026',
    peruntukanMerk:
      '153 Lista KML Hijau 10,16 - 153 Lista KML 10,12,20 - 153 LN 10,12 ,10+2 - 153 LN SALITI 12,20 - 153 LN SALITI 12 Hijau Tua',
    baseGr: 1000,
    targetKg: 600,
    rows: [
      ...SHARED_TOBACCO_153_AND_TIS.map((r, i) => ({...r, id: `153-${i + 1}`})),
      row('153', 33, 'SAOS', 'Cassing Jadi 153 - BK (Musim Panas)', 6.5, '', 'Catatan 4', true),
      row('153', 34, 'SAOS', 'Top Jadi 153 - BK (Segala Cuaca)', 3.5, '', '', true),
      row('153', 35, 'CENGKEH', 'Manado Grade A (2024)', 36.0, 'A', '', true),
    ],
    catatan: '',
    lokasiTanggal: 'Malang, 12 November 2026',
    accOperasional: {
      approved: false,
      jabatan: 'Manajer Operasional',
      nama: 'Lalu Mahendra AA.',
    },
    accDirektur: {
      approved: false,
      jabatan: 'Direktur',
      nama: 'Bpk. Denny Wibisono',
    },
    prufDownloadUrl: '',
    updatedAt: nowIso,
    source: 'local',
  };

  const docTis: PrufDocument = {
    tab: 'TIS KBT24',
    judulUtama: 'KETETAPAN PRUF TEMBAKAU BLEND JENIS SKT ( LOW FLAVOUR )',
    namaTbkBlend: 'TIS - KBT24',
    noDokumen: '26C/P-TIS/PPI/BKR/XI/2026',
    pelaksanaanPruf: '12 November 2026',
    periodePruf: '16 - 28 Nov 2026',
    tglBlend: '16 - 28 Nov 2026',
    peruntukanMerk: 'Kabel',
    baseGr: 1000,
    targetKg: 140,
    rows: [
      ...SHARED_TOBACCO_153_AND_TIS.map((r, i) => ({...r, id: `tis-${i + 1}`})),
      row('tis', 33, 'SAOS', 'Cassing Jadi Teh Kretek Reguler - BK (Musim Panas)', 6.5, '', '', true),
      row('tis', 34, 'SAOS', 'Top Jadi Teh Kretek Reguler - BK (Segala Cuaca)', 4.5, '', '', true),
      row('tis', 35, 'CENGKEH', 'Manado Grade A (2024)', 36.0, 'A', '', true),
    ],
    catatan: '',
    lokasiTanggal: 'Malang, 12 November 2026',
    accOperasional: {
      approved: false,
      jabatan: 'Manajer Operasional',
      nama: 'Lalu Mahendra AA.',
    },
    accDirektur: {
      approved: false,
      jabatan: 'Direktur',
      nama: 'Bpk. Denny Wibisono',
    },
    prufDownloadUrl: '',
    updatedAt: nowIso,
    source: 'local',
  };

  const docKarang: PrufDocument = {
    tab: 'KARANG BK',
    judulUtama: 'KETETAPAN PRUF TEMBAKAU BLEND JENIS SKT ( LOW FLAVOUR )',
    namaTbkBlend: 'KARANG - BK',
    noDokumen: '26B/P-KARANGBK/PPI/BKR/XI/2026',
    pelaksanaanPruf: '12 November 2026',
    periodePruf: '16 - 28 Nov 2026',
    tglBlend: '16 - 28 Nov 2026',
    peruntukanMerk:
      'Karang - Karang 20 - Karang 10+2 - Karang 153 Lista KML',
    baseGr: 1000,
    targetKg: 600,
    rows: [
      // GROUP 1
      row('krg', 1, 'GROUP 1', 'Madura 2024 (BAT) R', 32.0),
      row('krg', 2, 'GROUP 1', 'Maesan 2024 (HS)', 1.0),
      row('krg', 3, 'GROUP 1', 'Paiton 2024 (VJI)', 4.0),
      row('krg', 4, 'GROUP 1', 'Mranggen 2024 (LL)', 3.0),
      row('krg', 5, 'GROUP 1', 'Weleri 2024 (HK)', 4.5),
      row('krg', 6, 'GROUP 1', 'Weleri Grade B (2021)', 0.5),
      // GROUP 2
      row('krg', 7, 'GROUP 2', 'Sapudi 2024 (GF)', 1.5),
      row('krg', 8, 'GROUP 2', 'Besuki 2025 (ZN)', 0.5),
      row('krg', 9, 'GROUP 2', 'Beringin 2024 (HS)', 2.0),
      // GROUP 3
      row('krg', 10, 'GROUP 3', 'Amerika 2025 (BO1)', 7.0, 'BO1'),
      row('krg', 11, 'GROUP 3', 'Zimbabwe B1L (2023)', 4.0, 'B1L'),
      row('krg', 12, 'GROUP 3', 'Zimbabwe 2025 (L2OF/P)', 2.0),
      row('krg', 13, 'GROUP 3', 'Zimbabwe 2025 (HR) L1OF', 5.0, 'L1OF'),
      row('krg', 14, 'GROUP 3', 'Zimbabwe M1L (2023)', 3.0, 'M1L'),
      row('krg', 15, 'GROUP 3', 'Lombok 2024 (FS) - 1', 1.0, 'B1LF'),
      row('krg', 16, 'GROUP 3', 'Lombok 2024 (BE) - 1', 3.0, 'BO+OF'),
      row('krg', 17, 'GROUP 3', 'Zambia M1L (2023)', 1.5, 'M1L'),
      row('krg', 18, 'GROUP 3', 'Brazil Grade B (2022)', 1.0, 'X30F/B20F'),
      row('krg', 19, 'GROUP 3', 'Brazil 2025 (BOA)', 4.0, 'BOA'),
      row('krg', 20, 'GROUP 3', 'Diet Trial - 1 (2025)', 0.5),
      row('krg', 21, 'GROUP 3', 'Diet Trial - 3 (2026)', 1.5),
      // GROUP 4
      row('krg', 22, 'GROUP 4', 'Kasturi 2023 (ST)', 1.0),
      row('krg', 23, 'GROUP 4', 'Kasturi 2024 (BE) - 1', 3.5),
      row('krg', 24, 'GROUP 4', 'Hang Boyolali 2024 (FS)', 0.5),
      row('krg', 25, 'GROUP 4', 'Krs. Garut 2025 (MYN)', 1.5),
      row('krg', 26, 'GROUP 4', 'Krs. Garut 2024 (MYN)', 1.5),
      row('krg', 27, 'GROUP 4', 'Janturan Jombang 2024 (MYN)', 0.5),
      row('krg', 28, 'GROUP 4', 'Janturan Boyolali 2024 (VJI)', 1.0),
      // GROUP 6
      row('krg', 29, 'GROUP 6', 'Joning 2024 (AR)', 0.5),
      row('krg', 30, 'GROUP 6', 'Garut 2024 (FR)', 1.0),
      row('krg', 31, 'GROUP 6', 'Garut 2025 (FR)', 1.0),
      row('krg', 32, 'GROUP 6', 'Ploso 2024 (MYN)', 5.5),
      // SAOS & CENGKEH
      row('krg', 33, 'SAOS', 'Cassing Jadi Karang - BK (Musim Panas)', 6.4),
      row('krg', 34, 'SAOS', 'Top Jadi Karang - BK (Segala Cuaca)', 3.4),
      row('krg', 35, 'CENGKEH', 'Manado Grade A (2024)', 36.0),
    ],
    catatan:
      'Alur Proses > Input Tembakau - Input Cassing - Input Top - Input Diet Trial 1 + Diet Trial 3 - Input Cengkeh',
    lokasiTanggal: 'Malang, 12 November 2026',
    accOperasional: {
      approved: false,
      jabatan: 'Manajer Operasional',
      nama: 'Lalu Mahendra AA.',
    },
    accDirektur: {
      approved: false,
      jabatan: 'Direktur',
      nama: 'Bpk. Denny Wibisono',
    },
    prufDownloadUrl: '',
    updatedAt: nowIso,
    source: 'local',
  };

  const docFReguler: PrufDocument = {
    tab: 'F REGULER (LN, AVE)',
    judulUtama: 'KETETAPAN PRUF TEMBAKAU BLEND JENIS SKT ( LOW FLAVOUR )',
    namaTbkBlend: 'F REGULER (LN - AVE)',
    noDokumen: '26D/P-FREG/PPI/BKR/XI/2026',
    pelaksanaanPruf: '12 November 2026',
    periodePruf: '16 - 28 Nov 2026',
    tglBlend: '16 - 28 Nov 2026',
    peruntukanMerk:
      '153 Filter KML 12 - 153 Filter LN 12 - 153 Filter Lista KKML Hijau 16 - AVE 12 - AVE 20',
    baseGr: 1000,
    targetKg: 360,
    rows: [
      // GROUP 1
      row('freg', 1, 'GROUP 1', 'Madura 2024 (BAT) R', 28.0),
      row('freg', 2, 'GROUP 1', 'Hang Madura Grade B (2021)', 1.0),
      row('freg', 3, 'GROUP 1', 'Hang Madura 2024 (BAT)', 1.0),
      row('freg', 4, 'GROUP 1', 'Maesan 2024 (HS)', 1.0),
      row('freg', 5, 'GROUP 1', 'Paiton 2023 (DM)', 4.0),
      row('freg', 6, 'GROUP 1', 'Mranggen 2024 (LL)', 3.0),
      row('freg', 7, 'GROUP 1', 'Weleri 2024 (HK)', 5.0),
      // GROUP 2
      row('freg', 8, 'GROUP 2', 'Beringin 2024 (HS)', 2.5),
      row('freg', 9, 'GROUP 2', 'Tbk Escot 2024 (BE)', 3.5),
      // GROUP 3
      row('freg', 10, 'GROUP 3', 'Amerika 2025 (BO1)', 6.0, 'BO1'),
      row('freg', 11, 'GROUP 3', 'Zimbabwe B1L (2023)', 4.0, 'B1L'),
      row('freg', 12, 'GROUP 3', 'Zimbabwe 2025 (L2OF/P)', 1.0),
      row('freg', 13, 'GROUP 3', 'Zimbabwe 2025 (HR) L1OF', 4.0, 'L1OF'),
      row('freg', 14, 'GROUP 3', 'Zimbabwe M1L (2023)', 3.5, 'M1L'),
      row('freg', 15, 'GROUP 3', 'Lombok 2024 (FS) - 1', 2.0, 'B1LF'),
      row('freg', 16, 'GROUP 3', 'Lombok 2024 (BE) - 1', 2.0, 'BO+OF'),
      row('freg', 17, 'GROUP 3', 'Zambia M1L (2023)', 2.0, 'M1L'),
      row('freg', 18, 'GROUP 3', 'Brazil 2025 (BOA)', 5.0, 'BOA'),
      row('freg', 19, 'GROUP 3', 'Expanded Stem - 1B Grade B (2023)', 0.5, 'AG'),
      row('freg', 20, 'GROUP 3', 'Diet Trial - 1 (2025)', 1.0),
      row('freg', 21, 'GROUP 3', 'Diet Trial - 3 (2026)', 3.0),
      row('freg', 22, 'GROUP 3', 'FCV Diet Tobacco SGI (2024)', 1.0),
      // GROUP 4
      row('freg', 23, 'GROUP 4', 'Kasturi 2024 (BE) - 1', 4.0),
      row('freg', 24, 'GROUP 4', 'Hang Boyolali 2024 (FS)', 1.0),
      row('freg', 25, 'GROUP 4', 'Krs. Garut 2024 (MYN)', 2.0),
      row('freg', 26, 'GROUP 4', 'Janturan Jombang 2024 (MYN)', 1.5),
      row('freg', 27, 'GROUP 4', 'Janturan Boyolali 2024 (VJI)', 1.0),
      // GROUP 6
      row('freg', 28, 'GROUP 6', 'Garut 2024 (FR)', 1.0),
      row('freg', 29, 'GROUP 6', 'Garut 2025 (FR)', 0.5),
      row('freg', 30, 'GROUP 6', 'Ploso 2024 (MYN)', 5.0),
      // SAOS, BLEND REFRESH & CENGKEH
      row('freg', 31, 'SAOS', 'Cassing Jadi F Reguler (LN, AVE) Segala Cuaca', 2.4),
      row('freg', 32, 'SAOS', 'Top Jadi F Reguler (LN, AVE) Segala Cuaca', 1.9),
      row('freg', 33, 'REFRESH', 'F Reguler LN, AVE (Kode B)', 1.0),
      row('freg', 34, 'CENGKEH', 'Manado Grade A (2024)', 35.0),
    ],
    catatan:
      'Alur Proses > Input Tembakau - Input Cassing - Input Top - Input FCV Diet Tobacco - Input Diet Trial 1 + Diet Trial 3 - Input Cengkeh',
    lokasiTanggal: 'Malang, 12 November 2026',
    accOperasional: {
      approved: false,
      jabatan: 'Manajer Operasional',
      nama: 'Lalu Mahendra AA.',
    },
    accDirektur: {
      approved: false,
      jabatan: 'Direktur',
      nama: 'Bpk. Denny Wibisono',
    },
    prufDownloadUrl: '',
    updatedAt: nowIso,
    source: 'local',
  };

  return {
    '153 BK': doc153,
    'TIS KBT24': docTis,
    'KARANG BK': docKarang,
    'F REGULER (LN, AVE)': docFReguler,
  };
}

export const GAS_TEMPLATE_SCRIPT = `// ============================================================================
// Google Apps Script (Code.gs) — STANDALONE BACKEND
// Aplikasi : PRUF - KOMPOSISI TSC (PT Batu Karang - Divisi Produksi I)
// Sheet ID : ${DEFAULT_SPREADSHEET_ID}
// Tab      : 153 BK | TIS KBT24 | KARANG BK | F REGULER (LN, AVE)
// Aturan   : Formula Indonesia menggunakan titik koma (;) | Zona Waktu WIB
// ============================================================================

const SPREADSHEET_ID = '${DEFAULT_SPREADSHEET_ID}';
const ALLOWED_TABS = ['153 BK', 'TIS KBT24', 'KARANG BK', 'F REGULER (LN, AVE)'];
const LOG_SHEET_NAME = 'LOG_SYNC_PRUF';
const TIMEZONE_WIB = 'Asia/Jakarta';

/**
 * Jalankan fungsi ini 1x dari editor Apps Script (Run > testStandaloneConnection)
 * untuk memberikan izin akses Spreadsheet sebelum melakukan Deploy Web App.
 */
function testStandaloneConnection() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const summary = ALLOWED_TABS.map(function (name) {
    const sh = ss.getSheetByName(name);
    return sh
      ? name + ': OK (' + sh.getLastRow() + ' baris x ' + sh.getLastColumn() + ' kolom)'
      : name + ': TAB TIDAK DITEMUKAN';
  });
  Logger.log('Spreadsheet: ' + ss.getName());
  Logger.log(summary.join(' | '));
  return summary;
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function formatNowWib() {
  return Utilities.formatDate(new Date(), TIMEZONE_WIB, 'dd/MM/yyyy HH:mm:ss') + ' WIB';
}

function extractSheetLinks(range, displayValues) {
  const found = [];
  const seen = {};

  function pushUrl(url) {
    if (!url || typeof url !== 'string') return;
    const clean = url.trim();
    if (!clean || seen[clean]) return;
    if (/^https?:\\/\\//i.test(clean)) {
      seen[clean] = true;
      found.push(clean);
    }
  }

  try {
    const richValues = range.getRichTextValues();
    for (let r = 0; r < richValues.length; r++) {
      for (let c = 0; c < richValues[r].length; c++) {
        const cell = richValues[r][c];
        if (!cell) continue;
        pushUrl(cell.getLinkUrl());
        const runs = cell.getRuns();
        for (let k = 0; k < runs.length; k++) {
          pushUrl(runs[k].getLinkUrl());
        }
      }
    }
  } catch (err) {
    // Abaikan jika ada sel non-richtext
  }

  try {
    const formulas = range.getFormulas();
    const hyperRegex = /=HYPERLINK\\s*\\(\\s*"([^"]+)"/i;
    for (let r = 0; r < formulas.length; r++) {
      for (let c = 0; c < formulas[r].length; c++) {
        const f = formulas[r][c];
        if (!f) continue;
        const m = hyperRegex.exec(f);
        if (m && m[1]) pushUrl(m[1]);
      }
    }
  } catch (err) {
    // Abaikan jika gagal baca formula
  }

  const urlRegex = /(https?:\\/\\/[^\\s"']+)/gi;
  for (let r = 0; r < displayValues.length; r++) {
    for (let c = 0; c < displayValues[r].length; c++) {
      const txt = String(displayValues[r][c] || '');
      if (txt.indexOf('http') === -1) continue;
      let match;
      while ((match = urlRegex.exec(txt)) !== null) {
        pushUrl(match[1]);
      }
    }
  }

  return found;
}

function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    if (params.action === 'health') {
      return jsonResponse({
        ok: true,
        mode: 'standalone',
        spreadsheetId: SPREADSHEET_ID,
        tabs: ALLOWED_TABS,
        serverTime: formatNowWib()
      });
    }

    const tab = params.tab ? String(params.tab) : '';
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const tabsToRead = (tab && ALLOWED_TABS.indexOf(tab) !== -1) ? [tab] : ALLOWED_TABS;

    const result = {};
    const links = {};

    tabsToRead.forEach(function (sheetName) {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet || sheet.getLastRow() === 0 || sheet.getLastColumn() === 0) {
        result[sheetName] = [];
        links[sheetName] = [];
        return;
      }

      const range = sheet.getDataRange();
      // Gunakan getDisplayValues() agar format persen (32,00%), desimal (600,0),
      // dan tanggal Indonesia terbaca persis seperti tampilan Google Sheets.
      const displayValues = range.getDisplayValues();
      result[sheetName] = displayValues;
      links[sheetName] = extractSheetLinks(range, displayValues);
    });

    return jsonResponse({
      ok: true,
      mode: 'standalone',
      spreadsheetId: SPREADSHEET_ID,
      serverTime: formatNowWib(),
      data: result,
      links: links
    });
  } catch (err) {
    return jsonResponse({
      ok: false,
      error: String(err)
    });
  }
}

function normalizeLabel(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/\\(\\d{4}\\)/g, '')
    .replace(/\\s+/g, ' ')
    .trim();
}

function syncMasterSheetInPlace(sheet, doc) {
  if (!sheet || sheet.getLastRow() < 3) return 0;
  const range = sheet.getDataRange();
  const displayValues = range.getDisplayValues();
  const formulas = range.getFormulas();

  let colACount = 0;
  let colBCount = 0;
  for (let r = 0; r < Math.min(displayValues.length, 20); r++) {
    if (String(displayValues[r][0] || '').trim()) colACount++;
    if (String(displayValues[r][1] || '').trim()) colBCount++;
  }
  const hasBlankColA = colACount === 0 && colBCount > 0;
  const labelColIdx = hasBlankColA ? 1 : 0;
  const pctColIdx = hasBlankColA ? 5 : 4;
  const ketColIdx = hasBlankColA ? 12 : 7;

  const incomingMap = {};
  (doc.rows || []).forEach(function (item) {
    if (!item || !item.rincian) return;
    incomingMap[normalizeLabel(item.rincian)] = item;
  });

  let updatedCells = 0;
  for (let r = 0; r < displayValues.length; r++) {
    const label = String(displayValues[r][labelColIdx] || '').trim();
    if (!label) continue;

    const match = incomingMap[normalizeLabel(label)];
    if (!match) continue;

    // Hanya update sel % dan Keterangan jika sel bukan formula, agar rumus sheet aman
    if (pctColIdx < displayValues[r].length && !formulas[r][pctColIdx]) {
      const targetPctDecimal = Number(match.pct || 0) / 100;
      const curRaw = String(displayValues[r][pctColIdx] || '');
      const isPercentFormatted = curRaw.indexOf('%') !== -1;
      sheet.getRange(r + 1, pctColIdx + 1).setValue(
        isPercentFormatted ? targetPctDecimal : Number(match.pct || 0)
      );
      updatedCells++;
    }

    if (
      typeof match.keterangan === 'string' &&
      ketColIdx < displayValues[r].length &&
      !formulas[r][ketColIdx]
    ) {
      sheet.getRange(r + 1, ketColIdx + 1).setValue(match.keterangan);
    }
  }

  return updatedCells;
}

function appendSyncLog(ss, tab, doc, updatedCells) {
  let logSheet = ss.getSheetByName(LOG_SHEET_NAME);
  if (!logSheet) {
    logSheet = ss.insertSheet(LOG_SHEET_NAME);
    logSheet.appendRow([
      'Waktu Sync (WIB)',
      'Tab PRUF',
      'No Dokumen',
      'Target Kapasitas (Kg)',
      'Jumlah Bahan Aktif',
      'Total Persen (%)',
      'Kalkulasi Grand Total (Kg)',
      'Sel Master Diperbarui',
      'Catatan'
    ]);
    logSheet.getRange(1, 1, 1, 9).setFontWeight('bold');
  }

  const activeRows = (doc.rows || []).filter(function (r) {
    return r && Number(r.pct) > 0;
  });
  let totalPct = 0;
  activeRows.forEach(function (r) {
    totalPct += Number(r.pct || 0);
  });

  const nextRow = logSheet.getLastRow() + 1;
  // Formula Indonesia wajib menggunakan pemisah titik koma (;)
  const grandKgFormula = '=ROUND((F' + nextRow + '/100)*D' + nextRow + '; 1)';

  logSheet.appendRow([
    formatNowWib(),
    tab,
    doc.noDokumen || '-',
    Number(doc.targetKg || 0),
    activeRows.length,
    Number(totalPct.toFixed(2)),
    grandKgFormula,
    updatedCells,
    doc.catatan || 'Sinkronisasi dari Web App PRUF - KOMPOSISI TSC'
  ]);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const raw = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    const body = JSON.parse(raw);

    if (body.action === 'ping') {
      return jsonResponse({ ok: true, pong: true, serverTime: formatNowWib() });
    }

    const tab = body.tab;
    const doc = body.document;
    if (ALLOWED_TABS.indexOf(tab) === -1 || !doc) {
      throw new Error('Payload tab atau dokumen PRUF tidak valid.');
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(tab);
    if (!sheet) {
      throw new Error('Tab "' + tab + '" tidak ditemukan di Spreadsheet.');
    }

    // Pembaruan aman (in-place) tanpa clearContents() agar layout cetak & rumus master terjaga
    const updatedCells = syncMasterSheetInPlace(sheet, doc);
    appendSyncLog(ss, tab, doc, updatedCells);

    return jsonResponse({
      ok: true,
      mode: 'standalone',
      tab: tab,
      updatedCells: updatedCells,
      loggedTo: LOG_SHEET_NAME,
      serverTime: formatNowWib()
    });
  } catch (err) {
    return jsonResponse({
      ok: false,
      error: String(err)
    });
  } finally {
    try {
      lock.releaseLock();
    } catch (ignore) {}
  }
}
`;
