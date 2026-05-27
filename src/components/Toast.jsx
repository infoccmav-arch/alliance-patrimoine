import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

let _addToast = null;

export function toast(message, type = 'success', duration = 3200) {
  if (_addToast) _addToast({ message, type, duration, id: Date.now() + Math.random() });
}
toast.success = (msg, d) => toast(msg, 'success', d);
toast.error   = (msg, d) => toast(msg, 'error', d);
toast.info    = (msg, d) => toast(msg, 'info', d);
toast.warning = (msg, d) => toast(msg, 'warning', d);

const STYLES = {
  success: { icon: CheckCircle2, color: '#00d084', bg: 'rgba(0,208,132,0.08)', border: 'rgba(0,208,132,0.18)' },
  error:   { icon: AlertCircle,  color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)' },
  info:    { icon: Info,         color: '#60a5fa', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.2)'  },
  warning: { icon: AlertTriangle,color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
};

function ToastItem({ toast: t, onRemove }) {
  const [visible, setVisible] = useState(false);
  const s = STYLES[t.type] || STYLES.info;
  const Icon = s.icon;

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(t.id), 320);
    }, t.duration);
    return () => clearTimeout(timer);
  }, [t.id, t.duration, onRemove]);

  return (
    <div onClick={() => { setVisible(false); setTimeout(() => onRemove(t.id), 320); }}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 14px',
        background: '#111',
        border: `1px solid ${s.border}`,
        borderLeft: `3px solid ${s.color}`,
        borderRadius: 14,
        boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
        cursor: 'pointer',
        maxWidth: 340,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.96)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.32s cubic-bezier(.16,1,.3,1), opacity 0.32s ease',
      }}>
      <Icon style={{ color: s.color, flexShrink: 0, width: 16, height: 16 }} strokeWidth={2} />
      <p style={{ color: '#ddd', fontSize: 13, fontWeight: 500, flex: 1, lineHeight: 1.4 }}>{t.message}</p>
      <X style={{ color: '#444', flexShrink: 0, width: 13, height: 13 }} strokeWidth={2} />
    </div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((t) => setToasts(p => [...p.slice(-4), t]), []);
  const remove = useCallback((id) => setToasts(p => p.filter(x => x.id !== id)), []);

  useEffect(() => { _addToast = add; return () => { _addToast = null; }; }, [add]);

  if (!toasts.length) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8,
      alignItems: 'center', pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{ pointerEvents: 'all' }}>
          <ToastItem toast={t} onRemove={remove} />
        </div>
      ))}
    </div>
  );
}
