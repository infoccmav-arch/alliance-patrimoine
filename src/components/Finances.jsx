import { useState } from 'react';
import { DollarSign, Plus, ArrowUpCircle, ArrowDownCircle, TrendingUp, X, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { toast } from './Toast';

const CARD  = { background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20 };
const INPUT = { background: '#111', border: '1px solid #222', color: '#fff', borderRadius: 14, padding: '10px 14px', fontSize: 14, width: '100%', outline: 'none' };
const LABEL = { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#444', marginBottom: 6, display: 'block' };

const categories = ['Cotisation', 'Refinancement', 'Revenu locatif', 'Mise de fonds', 'Rénovation', 'Frais légaux', 'Franchise', 'Autre'];

const fmtCAD = v => v.toLocaleString('fr-CA');

// ── Cotisation tracker per member ─────────────────────────────────────────────
function CotisationTracker({ membres, transactions, setTransactions, setCapital }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState({});
  const now = new Date();
  const moisStr = now.toISOString().substring(0, 7);

  const actifs = membres.filter(m => m.actif);

  // Check who paid this month
  const paidThisMonth = transactions
    .filter(t => t.categorie === 'Cotisation' && t.membreId && t.date?.startsWith(moisStr))
    .map(t => t.membreId);

  const toggleSelect = id => setSelected(p => ({ ...p, [id]: !p[id] }));

  const enregistrer = () => {
    const aPayer = actifs.filter(m => selected[m.id]);
    if (!aPayer.length) return;
    const date = now.toISOString().split('T')[0];
    const newTxs = aPayer.map(m => ({
      type: 'entree', montant: m.cotisation,
      description: `Cotisation — ${m.nom}`,
      categorie: 'Cotisation', date,
      membreId: m.id,
      id: Date.now() + m.id,
    }));
    const total = aPayer.reduce((s, m) => s + m.cotisation, 0);
    setTransactions(prev => [...newTxs, ...prev]);
    setCapital(prev => prev + total);
    toast.success(`${aPayer.length} cotisation(s) enregistrée(s) — ${fmtCAD(total)} $`);
    setSelected({});
    setOpen(false);
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)' }}>
      <button onClick={() => setOpen(p => !p)}
        className="w-full flex items-center gap-3 px-4 py-4 transition"
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        <Users className="w-4 h-4 text-amber-400" strokeWidth={2} />
        <span className="text-white font-semibold text-sm flex-1 text-left">Cotisations du mois — {now.toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' })}</span>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full mr-2"
          style={{ background: 'rgba(0,208,132,0.1)', color: '#00d084' }}>
          {paidThisMonth.length}/{actifs.length} payé
        </span>
        {open ? <ChevronUp className="w-4 h-4" style={{ color: '#555' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#555' }} />}
      </button>

      {open && (
        <div>
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {actifs.map(m => {
              const paid = paidThisMonth.includes(m.id);
              const isSel = !!selected[m.id];
              return (
                <div key={m.id}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer transition"
                  style={{ background: isSel ? 'rgba(0,208,132,0.04)' : 'transparent' }}
                  onClick={() => !paid && toggleSelect(m.id)}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-black text-xs font-black flex-shrink-0"
                    style={{ background: paid ? '#00d084' : isSel ? 'rgba(0,208,132,0.3)' : 'linear-gradient(135deg,#f59e0b,#fbbf24)' }}>
                    {m.nom.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{m.nom}</p>
                    <p className="text-xs num" style={{ color: '#555' }}>{fmtCAD(m.cotisation)} $/mois</p>
                  </div>
                  <div className="flex-shrink-0">
                    {paid ? (
                      <span className="text-xs font-bold px-2 py-1 rounded-xl" style={{ background: 'rgba(0,208,132,0.1)', color: '#00d084' }}>✓ Payé</span>
                    ) : (
                      <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center transition"
                        style={{ borderColor: isSel ? '#00d084' : '#333', background: isSel ? '#00d084' : 'transparent' }}>
                        {isSel && <span className="text-black text-[10px] font-black">✓</span>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {Object.values(selected).some(Boolean) && (
            <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={enregistrer}
                className="w-full py-3 rounded-2xl text-black font-bold text-sm transition active:scale-95"
                style={{ background: 'linear-gradient(135deg,#00d084,#00b872)', boxShadow: '0 4px 16px rgba(0,208,132,0.25)' }}>
                Enregistrer {Object.values(selected).filter(Boolean).length} cotisation(s) —{' '}
                {fmtCAD(actifs.filter(m => selected[m.id]).reduce((s, m) => s + m.cotisation, 0))} $
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Finances({ membres, capital, setCapital, transactions, setTransactions }) {
  const { user } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ type: 'entree', montant: '', description: '', categorie: 'Cotisation', date: new Date().toISOString().split('T')[0] });
  const [filterCat, setFilterCat] = useState('');

  const totalEntrees = transactions.filter(t => t.type === 'entree').reduce((s, t) => s + t.montant, 0);
  const totalSorties = transactions.filter(t => t.type === 'sortie').reduce((s, t) => s + t.montant, 0);
  const cotisationMensuelle = membres.filter(m => m.actif).reduce((s, m) => s + m.cotisation, 0);

  const handleSubmit = () => {
    if (!form.montant) return;
    const montant = +form.montant;
    const entry = { ...form, montant, id: Date.now() };
    setTransactions(prev => [entry, ...prev]);
    if (form.type === 'entree') setCapital(prev => prev + montant);
    else setCapital(prev => prev - montant);
    toast.success(`Transaction enregistrée — ${form.type === 'entree' ? '+' : '-'}${fmtCAD(montant)} $`);
    setForm({ type: 'entree', montant: '', description: '', categorie: 'Cotisation', date: new Date().toISOString().split('T')[0] });
    setShowAdd(false);
  };

  const deleteTransaction = (id, t) => {
    setTransactions(prev => prev.filter(x => x.id !== id));
    if (t.type === 'entree') setCapital(prev => prev - t.montant);
    else setCapital(prev => prev + t.montant);
    toast.info('Transaction supprimée');
  };

  const derniersMois = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString('fr-CA', { month: 'short' });
    const moisStr = d.toISOString().substring(0, 7);
    const entrees = transactions.filter(t => t.type === 'entree' && t.date?.startsWith(moisStr)).reduce((s, t) => s + t.montant, 0);
    const sorties = transactions.filter(t => t.type === 'sortie' && t.date?.startsWith(moisStr)).reduce((s, t) => s + t.montant, 0);
    derniersMois.push({ mois: label, entrees, sorties });
  }

  const filteredTx = filterCat
    ? transactions.filter(t => t.categorie === filterCat)
    : transactions;

  // Member cotisation summary
  const membreSummary = membres.filter(m => m.actif).map(m => {
    const total = transactions
      .filter(t => t.membreId === m.id && t.categorie === 'Cotisation')
      .reduce((s, t) => s + t.montant, 0);
    return { ...m, totalPaid: total };
  });

  return (
    <div className="space-y-4">

      {/* ── Action buttons ── */}
      <div className="flex gap-2">
        <button onClick={() => setShowAdd(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition active:scale-95"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b' }}>
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Nouvelle transaction
        </button>
      </div>

      {/* ── Cotisation tracker ── */}
      {user?.isAdmin && (
        <CotisationTracker
          membres={membres}
          transactions={transactions}
          setTransactions={setTransactions}
          setCapital={setCapital}
        />
      )}

      {/* ── Capital card ── */}
      <div style={{ ...CARD, padding: 20 }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#444' }}>Capital disponible</p>
        <p className="text-4xl font-black text-white num tracking-tight">{fmtCAD(capital)} $</p>
        <div className="flex gap-4 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#333' }}>Entrées</p>
            <p className="text-sm font-bold mt-0.5 num" style={{ color: '#10b981' }}>+{fmtCAD(totalEntrees)} $</p>
          </div>
          <div className="w-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#333' }}>Sorties</p>
            <p className="text-sm font-bold mt-0.5 num" style={{ color: '#f87171' }}>-{fmtCAD(totalSorties)} $</p>
          </div>
          <div className="w-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#333' }}>Mensuel</p>
            <p className="text-sm font-bold mt-0.5 num" style={{ color: '#f59e0b' }}>{fmtCAD(cotisationMensuelle)} $</p>
          </div>
        </div>
      </div>

      {/* ── Suivi par membre ── */}
      <div style={{ ...CARD, padding: 20 }}>
        <p className="text-white font-semibold text-sm mb-3">Cotisations cumulées par membre</p>
        <div className="space-y-2">
          {membreSummary.map(m => (
            <div key={m.id} className="flex items-center gap-3 py-1.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-black text-xs font-black"
                style={{ background: 'linear-gradient(135deg,#f59e0b,#fbbf24)' }}>
                {m.nom.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{m.nom}</p>
                <p className="text-[10px]" style={{ color: '#444' }}>{fmtCAD(m.cotisation)} $/mois</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold num" style={{ color: m.totalPaid > 0 ? '#10b981' : '#333' }}>
                  {fmtCAD(m.totalPaid)} $
                </p>
                <p className="text-[10px] num" style={{ color: '#333' }}>
                  {m.cotisation > 0 ? `${Math.round(m.totalPaid / m.cotisation)} mois` : '—'}
                </p>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between pt-3 mt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <span className="text-white font-bold text-sm">Total annuel prévu</span>
            <span className="font-bold num" style={{ color: '#f59e0b' }}>{fmtCAD(cotisationMensuelle * 12)} $/an</span>
          </div>
        </div>
      </div>

      {/* ── Bar chart ── */}
      <div style={{ ...CARD, padding: 20 }}>
        <p className="text-white font-semibold text-sm mb-4">Entrées vs Sorties — 6 mois</p>
        <div style={{ height: 140 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={derniersMois} barCategoryGap="30%">
              <XAxis dataKey="mois" stroke="transparent" tick={{ fontSize:11, fill:'#333', fontWeight:600 }} tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff', fontSize: 12 }}
                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                formatter={(v, n) => [`${fmtCAD(v)} $`, n === 'entrees' ? 'Entrées' : 'Sorties']}
              />
              <Bar dataKey="entrees" fill="#10b981" radius={[6,6,0,0]} />
              <Bar dataKey="sorties" fill="#ef4444" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Transactions ── */}
      <div style={{ ...CARD, padding: 20 }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-white font-semibold text-sm">Historique</p>
          <select
            value={filterCat} onChange={e => setFilterCat(e.target.value)}
            className="text-xs rounded-xl px-2 py-1.5 outline-none"
            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888' }}>
            <option value="">Toutes</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {filteredTx.length === 0 ? (
          <p className="text-center py-8 text-sm" style={{ color: '#333' }}>Aucune transaction</p>
        ) : (
          <div className="space-y-1">
            {filteredTx.slice(0, 40).map(t => (
              <div key={t.id} className="flex items-center gap-3 px-3 py-3 rounded-2xl group transition"
                style={{ background: 'transparent' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: t.type === 'entree' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>
                  {t.type === 'entree'
                    ? <ArrowUpCircle className="w-4 h-4" style={{ color: '#10b981' }} strokeWidth={1.5} />
                    : <ArrowDownCircle className="w-4 h-4" style={{ color: '#f87171' }} strokeWidth={1.5} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: '#ccc' }}>{t.description || t.categorie}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: '#333' }}>{t.date} · {t.categorie}</p>
                </div>
                <span className="font-bold text-sm num"
                  style={{ color: t.type === 'entree' ? '#10b981' : '#f87171' }}>
                  {t.type === 'entree' ? '+' : '-'}{fmtCAD(t.montant)} $
                </span>
                {user?.isAdmin && (
                  <button onClick={() => deleteTransaction(t.id, t)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg transition ml-1"
                    style={{ color: '#555' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                    onMouseLeave={e => e.currentTarget.style.color = '#555'}>
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-3xl p-6 fade-up"
            style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold text-base">Nouvelle transaction</h3>
              <button onClick={() => setShowAdd(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                <X className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl" style={{ background: '#111' }}>
                {['entree', 'sortie'].map(type => (
                  <button key={type} onClick={() => setForm(p => ({ ...p, type }))}
                    className="py-2.5 rounded-xl text-sm font-bold transition"
                    style={{
                      background: form.type === type ? (type === 'entree' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)') : 'transparent',
                      color: form.type === type ? (type === 'entree' ? '#10b981' : '#f87171') : '#444',
                      border: form.type === type ? `1px solid ${type === 'entree' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}` : '1px solid transparent',
                    }}>
                    {type === 'entree' ? '+ Entrée' : '- Sortie'}
                  </button>
                ))}
              </div>
              <div>
                <label style={LABEL}>Montant ($)</label>
                <input type="number" style={INPUT} placeholder="5 000" value={form.montant} onChange={e => setForm(p => ({ ...p, montant: e.target.value }))} />
              </div>
              <div>
                <label style={LABEL}>Catégorie</label>
                <select style={INPUT} value={form.categorie} onChange={e => setForm(p => ({ ...p, categorie: e.target.value }))}>
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={LABEL}>Description</label>
                <input style={INPUT} placeholder="Description..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div>
                <label style={LABEL}>Date</label>
                <input type="date" style={INPUT} value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={handleSubmit}
                className="flex-1 py-3.5 rounded-2xl text-black font-bold text-sm transition active:scale-95"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', boxShadow: '0 6px 20px rgba(245,158,11,0.25)' }}>
                Enregistrer
              </button>
              <button onClick={() => setShowAdd(false)}
                className="flex-1 py-3.5 rounded-2xl text-sm font-bold transition active:scale-95"
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
