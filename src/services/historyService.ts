import type {
  PrufChangeHistoryEntry,
  PrufDocument,
  PrufHistoryKind,
  PrufRow,
} from '../types/tsc';
import {getWibDateKey, roundPct} from '../utils/formatters';

export interface NumberedNotePair {
  ref: string; // e.g. 'Catatan 1'
  num: string; // e.g. '1'
  text: string; // e.g. '1. Jika stok Besuki 2024 (ZN) habis, beralih menggunakan Besuki 2025 (ZN)'
  row?: PrufRow;
}

function normalizeMaterialKey(name: string): string {
  return name.toLowerCase().replace(/\s+/g, ' ').trim();
}

function extractNoteNumber(raw: string): string | null {
  const m = /\bcatatan\s*(\d+)\b/i.exec(raw);
  if (m?.[1]) return m[1];
  const lineM = /^(\d+)\s*[.)]\s+/.exec(raw.trim());
  if (lineM?.[1]) return lineM[1];
  return null;
}

/**
 * Extracts active Catatan 1, Catatan 2 markers from Column M and pairs them
 * with numbered footer explanation lines (B81:N85 below "Catatan :").
 */
export function extractDocumentNotes(doc: PrufDocument): NumberedNotePair[] {
  const lines = doc.catatanLines && doc.catatanLines.length > 0
    ? doc.catatanLines
    : doc.catatan
    ? doc.catatan
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const explanationByNum = new Map<string, string>();
  const unmatchedLines: string[] = [];

  for (const line of lines) {
    const num = extractNoteNumber(line);
    if (num) {
      explanationByNum.set(num, line);
    } else if (line && line !== '-') {
      unmatchedLines.push(line);
    }
  }

  const pairs: NumberedNotePair[] = [];
  const usedNums = new Set<string>();

  for (const row of doc.rows) {
    if (!row.keterangan) continue;
    if (!/catatan/i.test(row.keterangan)) continue;
    const num = extractNoteNumber(row.keterangan);
    const ref = num ? `Catatan ${num}` : row.keterangan.trim();
    const explanation = num
      ? explanationByNum.get(num) || `${row.keterangan.trim()} (kolom Keterangan)`
      : row.keterangan.trim();
    if (num) usedNums.add(num);
    pairs.push({
      ref,
      num: num || '',
      text: explanation,
      row,
    });
  }

  // Also capture numbered lines below "Catatan :" even if Column M was cleared/omitted
  for (const [num, text] of explanationByNum.entries()) {
    if (!usedNums.has(num)) {
      pairs.push({
        ref: `Catatan ${num}`,
        num,
        text,
      });
    }
  }

  if (pairs.length === 0 && unmatchedLines.length > 0) {
    unmatchedLines.forEach((line, idx) => {
      pairs.push({
        ref: `Catatan ${idx + 1}`,
        num: String(idx + 1),
        text: line,
      });
    });
  }

  return pairs;
}

function buildDocSnapshotContext(doc: PrufDocument) {
  return {
    tab: doc.tab,
    namaTbkBlend: doc.namaTbkBlend || doc.tab,
    peruntukanMerk: doc.peruntukanMerk || '-',
    noDokumen: doc.noDokumen || '-',
    periodePruf: doc.periodePruf || doc.tglBlend || '-',
  };
}

function makeDeterministicId(parts: string[]): string {
  const raw = parts.join('|').toLowerCase().replace(/[^a-z0-9|_-]+/g, '_');
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash * 31 + raw.charCodeAt(i)) | 0;
  }
  return `hist-${Math.abs(hash).toString(36)}-${raw.slice(0, 32)}`;
}

/**
 * Compares prevDoc -> nextDoc (after Google Sheets sync) and captures:
 * 1) Active Catatan 1, Catatan 2 (Column M + B81:N85) tied to Blend & Peruntukan Merk
 * 2) Executed Ingredient Replacements (GANTI_BAHAN), Percentage Changes (UBAH_PERSENTASE),
 *    Added/Removed rows, and cleared/executed Catatan (EKSEKUSI_CATATAN).
 */
