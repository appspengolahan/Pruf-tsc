import type {PrufDocument, PrufGroupKey, PrufRow} from '../types/tsc';

// Singleton NumberFormat instances (avoid instantiating Intl in data loops)
const ONE_DECIMAL_FORMATTER = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const TWO_DECIMAL_FORMATTER = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const INT_NUMBER_FORMATTER = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const MONTHS_SHORT_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
] as const;

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

export function roundOneDec(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 10) / 10;
}

export function roundKg(value: number): number {
  return roundOneDec(value);
}

export function roundPct(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

export function formatKg(value: number, withUnit = true): string {
  const formatted = ONE_DECIMAL_FORMATTER.format(roundOneDec(value));
  return withUnit ? `${formatted} Kg` : formatted;
}

export function formatGr(value: number, withUnit = true): string {
  const formatted = ONE_DECIMAL_FORMATTER.format(roundOneDec(value));
  return withUnit ? `${formatted} Gr` : formatted;
}

export function formatPct(value: number, withSymbol = true): string {
  const formatted = TWO_DECIMAL_FORMATTER.format(roundPct(value));
  return withSymbol ? `${formatted}%` : formatted;
}

export function formatInt(value: number): string {
  return INT_NUMBER_FORMATTER.format(Math.round(Number.isFinite(value) ? value : 0));
}

export function calcRowGr(pct: number, baseGr = 1000): number {
  return roundOneDec((roundPct(pct) / 100) * baseGr);
}

export function calcRowKg(pct: number, targetKg: number): number {
  return roundOneDec((roundPct(pct) / 100) * targetKg);
}

export function parseLocaleNumber(raw: string | number | null | undefined): number {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : 0;
  if (!raw) return 0;
  const cleaned = String(raw)
    .replace(/kg|gr|%/gi, '')
    .trim();
  if (!cleaned) return 0;

  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');
  let normalized = cleaned;
  if (hasComma && hasDot) {
    if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      normalized = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      normalized = cleaned.replace(/,/g, '');
    }
  } else if (hasComma) {
    normalized = cleaned.replace(',', '.');
  }
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export const TOBACCO_GROUPS: PrufGroupKey[] = [
  'GROUP 1',
  'GROUP 2',
  'GROUP 3',
  'GROUP 4',
  'GROUP 5',
  'GROUP 6',
];

export interface PrufTotalsSummary {
  groupTotals: Record<
    PrufGroupKey,
    {pct: number; gr: number; kg: number; count: number}
  >;
  tobaccoPct: number;
  tobaccoGr: number;
  tobaccoKg: number;
  tobaccoCount: number;
  saosPct: number;
  saosGr: number;
  saosKg: number;
  refreshPct: number;
  refreshGr: number;
  refreshKg: number;
  refreshCount: number;
  cengkehPct: number;
  cengkehGr: number;
  cengkehKg: number;
  cengkehCount: number;
  grandPct: number;
  grandGr: number;
  grandKg: number;
  verifiedCount: number;
  totalRows: number;
  verifiedPct: number;
}

export function computePrufTotals(doc: PrufDocument): PrufTotalsSummary {
  const emptyEntry = () => ({pct: 0, gr: 0, kg: 0, count: 0});
  const groupTotals: Record<
    PrufGroupKey,
    {pct: number; gr: number; kg: number; count: number}
  > = {
    'GROUP 1': emptyEntry(),
    'GROUP 2': emptyEntry(),
    'GROUP 3': emptyEntry(),
    'GROUP 4': emptyEntry(),
    'GROUP 5': emptyEntry(),
    'GROUP 6': emptyEntry(),
    SAOS: emptyEntry(),
    REFRESH: emptyEntry(),
    CENGKEH: emptyEntry(),
  };

  let verifiedCount = 0;

  for (const row of doc.rows) {
    if (row.pct <= 0) continue;
    const gr = calcRowGr(row.pct, doc.baseGr);
    if (gr <= 0) continue;
    const target = groupTotals[row.group];
    const kg = calcRowKg(row.pct, doc.targetKg);
    target.pct = roundPct(target.pct + row.pct);
    target.gr = roundOneDec(target.gr + gr);
    target.kg = roundOneDec(target.kg + kg);
    target.count += 1;
    if (row.verified) verifiedCount += 1;
  }

  const tobaccoPct = roundPct(
    TOBACCO_GROUPS.reduce((acc, g) => acc + groupTotals[g].pct, 0)
  );
  const tobaccoGr = roundOneDec(
    TOBACCO_GROUPS.reduce((acc, g) => acc + groupTotals[g].gr, 0)
  );
  const tobaccoKg = roundOneDec(
    TOBACCO_GROUPS.reduce((acc, g) => acc + groupTotals[g].kg, 0)
  );
  const tobaccoCount = TOBACCO_GROUPS.reduce(
    (acc, g) => acc + groupTotals[g].count,
    0
  );

  const saosPct = groupTotals.SAOS.pct;
  const saosGr = groupTotals.SAOS.gr;
  const saosKg = groupTotals.SAOS.kg;

  const refreshPct = groupTotals.REFRESH.pct;
  const refreshGr = groupTotals.REFRESH.gr;
  const refreshKg = groupTotals.REFRESH.kg;
  const refreshCount = groupTotals.REFRESH.count;

  const cengkehPct = groupTotals.CENGKEH.pct;
  const cengkehGr = groupTotals.CENGKEH.gr;
  const cengkehKg = groupTotals.CENGKEH.kg;
  const cengkehCount = groupTotals.CENGKEH.count;

  const grandPct = roundPct(tobaccoPct + saosPct + refreshPct + cengkehPct);
  const grandGr = roundOneDec(tobaccoGr + saosGr + refreshGr + cengkehGr);
  const grandKg = roundOneDec(tobaccoKg + saosKg + refreshKg + cengkehKg);

  const totalRows = doc.rows.length;
  const verifiedPct = totalRows > 0 ? roundPct((verifiedCount / totalRows) * 100) : 0;

  return {
    groupTotals,
    tobaccoPct,
    tobaccoGr,
    tobaccoKg,
    tobaccoCount,
    saosPct,
    saosGr,
    saosKg,
    refreshPct,
    refreshGr,
    refreshKg,
    refreshCount,
    cengkehPct,
    cengkehGr,
    cengkehKg,
    cengkehCount,
    grandPct,
    grandGr,
    grandKg,
    verifiedCount,
    totalRows,
    verifiedPct,
  };
}

/**
 * Pure UTC+7 arithmetic for YYYY-MM-DD in WIB without Intl.DateTimeFormat overhead.
 */
export function getWibDateKey(input?: Date | number | string): string {
  let ms: number;
  if (typeof input === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(input.trim())) {
      return input.trim();
    }
    const parsed = Date.parse(input);
    ms = Number.isFinite(parsed) ? parsed : Date.now();
  } else if (typeof input === 'number') {
    ms = Number.isFinite(input) ? input : Date.now();
  } else if (input instanceof Date) {
    ms = input.getTime();
  } else {
    ms = Date.now();
  }

  const wib = new Date(ms + WIB_OFFSET_MS);
  const y = wib.getUTCFullYear();
  const m = String(wib.getUTCMonth() + 1).padStart(2, '0');
  const d = String(wib.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatWibDateTime(input?: Date | number | string | null): string {
  if (!input) return '-';
  let ms: number;
  if (typeof input === 'string') {
    const parsed = Date.parse(input);
    if (!Number.isFinite(parsed)) return input;
    ms = parsed;
  } else if (typeof input === 'number') {
    ms = input;
  } else {
    ms = input.getTime();
  }
  const wib = new Date(ms + WIB_OFFSET_MS);
  const d = String(wib.getUTCDate()).padStart(2, '0');
  const mon = MONTHS_SHORT_ID[wib.getUTCMonth()] ?? 'Jan';
  const y = wib.getUTCFullYear();
  const hh = String(wib.getUTCHours()).padStart(2, '0');
  const mm = String(wib.getUTCMinutes()).padStart(2, '0');
  return `${d} ${mon} ${y}, ${hh}:${mm} WIB`;
}

/**
 * Generates Indonesian-locale Google Sheets formulas using semicolon (;) separator.
 */
export function buildIndoGrFormula(pctCell: string, baseGrCell: string): string {
  return `=ROUND((${pctCell}/100)*${baseGrCell}; 1)`;
}

export function buildIndoKgFormula(pctCell: string, targetKgCell: string): string {
  return `=ROUND((${pctCell}/100)*${targetKgCell}; 1)`;
}

export function buildIndoSumFormula(range: string, decimals = 1): string {
  return `=ROUND(SUM(${range}); ${decimals})`;
}

export function countVerifiedByGroup(
  rows: PrufRow[],
  group: PrufGroupKey
): {verified: number; total: number} {
  let verified = 0;
  let total = 0;
  for (const r of rows) {
    if (r.group === group) {
      total++;
      if (r.verified) verified++;
    }
  }
  return {verified, total};
}

/**
 * Converts any Google Drive share/view/open URL (or raw Drive file ID)
 * into a direct download URL: https://drive.google.com/uc?export=download&id=<ID>
 */
export function toGoogleDriveDownloadUrl(rawInput: string): string {
  const trimmed = rawInput.trim();
  if (!trimmed) return '';

  // Already a direct uc?export=download or usercontent download link with id
  if (/drive(?:\.usercontent)?\.google\.com\/(?:uc|download)\?/i.test(trimmed)) {
    const idMatch = /[?&]id=([a-zA-Z0-9_-]+)/.exec(trimmed);
    if (idMatch?.[1]) {
      return `https://drive.google.com/uc?export=download&id=${idMatch[1]}`;
    }
  }

  // Standard Drive /file/d/<ID>/view or /file/u/0/d/<ID>/view
  const fileDMatch = /drive\.google\.com\/file\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]+)/i.exec(
    trimmed
  );
  if (fileDMatch?.[1]) {
    return `https://drive.google.com/uc?export=download&id=${fileDMatch[1]}`;
  }

  // Drive /open?id=<ID>
  const openIdMatch = /drive\.google\.com\/open\?.*id=([a-zA-Z0-9_-]+)/i.exec(
    trimmed
  );
  if (openIdMatch?.[1]) {
    return `https://drive.google.com/uc?export=download&id=${openIdMatch[1]}`;
  }

  // Google Docs/Sheets/Slides link -> PDF export URL
  const docsMatch =
    /docs\.google\.com\/(document|spreadsheets|presentation)\/d\/([a-zA-Z0-9_-]+)/i.exec(
      trimmed
    );
  if (docsMatch?.[1] && docsMatch?.[2]) {
    return `https://docs.google.com/${docsMatch[1]}/d/${docsMatch[2]}/export?format=pdf`;
  }

  // Raw Drive file ID pasted directly
  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) {
    return `https://drive.google.com/uc?export=download&id=${trimmed}`;
  }

  return trimmed;
}

/**
 * Triggers direct file download without opening a preview tab or window.open.
 */
export function triggerDirectFileDownload(
  rawUrl: string,
  filename = 'PRUF.pdf'
): boolean {
  const downloadUrl = toGoogleDriveDownloadUrl(rawUrl);
  if (!downloadUrl) return false;

  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.setAttribute('download', filename);
  anchor.rel = 'noopener noreferrer';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  window.setTimeout(() => {
    if (anchor.parentNode) {
      anchor.parentNode.removeChild(anchor);
    }
  }, 150);
  return true;
}

