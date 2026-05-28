import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ThumbsUp, ThumbsDown, Minus, Plus, X, MapPin,
  DollarSign, Calendar, CheckCircle2, XCircle,
  Clock, ChevronDown, ChevronUp, Building2, TrendingUp,
  Users, Award, AlertCircle
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtCAD(n) {
  if (!n) return '—';
  const v = Number(n);
  if (v >= 1_000_000) return `${(v/1_000_000).toFixed(2)}M$`;
  if (v >= 1_000) return `${(v/1_000).toFixed(0)}k$`;
  return `${v.toLocaleString('fr-CA')}$`;
}

function daysLeft(expiresAt) {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt) - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / 86_400_000);
}

function authorColor(name) {
  const palette = [
    ['#f59e0b','#fbbf24'],['#3b82f6','#60a5fa'],['#8b5cf6','#a78bfa'],
    ['#ec4899','#f472b6'],['#10b981','#34d399'],['#06b6d4','#22d3ee'],
    ['#f97316','#fb923c'],['#6366f1','#818cf8'],['#14b8a6','#2dd4bf'],
    ['#ef4444','#f87171'],
  ];
  let h = 0;
  for (let i = 0; i < (name||'').length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return palette[h % palette.length];
}

const STATUS_CONFIG = {
  active:   { label: 'En cours',  color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.2)',  icon: Clock },
  approved: { label: 'Approuvé', color: '#00d084', bg: 'rgba(0,208,132,0.1)',   border: 'rgba(0,208,132,0.2)',   icon: CheckCircle2 },
  rejected: { label: 'Rejeté',   color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.2)',   icon: XCircle },
  expired:  { label: 'Expiré',   color: '#6b7280', bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.15)', icon: AlertCircle },
};

const PROPERTY_TYPES = ['Duplex','Triplex','Quadruplex','Plex 5+','Maison','Commercial','Terrain','Autre'];

// ── Vote Bar ─────────────────────────────────────────────────────────────────
function VoteBar({ oui, non, abstention }) {
  const total = oui + non + abstention;
  if (total === 0) return (
    <div className="w-full h-2 rounded-full" style={{ background:'rgba(255,255,255,0.05)' }}>
      <div className="h-full w-0 rounded-full" />
    </div>
  );
  const pOui = Math.round((oui/total)*100);
  const pNon = Math.round((non/total)*100);
  const pAbs = 100 - pOui - pNon;

  return (
    <div className="space-y-1.5">
      <div className="w-full h-2.5 rounded-full overflow-hidden flex" style={{ background:'rgba(255,255,255,0.04)' }}>
        {pOui > 0 && <div style={{ width:`${pOui}%`, background:'linear-gradient(90deg,#00d084,#34d399)', transition:'width 0.6s ease' }} />}
        {pAbs > 0 && <div style={{ width:`${pAbs}%`, background:'rgba(107,114,128,0.5)', transition:'width 0.6s ease' }} />}
        {pNon > 0 && <div style={{ width:`${pNon}%`, background:'linear-gradient(90deg,#ef4444,#f87171)', transition:'width 0.6s ease' }} />}
      </div>
      <div className="flex justify-between text-[10px] font-bold">
        <span style={{ color:'#00d084' }}>{pOui}% OUI ({oui})</span>
        {abstention > 0 && <span style={{ color:'#6b7280' }}>{pAbs}% ABS</span>}
        <span style={{ color:'#ef4444' }}>{pNon}% NON ({non})</span>
      </div>
    </div>
  );
}

// ── Voter Avatars ─────────────────────────────────────────────────────────────
function VoterAvatars({ votes, membres }) {
  if (!votes || Object.keys(votes).length === 0) return null;
  return (
    <div className="flex items-center gap-1.5 flex-wrap mt-2">
      {Object.entries(votes).map(([username, choice]) => {
        const membre = membres.find(m => m.username === username);
        const name = membre?.nom || username;
        const [c1, c2] = authorColor(name);
        const emoji = choice === 'oui' ? '✅' : choice === 'non' ? '❌' : '➖';
        return (
          <div key={username} className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold"
            style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
            <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-black"
              style={{ background:`linear-gradient(135deg,${c1},${c2})` }}>
              {name.charAt(0).toUpperCase()}
            </div>
            <span style={{ color:'#888' }}>{name.split(' ')[0]}</span>
            <span>{emoji}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Proposal Card ─────────────────────────────────────────────────────────────
function ProposalCard({ proposal, currentUser, membres, onVote, onClose }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[proposal.status] || STATUS_CONFIG.active;
  const StatusIcon = cfg.icon;
  const myVote = proposal.votes?.[currentUser.username];
  const days = daysLeft(proposal.expiresAt);

  const counts = useMemo(() => {
    const v = proposal.votes || {};
    return {
      oui: Object.values(v).filter(x => x === 'oui').length,
      non: Object.values(v).filter(x => x === 'non').length,
      abstention: Object.values(v).filter(x => x === 'abstention').length,
    };
  }, [proposal.votes]);

  const total = counts.oui + counts.non + counts.abstention;
  const canVote = proposal.status === 'active' && (days === null || days > 0);

  const [c1, c2] = authorColor(proposal.proposedBy || '');
  const propMembre = membres.find(m => m.username === proposal.proposedBy);
  const propName = propMembre?.nom || proposal.proposedBy || 'Inconnu';

  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{ background:'#111', border:`1px solid ${cfg.border}`, boxShadow:'0 4px 24px rgba(0,0,0,0.5)' }}>

      {/* Header */}
      <div className="relative px-4 pt-4 pb-3" style={{ background:`linear-gradient(135deg, ${cfg.bg}, rgba(0,0,0,0))` }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1"
                style={{ background: cfg.bg, border:`1px solid ${cfg.border}`, color: cfg.color }}>
                <StatusIcon className="w-2.5 h-2.5" />
                {cfg.label}
              </span>
              {proposal.type && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.15)', color:'#f59e0b' }}>
                  {proposal.type}
                </span>
              )}
              {days !== null && days <= 3 && days > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold animate-pulse"
                  style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', color:'#ef4444' }}>
                  ⏰ {days}j restant{days > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <h3 className="text-white font-bold text-sm leading-tight">{proposal.title}</h3>
            {proposal.address && (
              <div className="flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3 flex-shrink-0" style={{ color:'#555' }} />
                <span className="text-[11px] truncate" style={{ color:'#555' }}>{proposal.address}</span>
              </div>
            )}
          </div>
          {currentUser.isAdmin && proposal.status === 'active' && (
            <button onClick={() => onClose(proposal.id)} className="w-7 h-7 rounded-lg flex items-center justify-center transition flex-shrink-0"
              style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.15)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}>
              <X className="w-3.5 h-3.5" style={{ color:'#ef4444' }} />
            </button>
          )}
        </div>

        {/* Price row */}
        {proposal.price && (
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
              style={{ background:'rgba(0,208,132,0.06)', border:'1px solid rgba(0,208,132,0.12)' }}>
              <DollarSign className="w-3.5 h-3.5" style={{ color:'#00d084' }} />
              <span className="text-white font-black text-sm num">{fmtCAD(proposal.price)}</span>
            </div>
            {proposal.cashflow && (
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl"
                style={{ background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.15)' }}>
                <TrendingUp className="w-3 h-3" style={{ color:'#818cf8' }} />
                <span className="text-xs font-bold num" style={{ color:'#818cf8' }}>{fmtCAD(proposal.cashflow)}/mo</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Vote section */}
      <div className="px-4 pb-3 pt-1 space-y-3" style={{ borderTop:'1px solid rgba(255,255,255,0.04)' }}>

        {/* Vote bar */}
        <VoteBar oui={counts.oui} non={counts.non} abstention={counts.abstention} />

        {/* Vote buttons */}
        {canVote ? (
          <div className="flex gap-2">
            {[
              { choice:'oui',        label:'OUI',    icon:ThumbsUp,   color:'#00d084', bg:'rgba(0,208,132,0.08)',  border:'rgba(0,208,132,0.2)' },
              { choice:'abstention', label:'ABS.',   icon:Minus,      color:'#6b7280', bg:'rgba(107,114,128,0.06)', border:'rgba(107,114,128,0.2)' },
              { choice:'non',        label:'NON',    icon:ThumbsDown, color:'#ef4444', bg:'rgba(239,68,68,0.08)',   border:'rgba(239,68,68,0.2)' },
            ].map(({ choice, label, icon: Icon, color, bg, border }) => {
              const active = myVote === choice;
              return (
                <button key={choice} onClick={() => onVote(proposal.id, choice)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95"
                  style={{
                    background: active ? bg : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? border : 'rgba(255,255,255,0.07)'}`,
                    color: active ? color : '#555',
                    boxShadow: active ? `0 0 12px ${bg}` : 'none',
                    transform: active ? 'scale(1.02)' : 'scale(1)',
                  }}>
                  <Icon className="w-3.5 h-3.5" strokeWidth={active ? 2.5 : 1.8} />
                  {label}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-2 text-xs font-semibold" style={{ color:'#444' }}>
            {proposal.status === 'active' ? 'Vote expiré' : `Vote ${cfg.label.toLowerCase()}`}
            {myVote && <span className="ml-2" style={{ color:'#666' }}>— Vous avez voté {myVote}</span>}
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center justify-between text-[10px]" style={{ color:'#444' }}>
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{total} vote{total !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-black"
              style={{ background:`linear-gradient(135deg,${c1},${c2})` }}>
              {propName.charAt(0).toUpperCase()}
            </div>
            <span>Proposé par <span style={{ color:'#666' }}>{propName}</span></span>
          </div>
          {proposal.expiresAt && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{days !== null ? (days > 0 ? `${days}j` : 'Expiré') : '—'}</span>
            </div>
          )}
        </div>

        {/* Expand toggle */}
        {(proposal.description || proposal.notes || (proposal.votes && Object.keys(proposal.votes).length > 0)) && (
          <button onClick={() => setExpanded(e => !e)}
            className="w-full flex items-center justify-center gap-1 py-1.5 rounded-xl text-[10px] font-semibold transition"
            style={{ color:'#444', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.04)' }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.05)'; e.currentTarget.style.color='#888'; }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.02)'; e.currentTarget.style.color='#444'; }}>
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? 'Moins de détails' : 'Voir détails'}
          </button>
        )}

        {/* Expanded details */}
        {expanded && (
          <div className="space-y-3 pt-1 fade-up">
            {proposal.description && (
              <div className="p-3 rounded-xl text-xs leading-relaxed" style={{ background:'rgba(255,255,255,0.03)', color:'#888', border:'1px solid rgba(255,255,255,0.05)' }}>
                {proposal.description}
              </div>
            )}
            {proposal.notes && (
              <div className="p-3 rounded-xl" style={{ background:'rgba(245,158,11,0.04)', border:'1px solid rgba(245,158,11,0.1)' }}>
                <p className="text-[10px] font-bold mb-1" style={{ color:'#f59e0b' }}>📝 Notes</p>
                <p className="text-xs" style={{ color:'#888' }}>{proposal.notes}</p>
              </div>
            )}
            <VoterAvatars votes={proposal.votes} membres={membres} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── New Proposal Form ─────────────────────────────────────────────────────────
function NewProposalForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({
    title: '', address: '', type: 'Duplex', price: '',
    cashflow: '', description: '', notes: '', days: '7',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSubmit(form);
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background:'#111', border:'1px solid rgba(0,208,132,0.2)', boxShadow:'0 8px 48px rgba(0,0,0,0.7)' }}>
      <div className="px-4 py-3" style={{ background:'rgba(0,208,132,0.05)', borderBottom:'1px solid rgba(0,208,132,0.1)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background:'rgba(0,208,132,0.1)', border:'1px solid rgba(0,208,132,0.2)' }}>
              <Building2 className="w-3.5 h-3.5" style={{ color:'#00d084' }} />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Nouvelle proposition</p>
              <p className="text-[10px]" style={{ color:'#3a3a3a' }}>Soumettez un immeuble au vote du groupe</p>
            </div>
          </div>
          <button onClick={onCancel} className="w-7 h-7 rounded-lg flex items-center justify-center transition"
            style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.04)'}>
            <X className="w-3.5 h-3.5" style={{ color:'#666' }} />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-3">
        {/* Title */}
        <div>
          <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-wider" style={{ color:'#555' }}>Titre de la proposition *</label>
          <input value={form.title} onChange={e => set('title', e.target.value)}
            placeholder="Ex: Triplex Rosemont — belle opportunité"
            className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-700 outline-none transition"
            style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}
            onFocus={e => e.target.style.border='1px solid rgba(0,208,132,0.3)'}
            onBlur={e => e.target.style.border='1px solid rgba(255,255,255,0.08)'}
            required />
        </div>

        {/* Address */}
        <div>
          <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-wider" style={{ color:'#555' }}>Adresse</label>
          <input value={form.address} onChange={e => set('address', e.target.value)}
            placeholder="Ex: 123 rue Laurier, Montréal, QC"
            className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-700 outline-none transition"
            style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}
            onFocus={e => e.target.style.border='1px solid rgba(0,208,132,0.3)'}
            onBlur={e => e.target.style.border='1px solid rgba(255,255,255,0.08)'} />
        </div>

        {/* Type + Price row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-wider" style={{ color:'#555' }}>Type</label>
            <select value={form.type} onChange={e => set('type', e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none transition"
              style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
              {PROPERTY_TYPES.map(t => <option key={t} value={t} style={{ background:'#1a1a1a' }}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-wider" style={{ color:'#555' }}>Prix demandé ($)</label>
            <input value={form.price} onChange={e => set('price', e.target.value)}
              placeholder="450000"
              type="number" min="0"
              className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-700 outline-none transition"
              style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}
              onFocus={e => e.target.style.border='1px solid rgba(0,208,132,0.3)'}
              onBlur={e => e.target.style.border='1px solid rgba(255,255,255,0.08)'} />
          </div>
        </div>

        {/* Cashflow + Duration row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-wider" style={{ color:'#555' }}>Cashflow /mois ($)</label>
            <input value={form.cashflow} onChange={e => set('cashflow', e.target.value)}
              placeholder="850"
              type="number"
              className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-700 outline-none transition"
              style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}
              onFocus={e => e.target.style.border='1px solid rgba(6,182,212,0.3)'}
              onBlur={e => e.target.style.border='1px solid rgba(255,255,255,0.08)'} />
          </div>
          <div>
            <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-wider" style={{ color:'#555' }}>Durée du vote</label>
            <select value={form.days} onChange={e => set('days', e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none transition"
              style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
              {[1,3,7,14,30].map(d => <option key={d} value={d} style={{ background:'#1a1a1a' }}>{d} jour{d>1?'s':''}</option>)}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-wider" style={{ color:'#555' }}>Description</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="Décrivez l'opportunité, le quartier, le potentiel..."
            rows={3}
            className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-700 outline-none transition resize-none"
            style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}
            onFocus={e => e.target.style.border='1px solid rgba(0,208,132,0.3)'}
            onBlur={e => e.target.style.border='1px solid rgba(255,255,255,0.08)'} />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-wider" style={{ color:'#555' }}>Notes internes</label>
          <input value={form.notes} onChange={e => set('notes', e.target.value)}
            placeholder="Inspection prévue, agent de contact..."
            className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-700 outline-none transition"
            style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}
            onFocus={e => e.target.style.border='1px solid rgba(245,158,11,0.3)'}
            onBlur={e => e.target.style.border='1px solid rgba(255,255,255,0.08)'} />
        </div>

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition"
            style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#555' }}
            onMouseEnter={e => e.currentTarget.style.color='#888'}
            onMouseLeave={e => e.currentTarget.style.color='#555'}>
            Annuler
          </button>
          <button type="submit"
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition active:scale-95"
            style={{ background:'linear-gradient(135deg,#00d084,#34d399)', color:'#000', boxShadow:'0 4px 16px rgba(0,208,132,0.25)' }}>
            Soumettre au vote
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Admin Result Actions ──────────────────────────────────────────────────────
function ResultActions({ proposal, onSetStatus }) {
  const counts = useMemo(() => {
    const v = proposal.votes || {};
    return {
      oui: Object.values(v).filter(x => x === 'oui').length,
      non: Object.values(v).filter(x => x === 'non').length,
    };
  }, [proposal.votes]);

  if (proposal.status !== 'active') return null;

  const winning = counts.oui > counts.non ? 'approved' : counts.non > counts.oui ? 'rejected' : null;

  return (
    <div className="flex gap-2 mt-2">
      <button onClick={() => onSetStatus(proposal.id, 'approved')}
        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition"
        style={{ background: winning==='approved' ? 'rgba(0,208,132,0.15)' : 'rgba(0,208,132,0.06)', border:'1px solid rgba(0,208,132,0.2)', color:'#00d084' }}
        onMouseEnter={e => e.currentTarget.style.background='rgba(0,208,132,0.2)'}
        onMouseLeave={e => e.currentTarget.style.background=winning==='approved'?'rgba(0,208,132,0.15)':'rgba(0,208,132,0.06)'}>
        <Award className="w-3.5 h-3.5" /> Approuver
      </button>
      <button onClick={() => onSetStatus(proposal.id, 'rejected')}
        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition"
        style={{ background: winning==='rejected' ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)', color:'#ef4444' }}
        onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.2)'}
        onMouseLeave={e => e.currentTarget.style.background=winning==='rejected'?'rgba(239,68,68,0.15)':'rgba(239,68,68,0.06)'}>
        <XCircle className="w-3.5 h-3.5" /> Rejeter
      </button>
    </div>
  );
}

// ── Stats Banner ──────────────────────────────────────────────────────────────
function VoteStats({ proposals }) {
  const active   = proposals.filter(p => p.status === 'active').length;
  const approved = proposals.filter(p => p.status === 'approved').length;
  const rejected = proposals.filter(p => p.status === 'rejected').length;

  if (proposals.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-2 mb-5">
      {[
        { label:'En cours',  value:active,   color:'#3b82f6', bg:'rgba(59,130,246,0.06)',  border:'rgba(59,130,246,0.12)' },
        { label:'Approuvés', value:approved, color:'#00d084', bg:'rgba(0,208,132,0.06)',   border:'rgba(0,208,132,0.12)' },
        { label:'Rejetés',   value:rejected, color:'#ef4444', bg:'rgba(239,68,68,0.06)',   border:'rgba(239,68,68,0.12)' },
      ].map(({ label, value, color, bg, border }) => (
        <div key={label} className="rounded-xl p-3 text-center" style={{ background:bg, border:`1px solid ${border}` }}>
          <p className="text-xl font-black num" style={{ color }}>{value}</p>
          <p className="text-[10px] font-semibold mt-0.5" style={{ color:'#555' }}>{label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Main Votes Page ───────────────────────────────────────────────────────────
export default function Votes({ votes, setVotes, membres }) {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');

  const handleNewProposal = (form) => {
    const expiresAt = new Date(Date.now() + Number(form.days) * 86_400_000).toISOString();
    const proposal = {
      id: `vote_${Date.now()}`,
      title: form.title.trim(),
      address: form.address.trim(),
      type: form.type,
      price: form.price ? Number(form.price) : null,
      cashflow: form.cashflow ? Number(form.cashflow) : null,
      description: form.description.trim(),
      notes: form.notes.trim(),
      expiresAt,
      status: 'active',
      proposedBy: user.username,
      createdAt: new Date().toISOString(),
      votes: {},
    };
    setVotes(prev => [proposal, ...prev]);
    setShowForm(false);
  };

  const handleVote = (proposalId, choice) => {
    setVotes(prev => prev.map(p => {
      if (p.id !== proposalId) return p;
      const existing = p.votes?.[user.username];
      const newVotes = { ...p.votes };
      if (existing === choice) {
        delete newVotes[user.username]; // toggle off
      } else {
        newVotes[user.username] = choice;
      }
      return { ...p, votes: newVotes };
    }));
  };

  const handleClose = (proposalId) => {
    setVotes(prev => prev.map(p =>
      p.id === proposalId ? { ...p, status: 'expired' } : p
    ));
  };

  const handleSetStatus = (proposalId, status) => {
    setVotes(prev => prev.map(p =>
      p.id === proposalId ? { ...p, status } : p
    ));
  };

  const filtered = useMemo(() => {
    const list = votes || [];
    if (filter === 'all') return list;
    return list.filter(p => p.status === filter);
  }, [votes, filter]);

  const FILTERS = [
    { id:'all',      label:'Tous' },
    { id:'active',   label:'En cours' },
    { id:'approved', label:'Approuvés' },
    { id:'rejected', label:'Rejetés' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div />
        <button onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition active:scale-95"
          style={{
            background: showForm ? 'rgba(239,68,68,0.08)' : 'linear-gradient(135deg,#00d084,#34d399)',
            color: showForm ? '#ef4444' : '#000',
            border: showForm ? '1px solid rgba(239,68,68,0.2)' : 'none',
            boxShadow: showForm ? 'none' : '0 4px 16px rgba(0,208,132,0.2)',
          }}>
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? 'Annuler' : 'Proposer un immeuble'}
        </button>
      </div>

      {/* New proposal form */}
      {showForm && (
        <div className="fade-up">
          <NewProposalForm onSubmit={handleNewProposal} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* Stats */}
      <VoteStats proposals={votes || []} />

      {/* Filter tabs */}
      {(votes || []).length > 0 && (
        <div className="flex gap-1.5 p-1 rounded-xl" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)' }}>
          {FILTERS.map(f => {
            const count = f.id === 'all' ? (votes||[]).length : (votes||[]).filter(p => p.status === f.id).length;
            const active = filter === f.id;
            return (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className="flex-1 py-1.5 rounded-lg text-[10px] font-bold transition"
                style={{
                  background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
                  color: active ? '#fff' : '#444',
                  border: active ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
                }}>
                {f.label}
                {count > 0 && <span className="ml-1 opacity-60">({count})</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Proposal cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 fade-up">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.12)' }}>
            <Building2 className="w-7 h-7" style={{ color:'#3b82f6' }} strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-sm">Aucune proposition</p>
            <p className="text-xs mt-1 max-w-xs" style={{ color:'#3a3a3a' }}>
              {filter === 'all'
                ? 'Soyez le premier à proposer un immeuble au groupe!'
                : `Aucune proposition ${FILTERS.find(f=>f.id===filter)?.label.toLowerCase()}.`}
            </p>
          </div>
          {filter === 'all' && !showForm && (
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
              style={{ background:'linear-gradient(135deg,#00d084,#34d399)', color:'#000', boxShadow:'0 4px 16px rgba(0,208,132,0.2)' }}>
              <Plus className="w-4 h-4" /> Faire une proposition
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(proposal => (
            <div key={proposal.id} className="fade-up">
              <ProposalCard
                proposal={proposal}
                currentUser={user}
                membres={membres || []}
                onVote={handleVote}
                onClose={handleClose}
              />
              {user.isAdmin && (
                <ResultActions proposal={proposal} onSetStatus={handleSetStatus} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
