import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseReady } from '../lib/supabase';
import { enqueueWrite } from './useOfflineQueue';

/**
 * Shared data hook — uses Supabase when configured, localStorage otherwise.
 *
 * Features:
 * - Offline-first: writes go to localStorage immediately, always.
 * - When online + Supabase ready: also upserts to DB.
 * - When offline: enqueues the write; flushes when back online.
 * - Real-time subscription syncs changes from other devices instantly.
 *
 * Supabase table: app_data (key text PK, value jsonb, updated_at timestamptz)
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

    // 1. Initial fetch from DB (source of truth when online)
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
          // First run for this key: push current local state to DB
          const current = stateRef.current;
          supabase.from('app_data').insert({
            key,
            value: current,
            updated_at: new Date().toISOString(),
          });
        }
      });

    // 2. Real-time subscription — any device updates → everyone gets it
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

  // ── Setter — offline-first write ──────────────────────────────────────────
  const update = useCallback((updater) => {
    const next = typeof updater === 'function' ? updater(stateRef.current) : updater;
    setState(next);
    localStorage.setItem(lsKey, JSON.stringify(next));

    if (!isSupabaseReady) return;

    const op = { table: 'app_data', key, value: next, updated_at: new Date().toISOString() };

    if (navigator.onLine) {
      // Online: write directly
      supabase
        .from('app_data')
        .upsert(op, { onConflict: 'key' })
        .then(({ error }) => {
          if (error) {
            // Write failed — queue it for retry
            enqueueWrite(op);
          }
        });
    } else {
      // Offline: queue for later
      enqueueWrite(op);
    }
  }, [key, lsKey]); // eslint-disable-line

  return [state, update];
}
