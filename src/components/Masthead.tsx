import { useEffect, useState } from 'react';
import { Copy, History, Minus, Square, X } from 'lucide-react';
import { isTauri } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MastheadProps {
  onOpenHistory: () => void;
  historyCount: number;
}

/** Native window chrome is off (see tauri.conf.json); this bar is the titlebar too. */
const appWindow = isTauri() ? getCurrentWindow() : null;

export function Masthead({ onOpenHistory, historyCount }: MastheadProps) {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    if (!appWindow) return;
    appWindow.isMaximized().then(setMaximized);
    const unlisten = appWindow.onResized(() => {
      appWindow.isMaximized().then(setMaximized);
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  return (
    <header
      className={cn(
        'flex h-[72px] shrink-0 items-center gap-3 bg-ink pl-4 text-concrete-hi sm:pl-8',
        !appWindow && 'pr-4 sm:pr-8',
      )}
      data-tauri-drag-region
      onDoubleClick={() => appWindow?.toggleMaximize()}
    >
      <div className="flex min-w-0 items-center gap-3" data-tauri-drag-region>
        {/* same mark as the app icon — bordered so its ink half still
            reads against the masthead's own ink background */}
        <svg
          aria-hidden
          data-tauri-drag-region
          viewBox="0 0 1024 1024"
          className="h-9 w-9 shrink-0 border border-ink-line"
        >
          <polygon points="0,0 1024,0 0,1024" fill="var(--color-orange)" />
          <polygon points="1024,0 1024,1024 0,1024" fill="var(--color-ink)" />
          <g fill="var(--color-concrete-hi)">
            <rect x="336" y="210" width="116" height="604" />
            <rect x="572" y="210" width="116" height="604" />
            <rect x="210" y="336" width="604" height="116" />
            <rect x="210" y="572" width="604" height="116" />
          </g>
        </svg>
        {/* signature 2 — stencil bridge cut */}
        <h1
          data-tauri-drag-region
          className="stencil-bridge font-display text-[22px] leading-none font-black tracking-[0.02em] whitespace-nowrap uppercase sm:text-[34px]"
        >
          <span className="text-orange">Batch</span> Codes
        </h1>
      </div>

      {/* empty middle of the bar — also draggable */}
      <div className="min-w-4 flex-1 self-stretch" data-tauri-drag-region />

      <div className="flex shrink-0 items-center gap-2">
        <Button variant="ghostDark" onClick={onOpenHistory} className="tracking-[0.16em]">
          <History className="h-3.5 w-3.5" aria-hidden />
          <span className="hidden sm:inline">History</span>
          {historyCount > 0 && <span className="text-orange">{historyCount}</span>}
        </Button>
      </div>

      {appWindow && (
        <>
          <div className="h-8 w-px shrink-0 bg-ink-line" aria-hidden />
          <div className="flex shrink-0 items-stretch self-stretch">
            <WindowButton label="Minimize" onClick={() => appWindow.minimize()}>
              <Minus className="h-3 w-3" aria-hidden />
            </WindowButton>
            <WindowButton
              label={maximized ? 'Restore' : 'Maximize'}
              onClick={() => appWindow.toggleMaximize()}
            >
              {maximized ? (
                <Copy className="h-3 w-3" aria-hidden />
              ) : (
                <Square className="h-3 w-3" aria-hidden />
              )}
            </WindowButton>
            <WindowButton label="Close" danger onClick={() => appWindow.close()}>
              <X className="h-3.5 w-3.5" aria-hidden />
            </WindowButton>
          </div>
        </>
      )}
    </header>
  );
}

function WindowButton({
  label,
  danger,
  onClick,
  children,
}: {
  label: string;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        'flex w-11 items-center justify-center text-faint outline-none transition-colors hover:text-concrete-hi',
        danger ? 'hover:bg-orange hover:text-ink' : 'hover:bg-ink-lift',
      )}
    >
      {children}
    </button>
  );
}
