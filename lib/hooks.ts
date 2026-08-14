"use client";

import { useCallback, useEffect, useState } from "react";

interface ResourceState<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T | undefined>>;
}

/**
 * Fetch-and-cache hook that replaces Meteor's reactive `useTracker` +
 * `Meteor.subscribe`. Data is fetched on mount and whenever `deps` change.
 * Call `refetch()` after a mutation to refresh (there is no live push sync).
 */
export function useResource<T>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList = []
): ResourceState<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const result = await fetcher();
        if (active) setData(result);
      } catch (err) {
        if (active) setError(err as Error);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, refetch: load, setData };
}
