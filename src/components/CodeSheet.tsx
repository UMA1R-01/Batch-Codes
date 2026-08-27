import { useEffect, useState } from 'react';
import { Check, Copy, Download, Dices } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useClipboard } from '@/hooks/useClipboard';
import { buildExport, downloadFile, toPlainText, type ExportFormat } from '@/core/export';
import { MODE_LABEL, type GeneratedBatch } from '@/types';
import { formatTime, cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CodeSheetProps {
  batch: GeneratedBatch | null;
}

export function CodeSheet({ batch }: CodeSheetProps) {
  const copy = useClipboard();
  const [copyCounts, setCopyCounts] = useState<Record<string, number>>({});
  const [justCopied, setJustCopied] = useState<string | null>(null);

  // Counts are keyed by code text, and reset whenever a new lot is generated.
  useEffect(() => {
    setCopyCounts({});
    setJustCopied(null);
  }, [batch?.id]);

  useEffect(() => {
    if (!justCopied) return;
    const timer = window.setTimeout(() => setJustCopied(null), 1500);
    return () => window.clearTimeout(timer);
  }, [justCopied]);

  if (!batch) return <EmptySheet />;

  const handleCopyOne = async (code: string) => {
    const ok = await copy(code);
    if (!ok) {
      toast.error('Could not reach the clipboard', {
        description: 'Your browser blocked the request. Select the code and copy it manually.',
      });
      return;
    }
    setJustCopied(code);
    setCopyCounts((prev) => ({ ...prev, [code]: (prev[code] ?? 0) + 1 }));
  };

  const handleCopyAll = async () => {
    const ok = await copy(toPlainText(batch.codes));
    if (ok) toast.success(`Copied ${batch.codes.length} codes`);
    else toast.error('Could not reach the clipboard');
  };

  const handleExport = (format: ExportFormat) => {
    const file = buildExport(batch, format);
    downloadFile(file.name, file.body, file.mime);
    toast.success(`Saved ${file.name}`);
  };

  return (
    <section className="pt-6 pb-16">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* signature 3 — batch stamp block */}
          <span className="bg-ink px-3.5 py-1.5 font-display text-[26px] leading-[1.2] font-black tracking-[0.05em] text-concrete-hi uppercase sm:text-3xl">
            Lot <span className="text-yellow">{String(batch.lot).padStart(4, '0')}</span>
          </span>
          <span className="text-[11px] font-bold tracking-[0.18em] text-soft uppercase">
            {batch.codes.length} codes / {MODE_LABEL[batch.config.mode]} / {formatTime(batch.timestamp)}
          </span>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Button variant="outline" onClick={handleCopyAll}>
            <Copy className="h-3.5 w-3.5" aria-hidden />
            Copy all
          </Button>
          <Button variant="accent" onClick={() => handleExport('txt')}>
            <Download className="h-3.5 w-3.5" aria-hidden />
            Export .txt
          </Button>
          <Button variant="outline" onClick={() => handleExport('csv')} title="Export as CSV">
            .csv
          </Button>
        </div>
      </div>

      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {batch.codes.map((code, index) => {
          const count = copyCounts[code] ?? 0;
          const active = justCopied === code;
          return (
            <li key={`${code}-${index}`}>
              <button
                type="button"
                onClick={() => handleCopyOne(code)}
                aria-label={`Copy ${code}`}
                className={cn(
                  'corner-ticks relative flex w-full items-center justify-between gap-3',
                  'border-[3px] border-ink px-4 py-3.5 text-left transition-colors outline-none',
                  active || count > 0
                    ? 'bg-yellow'
                    : 'bg-concrete-hi hover:bg-concrete-lo',
                )}
              >
                <span className="min-w-0 font-mono text-[17px] font-bold break-all">{code}</span>
                <span
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 text-[10px] font-bold tracking-[0.1em] uppercase',
                    count > 0 ? 'text-ink' : 'text-faint',
                  )}
                >
                  {active ? (
                    <>
                      <Check className="h-3.5 w-3.5" aria-hidden /> Copied
                    </>
                  ) : count > 0 ? (
                    `Copied ${count}×`
                  ) : (
                    'Copy'
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function EmptySheet() {
  return (
    <section className="pt-6 pb-16">
      <div className="flex flex-col items-center justify-center border-[3px] border-dashed border-hair px-6 py-20 text-center">
        <Dices className="mb-4 h-12 w-12 text-hair" aria-hidden />
        <p className="font-display text-3xl leading-none font-black tracking-[0.04em] uppercase">
          No lot yet
        </p>
        <p className="mt-2 max-w-sm text-sm text-soft">
          Set your quantity and format above, then hit Generate. Codes land here ready to copy or
          export.
        </p>
      </div>
    </section>
  );
}
