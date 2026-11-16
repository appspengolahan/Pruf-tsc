import {jsPDF} from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {PrufDocument, PrufGroupKey, RBACUser} from '../types/tsc';
import {
  calcRowGr,
  calcRowKg,
  computePrufTotals,
  formatGr,
  formatKg,
  formatPct,
  formatWibDateTime,
  getWibDateKey,
  TOBACCO_GROUPS,
} from '../utils/formatters';

const REQUIRED_PDF_FOOTER = 'Divisi Produksi I - All Rights Reserved';

export function exportPrufPdf(docData: PrufDocument, currentUser: RBACUser): void {
  const doc = new jsPDF({orientation: 'portrait', unit: 'mm', format: 'a4'});
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const totals = computePrufTotals(docData);

  // Title Block matching authentic KETETAPAN PRUF layout
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.text(
    docData.judulUtama || 'KETETAPAN PRUF TEMBAKAU BLEND JENIS SKT ( LOW FLAVOUR )',
    pageWidth / 2,
    12,
    {align: 'center'}
  );

  doc.setFontSize(10.5);
  doc.text(
    `NAMA TBK. BLEND : ${docData.namaTbkBlend || docData.tab}`,
    pageWidth / 2,
    17.5,
    {align: 'center'}
  );

  if (docData.noDokumen) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`No : ${docData.noDokumen}`, pageWidth / 2, 22, {align: 'center'});
  }

  // 2x2 Document Metadata Block
  doc.setFontSize(8);
  doc.text(`1. Pelaksanaan Pruf`, 12, 28);
  doc.text(`: ${docData.pelaksanaanPruf}`, 44, 28);
  doc.text(`3. Tgl Blend`, 108, 28);
  doc.text(`: ${docData.tglBlend}`, 136, 28);

  doc.text(`2. Periode Pruf`, 12, 32.5);
  doc.text(`: ${docData.periodePruf}`, 44, 32.5);
  doc.text(`4. Peruntukan Merk`, 108, 32.5);
  const merkLines = doc.splitTextToSize(`: ${docData.peruntukanMerk}`, pageWidth - 148);
  doc.text(merkLines, 136, 32.5);

  const startY = 34 + Math.max(1, merkLines.length) * 3.8;

  // Build grouped table rows matching exact PRUF layout
  type StyledRow = {
    cells: string[];
    kind: 'group' | 'item' | 'subtotal' | 'grand';
  };
  const bodyRows: StyledRow[] = [];

  const isRowActive = (r: {pct: number}) =>
    r.pct > 0 && calcRowKg(r.pct, docData.targetKg) > 0;

  const pushGroup = (g: PrufGroupKey) => {
    const gTot = totals.groupTotals[g];
    const groupRows = docData.rows.filter((r) => r.group === g && isRowActive(r));
    if (groupRows.length === 0) return;
    bodyRows.push({
      kind: 'group',
      cells: [
        `${g} (${formatPct(gTot.pct)})`,
        '',
        formatPct(gTot.pct, false),
        formatGr(gTot.gr),
        formatKg(gTot.kg),
        '',
      ],
    });
    groupRows.forEach((r) => {
      bodyRows.push({
        kind: 'item',
        cells: [
          r.rincian,
          r.kodeIntern || '',
          formatPct(r.pct, false),
          formatGr(calcRowGr(r.pct, docData.baseGr)),
          formatKg(calcRowKg(r.pct, docData.targetKg)),
          r.keterangan || '',
        ],
      });
    });
  };

  TOBACCO_GROUPS.forEach(pushGroup);

  bodyRows.push({
    kind: 'subtotal',
    cells: [
      'TOTAL TEMBAKAU',
      '',
      formatPct(totals.tobaccoPct, false),
      formatGr(totals.tobaccoGr),
      formatKg(totals.tobaccoKg),
      `${totals.tobaccoCount} JENIS TEMBAKAU`,
    ],
  });

  // SAOS CASSING & TOP JADI
  const saosRows = docData.rows.filter((r) => r.group === 'SAOS');
  if (saosRows.length > 0) {
    saosRows.forEach((r) => {
      bodyRows.push({
        kind: 'item',
        cells: [
          r.rincian,
          r.kodeIntern || '',
          formatPct(r.pct, false),
          formatGr(calcRowGr(r.pct, docData.baseGr)),
          formatKg(calcRowKg(r.pct, docData.targetKg)),
          r.keterangan || '',
        ],
      });
    });
    bodyRows.push({
      kind: 'subtotal',
      cells: [
        'Total Saos Cassing Jadi & Top Jadi',
        '',
        formatPct(totals.saosPct, false),
        formatGr(totals.saosGr),
        formatKg(totals.saosKg),
        '',
      ],
    });
  }

  // TEMBAKAU BLEND REFRESH (optional)
  const refreshRows = docData.rows.filter((r) => r.group === 'REFRESH');
  if (refreshRows.length > 0) {
    bodyRows.push({
      kind: 'group',
      cells: [
        'Tembakau Blend Refresh',
        '',
        formatPct(totals.refreshPct, false),
        '',
        '',
        '',
      ],
    });
    refreshRows.forEach((r) => {
      bodyRows.push({
        kind: 'item',
        cells: [
          r.rincian,
          r.kodeIntern || '',
          formatPct(r.pct, false),
          formatGr(calcRowGr(r.pct, docData.baseGr)),
          formatKg(calcRowKg(r.pct, docData.targetKg)),
          r.keterangan || '',
        ],
      });
    });
    bodyRows.push({
      kind: 'subtotal',
      cells: [
        'Total Tembakau Blend Refresh',
        '',
        formatPct(totals.refreshPct, false),
        formatGr(totals.refreshGr),
        formatKg(totals.refreshKg),
        '',
      ],
    });
  }

  // CENGKEH RAJANG KERING
  const cengkehRows = docData.rows.filter((r) => r.group === 'CENGKEH');
  if (cengkehRows.length > 0) {
    cengkehRows.forEach((r) => {
      bodyRows.push({
        kind: 'item',
        cells: [
          r.rincian,
          r.kodeIntern || '',
          formatPct(r.pct, false),
          formatGr(calcRowGr(r.pct, docData.baseGr)),
          formatKg(calcRowKg(r.pct, docData.targetKg)),
          r.keterangan || '',
        ],
      });
    });
    bodyRows.push({
      kind: 'subtotal',
      cells: [
        'Total Cengkeh Rajang Kering',
        '',
        formatPct(totals.cengkehPct, false),
        formatGr(totals.cengkehGr),
        formatKg(totals.cengkehKg),
        '',
      ],
    });
  }

  bodyRows.push({
    kind: 'grand',
    cells: [
      'GRAND TOTAL',
      '',
      formatPct(totals.grandPct, false),
      formatGr(totals.grandGr),
      formatKg(totals.grandKg),
      '',
    ],
  });

  autoTable(doc, {
    startY,
    head: [
      [
        'NAMA STOCK BAHAN (RINCIAN)',
        'Kode Intern',
        '%',
        `Kapasitas (${docData.baseGr} Gr)`,
        `Kapasitas (${formatKg(docData.targetKg)})`,
        'KETERANGAN',
      ],
    ],
    body: bodyRows.map((r) => r.cells),
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.2,
      cellPadding: 1.4,
      textColor: [15, 23, 42],
      lineColor: [71, 85, 105],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 7.4,
      halign: 'center',
    },
    columnStyles: {
      0: {cellWidth: 66},
      1: {cellWidth: 18, halign: 'center'},
      2: {cellWidth: 16, halign: 'right'},
      3: {cellWidth: 25, halign: 'right'},
      4: {cellWidth: 25, halign: 'right'},
      5: {cellWidth: 36, halign: 'center'},
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const meta = bodyRows[data.row.index];
        if (!meta) return;
        if (meta.kind === 'group') {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [248, 250, 252];
        } else if (meta.kind === 'subtotal' || meta.kind === 'grand') {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [241, 245, 249];
          if (data.column.index === 0) {
            data.cell.styles.halign = 'right';
          }
        }
      }
    },
    margin: {top: 14, bottom: 20, left: 12, right: 12},
  });

  // Catatan + Signature block after table
  const finalY =
    ((doc as unknown as {lastAutoTable?: {finalY?: number}}).lastAutoTable
      ?.finalY || startY + 120) + 4;

  let sigY = finalY;
  if (sigY > pageHeight - 46) {
    doc.addPage();
    sigY = 18;
  }

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`Catatan : ${docData.catatan || '-'}`, 12, sigY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  if (docData.lokasiTanggal) {
    doc.text(docData.lokasiTanggal, pageWidth / 2, sigY + 7, {align: 'center'});
  }

  doc.text('Ditetapkan,', 42, sigY + 13, {align: 'center'});
  doc.text(docData.accOperasional.jabatan, 42, sigY + 17, {align: 'center'});

  doc.text('Diketahui,', pageWidth - 42, sigY + 13, {align: 'center'});
  doc.text(docData.accDirektur.jabatan, pageWidth - 42, sigY + 17, {
    align: 'center',
  });

  if (docData.accOperasional.approved) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(5, 150, 105);
    const labelOp = /\bACC\b/i.test(docData.accOperasional.approvedAt || '')
      ? docData.accOperasional.approvedAt || ''
      : `ACC Online · ${formatWibDateTime(docData.accOperasional.approvedAt)}`;
    doc.text(labelOp, 42, sigY + 23, {align: 'center'});
  }
  if (docData.accDirektur.approved) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(5, 150, 105);
    const labelDir = /\bACC\b/i.test(docData.accDirektur.approvedAt || '')
      ? docData.accDirektur.approvedAt || ''
      : `ACC Direktur · ${formatWibDateTime(docData.accDirektur.approvedAt)}`;
    doc.text(labelDir, pageWidth - 42, sigY + 23, {align: 'center'});
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  if (docData.accOperasional.nama) {
    doc.text(`( ${docData.accOperasional.nama} )`, 42, sigY + 30, {
      align: 'center',
    });
  }
  if (docData.accDirektur.nama) {
    doc.text(`( ${docData.accDirektur.nama} )`, pageWidth - 42, sigY + 30, {
      align: 'center',
    });
  }

  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(7.5);
  doc.setTextColor(185, 28, 28);
  doc.text(
    'Pruf berlaku hanya yang telah ditandatangani.',
    pageWidth / 2,
    sigY + 36,
    {align: 'center'}
  );

  // Mandatory Footer on EVERY page
  const totalPages = doc.getNumberOfPages();
  const printedInfo = `Dicetak: ${formatWibDateTime(Date.now())} · ${currentUser.name} (${currentUser.role})`;
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(12, pageHeight - 13, pageWidth - 12, pageHeight - 13);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(REQUIRED_PDF_FOOTER, 12, pageHeight - 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`${printedInfo}  |  Hal. ${p}/${totalPages}`, pageWidth - 12, pageHeight - 8, {
      align: 'right',
    });
  }

  const safeTab = docData.tab.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`PRUF_${safeTab}_${getWibDateKey()}.pdf`);
}
