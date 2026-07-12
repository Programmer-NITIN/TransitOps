/**
 * Export tabular data as a downloadable CSV file.
 * @param {string} filename - Name of the downloaded file (e.g. "fleet-report.csv")
 * @param {string[]} headers - Column headers
 * @param {Array<object>} rows - Array of row objects
 * @param {string[]} keys - Keys to extract from each row (same order as headers)
 */
export function exportToCsv(filename, headers, rows, keys) {
  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    // Wrap in quotes if contains comma, newline, or quote
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = [
    headers.map(escape).join(','),
    ...rows.map((row) => keys.map((key) => escape(row[key])).join(',')),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
