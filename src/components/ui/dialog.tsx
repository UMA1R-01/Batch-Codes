import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

const Overlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn('anim-overlay fixed inset-0 z-50 bg-ink/60 backdrop-blur-[2px]', className)}
    {...props}
  />
));
Overlay.displayName = 'DialogOverlay';

/** Centred modal — used for Settings and destructive confirmations. */
export const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <Overlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'anim-modal fixed top-1/2 left-1/2 z-50 w-[min(30rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2',
        'border-[3px] border-ink bg-concrete-hi p-6 shadow-[10px_10px_0_0_var(--color-ink)]',
        'max-h-[calc(100vh-2rem)] overflow-y-auto focus:outline-none',
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close asChild>
        <Button variant="quiet" size="icon" className="absolute top-3 right-3" aria-label="Close">
          <X className="h-4 w-4" aria-hidden />
        </Button>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = 'DialogContent';

/** Right-hand drawer — used for History. */
export const SheetContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <Overlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'anim-drawer fixed inset-y-0 right-0 z-50 flex w-[min(24rem,100vw)] flex-col',
        'border-l-[3px] border-ink bg-concrete focus:outline-none',
        className,
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
SheetContent.displayName = 'SheetContent';

export function DialogHeading({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-5 pr-8">
      <DialogTitle className="font-display text-3xl leading-none font-black tracking-[0.04em] uppercase">
        {title}
      </DialogTitle>
      {hint && <DialogDescription className="mt-2 text-sm text-soft">{hint}</DialogDescription>}
    </div>
  );
}