export function detectSyncHistoryEntries(
  prevDoc: PrufDocument,
  nextDoc: PrufDocument,
  actor = 'Sync Google Sheets'
): PrufChangeHistoryEntry[] {
  const created: PrufChangeHistoryEntry[] = [];
  const nowIso = new Date().toISOString();
  const ctx = buildDocSnapshotContext(nextDoc);

  const nextNotes = extractDocumentNotes(nextDoc);
  const prevHasRows = prevDoc.rows.length > 0;
  const prevNotes = prevHasRows ? extractDocumentNotes(prevDoc) : [];

  // 1. Always capture active Catatan 1, 2... (Column M + B81:N85) for the current document period
  for (const n of nextNotes) {
    const bahanName = n.row?.rincian || '';
    const periodKey = nextDoc.noDokumen || nextDoc.periodePruf || getWibDateKey();
    const id = makeDeterministicId([
      'note',
      ctx.tab,
      periodKey,
      n.ref,
      bahanName,
      n.text,
    ]);
    created.push({
      id,
      timestamp: nowIso,
      ...ctx,
      jenisPerubahan: 'CATATAN_AKTIF',
      status: 'Rencana (Catatan Aktif)',
      group: n.row?.group || 'CATATAN SHEET',
      bahanLama: bahanName,
      bahanBaru: '',
      pctLama: n.row ? n.row.pct : null,
      pctBaru: null,
      deltaPct: null,
      catatanRef: n.ref,
      faktorAlasan: n.text,
      sumber: 'Google Sheets',
      oleh: actor,
    });
  }

  // If this is the very first sync on a clean/empty cache, only archive active Catatan above
  if (!prevHasRows || nextDoc.rows.length === 0) {
    return created;
  }

  const periodOrVersion =
    nextDoc.noDokumen !== prevDoc.noDokumen && nextDoc.noDokumen
      ? `${prevDoc.noDokumen || 'prev'}->${nextDoc.noDokumen}`
      : `${getWibDateKey()}-${nextDoc.periodePruf || 'sync'}`;

  const prevByKey = new Map<string, PrufRow>();
  for (const r of prevDoc.rows) {
    if (r.pct > 0) prevByKey.set(normalizeMaterialKey(r.rincian), r);
  }

  const nextByKey = new Map<string, PrufRow>();
  for (const r of nextDoc.rows) {
    if (r.pct > 0) nextByKey.set(normalizeMaterialKey(r.rincian), r);
  }

  const removedRows: PrufRow[] = [];
  const addedRows: PrufRow[] = [];
  const consumedPrevNoteRefs = new Set<string>();

  const findPrevNoteForRow = (row: PrufRow): NumberedNotePair | undefined => {
    return prevNotes.find(
      (n) =>
        (n.row && normalizeMaterialKey(n.row.rincian) === normalizeMaterialKey(row.rincian)) ||
        n.text.toLowerCase().includes(row.rincian.toLowerCase())
    );
  };

  // 2. Detect % changes on surviving ingredients + collect added/removed
  for (const [key, prevRow] of prevByKey.entries()) {
    const nextRow = nextByKey.get(key);
    if (!nextRow) {
      removedRows.push(prevRow);
      continue;
    }

    const delta = roundPct(nextRow.pct - prevRow.pct);
    if (Math.abs(delta) >= 0.01) {
      const matchedPrevNote = prevNotes.find((n) =>
        n.text.toLowerCase().includes(nextRow.rincian.toLowerCase())
      );
      if (matchedPrevNote) consumedPrevNoteRefs.add(matchedPrevNote.ref);

      created.push({
        id: makeDeterministicId([
          'pct',
          ctx.tab,
          periodOrVersion,
          nextRow.rincian,
          String(prevRow.pct),
          String(nextRow.pct),
        ]),
        timestamp: nowIso,
        ...ctx,
        jenisPerubahan: 'UBAH_PERSENTASE',
        status: 'Sudah Dieksekusi',
        group: nextRow.group,
        bahanLama: prevRow.rincian,
        bahanBaru: nextRow.rincian,
        pctLama: prevRow.pct,
        pctBaru: nextRow.pct,
        deltaPct: delta,
        catatanRef: matchedPrevNote?.ref || '',
        faktorAlasan: matchedPrevNote
          ? `Eksekusi ${matchedPrevNote.ref}: ${matchedPrevNote.text}`
          : 'Penyesuaian persentase pemakaian bahan / rasa',
        sumber: 'Google Sheets',
        oleh: actor,
      });
    }
  }

  for (const [key, nextRow] of nextByKey.entries()) {
    if (!prevByKey.has(key)) {
      addedRows.push(nextRow);
    }
  }

  // 3. Pair removed + added ingredients into GANTI_BAHAN
  // Priority 1: Match explicitly via archived Catatan text (e.g. Besuki 2024 -> Besuki 2025)
  const matchedRemovedIds = new Set<string>();
  const matchedAddedIds = new Set<string>();

  for (const rem of removedRows) {
    const prevNote = findPrevNoteForRow(rem);
    if (!prevNote) continue;

    // Look for an added row whose name is mentioned in the Catatan text
    let candidate = addedRows.find(
      (add) =>
        !matchedAddedIds.has(add.id) &&
        prevNote.text.toLowerCase().includes(add.rincian.toLowerCase())
    );
    if (!candidate) {
      candidate = addedRows.find(
        (add) => !matchedAddedIds.has(add.id) && add.group === rem.group
      );
    }

    if (candidate) {
      matchedRemovedIds.add(rem.id);
      matchedAddedIds.add(candidate.id);
      consumedPrevNoteRefs.add(prevNote.ref);

      created.push({
        id: makeDeterministicId([
          'replace',
          ctx.tab,
          periodOrVersion,
          rem.rincian,
          candidate.rincian,
        ]),
        timestamp: nowIso,
        ...ctx,
        jenisPerubahan: 'GANTI_BAHAN',
        status: 'Sudah Dieksekusi',
        group: candidate.group,
        bahanLama: rem.rincian,
        bahanBaru: candidate.rincian,
        pctLama: rem.pct,
        pctBaru: candidate.pct,
        deltaPct: roundPct(candidate.pct - rem.pct),
        catatanRef: prevNote.ref,
        faktorAlasan: `Eksekusi ${prevNote.ref}: ${prevNote.text}`,
        sumber: 'Google Sheets',
        oleh: actor,
      });
    }
  }

  // Priority 2: Pair remaining removed & added rows 1-to-1 within the same GROUP
  for (const rem of removedRows) {
    if (matchedRemovedIds.has(rem.id)) continue;
    const sameGroupAdd = addedRows.find(
      (add) => !matchedAddedIds.has(add.id) && add.group === rem.group
    );
    if (sameGroupAdd) {
      matchedRemovedIds.add(rem.id);
      matchedAddedIds.add(sameGroupAdd.id);
      const prevNote = findPrevNoteForRow(rem);
      if (prevNote) consumedPrevNoteRefs.add(prevNote.ref);

      created.push({
        id: makeDeterministicId([
          'replace',
          ctx.tab,
          periodOrVersion,
          rem.rincian,
          sameGroupAdd.rincian,
        ]),
        timestamp: nowIso,
        ...ctx,
        jenisPerubahan: 'GANTI_BAHAN',
        status: 'Sudah Dieksekusi',
        group: sameGroupAdd.group,
        bahanLama: rem.rincian,
        bahanBaru: sameGroupAdd.rincian,
        pctLama: rem.pct,
        pctBaru: sameGroupAdd.pct,
        deltaPct: roundPct(sameGroupAdd.pct - rem.pct),
        catatanRef: prevNote?.ref || '',
        faktorAlasan: prevNote
          ? `Eksekusi ${prevNote.ref}: ${prevNote.text}`
          : 'Penggantian bahan baku pada grup yang sama',
        sumber: 'Google Sheets',
        oleh: actor,
      });
    }
  }

  // Remaining unmatched removed -> HAPUS_BAHAN
  for (const rem of removedRows) {
    if (matchedRemovedIds.has(rem.id)) continue;
    const prevNote = findPrevNoteForRow(rem);
    if (prevNote) consumedPrevNoteRefs.add(prevNote.ref);

    created.push({
      id: makeDeterministicId([
        'remove',
        ctx.tab,
        periodOrVersion,
        rem.rincian,
      ]),
      timestamp: nowIso,
      ...ctx,
      jenisPerubahan: 'HAPUS_BAHAN',
      status: 'Sudah Dieksekusi',
      group: rem.group,
      bahanLama: rem.rincian,
      bahanBaru: '',
      pctLama: rem.pct,
      pctBaru: 0,
      deltaPct: roundPct(-rem.pct),
      catatanRef: prevNote?.ref || '',
      faktorAlasan: prevNote
        ? `Eksekusi ${prevNote.ref}: ${prevNote.text}`
        : 'Bahan dihentikan / stok tidak aktif di Kolom G',
      sumber: 'Google Sheets',
      oleh: actor,
    });
  }

  // Remaining unmatched added -> TAMBAH_BAHAN
  for (const add of addedRows) {
    if (matchedAddedIds.has(add.id)) continue;
    created.push({
      id: makeDeterministicId([
        'add',
        ctx.tab,
        periodOrVersion,
        add.rincian,
      ]),
      timestamp: nowIso,
      ...ctx,
      jenisPerubahan: 'TAMBAH_BAHAN',
      status: 'Sudah Dieksekusi',
      group: add.group,
      bahanLama: '',
      bahanBaru: add.rincian,
      pctLama: 0,
      pctBaru: add.pct,
      deltaPct: add.pct,
      catatanRef: '',
      faktorAlasan: 'Penambahan bahan baru pada komposisi PRUF',
      sumber: 'Google Sheets',
      oleh: actor,
    });
  }

  // 4. Record any previous Catatan that was cleared/executed without leaving a separate record yet
  const nextNoteKeys = new Set(nextNotes.map((n) => `${n.ref}::${n.text}`));
  for (const pn of prevNotes) {
    if (consumedPrevNoteRefs.has(pn.ref)) continue;
    const key = `${pn.ref}::${pn.text}`;
    if (!nextNoteKeys.has(key)) {
      created.push({
        id: makeDeterministicId([
          'execnote',
          ctx.tab,
          periodOrVersion,
          pn.ref,
          pn.text,
        ]),
        timestamp: nowIso,
        ...ctx,
        jenisPerubahan: 'EKSEKUSI_CATATAN',
        status: 'Sudah Dieksekusi',
        group: pn.row?.group || 'CATATAN SHEET',
        bahanLama: pn.row?.rincian || '',
        bahanBaru: '',
        pctLama: pn.row ? pn.row.pct : null,
        pctBaru: null,
        deltaPct: null,
        catatanRef: pn.ref,
        faktorAlasan: `${pn.text} (catatan telah dieksekusi & dibersihkan dari sheet)`,
        sumber: 'Google Sheets',
        oleh: actor,
      });
    }
  }

  return created;
}

