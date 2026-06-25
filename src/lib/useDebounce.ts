"use client";

import { useEffect, useState } from "react";

// Returns a debounced copy of `value` that only updates after `delay`ms of no
// changes. Used to keep search inputs responsive while throttling the API
// requests they trigger (the debounced value feeds the React Query key).
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
