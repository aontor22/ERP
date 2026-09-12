import jsPDF from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';

export interface PDFSummaryCard {
  label: string;
  value: string;
}

export interface PDFColumn {
  header: string;
  dataKey: string;
  align?: 'left' | 'right' | 'center';
  width?: number;
}

export interface PDFExportOptions {
  title: string;
  subtitle?: string;
  companyName?: string;
  companyTaxId?: string;
  companyAddress?: string;
  filename: string;
  orientation?: 'portrait' | 'landscape';
  summaryCards?: PDFSummaryCard[];
  columns: PDFColumn[];
  data: Record<string, any>[];
  totalRow?: Record<string, any>;
  footerNotes?: string[];
  preparedBy?: string;
}

export function generateReportPDF(options: PDFExportOptions): void {
  const orientation = options.orientation || 'portrait';
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = 16;

  // 1. Company Letterhead & Document Title Header
  doc.setFillColor(30, 58, 138); // Dark Navy Blue (#1e3a8a)
  doc.rect(margin, currentY, pageWidth - margin * 2, 1.5, 'F');
  currentY += 6;

  // Company Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // Slate-900
  const company = options.companyName || 'Apex Industrial Holdings Ltd.';
  doc.text(company, margin, currentY);

  // Date & Document ID on right
  const now = new Date();
  const dateString = now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeString = now.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text(`Generated: ${dateString} ${timeString}`, pageWidth - margin, currentY, { align: 'right' });
  currentY += 4.5;

  // Company Tax ID & Address
  if (options.companyTaxId || options.companyAddress) {
    const taxInfo = [
      options.companyTaxId ? `NBR BIN: ${options.companyTaxId}` : '',
      options.companyAddress || 'Motijheel Commercial Area, Dhaka-1000, Bangladesh',
    ]
      .filter(Boolean)
      .join(' | ');

    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(taxInfo, margin, currentY);
  }

  // Prepared By on right
  if (options.preparedBy) {
    doc.text(`Sign-off: ${options.preparedBy}`, pageWidth - margin, currentY, { align: 'right' });
  }

  currentY += 7;

  // Report Title Badge
  doc.setFillColor(241, 245, 249); // Slate-100
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 14, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 58, 138); // Navy
  doc.text(options.title.toUpperCase(), margin + 4, currentY + 6);

  if (options.subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(options.subtitle, margin + 4, currentY + 11);
  }

  // Status tag
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(16, 185, 129); // Emerald
  doc.text('AUDIT-VERIFIED', pageWidth - margin - 4, currentY + 8.5, { align: 'right' });

  currentY += 18;

  // 2. Summary KPI Cards
  if (options.summaryCards && options.summaryCards.length > 0) {
    const cardCount = Math.min(options.summaryCards.length, 4);
    const availableWidth = pageWidth - margin * 2;
    const cardGap = 4;
    const cardWidth = (availableWidth - cardGap * (cardCount - 1)) / cardCount;
    const cardHeight = 14;

    options.summaryCards.slice(0, cardCount).forEach((card, index) => {
      const cardX = margin + index * (cardWidth + cardGap);
      doc.setFillColor(248, 250, 252); // Slate-50
      doc.setDrawColor(226, 232, 240); // Slate-200
      doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(card.label.toUpperCase(), cardX + 3, currentY + 4.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(card.value, cardX + 3, currentY + 10.5);
    });

    currentY += cardHeight + 6;
  }

  // 3. Format Data for Table
  const tableHead = [options.columns.map((c) => c.header)];
  const tableBody = options.data.map((row) =>
    options.columns.map((c) => {
      const val = row[c.dataKey];
      return val !== null && val !== undefined ? String(val) : '—';
    })
  );

  // Optional Totals Row
  let tableFoot: string[][] | undefined = undefined;
  if (options.totalRow) {
    tableFoot = [
      options.columns.map((c) => {
        const val = options.totalRow?.[c.dataKey];
        return val !== null && val !== undefined ? String(val) : '';
      }),
    ];
  }

  const columnStyles: Record<number, any> = {};
  options.columns.forEach((col, idx) => {
    columnStyles[idx] = {
      halign: col.align || 'left',
      cellWidth: col.width ? col.width : 'auto',
    };
  });

  // 4. Generate AutoTable
  const autoTableOptions: UserOptions = {
    startY: currentY,
    head: tableHead,
    body: tableBody,
    foot: tableFoot,
    margin: { left: margin, right: margin, bottom: 18 },
    theme: 'striped',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 2.2,
      textColor: [30, 41, 59],
      lineColor: [241, 245, 249],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [30, 58, 138], // Navy Blue
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left',
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles,
    didDrawPage: (data: any) => {
      // Running Footer on every page
      const pageNumber = data.pageNumber;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);

      // Left: Legal notice
      const legal =
        'Strictly Confidential - For internal governance & NBR Bangladesh compliance only.';
      doc.text(legal, margin, pageHeight - 8);

      // Right: Page count
      const totalPagesExp = '{total_pages_count_string}';
      const pageStr = `Page ${pageNumber} of ${totalPagesExp}`;
      doc.text(pageStr, pageWidth - margin, pageHeight - 8, { align: 'right' });
    },
  };

  autoTable(doc, autoTableOptions);

  // Replace page counts in footer
  if (typeof (doc as any).putTotalPages === 'function') {
    (doc as any).putTotalPages('{total_pages_count_string}');
  }

  // 5. Trigger download
  const cleanFilename = options.filename.endsWith('.pdf')
    ? options.filename
    : `${options.filename}.pdf`;

  doc.save(cleanFilename);
}
