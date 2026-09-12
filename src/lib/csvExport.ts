/**
 * Standardized RFC-4180 CSV Export Utility
 */

export interface CSVColumn<T = any> {
  header: string;
  key: keyof T | string;
  format?: (value: any, row: T) => string | number;
}

export function exportToCSV<T = any>(
  filename: string,
  columns: CSVColumn<T>[],
  data: T[],
  metadata?: {
    companyName?: string;
    reportTitle?: string;
    generatedAt?: string;
  }
) {
  const rows: string[] = [];

  // Optional enterprise metadata header
  if (metadata?.companyName) {
    rows.push(`"Entity: ${metadata.companyName.replace(/"/g, '""')}"`);
  }
  if (metadata?.reportTitle) {
    rows.push(`"Report: ${metadata.reportTitle.replace(/"/g, '""')}"`);
  }
  if (metadata?.generatedAt) {
    rows.push(`"Generated: ${metadata.generatedAt.replace(/"/g, '""')}"`);
  }
  if (metadata?.companyName || metadata?.reportTitle) {
    rows.push(''); // Blank separator row
  }

  // Header row
  const headerLine = columns
    .map((col) => `"${String(col.header).replace(/"/g, '""')}"`)
    .join(',');
  rows.push(headerLine);

  // Data rows
  data.forEach((row) => {
    const line = columns
      .map((col) => {
        let val: any;
        if (typeof col.key === 'string' && col.key.includes('.')) {
          const parts = col.key.split('.');
          val = parts.reduce((acc: any, part) => acc?.[part], row);
        } else {
          val = (row as any)[col.key];
        }

        if (col.format) {
          val = col.format(val, row);
        }

        if (val === null || val === undefined) {
          return '""';
        }

        const stringVal = String(val).replace(/"/g, '""');
        return `"${stringVal}"`;
      })
      .join(',');
    rows.push(line);
  });

  const csvContent = '\uFEFF' + rows.join('\r\n'); // Include UTF-8 BOM for Excel compatibility
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
