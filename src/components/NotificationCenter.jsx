import { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCheck, DollarSign, Target, Building2, AlertCircle, TrendingUp } from 'lucide-react';

const STORAGE_KEY = 'ig_notifications';
const READ_KEY    = 'ig_notif_read';

// ── helpers ─────────────────────────────────────────────────────────────────
function load(key, def) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// Types: 'cotisation' | 'objectif' | 'propriete' | 'capital' | 'info'
const ICONS = {
  cotisation: DollarSign,
  objectif:   Target,
  propriete:  Building2,
  capital:    TrendingUp,
  info:       AlertCircle,
};
const COLORS = {
  cotisation: '#10b981',
  objectif:   '#f59e0b',
  propriete:  '#60a5fa',
  capital:    '#10b981',
  info:       '#94a3b8',
};

// ── public API used by App.jsx ───────────────────────────────────────────────
export function pushNotification({ titre, message, type = 'info' }) {
  const notifs = load(STORAGE_KEY, []);
  const entry  = { id: Date.now(), titre, message, type, date: new Date().toISOString(), lu: false };
  save(STORAGE_KEY, [entry, ...notifs].slice(0, 50)); // keep max 50
}

// ── check for monthly cotisation reminder ───────────────────────────────────
export function checkCotisationReminder(membres) {
  const key    = 'ig_cotisation_last_remind';
  const now    = new Date();
  const moisCle = `${now.getFullYear()}-${now.getMonth()}`;
  const last   = localStorage.getItem(key);
  if (last === moisCle) return; // already reminded this month
  const cotisation = membres.filter(m => m.actif).reduce((s, m) => s + m.cotisation, 0);
  pushNotification({
    titre:   'Rappel cotisation du mois',
    message: `Les ${membres.filter(m => m.actif).length} membres doivent cotiser au total ${cotisation.toLocaleString('fr-CA')} $ ce mois-ci. Pensez à l'enregistrer dans Finances.`,
    type:    'cotisation',
  });
  localStorage.setItem(key, moisCle);
}

// ── check if an investment goal was just reached ─────────────────────────────
const OBJECTIFS = [
  { seuil: 25000,   label: '25 000 $',  msg: 'Vous approchez de votre première mise de fonds!' },
  { seuil: 50000,   label: '50 000 $',  msg: 'Super — vous êtes à mi-chemin de votre objectif initial!' },
  { seuil: 100000,  label: '100 000 $', msg: 'Capital de 100k$ atteint — prêts pour le premier achat immobilier!' },
  { seuil: 200000,  label: '200 000 $', msg: 'Capital de 200k$ — possibilité d\'une franchise en vue!' },
  { seuil: 500000,  label: '500 000 $', msg: 'Demi-million de capital! L\'empire financier prend forme.' },
  { seuil: 1000000, label: '1 000 000 $', msg: 'Premier million de capital atteint. Incroyable!' },
];

export function checkCapitalGoals(capital) {
  const fired = load('ig_goals_fired', []);
  OBJECTIFS.forEach(obj => {
    if (capital >= obj.seuil && !fired.includes(obj.seuil)) {
      pushNotification({
        titre:   `🎯 Objectif ${obj.label} atteint!`,
        message: obj.msg,
        type:    'objectif',
      });
      fired.push(obj.seuil);
    }
  });
  save('ig_goals_fired', fired);
}

// ── propriete / valeur nette goals ──────────────────────────────────────────
const IMMO_OBJECTIFS = [
  { seuil: 1, label: '1ère propriété', msg: 'Félicitations pour votre 1ère acquisition! Stratégie BRRRR en marche.' },
  { seuil: 3, label: '3 propriétés',   msg: '3 propriétés dans le portfolio — phase d\'accélération déclenchée!' },
  { seuil: 5, label: '5 propriétés',   msg: 'Un immeuble à revenus en vue! 5 propriétés, c\'est du solide.' },
];

export function checkProprieteGoals(count) {
  const fired = load('ig_immo_goals_fired', []);
  IMMO_OBJECTIFS.forEach(obj => {
    if (count >= obj.seuil && !fired.includes(obj.seuil)) {
      pushNotification({
        titre:   `🏠 Objectif — ${obj.label}!`,
        message: obj.msg,
        type:    'propriete',
      });
      fired.push(obj.seuil);
    }
  });
  save('ig_immo_goals_fired', fired);
}

