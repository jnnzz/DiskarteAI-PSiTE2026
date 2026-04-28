import { useCallback, useEffect, useState } from "react";

/**
 * Typed localStorage hook with cross-tab sync via the `storage` event.
 * Returns [value, setValue, reset].
 */
export function useLocalStorage<T>(
  key: string,
  initial: T | (() => T),
): [T, (v: T | ((prev: T) => T)) => void, () => void] {
  const read = useCallback((): T => {
    if (typeof window === "undefined") {
      return typeof initial === "function" ? (initial as () => T)() : initial;
    }
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) {
        return typeof initial === "function" ? (initial as () => T)() : initial;
      }
      return JSON.parse(raw) as T;
    } catch {
      return typeof initial === "function" ? (initial as () => T)() : initial;
    }
  }, [key, initial]);

  const [value, setValue] = useState<T>(read);

  // Sync if the underlying key changes (e.g. seedDemo writes happened before mount).
  useEffect(() => {
    setValue(read());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (v: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const next = typeof v === "function" ? (v as (p: T) => T)(prev) : v;
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          /* ignore quota errors */
        }
        return next;
      });
    },
    [key],
  );

  const reset = useCallback(() => {
    localStorage.removeItem(key);
    setValue(typeof initial === "function" ? (initial as () => T)() : initial);
  }, [key, initial]);

  // Cross-tab + post-seed sync
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === key) setValue(read());
    }
    function onCustom(e: Event) {
      const detail = (e as CustomEvent).detail as string | undefined;
      if (!detail || detail === key) setValue(read());
    }
    window.addEventListener("storage", onStorage);
    window.addEventListener("diskarte:storage", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("diskarte:storage", onCustom);
    };
  }, [key, read]);

  return [value, update, reset];
}

/** Notify all useLocalStorage hooks in this tab to re-read. */
export function broadcastStorageChange(key?: string): void {
  window.dispatchEvent(new CustomEvent("diskarte:storage", { detail: key }));
}
