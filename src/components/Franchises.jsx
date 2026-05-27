import { useState } from 'react';
import { Store, Plus, X, Edit2 } from 'lucide-react';

const statusConfig = {
  'Recherche': 'bg-yellow-500/20 text-yellow-400',
  'Négociation': 'bg-orange-500/20 text-orange-400',
  'Financement': 'bg-blue-500/20 text-amber-400',
  'Ouvert': 'bg-emerald-500/20 text-emerald-400',
};

const franchisesDisponibles = [
  { nom: 'Jan-Pro', secteur: 'Nettoyage commercial', investissement: '30 000–50 000$', revenus: '80 000–150 000$/an' },
  { nom: 'Kumon', secteur: 'Éducation', investissement: '40 000–60 000$', revenus: '100 000–200 000$/an' },
  { nom: 'Subway', secteur: 'Restauration rapide', investissement: '200 000–300 000$', revenus: '200 000–400 000$/an' },
  { nom: 'Cora', secteur: 'Restauration', investissement: '300 000–500 000$', revenus: '300 000–500 000$/an' },
  { nom: 'Anytime Fitness', secteur: 'Fitness', investissement: '300 000–500 000$', revenus: '200 000–400 000$/an' },
  { nom: 'Tim Hortons', secteur: 'Restauration rapide', investissement: '500 000–1 000 000$', revenus: '500 000–1 000 000$/an' },
];

const emptyFranchise = { nom: '', secteur: '', status: 'Recherche', investissement: '', revenus: '', emplacement: '', notes: '' };

export default function Franchises({ franchises, setFranchises }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyFranchise);
  const [editId, setEditId] = useState(null);

  const handleSubmit = () => {
    if (!form.nom) return;
    const entry = { ...form, id: editId || Date.now() };
    if (editId) setFranchises(prev => prev.map(f => f.id === editId ? entry : f));
    else setFranchises(prev => [...prev, entry]);
    setForm(emptyFranchise);
    setShowAdd(false);
    setEditId(null);
  };

  const handleEdit = (f) => { setForm({ ...f }); setEditId(f.id); setShowAdd(true); };
  const handleDelete = (id) => setFranchises(prev => prev.filter(f => f.id !== id));

  const revenusOuverts = franchises.filter(f => f.status === 'Ouvert').reduce((s, f) => {
    const match = f.revenus?.match(/(\d+[\s\d]*)/);
    return s + (match ? parseInt(match[1].replace(/\s/g, '')) : 0);
  }, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Franchises</h2>
          <p className="text-slate-400 text-sm mt-1">Phase 2 de votre empire</p>
        </div>
        <button onClick={() => { setForm(emptyFranchise); setEditId(null); setShowAdd(true); }} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition">
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-white">{franchises.length}</p>
          <p className="text-slate-400 text-sm">Total franchises</p>
        </div>
        <div className="bg-[#0a0a0a] border border-emerald-500/30 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-emerald-400">{franchises.filter(f => f.status === 'Ouvert').length}</p>
          <p className="text-slate-400 text-sm">Ouvertes</p>
        </div>
        <div className="bg-[#0a0a0a] border border-blue-500/30 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-amber-400">{franchises.filter(f => f.status !== 'Ouvert').length}</p>
          <p className="text-slate-400 text-sm">En développement</p>
        </div>
      </div>

      {/* Mes franchises */}
      {franchises.length === 0 ? (
        <div className="bg-[#0a0a0a] border border-dashed border-[#222] rounded-2xl p-10 text-center">
          <Store className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">Aucune franchise encore</p>
          <p className="text-slate-500 text-sm mt-1">Objectif : Première franchise en Année 5</p>
        </div>
      ) : (
        <div className="space-y-3">
          {franchises.map(f => (
            <div key={f.id} className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Store className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">{f.nom}</p>
                    <p className="text-slate-400 text-sm">{f.secteur}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${statusConfig[f.status]}`}>{f.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="bg-[#0a0a0a] rounded-lg p-2">
                  <p className="text-slate-400 text-xs">Investissement</p>
                  <p className="text-white text-sm font-medium">{f.investissement || 'N/A'}</p>
                </div>
                <div className="bg-[#0a0a0a] rounded-lg p-2">
                  <p className="text-slate-400 text-xs">Revenus estimés</p>
                  <p className="text-emerald-400 text-sm font-medium">{f.revenus || 'N/A'}</p>
                </div>
              </div>
              {f.emplacement && <p className="text-slate-400 text-sm mt-2">📍 {f.emplacement}</p>}
              {f.notes && <p className="text-slate-500 text-xs mt-1">{f.notes}</p>}
              <div className="flex gap-2 mt-3">
                <button onClick={() => handleEdit(f)} className="flex items-center gap-1 bg-blue-600/20 hover:bg-blue-600/40 text-amber-400 px-3 py-1.5 rounded-lg text-xs transition"><Edit2 className="w-3 h-3" /> Modifier</button>
                <button onClick={() => handleDelete(f.id)} className="flex items-center gap-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 px-3 py-1.5 rounded-lg text-xs transition"><X className="w-3 h-3" /> Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Franchises recommandées */}
      <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-4">
        <h3 className="text-white font-semibold mb-4">Franchises recommandées au Canada</h3>
        <div className="space-y-3">
          {franchisesDisponibles.map(f => (
            <div key={f.nom} className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-xl">
              <div>
                <p className="text-white font-medium text-sm">{f.nom}</p>
                <p className="text-slate-400 text-xs">{f.secteur}</p>
              </div>
              <div className="text-right">
                <p className="text-yellow-400 text-xs">{f.investissement}</p>
                <p className="text-emerald-400 text-xs">{f.revenus}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-slate-500 text-xs mt-3 text-center">Commencez par Jan-Pro ou Kumon — moins cher et plus simple</p>
      </div>

      {/* Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-white font-bold text-lg mb-4">{editId ? 'Modifier' : 'Ajouter'} une franchise</h3>
            <div className="space-y-3">
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Nom de la franchise</label>
                <input className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 text-white" placeholder="Ex: Subway, Jan-Pro..." value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Secteur</label>
                  <input className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 text-white" placeholder="Restauration..." value={form.secteur} onChange={e => setForm(p => ({ ...p, secteur: e.target.value }))} />
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Statut</label>
                  <select className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 text-white" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                    {Object.keys(statusConfig).map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Investissement</label>
                  <input className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 text-white" placeholder="200 000$" value={form.investissement} onChange={e => setForm(p => ({ ...p, investissement: e.target.value }))} />
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Revenus estimés/an</label>
                  <input className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 text-white" placeholder="300 000$/an" value={form.revenus} onChange={e => setForm(p => ({ ...p, revenus: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Emplacement</label>
                <input className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 text-white" placeholder="Laval, QC" value={form.emplacement} onChange={e => setForm(p => ({ ...p, emplacement: e.target.value }))} />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Notes</label>
                <textarea rows={2} className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 text-white text-sm resize-none" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleSubmit} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-xl font-medium transition">{editId ? 'Sauvegarder' : 'Ajouter'}</button>
              <button onClick={() => { setShowAdd(false); setEditId(null); }} className="flex-1 bg-[#1a1a1a] hover:bg-[#222] text-white py-2 rounded-xl font-medium transition">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
