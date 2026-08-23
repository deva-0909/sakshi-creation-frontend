// Module 13: client-side CSV export shared by every list page's BasicTable.
// Generates a CSV from the same columns/values already shown in the table
// (no new backend endpoints — exports whatever rows are currently loaded
// into that page's Redux state, after any active search/date/filter).

export interface CsvColumn<T> {
  id: string;
  label: string;
  value: (row: T) => string | number | null | undefined;
}

const escapeCsvValue = (val: unknown): string => {
  const str = val === null || val === undefined ? "" : String(val);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export function buildCsv<T>(columns: CsvColumn<T>[], rows: T[]): string {
  const header = columns.map((c) => escapeCsvValue(c.label)).join(",");
  const lines = rows.map((row) => columns.map((c) => escapeCsvValue(c.value(row))).join(","));
  return [header, ...lines].join("\r\n");
}

export function downloadCsvString(filename: string, csvContent: string): void {
  const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.toLowerCase().endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export function exportRowsToCsv<T>(filename: string, columns: CsvColumn<T>[], rows: T[]): void {
  downloadCsvString(filename, buildCsv(columns, rows));
}
