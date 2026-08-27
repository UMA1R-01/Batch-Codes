import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'w-full min-w-0 border-[3px] bg-concrete-hi px-3 py-2.5 font-mono text-[15px] font-medium',
        'placeholder:font-body placeholder:text-sm placeholder:text-faint',
        'outline-none transition-colors',
        invalid ? 'border-orange' : 'border-ink',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(({ className, invalid, ...props }, ref) => (
  <textarea
    ref={ref}
    aria-invalid={invalid || undefined}
    className={cn(
      'w-full min-w-0 resize-none border-[3px] bg-concrete-hi px-3 py-2.5 font-body text-sm',
      'placeholder:text-faint outline-none transition-colors',
      invalid ? 'border-orange' : 'border-ink',
      className,
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';
