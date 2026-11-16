import {createSeedPrufDocuments, SHEET_TABS} from '../data/seedData';
import type {
  GASConfig,
  PrufDocument,
  PrufGroupKey,
  PrufRow,
  SheetTabKey,
} from '../types/tsc';
import {
  calcRowGr,
  calcRowKg,
  computePrufTotals,
  getWibDateKey,
  parseLocaleNumber,
  roundOneDec,
  roundPct,
  toGoogleDriveDownloadUrl,
} from '../utils/formatters';

let staticHostingDetected = false;

export function isStaticHostingMode(): boolean {
  return staticHostingDetected;
}

export async function probeApiOrStatic<T>(
  apiPath: string,
  fallbackFn: () => Promise<T>
): Promise<T> {
  if (staticHostingDetected) {
    return fallbackFn();
  }
  try {
    const res = await fetch(apiPath, {method: 'GET', cache: 'no-store'});
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      staticHostingDetected = true;
      return fallbackFn();
    }
    const rawText = await res.text();
    if (rawText.trim().startsWith('<')) {
      staticHostingDetected = true;
      return fallbackFn();
    }
    if (!res.ok) {
      return fallbackFn();
    }
    return JSON.parse(rawText) as T;
  } catch {
    staticHostingDetected = true;
    return fallbackFn();
  }
}

function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const ch = csvText[i];
    const next = csvText[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell.trim());
      cell = '';
    } else if (ch === '\r' && next === '\n') {
      row.push(cell.trim());
      if (row.some((v) => v !== '')) rows.push(row);
      row = [];
      cell = '';
      i++;
    } else if (ch === '\n' || ch === '\r') {
      row.push(cell.trim());
      if (row.some((v) => v !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }

  row.push(cell.trim());
  if (row.some((v) => v !== '')) rows.push(row);
  return rows;
}

function detectGroupHeader(label: string): PrufGroupKey | null {
  const up = label.toUpperCase();
  if (up.startsWith('GROUP 1')) return 'GROUP 1';
  if (up.startsWith('GROUP 2')) return 'GROUP 2';
  if (up.startsWith('GROUP 3')) return 'GROUP 3';
  if (up.startsWith('GROUP 4')) return 'GROUP 4';
  if (up.startsWith('GROUP 6')) return 'GROUP 6';
  if (up.includes('TEMBAKAU BLEND REFRESH')) return 'REFRESH';
  return null;
}

function isSummaryOrIgnoreRow(label: string): boolean {
  const up = label.trim().toUpperCase();
  return (
    !up ||
    up.startsWith('TOTAL ') ||
    up.startsWith('GRAND TOTAL') ||
    up.startsWith('KETETAPAN PRUF') ||
    up.startsWith('NAMA TBK') ||
    up.startsWith('NAMA STOCK BAHAN') ||
    up.startsWith('RINCIAN') ||
    up.startsWith('PARAM') ||
    up.startsWith('CATATAN') ||
    up.startsWith('DITETAPKAN') ||
    up.startsWith('DIKETAHUI') ||
    up.startsWith('ACC ') ||
    up.startsWith('PRUF ') ||
    up.startsWith('SILAHKAN DOWNLOAD') ||
    up.startsWith('MALANG,') ||
    up.startsWith('( ') ||
    up.startsWith('(') ||
    up.startsWith('MANAJER') ||
    up.startsWith('DIREKTUR')
  );
}

function hasValidNumericCell(raw: string | undefined): boolean {
  if (!raw) return false;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '-' || trimmed === '—') return false;
  return parseLocaleNumber(trimmed) > 0;
}

/**
 * Parses 2D spreadsheet grid rows (from GAS doGet or Google Sheets CSV) into a PrufDocument.
 * Handles both the real Google Sheet layout (blank Col A margin, Rincian in Col B, % in Col F,
 * 1000 Gr in Col G, target Kg in Col I/K, Keterangan in Col M) and structured GAS Code.gs exports.
 * STRICT RULE: Only displays ingredient rows that have a non-empty, > 0 value in Column G (index 6).
 */
