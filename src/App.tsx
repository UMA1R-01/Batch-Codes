import { useCallback, useMemo, useState } from 'react';
import { Toaster, toast } from 'sonner';
import { Masthead } from '@/components/Masthead';
import { ControlRail } from '@/components/ControlRail';
import { AdvancedPanel } from '@/components/AdvancedPanel';
import { CodeSheet } from '@/components/CodeSheet';
import { HistoryDrawer } from '@/components/HistoryDrawer';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generatePatternCodes, generateRandomCodes } from '@/core/codegen';
import { hasErrors, validateConfig } from '@/core/validate';
import { useHistory, nextLotNumber } from '@/hooks/useHistory';
import { usePersistedConfig } from '@/hooks/useSettings';
import { storageAvailable } from '@/lib/storage';
import { createId } from '@/lib/utils';
import { GeneratorMode, MODE_LABEL, type GeneratedBatch, type GeneratorConfig } from '@/types';

const MODES = [GeneratorMode.RANDOM, GeneratorMode.PATTERN];

export default function App() {
  const [config, setConfig] = usePersistedConfig();
  const [batch, setBatch] = useState<GeneratedBatch | null>(null);
  const [busy, setBusy] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  /** Errors only surface after the first Generate press, so the form isn't hostile on load. */
  const [submitted, setSubmitted] = useState(false);

  const { history, addBatch, removeBatch, clearHistory, persistError } = useHistory();

  const issues = useMemo(() => validateConfig(config), [config]);
  const visibleIssues = submitted ? issues : issues.filter((i) => i.level === 'warning');

  const patch = useCallback(
    (next: Partial<GeneratorConfig>) => setConfig((prev) => ({ ...prev, ...next })),
    [setConfig],
  );

  const handleGenerate = useCallback(async () => {
    setSubmitted(true);

    const blocking = validateConfig(config);
    if (hasErrors(blocking)) {
      const first = blocking.find((i) => i.level === 'error')!;
      toast.error('Check the settings', { description: first.message });
      return;
    }

    setBusy(true);
    try {
      const codes =
        config.mode === GeneratorMode.PATTERN
          ? generatePatternCodes(config)
          : generateRandomCodes(config);

      const created: GeneratedBatch = {
        id: createId(),
        lot: nextLotNumber(),
        timestamp: Date.now(),
        codes,
        config: structuredClone(config),
      };

      setBatch(created);
      addBatch(created);
    } catch (error) {
      // Surface the real reason rather than a generic failure string.
      toast.error('Could not generate', {
        description: error instanceof Error ? error.message : 'Something went wrong.',
      });
    } finally {
      setBusy(false);
    }
  }, [config, addBatch]);

  const handleRestore = useCallback(
    (restored: GeneratedBatch) => {
      setConfig(restored.config);
      setBatch(restored);
      setSubmitted(false);
      setHistoryOpen(false);
      toast.success(`Restored lot ${String(restored.lot).padStart(4, '0')}`);
    },
    [setConfig],
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Masthead historyCount={history.length} onOpenHistory={() => setHistoryOpen(true)} />

      {/* Full-width scroll region so the scrollbar sits at the true window edge,
          below the titlebar, rather than floating at the edge of the centered content. */}
      <div className="flex-1 overflow-y-auto">
        <main className="mx-auto max-w-[1600px] px-4 sm:px-8">
          {!storageAvailable && (
            <p className="mt-4 border-[3px] border-orange bg-concrete-hi px-4 py-3 text-sm font-semibold">
              Local storage is unavailable, so history and settings will not be saved between
              visits.
            </p>
          )}
          {persistError && (
            <p className="mt-4 border-[3px] border-orange bg-concrete-hi px-4 py-3 text-sm font-semibold">
              {persistError}
            </p>
          )}

          <section className="border-b-[3px] border-ink pt-7 pb-6">
            <Tabs
              value={config.mode}
              onValueChange={(value) => {
                patch({ mode: value as GeneratorMode });
                setSubmitted(false);
              }}
            >
              <TabsList className="mb-6" aria-label="Generator mode">
                {MODES.map((mode) => (
                  <TabsTrigger key={mode} value={mode} className="flex-1 lg:flex-none">
                    {MODE_LABEL[mode]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <ControlRail
              config={config}
              issues={visibleIssues}
              busy={busy}
              onPatch={patch}
              onGenerate={handleGenerate}
            />

            <AdvancedPanel config={config} issues={visibleIssues} onPatch={patch} />
          </section>

          <CodeSheet batch={batch} />
        </main>
      </div>

      <HistoryDrawer
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        history={history}
        onRestore={handleRestore}
        onRemove={removeBatch}
        onClear={clearHistory}
      />

      {/* `unstyled` is required — otherwise Sonner's own CSS outranks these
          classes and the toast keeps its rounded white default look. */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          unstyled: true,
          classNames: {
            toast:
              'flex w-full items-start gap-3 border-[3px] border-ink bg-concrete-hi p-4 font-body shadow-[6px_6px_0_0_var(--color-ink)]',
            title: 'text-sm font-bold text-ink',
            description: 'mt-0.5 text-xs text-soft',
            icon: 'mt-0.5 shrink-0',
            error: 'border-orange',
            warning: 'border-yellow',
          },
        }}
      />
    </div>
  );
}
