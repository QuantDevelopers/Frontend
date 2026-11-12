type Cell = string | number | boolean | null | undefined;

const escape = (v: Cell) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Downloads rows as a UTF-8 CSV (with BOM so Excel renders Persian correctly). */
export function downloadCsv(filename: string, headers: string[], rows: Cell[][]): void {
  const content = '﻿' + [headers, ...rows].map((r) => r.map(escape).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
