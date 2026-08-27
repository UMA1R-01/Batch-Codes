import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-body uppercase transition-colors disabled:pointer-events-none disabled:opacity-40 shrink-0 outline-none',
  {
    variants: {
      variant: {
        /** Primary action. Black block that flips to orange on hover. */
        solid:
          'bg-ink text-concrete-hi border-[3px] border-ink hover:bg-orange hover:border-orange',
        /** Secondary action. Outlined, inverts on hover. */
        outline:
          'bg-transparent text-ink border-[3px] border-ink hover:bg-ink hover:text-concrete-hi',
        /** Accent action. Orange block that settles to black on hover. */
        accent:
          'bg-orange text-concrete-hi border-[3px] border-orange hover:bg-ink hover:border-ink',
        /** Sits on the black masthead. */
        ghostDark:
          'bg-transparent text-concrete-hi border-2 border-ink-line hover:bg-ink-lift hover:border-soft',
        /** Low-emphasis, no chrome until hover. */
        quiet: 'bg-transparent text-soft hover:text-ink hover:bg-concrete-lo',
        /** Destructive, kept visually quiet until hovered. */
        danger:
          'bg-transparent text-ink border-[3px] border-ink hover:bg-orange hover:border-orange hover:text-concrete-hi',
      },
      size: {
        sm: 'text-[11px] font-bold tracking-[0.12em] px-4 py-2.5',
        md: 'text-xs font-bold tracking-[0.12em] px-5 py-3',
        icon: 'h-9 w-9 p-0',
        /** Display-face size for the Generate action. */
        hero: 'font-display font-black text-2xl tracking-[0.05em] leading-[1.35] px-5 py-2',
      },
    },
    defaultVariants: { variant: 'outline', size: 'sm' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type = 'button', ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : type}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
