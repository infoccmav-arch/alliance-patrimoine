import { useState } from 'react';
import { Plus, Hammer, X, Edit2, TrendingUp, MapPin, ChevronRight } from 'lucide-react';

const STATUS_CONFIG = {
  'Recherche':   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: '🔍', label: 'Recherche'     },
  'Offre faite': { color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  icon: '📋', label: 'Offre faite'   },
  'Acheté':      { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', icon: '🔑', label: 'Acheté'        },
  'Rénovation':  { color: '#c084fc', bg: 'rgba(192,132,252,0.12)', icon: '🔨', label: 'En rénovation' },
  'Refinancé':   { color: '#00d084', bg: 'rgba(0,208,132,0.12)',   icon: '✅', label: 'Refinancé'     },
  'Loué':        { color: '#00d084', bg: 'rgba(0,208,132,0.12)',   icon: '🏠', label: 'Loué'          },
};

const TYPE_EMOJI = {
  'Maison':'🏡','Duplex':'🏘️','Triplex':'🏢','Quadruplex':'🏢',
  'Immeuble à revenus':'🏬','Commercial':'🏪',
};

const fmtM = (v) => v ? `${Number(v).toLocaleString('fr-CA')} $` : '—';
const fmtK = (v) => {
  const n = Number(v); if (!n) return '—';
  return n >= 1_000_000 ? `${(n/1_000_000).toFixed(1)}M$` : n >= 1000 ? `${(n/1000).toFixed(0)}k$` : `${n}$`;
};

