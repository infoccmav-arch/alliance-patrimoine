import { useState } from 'react';
import { Key, User, Shield, TrendingUp, DollarSign, Building2, Eye, EyeOff, Check, AlertCircle, Link2, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from './Toast';

const CARD  = { background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20 };
const INPUT = { background: '#111', border: '1px solid #222', color: '#fff', borderRadius: 14, padding: '12px 14px', fontSize: 14, width: '100%', outline: 'none' };
const LABEL = { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#444', marginBottom: 6, display: 'block' };

const fmtCAD = v => v.toLocaleString('fr-CA');

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

export default function Profil({ membres, transactions = [], proprietes = [], capital = 0, onEditMembre }) {
  const { user, users, changePassword, updateUser } = useAuth();
  const [pwdForm, setPwdForm]   = useState({ old: '', new: '', confirm: '' });
  const [showPwd, setShowPwd]   = useState({});
  const [msg, setMsg]           = useState({ type: '', text: '' });
  const [showLinkModal, setShowLink] = useState(false);
  const [selectedMembre, setSelMembre] = useState(user?.membreId || '');

  const showMessage = (type, text) => {
    setMsg({ type, text });
    if (type === 'success') toast.success(text);
    else toast.error(text);
    setTimeout(() => setMsg({ type: '', text: '' }), 3500);
  };

  const handleChangePwd = () => {
    if (pwdForm.new !== pwdForm.confirm) return showMessage('error', 'Les mots de passe ne correspondent pas.');
    if (pwdForm.new.length < 6) return showMessage('error', 'Minimum 6 caractères.');
    const res = changePassword(user.id, pwdForm.old, pwdForm.new);
    if (res.ok) {
      showMessage('success', 'Mot de passe modifié avec succès!');
      setPwdForm({ old: '', new: '', confirm: '' });
    } else {
      showMessage('error', res.error);
    }
  };

  const handleLinkMembre = () => {
    updateUser(user.id, { membreId: selectedMembre || null });
    showMessage('success', 'Profil membre lié avec succès!');
    setShowLink(false);
  };

  // Find linked member
  const monMembre = user?.membreId
    ? membres.find(m => String(m.id) === String(user.membreId))
    : null;

  // Personal stats
  const totalM     = membres.filter(m => m.actif).length;
  const partPct    = totalM > 0 ? (1 / totalM) * 100 : 0;
  const partVal    = totalM > 0 ? capital / totalM : 0;
  const maTxs      = transactions.filter(t => t.membreId === monMembre?.id);
  const totalPaid  = maTxs.filter(t => t.categorie === 'Cotisation').reduce((s, t) => s + t.montant, 0);
  const moisPaids  = maTxs.filter(t => t.categorie === 'Cotisation').length;

  const initials = (user?.nom || user?.username || '?').charAt(0).toUpperCase();

  return (
    <div className="space-y-4 pb-4">

      {/* ── Avatar card ── */}
      <div style={{ ...CARD, padding: 20 }}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-black text-2xl font-black"
            style={{ background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', boxShadow: '0 8px 24px rgba(245,158,11,0.3)' }}>
            {initials}
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-lg leading-tight">{user?.nom || user?.username}</p>
            <p className="text-sm mt-0.5" style={{ color: '#555' }}>@{user?.username}</p>
            <div className="flex items-center gap-2 mt-2">
              {user?.isAdmin && (
                <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest"
                  style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b' }}>
                  <Shield className="w-3 h-3" /> Admin
                </span>
              )}
              {monMembre && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(0,208,132,0.08)', border: '1px solid rgba(0,208,132,0.15)', color: '#00d084' }}>
                  Membre actif
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <Msg msg={msg} />

      {/* ── Lier au membre ── */}
      <div style={CARD} className="overflow-hidden">
        <button onClick={() => setShowLink(true)}
          className="w-full flex items-center gap-3 px-4 py-4 transition"
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: monMembre ? 'rgba(0,208,132,0.1)' : 'rgba(255,255,255,0.05)' }}>
            <Link2 className="w-4 h-4" style={{ color: monMembre ? '#00d084' : '#555' }} strokeWidth={1.8} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-white font-semibold text-sm">
              {monMembre ? `Lié à ${monMembre.nom}` : 'Lier à un membre'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#444' }}>
              {monMembre ? 'Voir vos statistiques personnalisées' : 'Connectez votre compte à votre profil membre'}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: '#333' }} />
        </button>
      </div>

      {/* ── Stats personnelles (si lié) ── */}
      {monMembre && (
        <div style={CARD} className="p-4">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#3a3a3a' }}>Mes statistiques</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Cotisation mensuelle', value: `${fmtCAD(monMembre.cotisation)} $`, color: '#00d084', icon: TrendingUp },
              { label: 'Total versé',           value: `${fmtCAD(totalPaid)} $`,           color: '#10b981', icon: DollarSign },
              { label: 'Ma part du groupe',     value: `${partPct.toFixed(1)} %`,          color: '#818cf8', icon: User },
              { label: 'Valeur de ma part',     value: fmtCAD(partVal) + ' $',             color: '#f59e0b', icon: Building2 },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="rounded-2xl p-3.5"
                  style={{ background: `${s.color}08`, border: `1px solid ${s.color}15` }}>
                  <Icon className="w-4 h-4 mb-2" style={{ color: s.color }} strokeWidth={1.5} />
                  <p className="text-xs font-medium mb-1" style={{ color: '#444' }}>{s.label}</p>
                  <p className="text-base font-black num" style={{ color: s.color }}>{s.value}</p>
                </div>
              );
            })}
          </div>

          {/* Cotisation history */}
          {maTxs.length > 0 && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#3a3a3a' }}>
                Historique ({moisPaids} paiement{moisPaids !== 1 ? 's' : ''})
              </p>
              <div className="space-y-1">
                {maTxs.slice(0, 8).map(t => (
                  <div key={t.id} className="flex items-center justify-between py-2"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <div>
                      <p className="text-xs font-medium" style={{ color: '#aaa' }}>{t.description || t.categorie}</p>
                      <p className="text-[10px]" style={{ color: '#333' }}>{t.date}</p>
                    </div>
                    <span className="text-xs font-bold num" style={{ color: t.type === 'entree' ? '#00d084' : '#f87171' }}>
                      +{fmtCAD(t.montant)} $
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Changer mot de passe ── */}
      <div style={{ ...CARD, padding: 20 }}>
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-4 h-4 text-amber-400" strokeWidth={1.8} />
          <p className="text-white font-semibold text-sm">Changer le mot de passe</p>
        </div>
        <div className="space-y-3">
          {[
            { key: 'old',     label: 'Mot de passe actuel',    placeholder: '••••••••' },
            { key: 'new',     label: 'Nouveau mot de passe',   placeholder: 'Minimum 6 caractères' },
            { key: 'confirm', label: 'Confirmer',              placeholder: 'Répétez...' },
          ].map(f => (
            <div key={f.key}>
              <label style={LABEL}>{f.label}</label>
              <div className="relative">
                <input
                  type={showPwd[f.key] ? 'text' : 'password'}
                  style={{ ...INPUT, paddingRight: 44 }}
                  placeholder={f.placeholder}
                  value={pwdForm[f.key]}
                  onChange={e => setPwdForm(p => ({ ...p, [f.key]: e.target.value }))}
                />
                <button type="button"
                  onClick={() => setShowPwd(p => ({ ...p, [f.key]: !p[f.key] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition"
                  style={{ color: '#444' }}>
                  {showPwd[f.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
        <button onClick={handleChangePwd}
          className="w-full mt-4 py-3.5 rounded-2xl text-black font-bold text-sm transition active:scale-95"
          style={{ background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', boxShadow: '0 6px 20px rgba(245,158,11,0.2)' }}>
          Mettre à jour le mot de passe
        </button>
      </div>

      {/* ── Link membre modal ── */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-3xl p-6 fade-up"
            style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold text-base">Lier à un membre</h3>
              <button onClick={() => setShowLink(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                <span className="text-slate-400 text-xs font-bold">✕</span>
              </button>
            </div>
            <p className="text-sm mb-4" style={{ color: '#555' }}>
              Sélectionnez votre profil membre pour voir vos statistiques personnalisées.
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <button onClick={() => setSelMembre('')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition"
                style={{
                  background: !selectedMembre ? 'rgba(255,255,255,0.06)' : 'transparent',
                  border: !selectedMembre ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent'
                }}>
                <span className="text-sm text-white">Aucun lien</span>
              </button>
              {membres.filter(m => m.actif).map(m => (
                <button key={m.id} onClick={() => setSelMembre(String(m.id))}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition"
                  style={{
                    background: String(selectedMembre) === String(m.id) ? 'rgba(0,208,132,0.06)' : 'transparent',
                    border: String(selectedMembre) === String(m.id) ? '1px solid rgba(0,208,132,0.2)' : '1px solid transparent'
                  }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-black text-xs font-black"
                    style={{ background: 'linear-gradient(135deg,#f59e0b,#fbbf24)' }}>
                    {m.nom.charAt(0)}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white text-sm font-medium">{m.nom}</p>
                    <p className="text-[10px]" style={{ color: '#444' }}>{fmtCAD(m.cotisation)} $/mois</p>
                  </div>
                  {String(selectedMembre) === String(m.id) && (
                    <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#00d084' }} />
                  )}
                </button>
              ))}
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
