import { supabase } from './supabase';
import { getAnonId } from './anonId';

/** Wraps a value for a CSV cell — quotes and escapes only when necessary. */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(','), ...rows.map((row) => headers.map((h) => csvCell(row[h])).join(','))];
  return lines.join('\n');
}

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports every one of the owner's own rows across the four core tables as
 * one plain-text file — a single combined download (not four separate
 * files) so there's exactly one thing to save and keep, with a clear
 * section header per table. Excludes soft-deleted rows, same as every
 * other view in the app. This is a straightforward client-side pull and
 * CSV-style format, not a new backend export service.
 */
export async function exportAllData(): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured — check VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.');

  const anonId = getAnonId();

  const [txRes, debtRes, invRes, itemRes] = await Promise.all([
    supabase.from('transactions').select('*').is('deleted_at', null).order('created_at', { ascending: true }),
    supabase.from('debts').select('*').eq('anon_id', anonId).is('deleted_at', null).order('created_at', { ascending: true }),
    supabase.from('invoices').select('*').eq('anon_id', anonId).is('deleted_at', null).order('created_at', { ascending: true }),
    supabase.from('inventory_items').select('*').eq('anon_id', anonId).is('deleted_at', null).order('item_name', { ascending: true }),
  ]);

  for (const res of [txRes, debtRes, invRes, itemRes]) {
    if (res.error) throw res.error;
  }

  const sections: { title: string; rows: Record<string, unknown>[] }[] = [
    { title: 'TRANSACTIONS', rows: txRes.data ?? [] },
    { title: 'DEBTORS & CREDITORS', rows: debtRes.data ?? [] },
    { title: 'INVOICES', rows: invRes.data ?? [] },
    { title: 'INVENTORY', rows: itemRes.data ?? [] },
  ];

  const content = sections
    .map(({ title, rows }) => `# ${title}\n${rows.length > 0 ? toCsv(rows) : '(none)'}`)
    .join('\n\n');

  const dateStamp = new Date().toISOString().slice(0, 10);
  downloadFile(`vanta-data-export-${dateStamp}.csv`, content, 'text/csv;charset=utf-8;');
}
