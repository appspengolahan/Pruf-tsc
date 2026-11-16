import type {
  PrufDocument,
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

function createEmptyPrufDoc(
  tab: SheetTabKey,
  defaultTargetKg: number
): PrufDocument {
  return {
    tab,
    judulUtama: '',
    namaTbkBlend: '',
    noDokumen: '',
    pelaksanaanPruf: '',
    periodePruf: '',
    tglBlend: '',
    peruntukanMerk: '',
    baseGr: 1000,
    targetKg: defaultTargetKg,
    rows: [],
    catatan: '',
    lokasiTanggal: '',
    accOperasional: {
      approved: false,
      jabatan: 'Manajer Operasional',
      nama: '',
    },
    accDirektur: {
      approved: false,
      jabatan: 'Direktur',
      nama: '',
    },
    prufDownloadUrl: '',
    updatedAt: '',
    source: 'local',
  };
}

export function createEmptyPrufDocuments(): Record<SheetTabKey, PrufDocument> {
  return {
    '153 BK': createEmptyPrufDoc('153 BK', 600),
    'TIS KBT24': createEmptyPrufDoc('TIS KBT24', 140),
    'KARANG BK': createEmptyPrufDoc('KARANG BK', 600),
    'F REGULER (LN, AVE)': createEmptyPrufDoc('F REGULER (LN, AVE)', 360),
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
