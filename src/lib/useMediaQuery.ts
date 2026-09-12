"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Reads a media query without a setState-in-effect round trip.
 * Returns `false` during SSR and on the first client render, so anything
 * gated on it mounts only once the real answer is known.
 */
export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
