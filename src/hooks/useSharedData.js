import { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseReady } from '../lib/supabase';

/**
 * Shared data hook — uses Supabase when configured, localStorage otherwise.
 * Same interface as the old useLocalStorage hook so components need no changes.
 *
 * Supabase table: app_data (key text PK, value jsonb, updated_at timestamptz)
 * Real-time broadcast ensures every connected member sees updates instantly.
 */
export function useSharedData(key, initial) {
  const lsKey = `ig_${key}`;

  const [state, setState] = useState(() => {
    try {
      const cached = localStorage.getItem(lsKey);
      return cached ? JSON.parse(cached) : initial;
    } catch { return initial; }
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  // ── Supabase sync ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseReady) return;

    let mounted = true;

    // 1. Initial fetch from DB (source of truth)
    supabase
      .from('app_data')
      .select('value')
      .eq('key', key)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!mounted || error) return;
        if (data?.value !== undefined) {
          setState(data.value);
          localStorage.setItem(lsKey, JSON.stringify(data.value));
        } else {
          // First run: push local state to DB
          const current = stateRef.current;
          supabase.from('app_data').insert({ key, value: current });
        }
      });

    // 2. Real-time subscription — any member updates → everyone gets it
    const channel = supabase
      .channel(`shared:${key}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_data', filter: `key=eq.${key}` },
        ({ new: row }) => {
          if (!mounted || !row?.value) return;
          setState(row.value);
          localStorage.setItem(lsKey, JSON.stringify(row.value));
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [key]); // eslint-disable-line

  // ── Setter — updates local state + pushes to Supabase ─────────────────────
  const update = (updater) => {
    const next = typeof updater === 'function' ? updater(stateRef.current) : updater;
    setState(next);
    localStorage.setItem(lsKey, JSON.stringify(next));

    if (isSupabaseReady) {
      supabase
        .from('app_data')
        .upsert({ key, value: next, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    }
  };

  return [state, update];
}
