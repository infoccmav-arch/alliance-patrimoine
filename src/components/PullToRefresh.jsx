import { useState, useRef, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

const THRESHOLD = 72;

export default function PullToRefresh({ onRefresh, children }) {
  const [pulling, setPulling]   = useState(false);
  const [distance, setDistance] = useState(0);
  const [refreshing, setRef]    = useState(false);
  const startY   = useRef(0);
  const scrollEl = useRef(null);

  const handleTouchStart = (e) => {
    const el = scrollEl.current;
    if (!el || el.scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
    setPulling(true);
  };

  const handleTouchMove = (e) => {
    if (!pulling) return;
    const el = scrollEl.current;
    if (!el || el.scrollTop > 0) { setPulling(false); setDistance(0); return; }
    const dy = Math.max(0, e.touches[0].clientY - startY.current);
    setDistance(Math.min(dy * 0.45, THRESHOLD + 20));
  };

  const handleTouchEnd = async () => {
    if (!pulling) return;
    setPulling(false);
    if (distance >= THRESHOLD) {
      setRef(true);
      setDistance(THRESHOLD);
      try { await onRefresh?.(); } catch {}
      setTimeout(() => { setRef(false); setDistance(0); }, 600);
    } else {
      setDistance(0);
    }
  };

  const pct       = Math.min(1, distance / THRESHOLD);
  const triggered = distance >= THRESHOLD;

  return (
    <div style={{ position: 'relative', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Pull indicator */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: distance, overflow: 'hidden',
        transition: pulling ? 'none' : 'height 0.4s cubic-bezier(.16,1,.3,1)',
        pointerEvents: 'none',
      }}>
        {distance > 8 && (
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: triggered ? 'rgba(0,208,132,0.12)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${triggered ? 'rgba(0,208,132,0.3)' : 'rgba(255,255,255,0.1)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s, border-color 0.2s',
          }}>
            <RefreshCw
              style={{
                width: 16, height: 16,
                color: triggered ? '#00d084' : '#555',
                transform: `rotate(${pct * 360}deg)`,
                transition: refreshing ? 'none' : 'color 0.2s',
                animation: refreshing ? 'spin 0.7s linear infinite' : 'none',
              }}
              strokeWidth={2}
            />
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div
        ref={scrollEl}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          flex: 1, overflowY: 'auto',
          transform: distance > 0 ? `translateY(${distance}px)` : 'none',
          transition: pulling ? 'none' : 'transform 0.4s cubic-bezier(.16,1,.3,1)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
