import type { GeneratedBatch } from '@/types';

/** 2026-08-21T14-22-05 — sortable, filename-safe, and unique per second. */
function fileStamp(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`
  );
}

export function toPlainText(codes: string[]): string {
  return codes.join('\r\n');
}

/** RFC 4180 quoting, so codes containing a comma or quote survive the round trip. */
export function toCsv(batch: GeneratedBatch): string {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const rows = [
    ['index', 'code', 'lot', 'mode', 'generated_at'].join(','),
    ...batch.codes.map((code, i) =>
      [
        String(i + 1),
        escape(code),
        String(batch.lot),
        batch.config.mode,
        new Date(batch.timestamp).toISOString(),
      ].join(','),
    ),
  ];
  return rows.join('\r\n');
}

export type ExportFormat = 'txt' | 'csv' | 'json';

export function buildExport(batch: GeneratedBatch, format: ExportFormat): { name: string; body: string; mime: string } {
  const base = `codes-lot-${String(batch.lot).padStart(4, '0')}-${fileStamp(new Date(batch.timestamp))}`;

  switch (format) {
    case 'csv':
      return { name: `${base}.csv`, body: toCsv(batch), mime: 'text/csv;charset=utf-8' };
    case 'json':
      return {
        name: `${base}.json`,
        body: JSON.stringify({ lot: batch.lot, generatedAt: new Date(batch.timestamp).toISOString(), config: batch.config, codes: batch.codes }, null, 2),
        mime: 'application/json;charset=utf-8',
      };
    case 'txt':
    default:
      return { name: `${base}.txt`, body: toPlainText(batch.codes), mime: 'text/plain;charset=utf-8' };
  }
}

export function downloadFile(name: string, body: string, mime: string): void {
  const blob = new Blob([body], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoke on the next frame — revoking synchronously can cancel the download
  // in some browsers before it has read the blob.
  requestAnimationFrame(() => URL.revokeObjectURL(url));
}
