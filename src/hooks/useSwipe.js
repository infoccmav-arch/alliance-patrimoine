import { useRef, useCallback } from 'react';

export function useSwipe(onSwipeLeft, onSwipeRight, minDist = 60) {
  const touchStart = useRef(null);

  const onTouchStart = useCallback((e) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const onTouchEnd = useCallback((e) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    // Only horizontal swipe (less than 60px vertical drift)
    if (Math.abs(dy) > 60 || Math.abs(dx) < minDist) return;
    if (dx < 0) onSwipeLeft?.();
    else        onSwipeRight?.();
    touchStart.current = null;
  }, [onSwipeLeft, onSwipeRight, minDist]);

  return { onTouchStart, onTouchEnd };
}
