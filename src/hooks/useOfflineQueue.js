/**
 * Offline queue — persists pending Supabase writes in localStorage.
 * When connectivity is restored, flushes all queued operations.
 */
import { useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseReady } from '../lib/supabase';

const QUEUE_KEY = 'ig_offline_queue';

function loadQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { return []; }
}

function saveQueue(q) {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch {}
}

/**
 * Enqueue a Supabase upsert to be executed when online.
 * op: { table: string, key: string, value: any, updated_at: string }
 */
export function enqueueWrite(op) {
  const q = loadQueue();
  // Replace any existing pending op for same key (last write wins)
  const filtered = q.filter(o => !(o.table === op.table && o.key === op.key));
  filtered.push({ ...op, queuedAt: Date.now() });
  saveQueue(filtered);
}

export function getQueueSize() {
  return loadQueue().length;
}

/**
 * Hook — flushes the offline queue whenever the browser goes online
 * and Supabase is configured. Returns { queueSize, isOnline }.
 */
export function useOfflineQueue() {
  const queueSize = useRef(getQueueSize());
  const timerRef  = useRef(null);

  const flush = useCallback(async () => {
    if (!isSupabaseReady || !navigator.onLine) return;
    const q = loadQueue();
    if (q.length === 0) return;

    const failed = [];
    for (const op of q) {
      try {
        const { error } = await supabase
          .from(op.table)
          .upsert({ key: op.key, value: op.value, updated_at: op.updated_at }, { onConflict: 'key' });
        if (error) failed.push(op);
      } catch {
        failed.push(op);
      }
    }
    saveQueue(failed);
    queueSize.current = failed.length;

    // Dispatch custom event so UI can update
    window.dispatchEvent(new CustomEvent('ig-queue-flushed', { detail: { remaining: failed.length } }));
  }, []);

  useEffect(() => {
    if (!isSupabaseReady) return;

    const onOnline  = () => { flush(); };
    const onOffline = () => {};

    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);

    // Also try to flush on mount (in case we came back online while app was closed)
    flush();

    // Periodic retry every 30 seconds
    timerRef.current = setInterval(flush, 30_000);

    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
      clearInterval(timerRef.current);
    };
  }, [flush]);

  return { flush };
}