export function createManualHistoryEntry(params: {
  doc: PrufDocument;
  prevRow?: PrufRow | null;
  nextRow?: PrufRow | null;
  jenisPerubahan: PrufHistoryKind;
  faktorAlasan: string;
  catatanRef?: string;
  actor: string;
}): PrufChangeHistoryEntry {
  const {doc, prevRow, nextRow, jenisPerubahan, faktorAlasan, catatanRef, actor} =
    params;
  const ctx = buildDocSnapshotContext(doc);
  const pctLama = prevRow ? prevRow.pct : 0;
  const pctBaru = nextRow ? nextRow.pct : 0;
  const deltaPct = roundPct(pctBaru - pctLama);

  return {
    id: `hist-app-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...ctx,
    jenisPerubahan,
    status:
      jenisPerubahan === 'CATATAN_AKTIF'
        ? 'Rencana (Catatan Aktif)'
        : 'Sudah Dieksekusi',
    group: nextRow?.group || prevRow?.group || 'GROUP 1',
    bahanLama: prevRow?.rincian || '',
    bahanBaru: nextRow?.rincian || '',
    pctLama: prevRow ? prevRow.pct : null,
    pctBaru: nextRow ? nextRow.pct : null,
    deltaPct,
    catatanRef: catatanRef || '',
    faktorAlasan: faktorAlasan.trim() || 'Pembaruan komposisi dari Web App',
    sumber: 'Web App',
    oleh: actor,
  };
}

export function mergeHistoryEntries(
  incoming: PrufChangeHistoryEntry[],
  existing: PrufChangeHistoryEntry[]
): PrufChangeHistoryEntry[] {
  const byId = new Map<string, PrufChangeHistoryEntry>();

  const ingest = (list: PrufChangeHistoryEntry[]) => {
    for (const item of list) {
      if (!item || !item.id) continue;
      const cur = byId.get(item.id);
      if (!cur) {
        byId.set(item.id, item);
      } else if (
        item.status === 'Sudah Dieksekusi' &&
        cur.status !== 'Sudah Dieksekusi'
      ) {
        byId.set(item.id, item);
      }
    }
  };

  ingest(existing);
  ingest(incoming);

  return Array.from(byId.values())
    .sort((a, b) => {
      const ta = Date.parse(a.timestamp) || 0;
      const tb = Date.parse(b.timestamp) || 0;
      return tb - ta;
    })
    .slice(0, 500);
}

export function downloadHistoryCsv(entries: PrufChangeHistoryEntry[]): void {
  const header = [
    'ID',
    'Waktu (WIB / ISO)',
    'Tab PRUF',
    'Nama Tbk Blend',
    'Peruntukan Merk',
    'No Dokumen',
    'Periode PRUF',
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
    'Oleh',
  ].join(';');

  const lines = [header];
  for (const e of entries) {
    const cols = [
      e.id,
      e.timestamp,
      e.tab,
      e.namaTbkBlend,
      e.peruntukanMerk,
      e.noDokumen,
      e.periodePruf,
      e.jenisPerubahan,
      e.status,
      e.group,
      e.bahanLama || '-',
      e.bahanBaru || '-',
      e.pctLama !== null ? e.pctLama.toFixed(2).replace('.', ',') : '-',
      e.pctBaru !== null ? e.pctBaru.toFixed(2).replace('.', ',') : '-',
      e.deltaPct !== null ? e.deltaPct.toFixed(2).replace('.', ',') : '-',
      e.catatanRef || '-',
      e.faktorAlasan || '-',
      e.sumber,
      e.oleh,
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
    lines.push(cols.join(';'));
  }

  const bom = '\uFEFF';
  const blob = new Blob([bom + lines.join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `RIWAYAT_PRUF_TSC_${getWibDateKey()}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
