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
      approved: true,
      jabatan: 'Manajer Operasional',
      nama: 'Lalu Mahendra AA.',
      approvedBy: 'Lalu Mahendra AA.',
      approvedAt: '2026-11-12T11:10:00+07:00',
    },
    accDirektur: {
      approved: true,
      jabatan: 'Direktur',
      nama: 'Bpk. Denny Wibisono',
      approvedBy: 'Bpk. Denny Wibisono',
      approvedAt: '2026-11-12T11:15:00+07:00',
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
      approved: true,
      jabatan: 'Manajer Operasional',
      nama: 'Lalu Mahendra AA.',
      approvedBy: 'Lalu Mahendra AA.',
      approvedAt: '2026-11-12T11:10:00+07:00',
    },
    accDirektur: {
      approved: true,
      jabatan: 'Direktur',
      nama: 'Bpk. Denny Wibisono',
      approvedBy: 'Bpk. Denny Wibisono',
      approvedAt: '2026-11-12T11:15:00+07:00',
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
      approved: true,
      jabatan: 'Manajer Operasional',
      nama: 'Lalu Mahendra AA.',
      approvedBy: 'Lalu Mahendra AA.',
      approvedAt: '2026-11-12T11:10:00+07:00',
    },
    accDirektur: {
      approved: true,
      jabatan: 'Direktur',
      nama: 'Bpk. Denny Wibisono',
      approvedBy: 'Bpk. Denny Wibisono',
      approvedAt: '2026-11-12T11:15:00+07:00',
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
      approved: true,
      jabatan: 'Manajer Operasional',
      nama: 'Lalu Mahendra AA.',
      approvedBy: 'Lalu Mahendra AA.',
      approvedAt: '2026-11-12T11:10:00+07:00',
    },
    accDirektur: {
      approved: true,
      jabatan: 'Direktur',
      nama: 'Bpk. Denny Wibisono',
      approvedBy: 'Bpk. Denny Wibisono',
      approvedAt: '2026-11-12T11:15:00+07:00',
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

export const GAS_TEMPLATE_SCRIPT = `// Google Apps Script (Code.gs) — PRUF - KOMPOSISI TSC
// Spreadsheet ID: ${DEFAULT_SPREADSHEET_ID}
// Catatan Lokal Indonesia: Semua formula spreadsheet menggunakan pemisah titik koma (;)

const SPREADSHEET_ID = '${DEFAULT_SPREADSHEET_ID}';
const ALLOWED_TABS = ['153 BK', 'TIS KBT24', 'KARANG BK', 'F REGULER (LN, AVE)'];

function doGet(e) {
  try {
    const tab = (e && e.parameter && e.parameter.tab) ? e.parameter.tab : '';
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const tabsToRead = tab && ALLOWED_TABS.indexOf(tab) !== -1 ? [tab] : ALLOWED_TABS;
    const result = {};
    const links = {};

    tabsToRead.forEach(function (sheetName) {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        result[sheetName] = [];
        links[sheetName] = [];
        return;
      }
      const range = sheet.getDataRange();
      const values = range.getValues();
      const richValues = range.getRichTextValues();
      const foundLinks = [];
      richValues.forEach(function (row) {
        row.forEach(function (cell) {
          const url = cell ? cell.getLinkUrl() : null;
          if (url) foundLinks.push(url);
        });
      });
      result[sheetName] = values;
      links[sheetName] = foundLinks;
    });

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, spreadsheetId: SPREADSHEET_ID, data: result, links: links }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    const tab = body.tab;
    const doc = body.document;
    if (ALLOWED_TABS.indexOf(tab) === -1 || !doc) {
      throw new Error('Payload tab atau dokumen PRUF tidak valid.');
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(tab);
    if (!sheet) {
      sheet = ss.insertSheet(tab);
    }

    sheet.clearContents();
    sheet.appendRow(['KETETAPAN PRUF TEMBAKAU BLEND JENIS SKT ( LOW FLAVOUR )']);
    sheet.appendRow(['NAMA TBK. BLEND', doc.namaTbkBlend, '', 'No : ' + (doc.noDokumen || '')]);
    sheet.appendRow(['1. Pelaksanaan Pruf', doc.pelaksanaanPruf, '', '3. Tgl Blend', doc.tglBlend]);
    sheet.appendRow(['2. Periode Pruf', doc.periodePruf, '', '4. Peruntukan Merk', doc.peruntukanMerk]);
    // Kolom A..I — Kolom G (indeks 7 / kolom ke-7) adalah Kapasitas (Kg)
    sheet.appendRow(['Group', 'Nama Stock Bahan (Rincian)', 'Grade/Tahun', 'Kode Intern', '%', 'Kapasitas (Gr)', 'Kapasitas (Kg)', 'Keterangan', 'Verifikasi']);

    const baseGr = Number(doc.baseGr || 1000);
    const targetKg = Number(doc.targetKg || 600);
    sheet.appendRow(['PARAM', 'Basis Kapasitas', '', '', 100, baseGr, targetKg, '', '']);

    const startRow = 7;
    (doc.rows || []).forEach(function (item, idx) {
      if (!item || Number(item.pct) <= 0) return;
      const r = startRow + idx;
      // Formula Indonesia wajib menggunakan titik koma (;) — Kolom G adalah Kapasitas (Kg)
      const grFormula = '=ROUND((E' + r + '/100)*$F$6; 1)';
      const kgFormula = '=ROUND((E' + r + '/100)*$G$6; 1)';
      sheet.appendRow([
        item.group,
        item.rincian,
        '',
        item.kodeIntern || '',
        Number(item.pct),
        grFormula,
        kgFormula,
        item.keterangan || '',
        item.verified ? 'TERVERIFIKASI' : 'MENUNGGU'
      ]);
    });

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, tab: tab, totalRows: (doc.rows || []).length }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
`;
