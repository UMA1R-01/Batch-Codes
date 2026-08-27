import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Square stencil switch. A pill toggle would read as generic app furniture;
 * a hard-edged checkbox matches the marking/asset-tag language of the design.
 */
export const Switch = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      'relative grid h-[19px] w-[19px] shrink-0 place-items-center border-[3px] border-ink',
      'bg-concrete-hi transition-colors outline-none',
      'data-[state=checked]:bg-orange',
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb asChild>
      <Check
        aria-hidden
        strokeWidth={4}
        className="h-3 w-3 text-ink opacity-0 transition-opacity data-[state=checked]:opacity-100"
      />
    </SwitchPrimitive.Thumb>
  </SwitchPrimitive.Root>
));
Switch.displayName = 'Switch';

interface SwitchFieldProps {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function SwitchField({ id, label, checked, onCheckedChange }: SwitchFieldProps) {
  return (
    <div className="flex items-center gap-2">
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
      <label
        htmlFor={id}
        className={cn(
          'cursor-pointer text-[13px] font-medium select-none',
          checked ? 'text-ink' : 'text-soft',
        )}
      >
        {label}
      </label>
    </div>
  );
}
