import * as React from 'react';
import { cn } from '@/lib/utils';

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

/** Eyebrow label + control + inline error. Errors sit under the field they belong to. */
export function Field({ id, label, error, className, children }: FieldProps) {
  return (
    <div className={cn('min-w-0', className)}>
      <label htmlFor={id} className="eyebrow mb-2 block">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs font-semibold text-orange">
          {error}
        </p>
      )}
    </div>
  );
}

export function Hint({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('mt-2 font-mono text-[11px] text-soft', className)}>{children}</p>;
}
