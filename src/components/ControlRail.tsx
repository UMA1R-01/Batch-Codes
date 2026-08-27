import { Play, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { NumberField } from '@/components/NumberField';
import { issueFor } from '@/core/validate';
import { GeneratorMode, LIMITS, type GeneratorConfig, type ValidationIssue } from '@/types';

interface ControlRailProps {
  config: GeneratorConfig;
  issues: ValidationIssue[];
  busy: boolean;
  onPatch: (patch: Partial<GeneratorConfig>) => void;
  onGenerate: () => void;
}

export function ControlRail({ config, issues, busy, onPatch, onGenerate }: ControlRailProps) {
  const showLength = config.mode === GeneratorMode.RANDOM;

  return (
    <div
      className={
        'grid items-end gap-3.5 ' +
        (showLength
          ? 'grid-cols-2 lg:grid-cols-[126px_126px_1fr_1fr_232px]'
          : 'grid-cols-2 lg:grid-cols-[126px_1fr_1fr_232px]')
      }
    >
      <Field id="quantity" label="Quantity" error={issueFor(issues, 'quantity')?.message}>
        <NumberField
          id="quantity"
          value={config.quantity}
          min={LIMITS.quantityMin}
          max={LIMITS.quantityMax}
          invalid={Boolean(issueFor(issues, 'quantity'))}
          onChange={(quantity) => onPatch({ quantity })}
        />
      </Field>

      {showLength && (
        <Field id="length" label="Length" error={issueFor(issues, 'length')?.message}>
          <NumberField
            id="length"
            value={config.length}
            min={LIMITS.lengthMin}
            max={LIMITS.lengthMax}
            invalid={Boolean(issueFor(issues, 'length'))}
            onChange={(length) => onPatch({ length })}
          />
        </Field>
      )}

      <Field id="prefix" label="Prefix" className="col-span-2 lg:col-span-1">
        <Input
          id="prefix"
          value={config.prefix}
          maxLength={LIMITS.affixMaxLength}
          placeholder="GIFT-"
          onChange={(event) => onPatch({ prefix: event.target.value })}
        />
      </Field>

      <Field id="suffix" label="Suffix" className="col-span-2 lg:col-span-1">
        <Input
          id="suffix"
          value={config.suffix}
          maxLength={LIMITS.affixMaxLength}
          placeholder="optional"
          onChange={(event) => onPatch({ suffix: event.target.value })}
        />
      </Field>

      <Button
        variant="solid"
        size="hero"
        onClick={onGenerate}
        disabled={busy}
        className="group col-span-2 justify-between lg:col-span-1"
      >
        {busy ? 'Working' : 'Generate'}
        {busy ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        ) : (
          // Orange on the black rest state; flips to paper once the button
          // itself turns orange on hover.
          <Play
            className="h-4 w-4 fill-current text-orange group-hover:text-concrete-hi"
            aria-hidden
          />
        )}
      </Button>
    </div>
  );
}