const INPUT = { background: '#111', border: '1px solid #1f1f1f', color: '#fff', borderRadius: 12, padding: '10px 14px', fontSize: 13, width: '100%', outline: 'none' };
const LABEL = { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#3a3a3a', marginBottom: 5, display: 'block' };

function PropCard({ p, index, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const valeur  = +p.valeurActuelle || +p.prixAchat || 0;
  const hypo    = +p.hypotheque || 0;
  const nette   = valeur - hypo;
  const cf      = +p.cashflow || 0;
  const isPos   = cf >= 0;
  const status  = STATUS_CONFIG[p.status] || STATUS_CONFIG['Acheté'];
  const emoji   = TYPE_EMOJI[p.type] || '🏠';
  const gain    = valeur - (+p.prixAchat || 0);
  const gainPct = p.prixAchat && +p.prixAchat > 0 ? ((gain / +p.prixAchat) * 100) : 0;
  const brrrr   = p.valeurActuelle && p.hypotheque ? Math.max(0, (+p.valeurActuelle * 0.8) - +p.hypotheque) : 0;

  return (
    <div className="fade-up rounded-3xl overflow-hidden"
      style={{ background:'#0a0a0a', border:'1px solid rgba(255,255,255,0.06)', animationDelay:`${index*60}ms` }}>

      {/* Coloured header */}
      <div className="relative px-5 pt-5 pb-4"
        style={{ background:`linear-gradient(135deg, ${status.bg} 0%, rgba(0,0,0,0) 80%)` }}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl leading-none">{emoji}</span>
            <div>
              <p className="text-white font-bold text-sm leading-tight">
                {p.adresse ? p.adresse.split(',')[0] : `Propriété ${index+1}`}
              </p>
              {p.ville && (
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin className="w-2.5 h-2.5" style={{ color:'#444' }} />
                  <p className="text-[10px]" style={{ color:'#555' }}>{p.ville}</p>
                </div>
              )}
            </div>
          </div>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black flex-shrink-0"
            style={{ background:status.bg, color:status.color, border:`1px solid ${status.color}30` }}>
            {status.icon} {status.label}
          </span>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color:'#444' }}>Valeur actuelle</p>
            <p className="text-3xl font-black num text-white leading-none">{fmtK(valeur || 0)}</p>
            {gainPct !== 0 && (
              <p className="text-xs font-bold num mt-1" style={{ color: gain>=0?'#00d084':'#ff4d4d' }}>
                {gain>=0?'+':''}{fmtK(gain)} ({gainPct>=0?'+':''}{gainPct.toFixed(1)}%)
              </p>
            )}
          </div>
          {cf !== 0 && (
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color:'#444' }}>Cashflow</p>
              <div className="px-3 py-1.5 rounded-xl"
                style={{ background:isPos?'rgba(0,208,132,0.1)':'rgba(255,77,77,0.1)', border:`1px solid ${isPos?'rgba(0,208,132,0.2)':'rgba(255,77,77,0.2)'}` }}>
                <p className="text-base font-black num" style={{ color:isPos?'#00d084':'#ff4d4d' }}>
                  {isPos?'+':''}{cf.toLocaleString('fr-CA')} $/m
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-px" style={{ background:'rgba(255,255,255,0.04)' }}>
        {[
          { label:'Prix achat',   value:fmtK(p.prixAchat),   color:'#888'    },
          { label:'Valeur nette', value:fmtK(nette),          color:'#00d084' },
          { label:'Hypothèque',   value:fmtK(p.hypotheque),  color:'#818cf8' },
        ].map(({ label, value, color }) => (
          <div key={label} className="px-3 py-3 text-center" style={{ background:'#0a0a0a' }}>
            <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color:'#333' }}>{label}</p>
            <p className="text-sm font-black num mt-0.5" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* BRRRR chip */}
      {brrrr > 0 && (
        <div className="mx-4 my-3 flex items-center gap-2 px-3 py-2.5 rounded-xl"
          style={{ background:'rgba(0,208,132,0.06)', border:'1px solid rgba(0,208,132,0.1)' }}>
          <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" style={{ color:'#00d084' }} strokeWidth={2} />
          <p className="text-xs flex-1" style={{ color:'#555' }}>Capital récupérable (BRRRR 80%)</p>
          <p className="text-sm font-black num" style={{ color:'#00d084' }}>{fmtK(brrrr)}</p>
        </div>
      )}

      {/* Expand toggle */}
      <button onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-3 transition"
        style={{ borderTop:'1px solid rgba(255,255,255,0.04)', color:'#3a3a3a' }}
        onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'}
        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
        <span className="text-[10px] font-bold uppercase tracking-widest">Détails & actions</span>
        <ChevronRight className="w-3.5 h-3.5 transition-transform" style={{ transform:expanded?'rotate(90deg)':'none' }} />
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label:'Mise de fonds', value:fmtM(p.miseDefonds) },
              { label:'Taux intérêt',  value:p.tauxInteret?`${p.tauxInteret}%`:'—' },
              { label:'Coût réno',     value:fmtM(p.coutRenovation) },
              { label:'Revenu loc.',   value:fmtM(p.revenuLocatif), color:'#00d084' },
              { label:'Dépenses/m',    value:fmtM(p.depenses),      color:'#ff4d4d' },
              { label:'Type',          value:p.type||'—' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl px-3 py-2.5" style={{ background:'#111', border:'1px solid rgba(255,255,255,0.04)' }}>
                <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color:'#333' }}>{label}</p>
                <p className="text-xs font-bold num mt-0.5" style={{ color:color||'#666' }}>{value}</p>
              </div>
            ))}
          </div>
          {p.notes && <p className="text-xs leading-relaxed px-1" style={{ color:'#555' }}>{p.notes}</p>}
          <div className="flex gap-2 pt-1">
            <button onClick={() => onEdit(p)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition active:scale-95"
              style={{ background:'rgba(245,158,11,0.08)', color:'#f59e0b', border:'1px solid rgba(245,158,11,0.15)' }}>
              <Edit2 className="w-3 h-3" /> Modifier
            </button>
            <button onClick={() => onDelete(p.id)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition active:scale-95"
              style={{ background:'rgba(255,77,77,0.06)', color:'#ff4d4d', border:'1px solid rgba(255,77,77,0.12)' }}>
              <X className="w-3 h-3" /> Supprimer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const emptyProp = {
  adresse: '', ville: '', type: 'Maison', status: 'Recherche',
  prixAchat: '', miseDefonds: '', hypotheque: '', tauxInteret: '',
  valeurActuelle: '', revenuLocatif: '', depenses: '', cashflow: '',
  coutRenovation: '', notes: '',
};

export default function Proprietes({ proprietes, setProprietes, setCapital }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm]       = useState(emptyProp);
  const [editId, setEditId]   = useState(null);

  const totalValeur    = proprietes.reduce((s, p) => s + (+p.valeurActuelle || +p.prixAchat || 0), 0);
  const totalHypo      = proprietes.reduce((s, p) => s + (+p.hypotheque || 0), 0);
  const totalCashflow  = proprietes.reduce((s, p) => s + (+p.cashflow || 0), 0);
  const valeurNette    = totalValeur - totalHypo;

  const handleSubmit = () => {
    if (!form.adresse) return;
    const cashflow = (+form.revenuLocatif || 0) - (+form.depenses || 0);
    const entry = { ...form, id: editId || Date.now(), cashflow: +form.cashflow || cashflow };
    if (editId) {
      setProprietes(prev => prev.map(p => p.id === editId ? entry : p));
    } else {
      setProprietes(prev => [...prev, entry]);
      if (form.status === 'Acheté' || form.status === 'Rénovation') {
        setCapital(prev => prev - (+form.miseDefonds || 0) - (+form.coutRenovation || 0));
      }
    }
    setForm(emptyProp); setShowAdd(false); setEditId(null);
  };

  const handleEdit   = (p) => { setForm({ ...p }); setEditId(p.id); setShowAdd(true); };
  const handleDelete = (id) => setProprietes(prev => prev.filter(p => p.id !== id));

  return (
    <div className="space-y-6">

      {/* ── Header stats ── */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Valeur totale', value: fmtM(totalValeur), color: '#ffffff' },
          { label: 'Valeur nette',  value: fmtM(valeurNette),  color: '#00d084' },
          { label: 'Cashflow/mois', value: fmtM(totalCashflow), color: totalCashflow >= 0 ? '#00d084' : '#ff4d4d' },
          { label: 'Propriétés',   value: proprietes.length,    color: '#818cf8' },
        ].map(s => (
          <div key={s.label} style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14 }}
            className="px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#3a3a3a' }}>{s.label}</p>
            <p className="text-base font-black num mt-1 tracking-tight" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── BRRRR Banner ── */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
        style={{ background: 'rgba(129,140,248,0.07)', border: '1px solid rgba(129,140,248,0.12)' }}>
        <Hammer className="w-4 h-4 flex-shrink-0" style={{ color: '#818cf8' }} strokeWidth={1.8} />
        <div className="flex gap-3 text-xs font-bold flex-1">
          {['Acheter','Rénover','Louer','Refinancer','Répéter'].map((s, i) => (
            <span key={i} style={{ color: '#818cf8' }}>{s}</span>
          ))}
        </div>
      </div>

      {/* ── Add button ── */}
      <button onClick={() => { setForm(emptyProp); setEditId(null); setShowAdd(true); }}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition active:scale-98"
        style={{ background: 'rgba(245,158,11,0.08)', border: '1px dashed rgba(245,158,11,0.2)', color: '#f59e0b' }}>
        <Plus className="w-4 h-4" strokeWidth={2.5} />
        Ajouter une propriété
      </button>

      {/* ── Gallery ── */}
      {proprietes.length === 0 ? (
        <div className="py-16 text-center fade-up flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl"
            style={{ background: 'rgba(129,140,248,0.07)', border: '1px solid rgba(129,140,248,0.12)' }}>
            🏠
          </div>
          <div>
            <p className="text-white font-bold text-base">Aucune propriété encore</p>
            <p className="text-sm mt-1.5 max-w-[240px] mx-auto leading-relaxed" style={{ color: '#3a3a3a' }}>
              Ajoutez votre premier actif immobilier pour commencer à suivre votre portefeuille.
            </p>
          </div>
          <button onClick={() => { setForm(emptyProp); setEditId(null); setShowAdd(true); }}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition active:scale-95"
            style={{ background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)', color: '#818cf8' }}>
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Ajouter ma première propriété
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {proprietes.map((p, i) => (
            <PropCard key={p.id} p={p} index={i} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* ── Modal ── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-lg rounded-3xl p-5 fade-up max-h-[88vh] overflow-y-auto"
            style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 32px 80px rgba(0,0,0,0.9)' }}>

            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold text-base">{editId ? 'Modifier' : 'Ajouter'} une propriété</h3>
              <button onClick={() => { setShowAdd(false); setEditId(null); }}
                className="w-7 h-7 rounded-full flex items-center justify-center transition"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                <X className="w-3.5 h-3.5" style={{ color: '#5a5a5a' }} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label style={LABEL}>Adresse</label>
                <input style={INPUT} placeholder="123 Rue des Érables" value={form.adresse} onChange={e => setForm(p => ({ ...p, adresse: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Ville',            key: 'ville',          ph: 'Repentigny' },
                  { label: 'Type',             key: 'type',           type: 'select', opts: ['Maison','Duplex','Triplex','Quadruplex','Immeuble à revenus','Commercial'] },
                  { label: 'Statut',           key: 'status',         type: 'select', opts: Object.keys(STATUS_LABEL) },
                  { label: "Prix d'achat ($)", key: 'prixAchat',      ph: '400 000', num: true },
                  { label: 'Mise de fonds ($)',key: 'miseDefonds',    ph: '100 000', num: true },
                  { label: 'Hypothèque ($)',   key: 'hypotheque',     ph: '300 000', num: true },
                  { label: 'Taux intérêt (%)', key: 'tauxInteret',    ph: '5.5',     num: true, step: '0.1' },
                  { label: 'Valeur actuelle ($)', key: 'valeurActuelle', ph: '500 000', num: true },
                  { label: 'Revenu locatif/m ($)', key: 'revenuLocatif', ph: '3 500', num: true },
                  { label: 'Dépenses/mois ($)',    key: 'depenses',     ph: '2 800', num: true },
                  { label: 'Cashflow net/m ($)',   key: 'cashflow',     ph: '700',   num: true },
                  { label: 'Coût rénovation ($)',  key: 'coutRenovation', ph: '25 000', num: true },
                ].map(f => (
                  <div key={f.key}>
                    <label style={LABEL}>{f.label}</label>
                    {f.type === 'select'
                      ? <select style={INPUT} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}>
                          {f.opts.map(o => <option key={o}>{o}</option>)}
                        </select>
                      : <input type={f.num ? 'number' : 'text'} step={f.step} style={INPUT} placeholder={f.ph}
                          value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                    }
                  </div>
                ))}
              </div>
              <div>
                <label style={LABEL}>Notes</label>
                <textarea rows={2} style={{ ...INPUT, resize: 'none' }} placeholder="Notes sur la propriété..."
                  value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={handleSubmit}
                className="flex-1 py-3.5 rounded-2xl text-black font-bold text-sm transition active:scale-95"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}>
                {editId ? 'Sauvegarder' : 'Ajouter'}
              </button>
              <button onClick={() => { setShowAdd(false); setEditId(null); }}
                className="flex-1 py-3.5 rounded-2xl text-sm font-bold transition active:scale-95"
                style={{ background: '#1a1a1a', color: '#5a5a5a', border: '1px solid #222' }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
