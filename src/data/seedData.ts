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
    catatanLines: [],
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
    instruksiDownload: '',
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
const HISTORY_SHEET_NAME = 'RIWAYAT_PRUF';
const TIMEZONE_WIB = 'Asia/Jakarta';
const PROP_SNAPSHOT_KEY = 'PRUF_COMPOSITION_SNAPSHOT_V1';
const PROP_SHOW_HISTORY_PUBLIC = 'PRUF_SHOW_HISTORY_PUBLIC';

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

function getHistorySettings() {
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty(PROP_SHOW_HISTORY_PUBLIC);
  return {
    showHistoryInPublicPortal: raw !== 'false',
    updatedAt: props.getProperty('PRUF_HISTORY_SETTINGS_AT') || '',
    updatedBy: props.getProperty('PRUF_HISTORY_SETTINGS_BY') || 'Admin'
  };
}

function saveHistorySettings(settings) {
  const props = PropertiesService.getScriptProperties();
  const flag = settings && settings.showHistoryInPublicPortal === false ? 'false' : 'true';
  props.setProperty(PROP_SHOW_HISTORY_PUBLIC, flag);
  props.setProperty('PRUF_HISTORY_SETTINGS_AT', (settings && settings.updatedAt) || new Date().toISOString());
  props.setProperty('PRUF_HISTORY_SETTINGS_BY', (settings && settings.updatedBy) || 'Admin');
  return getHistorySettings();
}

function ensureHistorySheet(ss) {
  let sh = ss.getSheetByName(HISTORY_SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(HISTORY_SHEET_NAME);
    sh.appendRow([
      'ID',
      'Waktu (ISO/WIB)',
      'Tab PRUF',
      'Nama Tbk Blend',
      'Peruntukan Merk',
      'No Dokumen',
      'Periode Pruf',
      'Jenis Perubahan',
      'Status',
      'Group',
      'Bahan Lama',
      'Bahan Baru',
      'Persen Lama (%)',
      'Persen Baru (%)',
      'Selisih (%)',
      'Ref Catatan',
      'Faktor / Penjelasan Perubahan',
      'Sumber',
      'Oleh'
    ]);
    sh.getRange(1, 1, 1, 19).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function parseNumCell(raw) {
  if (typeof raw === 'number') return raw;
  const s = String(raw || '').replace(/%|kg|gr/gi, '').trim();
  if (!s || s === '-') return null;
  const normalized = s.indexOf(',') !== -1 && s.indexOf('.') !== -1
    ? (s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\\./g, '').replace(',', '.') : s.replace(/,/g, ''))
    : s.replace(',', '.');
  const n = parseFloat(normalized);
  return isNaN(n) ? null : n;
}

function readHistoryEntries(ss) {
  const sh = ss.getSheetByName(HISTORY_SHEET_NAME);
  if (!sh || sh.getLastRow() <= 1) return [];
  const values = sh.getRange(2, 1, sh.getLastRow() - 1, 19).getDisplayValues();
  const entries = [];
  for (let i = values.length - 1; i >= 0; i--) {
    const r = values[i];
    if (!r[0] && !r[2]) continue;
    entries.push({
      id: r[0] || ('sheet-row-' + (i + 2)),
      timestamp: r[1] || '',
      tab: r[2] || '153 BK',
      namaTbkBlend: r[3] || '',
      peruntukanMerk: r[4] || '',
      noDokumen: r[5] || '',
      periodePruf: r[6] || '',
      jenisPerubahan: r[7] || 'CATATAN_AKTIF',
      status: r[8] || 'Tercatat',
      group: r[9] || '',
      bahanLama: r[10] || '',
      bahanBaru: r[11] || '',
      pctLama: parseNumCell(r[12]),
      pctBaru: parseNumCell(r[13]),
      deltaPct: parseNumCell(r[14]),
      catatanRef: r[15] || '',
      faktorAlasan: r[16] || '',
      sumber: r[17] || 'Google Sheets',
      oleh: r[18] || 'Sync Google Sheets'
    });
    if (entries.length >= 500) break;
  }
  return entries;
}

function appendHistoryEntriesToSheet(ss, entries) {
  if (!entries || !entries.length) return 0;
  const sh = ensureHistorySheet(ss);
  const existingIds = {};
  if (sh.getLastRow() > 1) {
    const idCols = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues();
    idCols.forEach(function (row) {
      if (row[0]) existingIds[String(row[0])] = true;
    });
  }

  const rowsToInsert = [];
  entries.forEach(function (e) {
    if (!e || !e.id || existingIds[e.id]) return;
    existingIds[e.id] = true;
    rowsToInsert.push([
      e.id,
      e.timestamp || new Date().toISOString(),
      e.tab || '',
      e.namaTbkBlend || '',
      e.peruntukanMerk || '',
      e.noDokumen || '',
      e.periodePruf || '',
      e.jenisPerubahan || 'CATATAN_AKTIF',
      e.status || 'Tercatat',
      e.group || '',
      e.bahanLama || '',
      e.bahanBaru || '',
      e.pctLama !== null && e.pctLama !== undefined ? Number(e.pctLama) : '',
      e.pctBaru !== null && e.pctBaru !== undefined ? Number(e.pctBaru) : '',
      e.deltaPct !== null && e.deltaPct !== undefined ? Number(e.deltaPct) : '',
      e.catatanRef || '',
      e.faktorAlasan || '',
      e.sumber || 'Google Sheets',
      e.oleh || 'Sync Google Sheets'
    ]);
  });

  if (rowsToInsert.length > 0) {
    sh.getRange(sh.getLastRow() + 1, 1, rowsToInsert.length, 19).setValues(rowsToInsert);
  }
  return rowsToInsert.length;
}

function makeGasHistId(parts) {
  const raw = parts.join('|').toLowerCase().replace(/[^a-z0-9|_-]+/g, '_');
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash * 31 + raw.charCodeAt(i)) | 0);
  }
  return 'hist-' + Math.abs(hash).toString(36) + '-' + raw.slice(0, 32);
}

