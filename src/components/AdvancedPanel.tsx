import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Hint } from '@/components/ui/field';
import { SwitchField } from '@/components/ui/switch';
import { NumberField } from '@/components/NumberField';
import { PATTERN_LEGEND } from '@/core/charset';
import { previewCode } from '@/core/codegen';
import { issueFor } from '@/core/validate';
import {
  AMBIGUOUS_CHARS,
  GeneratorMode,
  LIMITS,
  type CharsetConfig,
  type GeneratorConfig,
  type ValidationIssue,
} from '@/types';
import { cn } from '@/lib/utils';

interface AdvancedPanelProps {
  config: GeneratorConfig;
  issues: ValidationIssue[];
  onPatch: (patch: Partial<GeneratorConfig>) => void;
}

function Column({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('border-b-2 border-hair p-4 last:border-b-0 md:border-r-2 md:border-b-0 md:last:border-r-0', className)}>
      <span className="eyebrow mb-3 block">{label}</span>
      {children}
    </div>
  );
}

export function AdvancedPanel({ config, issues, onPatch }: AdvancedPanelProps) {
  const [open, setOpen] = useState(true);
  const panelId = useId();

  const patchCharset = (patch: Partial<CharsetConfig>) =>
    onPatch({ charset: { ...config.charset, ...patch } });

  const summary = config.mode === GeneratorMode.PATTERN ? 'Pattern' : 'Character set & separator';

  return (
    <div className="mt-5">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.12em] text-soft uppercase outline-none hover:text-ink"
      >
        <ChevronDown
          aria-hidden
          className={cn('h-3.5 w-3.5 transition-transform', !open && '-rotate-90')}
        />
        <span className="border-b-[3px] border-orange pb-0.5 text-ink">{summary}</span>
      </button>

      {open && (
        <div
          id={panelId}
          className="mt-4 grid grid-cols-1 border-2 border-hair bg-concrete-hi md:grid-cols-[1.6fr_1fr_1fr]"
        >
          {config.mode === GeneratorMode.RANDOM && <RandomOptions config={config} issues={issues} patchCharset={patchCharset} onPatch={onPatch} />}
          {config.mode === GeneratorMode.PATTERN && <PatternOptions config={config} issues={issues} onPatch={onPatch} />}
        </div>
      )}
    </div>
  );
}

function RandomOptions({
  config,
  issues,
  patchCharset,
  onPatch,
}: {
  config: GeneratorConfig;
  issues: ValidationIssue[];
  patchCharset: (patch: Partial<CharsetConfig>) => void;
  onPatch: (patch: Partial<GeneratorConfig>) => void;
}) {
  const charsetError = issueFor(issues, 'charset');
  const preview = previewCode(config);

  return (
    <>
      <Column label="Character set">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <SwitchField
            id="cs-upper"
            label="Uppercase A–Z"
            checked={config.charset.uppercase}
            onCheckedChange={(v) => patchCharset({ uppercase: v })}
          />
          <SwitchField
            id="cs-lower"
            label="Lowercase a–z"
            checked={config.charset.lowercase}
            onCheckedChange={(v) => patchCharset({ lowercase: v })}
          />
          <SwitchField
            id="cs-num"
            label="Numbers 0–9"
            checked={config.charset.numbers}
            onCheckedChange={(v) => patchCharset({ numbers: v })}
          />
          <SwitchField
            id="cs-sym"
            label="Symbols !@#$"
            checked={config.charset.symbols}
            onCheckedChange={(v) => patchCharset({ symbols: v })}
          />
        </div>

        <div className="mt-4">
          <label htmlFor="cs-custom" className="eyebrow mb-2 block">
            Your own characters
          </label>
          <Input
            id="cs-custom"
            value={config.charset.customChars}
            placeholder="e.g. ΔΩ or 0123"
            maxLength={64}
            className="py-2 text-sm"
            onChange={(event) => patchCharset({ customChars: event.target.value })}
          />
        </div>

        {charsetError && (
          <p role="alert" className="mt-2 text-xs font-semibold text-orange">
            {charsetError.message}
          </p>
        )}
      </Column>

      <Column label="Separator">
        <div className="flex flex-wrap items-center gap-2.5">
          <Input
            aria-label="Separator character"
            value={config.separator.char}
            maxLength={1}
            className="w-11 px-0 text-center"
            onChange={(event) =>
              onPatch({ separator: { ...config.separator, char: event.target.value.slice(0, 1) } })
            }
          />
          <span className="text-xs font-medium text-soft">every</span>
          <div className="w-[68px]">
            <NumberField
              id="sep-every"
              value={config.separator.every}
              min={LIMITS.separatorEveryMin}
              max={LIMITS.separatorEveryMax}
              onChange={(every) => onPatch({ separator: { ...config.separator, every } })}
            />
          </div>
          <span className="text-xs font-medium text-soft">chars</span>
        </div>
        {preview && <Hint>{preview}</Hint>}
        {issueFor(issues, 'separator') && (
          <p className="mt-2 text-xs font-semibold text-soft">{issueFor(issues, 'separator')!.message}</p>
        )}
      </Column>

      <Column label="Readability">
        <SwitchField
          id="cs-ambiguous"
          label="Skip lookalike characters"
          checked={config.charset.excludeAmbiguous}
          onCheckedChange={(v) => patchCharset({ excludeAmbiguous: v })}
        />
        <Hint>Removes {AMBIGUOUS_CHARS.split('').join(' ')}</Hint>
      </Column>
    </>
  );
}

function PatternOptions({
  config,
  issues,
  onPatch,
}: {
  config: GeneratorConfig;
  issues: ValidationIssue[];
  onPatch: (patch: Partial<GeneratorConfig>) => void;
}) {
  const error = issueFor(issues, 'pattern');
  const preview = previewCode(config);

  return (
    <>
      <Column label="Pattern" className="md:col-span-2">
        <Input
          id="pattern"
          value={config.pattern}
          maxLength={LIMITS.patternMaxLength}
          invalid={Boolean(error)}
          placeholder="####-AAAA-####"
          onChange={(event) => onPatch({ pattern: event.target.value })}
        />
        {error ? (
          <p role="alert" className="mt-2 text-xs font-semibold text-orange">
            {error.message}
          </p>
        ) : (
          preview && <Hint>{preview}</Hint>
        )}
      </Column>

      <Column label="Placeholders">
        <dl className="space-y-1.5">
          {PATTERN_LEGEND.map((entry) => (
            <div key={entry.token} className="flex items-baseline gap-2.5 text-[13px]">
              <dt className="w-4 shrink-0 font-mono font-bold text-orange">{entry.token}</dt>
              <dd className="text-soft">
                <span className="font-medium text-ink">{entry.label}</span>{' '}
                <span className="font-mono text-[11px]">{entry.example}</span>
              </dd>
            </div>
          ))}
        </dl>
        <Hint>Any other character is kept as-is. Use a fixed prefix for words like SALE.</Hint>
      </Column>
    </>
  );
}
