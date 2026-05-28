import { useState, useEffect, useRef } from 'react';
import { Key, User, Shield, TrendingUp, DollarSign, Building2, Eye, EyeOff, Check, AlertCircle, Link2, ChevronRight, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from './Toast';

const INPUT = { background: '#111', border: '1px solid #222', color: '#fff', borderRadius: 14, padding: '12px 14px', fontSize: 14, width: '100%', outline: 'none' };
const LABEL = { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#444', marginBottom: 6, display: 'block' };

const fmtCAD = v => Number(v).toLocaleString('fr-CA');

// Avatar color palette — deterministic from initial
const AVATAR_COLORS = [
  ['#f59e0b','#b45309'], ['#00d084','#00956e'], ['#818cf8','#4f46e5'],
  ['#f87171','#dc2626'], ['#60a5fa','#2563eb'], ['#c084fc','#9333ea'],
  ['#fb923c','#ea580c'], ['#34d399','#059669'],
];
function avatarGrad(initial) {
  const idx = (initial.charCodeAt(0) - 65) % AVATAR_COLORS.length;
  const [a, b] = AVATAR_COLORS[Math.max(0, idx)];
  return `linear-gradient(135deg,${a},${b})`;
}

// Animated counter
function useCountUp(target, duration = 1200) {
  const [val, setVal] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    const start = performance.now();
    const animate = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const e = 1 - Math.pow(2, -10 * p);
      setVal(Math.round(target * e));
      if (p < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return val;
}

function StatCard({ label, value, rawValue, color, icon: Icon, suffix = '' }) {
  const animated = useCountUp(rawValue || 0);
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-2" style={{ background: `${color}08`, border: `1px solid ${color}18` }}>
      <Icon className="w-4 h-4" style={{ color }} strokeWidth={1.5} />
      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#444' }}>{label}</p>
      <p className="text-xl font-black num leading-none" style={{ color }}>
        {value ?? (animated.toLocaleString('fr-CA') + suffix)}
      </p>
    </div>
  );
}

// 12-month cotisation timeline
function CotisationTimeline({ transactions, membreId }) {
  const now = new Date();
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toISOString().substring(0, 7);
    const paid = transactions.some(t => t.membreId === membreId && t.categorie === 'Cotisation' && t.date?.startsWith(key));
    months.push({ key, label: d.toLocaleDateString('fr-CA', { month: 'short' }), paid, isCurrent: i === 0 });
  }
  const streak = (() => {
    let s = 0;
    for (let i = months.length - 1; i >= 0; i--) {
      if (months[i].paid) s++; else break;
    }
    return s;
  })();

  return (
    <div className="mt-5 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#3a3a3a' }}>Historique 12 mois</p>
        {streak > 0 && (
          <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
            🔥 {streak} mois consécutifs
          </span>
        )}
      </div>
      <div className="grid grid-cols-6 gap-1.5">
        {months.map(m => (
          <div key={m.key} className="flex flex-col items-center gap-1">
            <div className="w-full rounded-lg flex items-center justify-center text-[9px] font-black"
              style={{
                height: 28,
                background: m.paid ? 'rgba(0,208,132,0.15)' : 'rgba(255,255,255,0.03)',
                border: m.isCurrent ? '1px solid rgba(0,208,132,0.4)' : m.paid ? '1px solid rgba(0,208,132,0.2)' : '1px solid rgba(255,255,255,0.05)',
                color: m.paid ? '#00d084' : '#333',
                boxShadow: m.isCurrent && m.paid ? '0 0 8px rgba(0,208,132,0.2)' : 'none',
              }}>
              {m.paid ? '✓' : '·'}
            </div>
            <p className="text-[8px] font-semibold" style={{ color: '#2a2a2a' }}>{m.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Msg({ msg }) {
  if (!msg.text) return null;
  const isOk = msg.type === 'success';
  return (
    <div className="flex items-center gap-2 rounded-2xl px-4 py-3 fade-up"
      style={{ background: isOk ? 'rgba(0,208,132,0.07)' : 'rgba(239,68,68,0.07)', border: `1px solid ${isOk ? 'rgba(0,208,132,0.15)' : 'rgba(239,68,68,0.15)'}` }}>
      {isOk ? <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#00d084' }} />
             : <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-red-400" />}
      <p className="text-xs font-medium" style={{ color: isOk ? '#00d084' : '#f87171' }}>{msg.text}</p>
    </div>
  );
}

export default function Profil({ membres, transactions = [], proprietes = [], capital = 0 }) {
  const { user, changePassword, updateUser } = useAuth();
  const [pwdForm, setPwdForm] = useState({ old: '', new: '', confirm: '' });
  const [showPwd, setShowPwd] = useState({});
  const [msg, setMsg]         = useState({ type: '', text: '' });
  const [showLink, setShowLink] = useState(false);
  const [selMembre, setSelMembre] = useState(user?.membreId || '');

  const showMessage = (type, text) => {
    setMsg({ type, text });
    if (type === 'success') toast.success(text); else toast.error(text);
    setTimeout(() => setMsg({ type: '', text: '' }), 3500);
  };

  const handleChangePwd = () => {
    if (pwdForm.new !== pwdForm.confirm) return showMessage('error', 'Les mots de passe ne correspondent pas.');
    if (pwdForm.new.length < 6) return showMessage('error', 'Minimum 6 caractères.');
    const res = changePassword(user.id, pwdForm.old, pwdForm.new);
    if (res.ok) { showMessage('success', 'Mot de passe modifié!'); setPwdForm({ old:'', new:'', confirm:'' }); }
    else showMessage('error', res.error);
  };

  const handleLinkMembre = () => {
    updateUser(user.id, { membreId: selMembre || null });
    showMessage('success', 'Profil lié avec succès!');
    setShowLink(false);
  };

  const monMembre  = user?.membreId ? membres.find(m => String(m.id) === String(user.membreId)) : null;
  const totalM     = membres.filter(m => m.actif).length;
  const maCotis    = monMembre?.cotisation || 0;
  const totalCotis = membres.filter(m => m.actif).reduce((s, m) => s + (+m.cotisation || 0), 0);
  const partPct    = totalCotis > 0 ? (maCotis / totalCotis) * 100 : totalM > 0 ? (1 / totalM) * 100 : 0;
  const partVal    = capital * (partPct / 100);
  const maTxs      = transactions.filter(t => t.membreId === monMembre?.id);
  const totalPaid  = maTxs.filter(t => t.categorie === 'Cotisation').reduce((s, t) => s + t.montant, 0);
  const initials   = (user?.nom || user?.username || '?').charAt(0).toUpperCase();
  const proj10     = partVal * 18;

  return (
    <div className="space-y-4 pb-4">

      {/* ── Hero banner ── */}
      <div className="relative rounded-3xl overflow-hidden fade-up"
        style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Ambient glow */}
        <div style={{
          position: 'absolute', top: -30, right: -30,
          width: 180, height: 180, borderRadius: '50%',
          background: `radial-gradient(circle, ${avatarGrad(initials).match(/#[a-f0-9]+/i)?.[0] || '#f59e0b'}22 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        <div className="relative px-5 pt-6 pb-5">
          {/* Avatar + info */}
          <div className="flex items-center gap-4 mb-5">
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-black"
                style={{ background: avatarGrad(initials), boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                {initials}
              </div>
              {user?.isAdmin && (
                <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: '#f59e0b', border: '2px solid #0a0a0a' }}>
                  <Shield className="w-3 h-3 text-black" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-black text-xl leading-tight truncate">{user?.nom || user?.username}</p>
              <p className="text-sm mt-0.5" style={{ color: '#444' }}>@{user?.username}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {user?.isAdmin && (
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest"
                    style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b' }}>
                    Administrateur
                  </span>
                )}
                {monMembre && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(0,208,132,0.08)', border: '1px solid rgba(0,208,132,0.15)', color: '#00d084' }}>
                    {monMembre.role || 'Actionnaire'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Part % big display */}
          {monMembre && (
            <div className="flex items-center justify-between px-4 py-3 rounded-2xl"
              style={{ background: 'rgba(0,208,132,0.06)', border: '1px solid rgba(0,208,132,0.12)' }}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#3a3a3a' }}>Ma part du groupe</p>
                <p className="text-3xl font-black num" style={{ color: '#00d084' }}>{partPct.toFixed(1)}%</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#3a3a3a' }}>Projection 10 ans</p>
                <p className="text-lg font-black num" style={{ color: '#f59e0b' }}>
                  {proj10 >= 1_000_000 ? `${(proj10/1_000_000).toFixed(1)}M$` : proj10 >= 1000 ? `${(proj10/1000).toFixed(0)}k$` : `${Math.round(proj10)}$`}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Msg msg={msg} />

      {/* ── Animated stats grid ── */}
      {monMembre && (
        <div className="grid grid-cols-2 gap-2.5 fade-up">
          <StatCard label="Cotisation / mois" rawValue={maCotis} suffix=" $" color="#00d084" icon={TrendingUp} />
          <StatCard label="Total versé" rawValue={totalPaid} suffix=" $" color="#10b981" icon={DollarSign} />
          <StatCard label="Valeur de ma part" rawValue={Math.round(partVal)} suffix=" $" color="#f59e0b" icon={Building2} />
          <StatCard label="Mois de cotisation" rawValue={maTxs.filter(t=>t.categorie==='Cotisation').length} color="#818cf8" icon={Star} />
        </div>
      )}

      {/* ── Cotisation timeline ── */}
      {monMembre && (
        <div className="rounded-3xl p-4 fade-up" style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.06)' }}>
          <CotisationTimeline transactions={transactions} membreId={monMembre.id} />
        </div>
      )}

      {/* ── Lier au membre ── */}
      <div className="rounded-2xl overflow-hidden fade-up" style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => setShowLink(true)}
          className="w-full flex items-center gap-3 px-4 py-4 transition"
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: monMembre ? 'rgba(0,208,132,0.1)' : 'rgba(255,255,255,0.05)' }}>
            <Link2 className="w-4 h-4" style={{ color: monMembre ? '#00d084' : '#555' }} strokeWidth={1.8} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-white font-semibold text-sm">{monMembre ? `Lié à ${monMembre.nom}` : 'Lier à un membre'}</p>
            <p className="text-xs mt-0.5" style={{ color: '#444' }}>
              {monMembre ? 'Voir vos statistiques personnalisées' : 'Connectez votre compte à votre profil membre'}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: '#333' }} />
        </button>
      </div>

      {/* ── Change password ── */}
      <div className="rounded-3xl p-5 fade-up" style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)' }}>
            <Key className="w-4 h-4 text-amber-400" strokeWidth={1.8} />
          </div>
          <p className="text-white font-bold text-sm">Changer le mot de passe</p>
        </div>
        <div className="space-y-3">
          {[
            { key: 'old',     label: 'Mot de passe actuel',   placeholder: '••••••••' },
            { key: 'new',     label: 'Nouveau mot de passe',  placeholder: 'Minimum 6 caractères' },
            { key: 'confirm', label: 'Confirmer',             placeholder: 'Répétez...' },
          ].map(f => (
            <div key={f.key}>
              <label style={LABEL}>{f.label}</label>
              <div className="relative">
                <input type={showPwd[f.key] ? 'text' : 'password'} style={{ ...INPUT, paddingRight: 44 }}
                  placeholder={f.placeholder} value={pwdForm[f.key]}
                  onChange={e => setPwdForm(p => ({ ...p, [f.key]: e.target.value }))} />
                <button type="button" onClick={() => setShowPwd(p => ({ ...p, [f.key]: !p[f.key] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#444' }}>
                  {showPwd[f.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
        <button onClick={handleChangePwd}
          className="w-full mt-4 py-3.5 rounded-2xl text-black font-bold text-sm transition active:scale-95"
          style={{ background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', boxShadow: '0 6px 20px rgba(245,158,11,0.2)' }}>
          Mettre à jour
        </button>
      </div>

      {/* ── Link membre modal ── */}
      {showLink && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4"
          style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}>
          <div className="w-full max-w-sm rounded-3xl p-6 fade-up"
            style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold text-base">Lier à un membre</h3>
              <button onClick={() => setShowLink(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <span className="text-slate-400 text-xs font-bold">✕</span>
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <button onClick={() => setSelMembre('')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition"
                style={{ background: !selMembre ? 'rgba(255,255,255,0.06)' : 'transparent', border: !selMembre ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent' }}>
                <span className="text-sm text-white">Aucun lien</span>
              </button>
              {membres.filter(m => m.actif).map(m => {
                const init = m.nom.charAt(0).toUpperCase();
                const isSelected = String(selMembre) === String(m.id);
                return (
                  <button key={m.id} onClick={() => setSelMembre(String(m.id))}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition"
                    style={{ background: isSelected ? 'rgba(0,208,132,0.06)' : 'transparent', border: isSelected ? '1px solid rgba(0,208,132,0.2)' : '1px solid transparent' }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-black flex-shrink-0"
                      style={{ background: avatarGrad(init) }}>
                      {init}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-white text-sm font-semibold">{m.nom}</p>
                      <p className="text-[10px]" style={{ color: '#444' }}>{fmtCAD(m.cotisation)} $/mois · {m.role}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4" style={{ color: '#00d084' }} />}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleLinkMembre}
                className="flex-1 py-3.5 rounded-2xl text-black font-bold text-sm transition active:scale-95"
                style={{ background: 'linear-gradient(135deg,#f59e0b,#fbbf24)' }}>
                Confirmer
              </button>
              <button onClick={() => setShowLink(false)}
                className="flex-1 py-3.5 rounded-2xl text-sm font-bold"
                style={{ background: '#1a1a1a', color: '#555', border: '1px solid #222' }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
