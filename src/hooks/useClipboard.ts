import { useCallback } from 'react';

/**
 * Copies text, resolving to whether it actually worked.
 *
 * The old build fired navigator.clipboard.writeText() and immediately showed a
 * success tick without awaiting it, so a denied permission or an insecure
 * origin still reported success. This awaits the promise and falls back to the
 * legacy execCommand path before admitting failure.
 */
export function useClipboard() {
  return useCallback(async (text: string): Promise<boolean> => {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        /* fall through to the legacy path */
      }
    }

    try {
      const scratch = document.createElement('textarea');
      scratch.value = text;
      scratch.setAttribute('readonly', '');
      scratch.style.position = 'fixed';
      scratch.style.top = '-1000px';
      scratch.style.opacity = '0';
      document.body.appendChild(scratch);
      scratch.select();
      const ok = document.execCommand('copy');
      scratch.remove();
      return ok;
    } catch {
      return false;
    }
  }, []);
}