export function parseMatrixToPrufDoc(
  tab: SheetTabKey,
  matrix: unknown[][],
  baseline: PrufDocument,
  source: 'gas' | 'csv'
): PrufDocument {
  if (!matrix || matrix.length < 3) {
    return baseline;
  }

  // Start with a clean slate for sheet-derived fields so deletions in the source
  // sheet immediately apply in the web app (never carry over removed ACC stamps, notes, or links).
  const nextDoc: PrufDocument = {
    ...baseline,
    pelaksanaanPruf: '',
    periodePruf: '',
    tglBlend: '',
    peruntukanMerk: '',
    catatan: '',
    lokasiTanggal: '',
    accOperasional: {
      approved: false,
      jabatan: baseline.accOperasional?.jabatan || 'Manajer Operasional',
      nama: baseline.accOperasional?.nama || '',
    },
    accDirektur: {
      approved: false,
      jabatan: baseline.accDirektur?.jabatan || 'Direktur',
      nama: baseline.accDirektur?.nama || '',
    },
    prufDownloadUrl:
      source === 'csv' && baseline.prufDownloadUrl
        ? toGoogleDriveDownloadUrl(baseline.prufDownloadUrl)
        : '',
    rows: [],
    updatedAt: new Date().toISOString(),
    source,
  };

  // Detect whether Column A is a blank left margin (real sheet starts in Col B = index 1)
  let colACount = 0;
  let colBCount = 0;
  for (let r = 0; r < Math.min(matrix.length, 20); r++) {
    const row = matrix[r] || [];
    if (String(row[0] ?? '').trim()) colACount++;
    if (String(row[1] ?? '').trim()) colBCount++;
  }
  const hasBlankColA = colACount === 0 && colBCount > 0;
  const labelColIdx = hasBlankColA ? 1 : 0;

  let currentGroup: PrufGroupKey = 'GROUP 1';
  let rowIndex = 1;
  let pctColIdx = hasBlankColA ? 5 : 4;
  let grColIdx = hasBlankColA ? 6 : 5;
  // Column G = index 6 (always the strict non-empty numeric gate in Google Sheets)
  const colGIndex = 6;
  let kgColIdx = hasBlankColA ? 10 : 6;
  let kodeColIdx = hasBlankColA ? 4 : 3;
  let ketColIdx = hasBlankColA ? 12 : 7;
  let verColIdx = -1;
  let linkColIdx = -1;
  let isStructuredExport = false;
  let passedGrandTotal = false;

  for (let r = 0; r < matrix.length; r++) {
    const rawRow = matrix[r] || [];
    const cells = rawRow.map((c) => String(c ?? '').trim());
    const joined = cells.join(' ').trim();
    if (!joined) continue;

    // Detect any Google Drive / Docs PDF link embedded in cells of the source sheet
    for (let ci = 0; ci < cells.length; ci++) {
      const c = cells[ci];
      if (/https?:\/\/(drive(?:\.usercontent)?|docs)\.google\.com\//i.test(c)) {
        const urlMatch = /(https?:\/\/[^\s"']+)/i.exec(c);
        if (urlMatch?.[1]) {
          nextDoc.prufDownloadUrl = toGoogleDriveDownloadUrl(urlMatch[1]);
        }
      } else if (
        linkColIdx >= 0 &&
        ci === linkColIdx &&
        c &&
        /^[a-zA-Z0-9_-]{20,}$|^https?:\/\//i.test(c)
      ) {
        nextDoc.prufDownloadUrl = toGoogleDriveDownloadUrl(c);
      }
    }

    const first = cells[labelColIdx] || cells[0] || '';
    const firstUp = first.toUpperCase();

    if (firstUp.includes('KETETAPAN PRUF')) {
      nextDoc.judulUtama = first;
      continue;
    }

    // Extract document metadata lines dynamically from source sheet
    if (firstUp.includes('NAMA TBK')) {
      const colonVal = first.includes(':') ? first.split(':').slice(1).join(':').trim() : '';
      const nextCellVal = cells
        .slice(labelColIdx + 1, labelColIdx + 5)
        .find((c) => c && c !== 'TRUE' && c !== 'FALSE' && !c.toUpperCase().includes('HOME'));
      const val = colonVal || nextCellVal || '';
      if (val) nextDoc.namaTbkBlend = val.replace(/^:/, '').trim();
      continue;
    }
    if (/^No\s*:/i.test(first) || joined.includes('No :') || joined.includes('No:')) {
      const m = /No\s*:\s*([^|]+)/i.exec(first || joined);
      if (m?.[1]) {
        nextDoc.noDokumen = m[1]
          .replace(/\s*LEMBAR PRUF.*$/i, '')
          .trim();
      }
      continue;
    }
    if (firstUp.startsWith('1. PELAKSANAAN')) {
      const val =
        cells
          .slice(labelColIdx + 1, labelColIdx + 6)
          .find((c) => c && !c.startsWith('3.') && !c.toUpperCase().includes('LEMBAR PRUF')) || '';
      if (val) nextDoc.pelaksanaanPruf = val.replace(/^:/, '').trim();
      const tglIdx = cells.findIndex((c) => c.toUpperCase().includes('3.'));
      if (tglIdx >= 0) {
        const tglVal =
          cells
            .slice(tglIdx + 1)
            .find((c) => c && !c.toUpperCase().includes('LEMBAR PRUF')) || '';
        if (tglVal) nextDoc.tglBlend = tglVal.replace(/^:/, '').trim();
      }
      continue;
    }
    if (firstUp.startsWith('2. PERIODE')) {
      const val =
        cells
          .slice(labelColIdx + 1, labelColIdx + 6)
          .find((c) => c && !c.startsWith('4.') && !c.toUpperCase().includes('LEMBAR PRUF')) || '';
      if (val) nextDoc.periodePruf = val.replace(/^:/, '').trim();
      const merkIdx = cells.findIndex((c) => c.toUpperCase().includes('4.'));
      if (merkIdx >= 0) {
        const afterMerk = cells
          .slice(merkIdx + 1)
          .filter((c) => c && !c.toUpperCase().includes('LEMBAR PRUF'));
        const colonMerk = afterMerk.find((c) => c.startsWith(':'));
        const baseMerk = (colonMerk || afterMerk[0] || '').replace(/^:/, '').trim();
        // Also collect wrapped continuation row right below 4.Peruntukan Merk (if present before NAMA STOCK BAHAN)
        const nextRowCells = (matrix[r + 1] || []).map((c) => String(c ?? '').trim());
        const nextFirst = (nextRowCells[labelColIdx] || nextRowCells[0] || '').toUpperCase();
        const extraMerk =
          !nextFirst && !nextRowCells.slice(0, merkIdx).some(Boolean)
            ? nextRowCells
                .slice(merkIdx)
                .filter((c) => c && !c.toUpperCase().includes('LEMBAR PRUF'))
                .join(' ')
                .trim()
            : '';
        const combined = [baseMerk, extraMerk].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
        if (combined) nextDoc.peruntukanMerk = combined;
      }
      continue;
    }

    // Track when we reach the footer section (after GRAND TOTAL)
    if (
      firstUp.startsWith('GRAND TOTAL') ||
      cells.slice(0, 6).some((c) => /^GRAND TOTAL\b/i.test(c))
    ) {
      passedGrandTotal = true;
      continue;
    }

    // Extract Catatan line dynamically from source
    if (firstUp.startsWith('CATATAN')) {
      passedGrandTotal = true;
      const inlineNote = first.replace(/^CATATAN\s*:?\s*/i, '').trim();
      const extraNote = cells
        .slice(labelColIdx + 1)
        .filter((c) => c && c !== ':')
        .join(' ')
        .replace(/^:\s*/, '')
        .trim();
      nextDoc.catatan = inlineNote || extraNote || '';
      continue;
    }

    // Extract Footer Metadata: Tanggal Lokasi, Jabatan, Nama Penandatangan, and optional ACC stamps
    if (passedGrandTotal || /^(DITETAPKAN|DIKETAHUI|MALANG,|ACC\s|MANAJER|DIREKTUR|\()/i.test(firstUp)) {
      // Lokasi & Tanggal e.g. "Malang, 12 November 2026"
      for (const c of cells) {
        if (!c) continue;
        if (/^(malang|[a-z]+)\s*,\s*\d{1,2}\s+[a-z]+\s+\d{4}$/i.test(c)) {
          nextDoc.lokasiTanggal = c;
        }
      }

      // Signature parenthesized names e.g. "( Lalu Mahendra AA. )" & "( Bpk. Denny Wibisono )"
      const parenMatches: Array<{col: number; name: string}> = [];
      cells.forEach((c, idx) => {
        const m = /^\(\s*([^)]+?)\s*\)$/.exec(c);
        if (m?.[1] && !/^\d{4}$/.test(m[1])) {
          parenMatches.push({col: idx, name: m[1].trim()});
        }
      });
      if (parenMatches.length >= 2) {
        nextDoc.accOperasional.nama = parenMatches[0].name;
        nextDoc.accDirektur.nama = parenMatches[parenMatches.length - 1].name;
      } else if (parenMatches.length === 1) {
        if (parenMatches[0].col <= 6) {
          nextDoc.accOperasional.nama = parenMatches[0].name;
        } else {
          nextDoc.accDirektur.nama = parenMatches[0].name;
        }
      }

      // Only mark ACC approved if an explicit ACC cell actually exists in the source sheet
      cells.forEach((c, idx) => {
        if (!c || /^https?:\/\//i.test(c)) return;
        const cu = c.toUpperCase();
        if (!/\bACC\b/.test(cu)) return;
        if (cu.includes('DIREKTUR')) {
          nextDoc.accDirektur.approved = true;
          nextDoc.accDirektur.approvedBy = nextDoc.accDirektur.nama || 'Direktur';
          nextDoc.accDirektur.approvedAt = c;
        } else if (cu.includes('ONLINE') || cu.includes('OPERASIONAL') || idx <= 6) {
          nextDoc.accOperasional.approved = true;
          nextDoc.accOperasional.approvedBy = nextDoc.accOperasional.nama || 'Manajer Operasional';
          nextDoc.accOperasional.approvedAt = c;
        }
      });

      if (passedGrandTotal) {
        continue;
      }
    }

    // Detect table header columns
    if (
      cells.some((c) => c === '%') ||
      cells.some((c) => c.toUpperCase().includes('NAMA STOCK BAHAN')) ||
      firstUp === 'GROUP'
    ) {
      if (firstUp === 'GROUP') isStructuredExport = true;
      cells.forEach((c, idx) => {
        const up = c.toUpperCase();
        if (c === '%') pctColIdx = idx;
        else if (up.includes('KODE')) kodeColIdx = idx;
        else if (up.includes('(GR)')) grColIdx = idx;
        else if (up.includes('(KG)')) kgColIdx = idx;
        else if (up.includes('KETERANGAN')) ketColIdx = idx;
        else if (up.includes('VERIFIKASI')) verColIdx = idx;
        else if (up.includes('LINK') || up === 'PDF' || up.includes('URL')) linkColIdx = idx;
      });
      continue;
    }

    // Detect sub-header capacity row: e.g. RINCIAN | Grade | Tahun | Kode Intern | | 1000 Gr | | 500 | | 600 Kg
    if (
      firstUp === 'RINCIAN' ||
      cells.some((c) => /^1000(\s*gr)?$/i.test(c))
    ) {
      cells.forEach((c, idx) => {
        const up = c.toUpperCase();
        if (up.includes('KODE')) kodeColIdx = idx;
        else if (up.includes('KETERANGAN')) ketColIdx = idx;
      });

      const grIdx = cells.findIndex((c) => /^1000(\s*gr)?$/i.test(c));
      if (grIdx >= 0) {
        grColIdx = grIdx;
        pctColIdx = Math.max(labelColIdx + 1, grIdx - 1);
        const parsedGr = parseLocaleNumber(cells[grIdx]);
        if (parsedGr > 0) nextDoc.baseGr = parsedGr;
      }

      // Inspect capacity columns after 1000 Gr (e.g. col 8 = 500 or 360, col 10 = 600 Kg or 140 Kg or 500)
      const capCandidates: Array<{idx: number; val: number; hasKg: boolean}> = [];
      for (let idx = (grIdx >= 0 ? grIdx + 1 : labelColIdx + 2); idx < Math.min(cells.length, 13); idx++) {
        const cell = cells[idx];
        if (!cell) continue;
        if (/^\d+([.,]\d+)?(\s*kg)?$/i.test(cell)) {
          const val = parseLocaleNumber(cell);
          if (val > 0 && val !== nextDoc.baseGr) {
            capCandidates.push({idx, val, hasKg: /kg$/i.test(cell)});
          }
        }
      }

      if (capCandidates.length > 0) {
        // Prefer candidate matching baseline targetKg (e.g. 360 on F REGULER, 140 on TIS, 600 on 153/KARANG),
        // else explicit 'Kg' suffix, else non-500 candidate, else last candidate.
        const picked =
          capCandidates.find((c) => Math.abs(c.val - baseline.targetKg) < 0.1) ||
          capCandidates.find((c) => c.hasKg) ||
          capCandidates.find((c) => c.val !== 500) ||
          capCandidates[capCandidates.length - 1];
        if (picked) {
          kgColIdx = picked.idx;
          nextDoc.targetKg = roundOneDec(picked.val);
        }
      }
      continue;
    }

    // Detect PARAM row (Code.gs format)
    if (firstUp === 'PARAM') {
      const bGr = parseLocaleNumber(cells[grColIdx >= 0 ? grColIdx : 5]);
      const tKg = parseLocaleNumber(cells[kgColIdx]);
      if (bGr > 0) nextDoc.baseGr = bGr;
      if (tKg > 0) nextDoc.targetKg = roundOneDec(tKg);
      continue;
    }

    // Check group header transition
    const groupHit = detectGroupHeader(first);
    if (groupHit && !isStructuredExport) {
      currentGroup = groupHit;
      continue;
    }

    // Skip summary rows even when 'Total ...' appears in a shifted column (e.g. Total Saos in 153 BK)
    if (
      isSummaryOrIgnoreRow(first) ||
      cells.slice(0, 6).some((c) => /^(TOTAL|GRAND TOTAL)\b/i.test(c))
    ) {
      continue;
    }

    let effectiveGroup = currentGroup;
    let rincian = first;
    let pctVal = 0;
    let kodeIntern = '';
    let keterangan = '';
    let verified = true;

    if (
      isStructuredExport &&
      (firstUp === 'SAOS' ||
        firstUp === 'REFRESH' ||
        firstUp === 'CENGKEH' ||
        groupHit)
    ) {
      effectiveGroup = (groupHit || firstUp) as PrufGroupKey;
      rincian = cells[1] || '';
      kodeIntern = kodeColIdx >= 0 ? cells[kodeColIdx] || '' : cells[2] || '';

      // Strict Column G check
      const colGCell = cells[colGIndex];
      if (!hasValidNumericCell(colGCell)) {
        continue;
      }
      const kgVal = parseLocaleNumber(cells[kgColIdx] ?? colGCell);
      pctVal = roundPct(parseLocaleNumber(cells[pctColIdx >= 0 ? pctColIdx : 4]));
      if (pctVal <= 0 && nextDoc.targetKg > 0) {
        pctVal = roundPct((kgVal / nextDoc.targetKg) * 100);
      }
      keterangan = ketColIdx >= 0 ? cells[ketColIdx] || '' : '';
      if (verColIdx >= 0) {
        const vStr = (cells[verColIdx] || '').toUpperCase();
        verified = !vStr || vStr.includes('VERIF') || vStr === 'TRUE' || vStr === 'OK';
      }
    } else {
      // Standard PRUF Google Sheet layout:
      // Col A (0): blank margin, Col B (1): Rincian, C (2): Grade, D (3): Tahun, E (4): Kode Intern,
      // Col F (5): %, Col G (6): 1000 Gr, Col H (7): 'Gr', Col I (8)/Col K (10): Kg capacities, Col M (12): Keterangan
      const colGCell = cells[colGIndex];

      // STRICT REQUIREMENT: Do not show row if Column G (index 6) has no value (empty / 0 / '-')
      if (!hasValidNumericCell(colGCell)) {
        continue;
      }

      const gradeColIdx = labelColIdx + 1;
      const tahunColIdx = labelColIdx + 2;
      const gradeRaw = cells[gradeColIdx] || '';
      const tahunRaw = cells[tahunColIdx] || '';
      const gradePart =
        gradeRaw && !/^\d/.test(gradeRaw) && gradeRaw.length > 1 ? gradeRaw : '';
      const tahunPart = tahunRaw && /^\d{4}$/.test(tahunRaw) ? `(${tahunRaw})` : '';
      const parts = [first, gradePart, tahunPart].filter(
        (part, i, arr) =>
          part &&
          (i === 0 ||
            !first.toLowerCase().includes(part.replace(/[()]/g, '').toLowerCase())) &&
          arr.indexOf(part) === i
      );
      rincian = parts.join(' ').trim();

      const upName = rincian.toUpperCase();
      if (upName.includes('CASSING') || upName.includes('TOP JADI')) {
        effectiveGroup = 'SAOS';
      } else if (upName.includes('MANADO') || upName.includes('CENGKEH')) {
        effectiveGroup = 'CENGKEH';
      } else if (upName.includes('REFRESH')) {
        effectiveGroup = 'REFRESH';
      }

      pctVal = roundPct(parseLocaleNumber(cells[pctColIdx]));

      if (pctVal <= 0 && grColIdx >= 0) {
        const grVal = parseLocaleNumber(cells[grColIdx]);
        if (grVal > 0 && nextDoc.baseGr > 0) {
          pctVal = roundPct((grVal / nextDoc.baseGr) * 100);
        }
      }
      if (pctVal <= 0) {
        const kgVal = parseLocaleNumber(cells[kgColIdx]);
        if (kgVal > 0 && nextDoc.targetKg > 0) {
          pctVal = roundPct((kgVal / nextDoc.targetKg) * 100);
        }
      }

      kodeIntern =
        (kodeColIdx >= 0 ? cells[kodeColIdx] || '' : '') ||
        (gradeRaw && gradeRaw.length <= 2 ? gradeRaw : '');

      const rawKet = ketColIdx >= 0 ? cells[ketColIdx] || '' : '';
      keterangan = /^(gr|kg|ada data|sync|filter)$/i.test(rawKet) ? '' : rawKet;
    }

    if (rincian && pctVal > 0) {
      nextDoc.rows.push({
        id: `${source}-${tab}-${rowIndex++}`,
        group: effectiveGroup,
        rincian,
        kodeIntern,
        pct: pctVal,
        keterangan,
        verified,
      });
    }
  }

  return nextDoc;
}

export async function fetchFromGasEndpoint(
  gasUrl: string,
  baselines: Record<SheetTabKey, PrufDocument>,
  tab?: SheetTabKey
): Promise<{
  docs: Partial<Record<SheetTabKey, PrufDocument>>;
  rawPayload: unknown;
}> {
  const cleanUrl = gasUrl.trim();
  if (!cleanUrl) {
    throw new Error('URL Headless GAS belum diisi.');
  }
  const baseUrl = tab
    ? `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}tab=${encodeURIComponent(tab)}`
    : cleanUrl;
  const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}_ts=${Date.now()}`;

  const res = await fetch(url, {method: 'GET', redirect: 'follow'});
  const rawText = await res.text();
  if (rawText.trim().startsWith('<')) {
    throw new Error(
      'Endpoint GAS mengembalikan HTML (pastikan Web App GAS dideploy dengan akses "Anyone").'
    );
  }
  const parsed = JSON.parse(rawText) as {
    ok?: boolean;
    error?: string;
    data?: Record<string, unknown[][]>;
    links?: Record<string, string[]>;
  };
  if (parsed.ok === false) {
    throw new Error(parsed.error || 'Respons GAS menyatakan gagal.');
  }

  const docs: Partial<Record<SheetTabKey, PrufDocument>> = {};
  const dataMap = parsed.data || {};
  const linksMap = parsed.links || {};
  for (const meta of SHEET_TABS) {
    const matrix = dataMap[meta.key];
    if (Array.isArray(matrix) && matrix.length > 0) {
      const parsedDoc = parseMatrixToPrufDoc(
        meta.key,
        matrix,
        baselines[meta.key],
        'gas'
      );
      const tabLinks = linksMap[meta.key];
      if (Array.isArray(tabLinks) && tabLinks.length > 0) {
        const driveLink =
          tabLinks.find((u) => /(drive(?:\.usercontent)?|docs)\.google\.com/i.test(u)) ||
          tabLinks[0];
        if (driveLink) {
          parsedDoc.prufDownloadUrl = toGoogleDriveDownloadUrl(driveLink);
        }
      }
      docs[meta.key] = parsedDoc;
    }
  }
  return {docs, rawPayload: parsed};
}

export async function fetchTabFromGoogleSheetCsv(
  spreadsheetId: string,
  tab: SheetTabKey,
  baseline: PrufDocument
): Promise<PrufDocument> {
  const csvUrl = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(
    spreadsheetId.trim()
  )}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`;

  const res = await fetch(csvUrl, {method: 'GET', cache: 'no-store'});
  const rawText = await res.text();
  if (!res.ok || rawText.trim().startsWith('<')) {
    throw new Error(
      `CSV tab "${tab}" belum dibuka untuk publik (izin akses Sheet masih terbatas).`
    );
  }

  const matrix = parseCsvRows(rawText);
  return parseMatrixToPrufDoc(tab, matrix, baseline, 'csv');
}

export async function syncAllTabs(
  config: GASConfig,
  currentDocs: Record<SheetTabKey, PrufDocument>
): Promise<{
  docs: Record<SheetTabKey, PrufDocument>;
  source: 'gas' | 'csv';
  warnings: string[];
}> {
  const baselines = currentDocs || createSeedPrufDocuments();

  return probeApiOrStatic('/api/health', async () => {
    const warnings: string[] = [];
    const merged: Record<SheetTabKey, PrufDocument> = {...baselines};

    if (config.gasUrl.trim()) {
      try {
        const gasRes = await fetchFromGasEndpoint(config.gasUrl, baselines);
        const syncedKeys = Object.keys(gasRes.docs) as SheetTabKey[];
        if (syncedKeys.length > 0) {
          for (const k of syncedKeys) {
            if (gasRes.docs[k]) merged[k] = gasRes.docs[k]!;
          }
          return {docs: merged, source: 'gas', warnings};
        }
        warnings.push('GAS terhubung namun data tab kosong; mencoba fallback CSV...');
      } catch (err) {
        warnings.push(
          err instanceof Error ? err.message : 'Gagal fetch GAS; beralih ke CSV.'
        );
      }
    }

    let csvSuccessCount = 0;
    for (const meta of SHEET_TABS) {
      try {
        const parsedDoc = await fetchTabFromGoogleSheetCsv(
          config.spreadsheetId,
          meta.key,
          baselines[meta.key]
        );
        if (parsedDoc.source === 'csv') {
          merged[meta.key] = parsedDoc;
          csvSuccessCount++;
        }
      } catch (err) {
        warnings.push(
          err instanceof Error ? err.message : `Gagal CSV tab ${meta.key}`
        );
      }
    }

    if (csvSuccessCount === 0) {
      throw new Error(
        warnings[0] ||
          'Data Google Sheets belum terbaca publik. Gunakan Headless GAS Center atau aktifkan Viewer Link.'
      );
    }

    return {docs: merged, source: 'csv', warnings};
  });
}

export async function pushPrufDocToGas(
  gasUrl: string,
  tab: SheetTabKey,
  doc: PrufDocument
): Promise<unknown> {
  const cleanUrl = gasUrl.trim();
  if (!cleanUrl) {
    return {ok: true, localOnly: true};
  }
  const res = await fetch(cleanUrl, {
    method: 'POST',
    headers: {'Content-Type': 'text/plain;charset=utf-8'},
    body: JSON.stringify({action: 'upsert_pruf', tab, document: doc}),
  });
  const rawText = await res.text();
  if (rawText.trim().startsWith('<')) {
    throw new Error(
      'GAS POST mengembalikan halaman HTML. Periksa izin deploy Web App GAS.'
    );
  }
  const parsed = JSON.parse(rawText) as {ok?: boolean; error?: string};
  if (parsed.ok === false) {
    throw new Error(parsed.error || 'Gagal menulis ke GAS.');
  }
  return parsed;
}

/**
 * Exports active PRUF sheet as semicolon-delimited CSV with Indonesian formulas (;).
 * Only includes active rows with > 0 value in Kapasitas (Kg).
 */
export function downloadIndonesianCsv(doc: PrufDocument): void {
  const activeRows = doc.rows.filter(
    (r) => r.pct > 0 && calcRowKg(r.pct, doc.targetKg) > 0
  );
  const filteredDoc: PrufDocument = {...doc, rows: activeRows};
  const totals = computePrufTotals(filteredDoc);

  const lines: string[] = [
    `"${doc.judulUtama}"`,
    `"NAMA TBK. BLEND : ${doc.namaTbkBlend}";"No : ${doc.noDokumen}"`,
    `"1. Pelaksanaan Pruf : ${doc.pelaksanaanPruf}";"3. Tgl Blend : ${doc.tglBlend}"`,
    `"2. Periode Pruf : ${doc.periodePruf}";"4. Peruntukan Merk : ${doc.peruntukanMerk}"`,
    [
      'Group',
      'Nama Stock Bahan (Rincian)',
      'Grade/Tahun',
      'Kode Intern',
      '%',
      `Kapasitas (${doc.baseGr} Gr)`,
      `Kapasitas (${doc.targetKg} Kg)`,
      'Keterangan',
      'Formula Gr (;)',
      'Formula Kg (;)',
      'Verifikasi',
    ].join(';'),
    [
      'PARAM',
      'Basis Kapasitas',
      '',
      '',
      '100,00',
      doc.baseGr.toFixed(1).replace('.', ','),
      doc.targetKg.toFixed(1).replace('.', ','),
      '',
      '',
      '',
      '',
    ].join(';'),
  ];

  let rowIdx = 7;
  activeRows.forEach((item) => {
    const grVal = calcRowGr(item.pct, doc.baseGr);
    const kgVal = calcRowKg(item.pct, doc.targetKg);
    const grFormula = `=ROUND((E${rowIdx}/100)*$F$6; 1)`;
    const kgFormula = `=ROUND((E${rowIdx}/100)*$G$6; 1)`;
    const cols = [
      item.group,
      item.rincian,
      '-',
      item.kodeIntern || '-',
      item.pct.toFixed(2).replace('.', ','),
      grVal.toFixed(1).replace('.', ','),
      kgVal.toFixed(1).replace('.', ','),
      item.keterangan || '-',
      grFormula,
      kgFormula,
      item.verified ? 'TERVERIFIKASI' : 'MENUNGGU',
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
    lines.push(cols.join(';'));
    rowIdx++;
  });

  lines.push(
    [
      'SUMMARY',
      'TOTAL TEMBAKAU',
      '',
      '',
      totals.tobaccoPct.toFixed(2).replace('.', ','),
      totals.tobaccoGr.toFixed(1).replace('.', ','),
      totals.tobaccoKg.toFixed(1).replace('.', ','),
      `${totals.tobaccoCount} JENIS TEMBAKAU`,
      '',
      '',
      '',
    ].join(';')
  );
  lines.push(
    [
      'SUMMARY',
      'GRAND TOTAL',
      '',
      '',
      totals.grandPct.toFixed(2).replace('.', ','),
      totals.grandGr.toFixed(1).replace('.', ','),
      totals.grandKg.toFixed(1).replace('.', ','),
      '',
      '',
      '',
      '',
    ].join(';')
  );

  const bom = '\uFEFF';
  const blob = new Blob([bom + lines.join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `PRUF_${doc.tab.replace(/[^a-zA-Z0-9]/g, '_')}_${getWibDateKey()}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