function extractQuickTabSnapshot(tabName, displayValues) {
  const snap = {
    tab: tabName,
    namaTbkBlend: tabName,
    peruntukanMerk: '',
    noDokumen: '',
    periodePruf: '',
    rows: [],
    notes: []
  };
  if (!displayValues || displayValues.length < 3) return snap;

  let colACount = 0;
  let colBCount = 0;
  for (let r = 0; r < Math.min(displayValues.length, 20); r++) {
    if (String(displayValues[r][0] || '').trim()) colACount++;
    if (String(displayValues[r][1] || '').trim()) colBCount++;
  }
  const hasBlankColA = colACount === 0 && colBCount > 0;
  const labelIdx = hasBlankColA ? 1 : 0;
  const pctIdx = hasBlankColA ? 5 : 4;
  const ketIdx = hasBlankColA ? 12 : 7;
  let currentGroup = 'GROUP 1';
  let capturingNotes = false;
  const footerNoteLines = [];

  for (let r = 0; r < displayValues.length; r++) {
    const cells = displayValues[r].map(function (c) { return String(c || '').trim(); });
    const first = cells[labelIdx] || cells[0] || '';
    const firstUp = first.toUpperCase();
    if (!first && cells.join('') === '') continue;

    if (firstUp.indexOf('NAMA TBK') !== -1) {
      const cVal = first.indexOf(':') !== -1 ? first.split(':').slice(1).join(':').trim() : '';
      snap.namaTbkBlend = cVal || tabName;
      continue;
    }
    if (/^No\\s*:/i.test(first)) {
      snap.noDokumen = first.replace(/^No\\s*:\\s*/i, '').replace(/\\s*LEMBAR PRUF.*$/i, '').trim();
      continue;
    }
    if (firstUp.indexOf('2. PERIODE') === 0) {
      for (let c = labelIdx + 1; c < cells.length; c++) {
        if (cells[c] && cells[c].indexOf('4.') === -1 && cells[c].toUpperCase().indexOf('LEMBAR PRUF') === -1) {
          snap.periodePruf = cells[c].replace(/^:/, '').trim();
          break;
        }
      }
      let merkCol = -1;
      for (let c = 0; c < cells.length; c++) {
        if (cells[c].toUpperCase().indexOf('4.') !== -1) { merkCol = c; break; }
      }
      if (merkCol >= 0) {
        const after = cells.slice(merkCol + 1).filter(function (x) {
          return x && x.toUpperCase().indexOf('LEMBAR PRUF') === -1;
        });
        const baseM = (after[0] || '').replace(/^:/, '').trim();
        let extraM = '';
        if (displayValues[r + 1]) {
          const nextCells = displayValues[r + 1].map(function (x) { return String(x || '').trim(); });
          if (!nextCells[labelIdx] && !nextCells.slice(0, merkCol).some(Boolean)) {
            extraM = nextCells.slice(merkCol).filter(function (x) {
              return x && x.toUpperCase().indexOf('LEMBAR PRUF') === -1;
            }).join(' ').trim();
          }
        }
        snap.peruntukanMerk = [baseM, extraM].filter(Boolean).join(' ').replace(/\\s+/g, ' ').trim();
      }
      continue;
    }

    if (firstUp.indexOf('CATATAN') === 0) {
      capturingNotes = true;
      const inlineN = first.replace(/^CATATAN\\s*:?\\s*/i, '').trim();
      if (inlineN && !/^(sync|oos|filter|ada data|tanpa data|-|—)$/i.test(inlineN)) {
        footerNoteLines.push(inlineN);
      }
      continue;
    }
    if (capturingNotes) {
      const isFootBoundary =
        /^(DITETAPKAN|DIKETAHUI|MALANG,|ACC\\b|MANAJER|DIREKTUR|\\(|PRUF BERLAKU|SILAHKAN DOWNLOAD)/i.test(firstUp) ||
        cells.some(function (x) {
          return /^(malang|[a-z]+)\\s*,\\s*\\d{1,2}\\s+[a-z]+\\s+\\d{4}$/i.test(x) ||
            /^(ditetapkan|diketahui|manajer|direktur|pruf berlaku|silahkan download)/i.test(x);
        });
      if (isFootBoundary) {
        capturingNotes = false;
      } else {
        const nl = (cells[labelIdx] || '').replace(/\\s+/g, ' ').trim();
        if (
          nl &&
          !/^(sync|oos|filter|ada data|tanpa data|true|false|gr|kg|-|—)$/i.test(nl) &&
          !/^https?:\\/\\//i.test(nl)
        ) {
          footerNoteLines.push(nl);
        }
        continue;
      }
    }

    if (/^GROUP\\s*[1-6]/i.test(firstUp)) {
      currentGroup = firstUp.match(/^GROUP\\s*[1-6]/i)[0];
      continue;
    }
    if (firstUp.indexOf('TEMBAKAU BLEND REFRESH') !== -1) {
      currentGroup = 'REFRESH';
      continue;
    }
    if (!first || /^(TOTAL |GRAND TOTAL|KETETAPAN|NAMA |RINCIAN|DITETAPKAN|DIKETAHUI|MALANG,|ACC |PRUF |SILAHKAN|\\()/i.test(firstUp)) {
      continue;
    }

    // Strict Column G check (index 6)
    const colGNum = parseNumCell(cells[6]);
    if (colGNum === null || colGNum <= 0) continue;

    const pctNum = parseNumCell(cells[pctIdx]);
    if (pctNum === null || pctNum <= 0) continue;

    const gradeRaw = cells[labelIdx + 1] || '';
    const tahunRaw = cells[labelIdx + 2] || '';
    const parts = [first];
    if (gradeRaw && !/^\\d/.test(gradeRaw) && gradeRaw.length > 1 && first.toLowerCase().indexOf(gradeRaw.toLowerCase()) === -1) parts.push(gradeRaw);
    if (/^\\d{4}$/.test(tahunRaw) && first.indexOf(tahunRaw) === -1) parts.push('(' + tahunRaw + ')');
    const rincian = parts.join(' ').trim();

    let effGroup = currentGroup;
    const upR = rincian.toUpperCase();
    if (upR.indexOf('CASSING') !== -1 || upR.indexOf('TOP JADI') !== -1) effGroup = 'SAOS';
    else if (upR.indexOf('MANADO') !== -1 || upR.indexOf('CENGKEH') !== -1) effGroup = 'CENGKEH';
    else if (upR.indexOf('REFRESH') !== -1) effGroup = 'REFRESH';

    const ket = cells[ketIdx] || '';
    snap.rows.push({
      group: effGroup,
      rincian: rincian,
      pct: Math.round(pctNum * 100) / 100,
      ket: /^(gr|kg|ada data|sync|filter)$/i.test(ket) ? '' : ket
    });
  }

  const explByNum = {};
  footerNoteLines.forEach(function (line) {
    const m = /^(\\d+)\\s*[.)]\\s+/.exec(line);
    if (m && m[1]) explByNum[m[1]] = line;
  });

  const usedNums = {};
  snap.rows.forEach(function (row) {
    if (!row.ket || !/catatan/i.test(row.ket)) return;
    const m = /catatan\\s*(\\d+)/i.exec(row.ket);
    const num = m && m[1] ? m[1] : '';
    const ref = num ? ('Catatan ' + num) : row.ket;
    if (num) usedNums[num] = true;
    snap.notes.push({
      ref: ref,
      num: num,
      rincian: row.rincian,
      group: row.group,
      pct: row.pct,
      text: (num && explByNum[num]) ? explByNum[num] : row.ket
    });
  });

  Object.keys(explByNum).forEach(function (num) {
    if (!usedNums[num]) {
      snap.notes.push({
        ref: 'Catatan ' + num,
        num: num,
        rincian: '',
        group: 'CATATAN SHEET',
        pct: null,
        text: explByNum[num]
      });
    }
  });

  return snap;
}

function syncSheetSnapshotAndHistory(ss, dataMap) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(3000)) return;
  try {
    const props = PropertiesService.getScriptProperties();
    const prevRaw = props.getProperty(PROP_SNAPSHOT_KEY);
    const prevAll = prevRaw ? JSON.parse(prevRaw) : null;
    const nextAll = {};
    const newEntries = [];
    const nowIso = new Date().toISOString();

    ALLOWED_TABS.forEach(function (tabName) {
      const matrix = dataMap[tabName] || [];
      const cur = extractQuickTabSnapshot(tabName, matrix);
      nextAll[tabName] = cur;

      // Always capture active Catatan 1, 2... (Column M + B81:N85)
      cur.notes.forEach(function (n) {
        const periodKey = cur.noDokumen || cur.periodePruf || nowIso.slice(0, 10);
        newEntries.push({
          id: makeGasHistId(['note', tabName, periodKey, n.ref, n.rincian, n.text]),
          timestamp: nowIso,
          tab: tabName,
          namaTbkBlend: cur.namaTbkBlend,
          peruntukanMerk: cur.peruntukanMerk || '-',
          noDokumen: cur.noDokumen || '-',
          periodePruf: cur.periodePruf || '-',
          jenisPerubahan: 'CATATAN_AKTIF',
          status: 'Rencana (Catatan Aktif)',
          group: n.group,
          bahanLama: n.rincian,
          bahanBaru: '',
          pctLama: n.pct,
          pctBaru: null,
          deltaPct: null,
          catatanRef: n.ref,
          faktorAlasan: n.text,
          sumber: 'Google Sheets',
          oleh: 'Sync Google Sheets'
        });
      });

      const prev = prevAll ? prevAll[tabName] : null;
      if (!prev || !prev.rows || !prev.rows.length || !cur.rows.length) return;

      const versionKey = cur.noDokumen && cur.noDokumen !== prev.noDokumen
        ? (prev.noDokumen + '->' + cur.noDokumen)
        : (nowIso.slice(0, 10) + '-' + (cur.periodePruf || 'sync'));

      const prevMap = {};
      prev.rows.forEach(function (r) { prevMap[r.rincian.toLowerCase()] = r; });
      const curMap = {};
      cur.rows.forEach(function (r) { curMap[r.rincian.toLowerCase()] = r; });

      const removed = [];
      const added = [];
      const consumedNoteRefs = {};

      function findPrevNote(rincian) {
        const low = rincian.toLowerCase();
        return (prev.notes || []).find(function (n) {
          return (n.rincian && n.rincian.toLowerCase() === low) || n.text.toLowerCase().indexOf(low) !== -1;
        });
      }

      prev.rows.forEach(function (pr) {
        const nr = curMap[pr.rincian.toLowerCase()];
        if (!nr) {
          removed.push(pr);
        } else {
          const delta = Math.round((nr.pct - pr.pct) * 100) / 100;
          if (Math.abs(delta) >= 0.01) {
            const pNote = findPrevNote(nr.rincian);
            if (pNote) consumedNoteRefs[pNote.ref] = true;
            newEntries.push({
              id: makeGasHistId(['pct', tabName, versionKey, nr.rincian, String(pr.pct), String(nr.pct)]),
              timestamp: nowIso,
              tab: tabName,
              namaTbkBlend: cur.namaTbkBlend,
              peruntukanMerk: cur.peruntukanMerk || '-',
              noDokumen: cur.noDokumen || '-',
              periodePruf: cur.periodePruf || '-',
              jenisPerubahan: 'UBAH_PERSENTASE',
              status: 'Sudah Dieksekusi',
              group: nr.group,
              bahanLama: pr.rincian,
              bahanBaru: nr.rincian,
              pctLama: pr.pct,
              pctBaru: nr.pct,
              deltaPct: delta,
              catatanRef: pNote ? pNote.ref : '',
              faktorAlasan: pNote ? ('Eksekusi ' + pNote.ref + ': ' + pNote.text) : 'Penyesuaian persentase pemakaian bahan / rasa',
              sumber: 'Google Sheets',
              oleh: 'Sync Google Sheets'
            });
          }
        }
      });

      cur.rows.forEach(function (nr) {
        if (!prevMap[nr.rincian.toLowerCase()]) added.push(nr);
      });

      const usedRem = {};
      const usedAdd = {};
      removed.forEach(function (rem, ri) {
        const pNote = findPrevNote(rem.rincian);
        let matchIdx = -1;
        if (pNote) {
          matchIdx = added.findIndex(function (ad, ai) {
            return !usedAdd[ai] && pNote.text.toLowerCase().indexOf(ad.rincian.toLowerCase()) !== -1;
          });
        }
        if (matchIdx === -1) {
          matchIdx = added.findIndex(function (ad, ai) {
            return !usedAdd[ai] && ad.group === rem.group;
          });
        }
        if (matchIdx !== -1) {
          usedRem[ri] = true;
          usedAdd[matchIdx] = true;
          const ad = added[matchIdx];
          if (pNote) consumedNoteRefs[pNote.ref] = true;
          newEntries.push({
            id: makeGasHistId(['replace', tabName, versionKey, rem.rincian, ad.rincian]),
            timestamp: nowIso,
            tab: tabName,
            namaTbkBlend: cur.namaTbkBlend,
            peruntukanMerk: cur.peruntukanMerk || '-',
            noDokumen: cur.noDokumen || '-',
            periodePruf: cur.periodePruf || '-',
            jenisPerubahan: 'GANTI_BAHAN',
            status: 'Sudah Dieksekusi',
            group: ad.group,
            bahanLama: rem.rincian,
            bahanBaru: ad.rincian,
            pctLama: rem.pct,
            pctBaru: ad.pct,
            deltaPct: Math.round((ad.pct - rem.pct) * 100) / 100,
            catatanRef: pNote ? pNote.ref : '',
            faktorAlasan: pNote ? ('Eksekusi ' + pNote.ref + ': ' + pNote.text) : 'Penggantian jenis bahan pada grup yang sama',
            sumber: 'Google Sheets',
            oleh: 'Sync Google Sheets'
          });
        }
      });

      removed.forEach(function (rem, ri) {
        if (usedRem[ri]) return;
        const pNote = findPrevNote(rem.rincian);
        if (pNote) consumedNoteRefs[pNote.ref] = true;
        newEntries.push({
          id: makeGasHistId(['remove', tabName, versionKey, rem.rincian]),
          timestamp: nowIso,
          tab: tabName,
          namaTbkBlend: cur.namaTbkBlend,
          peruntukanMerk: cur.peruntukanMerk || '-',
          noDokumen: cur.noDokumen || '-',
          periodePruf: cur.periodePruf || '-',
          jenisPerubahan: 'HAPUS_BAHAN',
          status: 'Sudah Dieksekusi',
          group: rem.group,
          bahanLama: rem.rincian,
          bahanBaru: '',
          pctLama: rem.pct,
          pctBaru: 0,
          deltaPct: Math.round((-rem.pct) * 100) / 100,
          catatanRef: pNote ? pNote.ref : '',
          faktorAlasan: pNote ? ('Eksekusi ' + pNote.ref + ': ' + pNote.text) : 'Bahan dihentikan / stok tidak aktif di Kolom G',
          sumber: 'Google Sheets',
          oleh: 'Sync Google Sheets'
        });
      });

      added.forEach(function (ad, ai) {
        if (usedAdd[ai]) return;
        newEntries.push({
          id: makeGasHistId(['add', tabName, versionKey, ad.rincian]),
          timestamp: nowIso,
          tab: tabName,
          namaTbkBlend: cur.namaTbkBlend,
          peruntukanMerk: cur.peruntukanMerk || '-',
          noDokumen: cur.noDokumen || '-',
          periodePruf: cur.periodePruf || '-',
          jenisPerubahan: 'TAMBAH_BAHAN',
          status: 'Sudah Dieksekusi',
          group: ad.group,
          bahanLama: '',
          bahanBaru: ad.rincian,
          pctLama: 0,
          pctBaru: ad.pct,
          deltaPct: ad.pct,
          catatanRef: '',
          faktorAlasan: 'Penambahan bahan baru pada komposisi PRUF',
          sumber: 'Google Sheets',
          oleh: 'Sync Google Sheets'
        });
      });

      (prev.notes || []).forEach(function (pn) {
        if (consumedNoteRefs[pn.ref]) return;
        const stillThere = cur.notes.some(function (cn) {
          return cn.ref === pn.ref && cn.text === pn.text;
        });
        if (!stillThere) {
          newEntries.push({
            id: makeGasHistId(['execnote', tabName, versionKey, pn.ref, pn.text]),
            timestamp: nowIso,
            tab: tabName,
            namaTbkBlend: cur.namaTbkBlend,
            peruntukanMerk: cur.peruntukanMerk || '-',
            noDokumen: cur.noDokumen || '-',
            periodePruf: cur.periodePruf || '-',
            jenisPerubahan: 'EKSEKUSI_CATATAN',
            status: 'Sudah Dieksekusi',
            group: pn.group || 'CATATAN SHEET',
            bahanLama: pn.rincian || '',
            bahanBaru: '',
            pctLama: pn.pct,
            pctBaru: null,
            deltaPct: null,
            catatanRef: pn.ref,
            faktorAlasan: pn.text + ' (catatan telah dieksekusi & dibersihkan dari sheet)',
            sumber: 'Google Sheets',
            oleh: 'Sync Google Sheets'
          });
        }
      });
    });

    if (newEntries.length > 0) {
      appendHistoryEntriesToSheet(ss, newEntries);
    }
    props.setProperty(PROP_SNAPSHOT_KEY, JSON.stringify(nextAll));
  } catch (err) {
    Logger.log('syncSheetSnapshotAndHistory warning: ' + err);
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
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
      const displayValues = range.getDisplayValues();
      const fontColors = range.getFontColors();
      const bgColors = range.getBackgrounds();

      // Abaikan teks yang disembunyikan dengan warna font = warna latar (mis. putih di atas putih)
      for (let r = 0; r < displayValues.length; r++) {
        for (let c = 0; c < displayValues[r].length; c++) {
          const fc = String(fontColors[r][c] || '').toLowerCase();
          const bg = String(bgColors[r][c] || '').toLowerCase();
          if (
            fc &&
            bg &&
            fc === bg &&
            String(displayValues[r][c] || '').indexOf('http') === -1
          ) {
            displayValues[r][c] = '';
          }
        }
      }

      result[sheetName] = displayValues;
      links[sheetName] = extractSheetLinks(range, displayValues);
    });

    if (!tab) {
      syncSheetSnapshotAndHistory(ss, result);
    }

    const history = readHistoryEntries(ss);
    const historySettings = getHistorySettings();

    return jsonResponse({
      ok: true,
      mode: 'standalone',
      spreadsheetId: SPREADSHEET_ID,
      serverTime: formatNowWib(),
      data: result,
      links: links,
      history: history,
      historySettings: historySettings
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

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (body.action === 'set_history_settings') {
      const savedSettings = saveHistorySettings(body.settings || {});
      return jsonResponse({ ok: true, historySettings: savedSettings, serverTime: formatNowWib() });
    }

    if (body.action === 'append_history') {
      const inserted = appendHistoryEntriesToSheet(ss, body.entries || []);
      return jsonResponse({ ok: true, inserted: inserted, sheet: HISTORY_SHEET_NAME, serverTime: formatNowWib() });
    }

    const tab = body.tab;
    const doc = body.document;
    if (ALLOWED_TABS.indexOf(tab) === -1 || !doc) {
      throw new Error('Payload tab atau dokumen PRUF tidak valid.');
    }

    const sheet = ss.getSheetByName(tab);
    if (!sheet) {
      throw new Error('Tab "' + tab + '" tidak ditemukan di Spreadsheet.');
    }

    // Pembaruan aman (in-place) tanpa clearContents() agar layout cetak & rumus master terjaga
    const updatedCells = syncMasterSheetInPlace(sheet, doc);
    appendSyncLog(ss, tab, doc, updatedCells);

    if (body.historyEntries && body.historyEntries.length) {
      appendHistoryEntriesToSheet(ss, body.historyEntries);
    }

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