// ── Component ────────────────────────────────────────────────────────────────
export default function NotificationCenter() {
  const [notifs, setNotifs]   = useState(() => load(STORAGE_KEY, []));
  const [open, setOpen]       = useState(false);
  const panelRef              = useRef(null);

  // Poll for new notifications every 3 seconds
  useEffect(() => {
    const id = setInterval(() => {
      const fresh = load(STORAGE_KEY, []);
      setNotifs(fresh);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = e => { if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const unread = notifs.filter(n => !n.lu).length;

  const markAllRead = () => {
    const updated = notifs.map(n => ({ ...n, lu: true }));
    save(STORAGE_KEY, updated);
    setNotifs(updated);
  };

  const markOne = id => {
    const updated = notifs.map(n => n.id === id ? { ...n, lu: true } : n);
    save(STORAGE_KEY, updated);
    setNotifs(updated);
  };

  const deleteOne = id => {
    const updated = notifs.filter(n => n.id !== id);
    save(STORAGE_KEY, updated);
    setNotifs(updated);
  };

  const fmt = iso => {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    if (diff < 60000)      return 'À l\'instant';
    if (diff < 3600000)    return `Il y a ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000)   return `Il y a ${Math.floor(diff / 3600000)}h`;
    return d.toLocaleDateString('fr-CA', { day:'numeric', month:'short' });
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => { setOpen(o => !o); if (!open) {} }}
        className="relative w-9 h-9 rounded-full flex items-center justify-center transition hover:scale-105"
        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4 text-slate-300" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
            style={{ background: '#ef4444', boxShadow: '0 0 0 2px #060d18' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute right-0 top-12 w-80 max-h-[70vh] flex flex-col rounded-2xl shadow-2xl z-50 overflow-hidden"
          style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <span className="text-white font-semibold text-sm">Notifications</span>
              {unread > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                  {unread} new
                </span>
              )}
            </div>
            {unread > 0 && (
              <button onClick={markAllRead}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-amber-400 transition"
                title="Tout marquer comme lu">
                <CheckCheck className="w-3.5 h-3.5" />
                Tout lire
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {notifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Bell className="w-8 h-8 text-slate-700" />
                <p className="text-slate-600 text-sm">Aucune notification</p>
              </div>
            ) : (
              <div>
                {notifs.map(n => {
                  const Icon  = ICONS[n.type] || AlertCircle;
                  const color = COLORS[n.type] || '#94a3b8';
                  return (
                    <div key={n.id}
                      onClick={() => markOne(n.id)}
                      className="flex gap-3 px-4 py-3.5 cursor-pointer transition group"
                      style={{
                        background: n.lu ? 'transparent' : 'rgba(245,158,11,0.04)',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = n.lu ? 'transparent' : 'rgba(245,158,11,0.04)'}
                    >
                      {/* Icon */}
                      <div className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-0.5"
                        style={{ background: `${color}18` }}>
                        <Icon className="w-4 h-4" style={{ color }} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold leading-snug"
                            style={{ color: n.lu ? '#94a3b8' : '#fff' }}>
                            {n.titre}
                          </p>
                          <button
                            onClick={e => { e.stopPropagation(); deleteOne(n.id); }}
                            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition p-0.5 rounded-md hover:bg-white/10"
                          >
                            <X className="w-3 h-3 text-slate-500" />
                          </button>
                        </div>
                        <p className="text-xs mt-0.5 leading-relaxed"
                          style={{ color: n.lu ? '#475569' : '#94a3b8' }}>
                          {n.message}
                        </p>
                        <p className="text-[10px] mt-1.5 font-medium" style={{ color: '#475569' }}>
                          {fmt(n.date)}
                        </p>
                      </div>

                      {/* Unread dot */}
                      {!n.lu && (
                        <div className="flex-shrink-0 w-2 h-2 rounded-full mt-2"
                          style={{ background: color }} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifs.length > 0 && (
            <div className="px-4 py-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button
                onClick={() => { save(STORAGE_KEY, []); setNotifs([]); }}
                className="w-full text-xs text-slate-600 hover:text-slate-400 transition py-1">
                Effacer toutes les notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
