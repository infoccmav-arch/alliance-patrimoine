import { useState } from 'react';
import { Plus, Edit2, Check, X, Star, CheckCircle, Clock } from 'lucide-react';

const roleColors = {
  'Gestionnaire': 'bg-yellow-500/20 text-yellow-400',
  'Trésorier': 'bg-amber-500/20 text-amber-400',
  'Chef de chantier': 'bg-orange-500/20 text-orange-400',
  'Secrétaire': 'bg-purple-500/20 text-purple-400',
  'Actionnaire': 'bg-[#1a1a1a]/20 text-slate-400',
};

const getCreditColor = (score) => {
  if (score >= 750) return 'text-emerald-400';
  if (score >= 700) return 'text-amber-400';
  if (score >= 650) return 'text-yellow-400';
  return 'text-red-400';
};

const getCreditLabel = (score) => {
  if (score >= 750) return 'Excellent ★ Signataire';
  if (score >= 700) return 'Bon ★ Peut signer';
  if (score >= 650) return 'Acceptable';
  return 'À améliorer';
};

// Cotisation badge — shows Payé or En attente based on transactions
function CotisationBadge({ membreId, transactions }) {
  const moisStr = new Date().toISOString().substring(0, 7);
  const paid = transactions?.some(
    t => t.membreId === membreId && t.categorie === 'Cotisation' && t.date?.startsWith(moisStr)
  );
  if (paid) return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black"
      style={{ background: 'rgba(0,208,132,0.1)', color: '#00d084', border: '1px solid rgba(0,208,132,0.2)' }}>
      <CheckCircle className="w-2.5 h-2.5" />Payé ✓
    </span>
  );
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black"
      style={{ background: 'rgba(245,158,11,0.08)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
      <Clock className="w-2.5 h-2.5" />En attente
    </span>
  );
}

export default function Membres({ membres, setMembres, transactions = [] }) {
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [newMembre, setNewMembre] = useState({ nom: '', cotisation: 1000, role: 'Actionnaire' });

  const totalCotisation = membres.filter(m => m.actif).reduce((s, m) => s + m.cotisation, 0);
  const cotisationAnnuelle = totalCotisation * 12;

  const startEdit = (m) => {
    setEditId(m.id);
    setEditData({ ...m });
  };

  const saveEdit = () => {
    setMembres(prev => prev.map(m => m.id === editId ? { ...m, ...editData } : m));
    setEditId(null);
  };

  const addMembre = () => {
    if (!newMembre.nom) return;
    const id = Math.max(...membres.map(m => m.id)) + 1;
    setMembres(prev => [...prev, { ...newMembre, id, actif: true, totalCotise: 0 }]);
    setNewMembre({ nom: '', cotisation: 750, creditScore: 700, role: 'Actionnaire' });
    setShowAdd(false);
  };

  const toggleActif = (id) => {
    setMembres(prev => prev.map(m => m.id === id ? { ...m, actif: !m.actif } : m));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Membres</h2>
          <p className="text-slate-400 text-sm mt-1">Gérez votre équipe de 10 actionnaires</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition">
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-white">{membres.filter(m => m.actif).length}</p>
          <p className="text-slate-400 text-sm">Membres actifs</p>
        </div>
        <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-emerald-400">{totalCotisation.toLocaleString()}$</p>
          <p className="text-slate-400 text-sm">Par mois</p>
        </div>
        <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-amber-400">{(cotisationAnnuelle / 1000).toFixed(0)}k$</p>
          <p className="text-slate-400 text-sm">Par année</p>
        </div>
      </div>

      {/* Signataires recommandés */}
      <div className="bg-[#0a0a0a] border border-yellow-500/30 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-yellow-400" />
          <span className="text-yellow-400 font-semibold text-sm">Signataires recommandés pour la banque</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {membres.filter(m => m.actif && m.creditScore >= 700).map(m => (
            <span key={m.id} className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-xs px-3 py-1 rounded-full">
              {m.nom} — {m.creditScore}
            </span>
          ))}
          {membres.filter(m => m.actif && m.creditScore >= 700).length === 0 && (
            <span className="text-slate-400 text-sm">Aucun membre avec 700+ de cote de crédit</span>
          )}
        </div>
      </div>

      {/* Liste membres */}
      <div className="space-y-3">
        {membres.map(m => (
          <div key={m.id} className={`bg-[#0a0a0a] border rounded-2xl p-4 transition ${m.actif ? 'border-white/[0.06]' : 'border-white/[0.06]/50 opacity-50'}`}>
            {editId === m.id ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 text-xs mb-1 block">Nom</label>
                    <input className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 text-white text-sm" value={editData.nom} onChange={e => setEditData(p => ({ ...p, nom: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs mb-1 block">Cotisation $/mois</label>
                    <input type="number" className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 text-white text-sm" value={editData.cotisation} onChange={e => setEditData(p => ({ ...p, cotisation: +e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs mb-1 block">Cote de crédit</label>
                    <input type="number" className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 text-white text-sm" value={editData.creditScore} onChange={e => setEditData(p => ({ ...p, creditScore: +e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs mb-1 block">Rôle</label>
                    <select className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 text-white text-sm" value={editData.role} onChange={e => setEditData(p => ({ ...p, role: e.target.value }))}>
                      {Object.keys(roleColors).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm transition"><Check className="w-3 h-3" />Sauvegarder</button>
                  <button onClick={() => setEditId(null)} className="flex items-center gap-1 bg-[#1a1a1a] hover:bg-[#222] text-white px-3 py-1.5 rounded-lg text-sm transition"><X className="w-3 h-3" />Annuler</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {m.nom.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-medium">{m.nom}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${roleColors[m.role] || roleColors['Actionnaire']}`}>{m.role}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-emerald-400 text-sm font-medium">{m.cotisation}$/mois</span>
                    <CotisationBadge membreId={m.id} transactions={transactions} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => startEdit(m)} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-[#1a1a1a] transition">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => toggleActif(m.id)} className={`px-2 py-1 rounded-lg text-xs transition ${m.actif ? 'bg-emerald-500/20 text-emerald-400 hover:bg-red-500/20 hover:text-red-400' : 'bg-red-500/20 text-red-400 hover:bg-emerald-500/20 hover:text-emerald-400'}`}>
                    {m.actif ? 'Actif' : 'Inactif'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal ajout */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-white font-bold text-lg mb-4">Ajouter un membre</h3>
            <div className="space-y-3">
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Nom complet</label>
                <input className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 text-white" placeholder="Ex: Jean Tremblay" value={newMembre.nom} onChange={e => setNewMembre(p => ({ ...p, nom: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Cotisation $/mois</label>
                  <input type="number" className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 text-white" value={newMembre.cotisation} onChange={e => setNewMembre(p => ({ ...p, cotisation: +e.target.value }))} />
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Rôle</label>
                  <select className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 text-white" value={newMembre.role} onChange={e => setNewMembre(p => ({ ...p, role: e.target.value }))}>
                    {Object.keys(roleColors).map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={addMembre} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-xl font-medium transition">Ajouter</button>
              <button onClick={() => setShowAdd(false)} className="flex-1 bg-[#1a1a1a] hover:bg-[#222] text-white py-2 rounded-xl font-medium transition">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
