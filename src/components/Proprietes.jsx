import { useState } from 'react';
import { Building2, Plus, Hammer, X, Edit2, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import Sparkline, { generateSparkData } from './Sparkline';

const STATUS_DOT = {
  'Recherche':  '#f59e0b',
  'Offre faite':'#fb923c',
  'Acheté':     '#a78bfa',
  'Rénovation': '#c084fc',
  'Refinancé':  '#00d084',
  'Loué':       '#00d084',
};

const STATUS_LABEL = {
  'Recherche':  'Recherche',
  'Offre faite':'Offre faite',
  'Acheté':     'Acheté',
  'Rénovation': 'Rénovation',
  'Refinancé':  'Refinancé ✓',
  'Loué':       'Loué',
};

const fmtM = (v) => v ? `${Number(v).toLocaleString('fr-CA')} $` : '—';

const INPUT  = { background: '#111', border: '1px solid #1f1f1f', color: '#fff', borderRadius: 12, padding: '10px 14px', fontSize: 13, width: '100%', outline: 'none' };
const LABEL  = { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#3a3a3a', marginBottom: 5, display: 'block' };

const emptyProp = {
  adresse: '', ville: '', type: 'Maison', status: 'Recherche',
  prixAchat: '', miseDefonds: '', hypotheque: '', tauxInteret: '',
  valeurActuelle: '', revenuLocatif: '', depenses: '', cashflow: '',
  coutRenovation: '', notes: '',
};

export default function Proprietes({ proprietes, setProprietes, setCapital }) {
  const [showAdd, setShowAdd]   = useState(false);
  const [form, setForm]         = useState(emptyProp);
  const [editId, setEditId]     = useState(null);
  const [expandId, setExpandId] = useState(null);

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

      {/* ── Property list — Wealthsimple asset card style ── */}
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
        <div>
          {proprietes.map((p, i) => {
            const valeur   = +p.valeurActuelle || +p.prixAchat || 0;
            const hypo     = +p.hypotheque || 0;
            const nette    = valeur - hypo;
            const cf       = +p.cashflow || 0;
            const isPos    = cf >= 0;
            const dotColor = STATUS_DOT[p.status] || '#5a5a5a';
            const expanded = expandId === p.id;
            const spark    = generateSparkData(p.id || i + 300, 14, 1.5);

            return (
              <div key={p.id}>
                {/* Main row */}
                <button onClick={() => setExpandId(expanded ? null : p.id)}
                  className="w-full flex items-center gap-4 py-4 text-left transition-all duration-150"
                  style={{ borderBottom: expanded ? 'none' : '1px solid rgba(255,255,255,0.04)', background: 'transparent' }}>

                  {/* Icon circle */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-base"
                    style={{ background: 'rgba(129,140,248,0.12)' }}>
                    🏠
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-white truncate">
                        {p.adresse ? p.adresse.split(',')[0] : `Propriété ${i + 1}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dotColor }} />
                      <p className="text-xs truncate" style={{ color: '#5a5a5a' }}>
                        {p.ville || ''}{p.ville ? ' · ' : ''}{STATUS_LABEL[p.status] || p.status}
                      </p>
                    </div>
                  </div>

                  {/* Sparkline */}
                  <div className="flex-shrink-0 opacity-70">
                    <Sparkline data={spark} positive={isPos} width={52} height={22} />
                  </div>

                  {/* Value */}
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-bold num text-white">{fmtM(valeur)}</p>
                    <p className="text-xs font-semibold num mt-0.5" style={{ color: isPos ? '#00d084' : '#ff4d4d' }}>
                      {cf !== 0 ? `${isPos ? '+' : ''}${cf.toLocaleString('fr-CA')} $/m` : '—'}
                    </p>
                  </div>
                </button>

                {/* Expanded detail */}
                {expanded && (
                  <div className="pb-4 mb-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="rounded-2xl p-4 space-y-3"
                      style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.05)' }}>

                      {/* Key metrics */}
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: 'Prix achat', value: fmtM(p.prixAchat) },
                          { label: 'Valeur actuelle', value: fmtM(p.valeurActuelle || p.prixAchat), color: '#f59e0b' },
                          { label: 'Valeur nette',    value: fmtM(nette), color: '#00d084' },
                          { label: 'Hypothèque',      value: fmtM(p.hypotheque) },
                          { label: 'Mise de fonds',   value: fmtM(p.miseDefonds) },
                          { label: 'Taux intérêt',    value: p.tauxInteret ? `${p.tauxInteret}%` : '—' },
                        ].map(item => (
                          <div key={item.label} className="py-2">
                            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#3a3a3a' }}>{item.label}</p>
                            <p className="text-sm font-bold num mt-0.5" style={{ color: item.color || '#888' }}>{item.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Refinancement BRRRR */}
                      {p.valeurActuelle && p.hypotheque && (
                        <div className="rounded-xl p-3"
                          style={{ background: 'rgba(0,208,132,0.06)', border: '1px solid rgba(0,208,132,0.12)' }}>
                          <div className="flex items-center gap-1.5 mb-2">
                            <TrendingUp className="w-3.5 h-3.5" style={{ color: '#00d084' }} strokeWidth={2} />
                            <p className="text-xs font-bold" style={{ color: '#00d084' }}>Refinancement BRRRR (80%)</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs" style={{ color: '#5a5a5a' }}>Capital récupérable</p>
                            <p className="text-sm font-black num" style={{ color: '#00d084' }}>
                              {fmtM(Math.max(0, (+p.valeurActuelle * 0.8) - +p.hypotheque))}
                            </p>
                          </div>
                        </div>
                      )}

                      {p.notes && (
                        <p className="text-xs leading-relaxed" style={{ color: '#5a5a5a' }}>{p.notes}</p>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => handleEdit(p)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition active:scale-95"
                          style={{ background: 'rgba(245,158,11,0.08)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.15)' }}>
                          <Edit2 className="w-3 h-3" /> Modifier
                        </button>
                        <button onClick={() => handleDelete(p.id)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition active:scale-95"
                          style={{ background: 'rgba(255,77,77,0.07)', color: '#ff4d4d', border: '1px solid rgba(255,77,77,0.12)' }}>
                          <X className="w-3 h-3" /> Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
