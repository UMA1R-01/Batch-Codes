import { useCallback, useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { clampNumber } from '@/core/validate';

interface NumberFieldProps {
  id: string;
  value: number;
  min: number;
  max: number;
  invalid?: boolean;
  onChange: (value: number) => void;
  'aria-describedby'?: string;
}

/**
 * Numeric input that actually respects its own bounds.
 *
 * Two fixes over the old build:
 *  - min/max were only enforced by the scroll-wheel handler, so anything typed
 *    (including negatives) sailed straight through. Values are clamped on blur
 *    and on Enter, while free typing stays possible mid-edit.
 *  - the wheel handler fired on hover rather than focus, so scrolling the page
 *    silently changed whichever field the pointer happened to cross. It now
 *    only responds while the input has focus.
 */
export function NumberField({ id, value, min, max, invalid, onChange, ...rest }: NumberFieldProps) {
  const ref = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<string>(String(value));
  const [focused, setFocused] = useState(false);

  // Keep the visible text in sync when the value changes from elsewhere
  // (history restore, reset) — but never while the user is mid-edit.
  useEffect(() => {
    if (!focused) setDraft(String(value));
  }, [value, focused]);

  const commit = useCallback(
    (raw: string) => {
      const next = clampNumber(raw, min, max, value);
      setDraft(String(next));
      onChange(next);
    },
    [min, max, value, onChange],
  );

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const onWheel = (event: WheelEvent) => {
      if (document.activeElement !== node) return; // focus-gated, not hover-gated
      event.preventDefault();
      const step = event.deltaY < 0 ? 1 : -1;
      const next = clampNumber(Number(node.value) + step, min, max, value);
      setDraft(String(next));
      onChange(next);
    };

    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, [min, max, value, onChange]);

  return (
    <Input
      ref={ref}
      id={id}
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      value={draft}
      invalid={invalid}
      onFocus={() => setFocused(true)}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={(event) => {
        setFocused(false);
        commit(event.target.value);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') commit(event.currentTarget.value);
      }}
      {...rest}
    />
  );
}
