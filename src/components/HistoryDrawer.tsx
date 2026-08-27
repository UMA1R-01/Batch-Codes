import { useState } from 'react';
import { Trash2, X, RotateCcw } from 'lucide-react';
import { Dialog, SheetContent, DialogClose, DialogTitle, DialogContent, DialogHeading } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MODE_LABEL, type GeneratedBatch } from '@/types';
import { formatDate, formatTime } from '@/lib/utils';

interface HistoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: GeneratedBatch[];
  onRestore: (batch: GeneratedBatch) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

export function HistoryDrawer({
  open,
  onOpenChange,
  history,
  onRestore,
  onRemove,
  onClear,
}: HistoryDrawerProps) {
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <SheetContent aria-describedby={undefined}>
          <div className="flex items-center justify-between border-b-[3px] border-ink bg-ink px-4 py-3.5">
            <DialogTitle className="font-display text-2xl leading-none font-black tracking-[0.05em] text-concrete-hi uppercase">
              History
            </DialogTitle>
            <DialogClose asChild>
              <Button variant="ghostDark" size="icon" aria-label="Close history">
                <X className="h-4 w-4" aria-hidden />
              </Button>
            </DialogClose>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {history.length === 0 ? (
              <p className="py-12 text-center text-sm text-soft">
                Nothing generated yet. Your last {50} lots will be listed here.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {history.map((batch) => (
                  <li key={batch.id}>
                    <div className="corner-ticks relative border-[3px] border-ink bg-concrete-hi">
                      <button
                        type="button"
                        onClick={() => onRestore(batch)}
                        className="block w-full px-4 py-3 text-left outline-none hover:bg-concrete-lo"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="bg-ink px-2 py-0.5 font-display text-base leading-tight font-black tracking-[0.05em] text-concrete-hi uppercase">
                            Lot {String(batch.lot).padStart(4, '0')}
                          </span>
                          <span className="text-[10px] font-bold tracking-[0.14em] text-soft uppercase">
                            {formatDate(batch.timestamp)} {formatTime(batch.timestamp)}
                          </span>
                        </div>
                        <p className="mt-2 truncate font-mono text-[13px] font-bold">
                          {batch.codes[0]}
                        </p>
                        <p className="mt-1 text-[10px] font-bold tracking-[0.14em] text-soft uppercase">
                          {batch.codes.length} codes / {MODE_LABEL[batch.config.mode]}
                        </p>
                      </button>

                      <div className="flex border-t-2 border-hair">
                        <button
                          type="button"
                          onClick={() => onRestore(batch)}
                          className="flex flex-1 items-center justify-center gap-1.5 border-r-2 border-hair py-2 text-[10px] font-bold tracking-[0.12em] text-soft uppercase outline-none hover:bg-ink hover:text-concrete-hi"
                        >
                          <RotateCcw className="h-3 w-3" aria-hidden />
                          Restore
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemove(batch.id)}
                          aria-label={`Delete lot ${batch.lot}`}
                          className="flex items-center justify-center px-4 py-2 text-soft outline-none hover:bg-orange hover:text-concrete-hi"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {history.length > 0 && (
            <div className="border-t-[3px] border-ink bg-concrete-hi p-4">
              <Button variant="danger" className="w-full" onClick={() => setConfirmClear(true)}>
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                Clear history
              </Button>
            </div>
          )}
        </SheetContent>
      </Dialog>

      {/* The old build wiped all 50 entries on a single unguarded click. */}
      <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
        <DialogContent>
          <DialogHeading
            title="Clear history?"
            hint={`This deletes all ${history.length} saved lots from this device. The codes themselves are not revoked — anything you already exported stays valid.`}
          />
          <div className="flex justify-end gap-2.5">
            <DialogClose asChild>
              <Button variant="outline">Keep history</Button>
            </DialogClose>
            <Button
              variant="accent"
              onClick={() => {
                onClear();
                setConfirmClear(false);
              }}
            >
              Delete everything
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
