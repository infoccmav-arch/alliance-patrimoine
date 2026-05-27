import { useState } from 'react';
import { FileText, Plus, Trash2, Download, Search, FolderOpen, File, X, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from './Toast';

const CARD  = { background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20 };
const INPUT = { background: '#111', border: '1px solid #222', color: '#fff', borderRadius: 14, padding: '10px 14px', fontSize: 14, width: '100%', outline: 'none' };
const LABEL = { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#444', marginBottom: 6, display: 'block' };

const CATEGORIES = [
  { id: 'contrats',   label: 'Contrats',      color: '#818cf8', icon: '📋' },
  { id: 'immobilier', label: 'Immobilier',     color: '#00d084', icon: '🏠' },
  { id: 'legal',      label: 'Légal & Notaire', color: '#f59e0b', icon: '⚖️' },
  { id: 'assurance',  label: 'Assurances',     color: '#f87171', icon: '🛡️' },
  { id: 'finance',    label: 'Finances',       color: '#10b981', icon: '💰' },
  { id: 'autre',      label: 'Autre',          color: '#888',    icon: '📁' },
];

const EXT_COLORS = {
  pdf:  '#f87171',
  doc:  '#60a5fa',
  docx: '#60a5fa',
  xls:  '#34d399',
  xlsx: '#34d399',
  png:  '#a78bfa',
  jpg:  '#a78bfa',
  jpeg: '#a78bfa',
};

function extColor(filename) {
  const ext = (filename || '').split('.').pop().toLowerCase();
  return EXT_COLORS[ext] || '#888';
}

function extBadge(filename) {
  const ext = (filename || '').split('.').pop().toUpperCase();
  return ext || 'DOC';
}

function DocCard({ doc, onDelete, canDelete }) {
  const cat = CATEGORIES.find(c => c.id === doc.categorie) || CATEGORIES[5];
  const color = extColor(doc.nom);

  return (
    <div className="flex items-center gap-3 py-3.5 group transition"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      {/* Icon */}
      <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
        style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
        <File className="w-4 h-4" style={{ color }} strokeWidth={1.5} />
        <span className="text-[7px] font-black mt-0.5" style={{ color }}>{extBadge(doc.nom)}</span>
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{doc.nom}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
            style={{ background: `${cat.color}12`, color: cat.color }}>
            {cat.icon} {cat.label}
          </span>
          {doc.description && <span className="text-[10px] truncate" style={{ color: '#444' }}>{doc.description}</span>}
        </div>
        <p className="text-[10px] mt-0.5" style={{ color: '#2a2a2a' }}>
          {doc.addedBy} · {new Date(doc.createdAt).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>
      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
        {doc.url && (
          <a href={doc.url} target="_blank" rel="noreferrer"
            className="p-2 rounded-xl transition"
            style={{ color: '#555' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#00d084'; e.currentTarget.style.background = 'rgba(0,208,132,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#555'; e.currentTarget.style.background = 'transparent'; }}>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
        {canDelete && (
          <button onClick={() => onDelete(doc.id)}
            className="p-2 rounded-xl transition"
            style={{ color: '#555' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#555'; e.currentTarget.style.background = 'transparent'; }}>
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function Documents({ documents, setDocuments }) {
  const { user } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [activecat, setActiveCat] = useState('');
  const [form, setForm] = useState({ nom: '', categorie: 'contrats', description: '', url: '' });

  const handleAdd = () => {
    if (!form.nom.trim()) return;
    const doc = {
      id: Date.now(),
      ...form,
      nom: form.nom.trim(),
      addedBy: user?.nom || user?.username || 'Inconnu',
      addedById: user?.id,
      createdAt: new Date().toISOString(),
    };
    setDocuments(prev => [doc, ...prev]);
    toast.success(`Document ajouté — ${doc.nom}`);
    setForm({ nom: '', categorie: 'contrats', description: '', url: '' });
    setShowAdd(false);
  };

  const handleDelete = (id) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    toast.info('Document supprimé');
  };

  const filtered = documents.filter(d => {
    const matchSearch = !search || d.nom.toLowerCase().includes(search.toLowerCase()) || d.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = !activecat || d.categorie === activecat;
    return matchSearch && matchCat;
  });

  const countByCat = (catId) => documents.filter(d => d.categorie === catId).length;

  return (
    <div className="space-y-4">

      {/* ── Search + Add ── */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#444' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-full rounded-2xl pl-9 pr-4 py-3 text-sm outline-none"
            style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)', color: '#fff' }}
          />
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold transition active:scale-95"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b' }}>
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Ajouter
        </button>
      </div>

      {/* ── Category filters ── */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        <button onClick={() => setActiveCat('')}
          className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition"
          style={{
            background: !activecat ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
            border: !activecat ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.05)',
            color: !activecat ? '#fff' : '#555',
          }}>
          Tous ({documents.length})
        </button>
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setActiveCat(activecat === c.id ? '' : c.id)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition"
            style={{
              background: activecat === c.id ? `${c.color}15` : 'rgba(255,255,255,0.03)',
              border: activecat === c.id ? `1px solid ${c.color}30` : '1px solid rgba(255,255,255,0.05)',
              color: activecat === c.id ? c.color : '#555',
            }}>
            {c.icon} {c.label} {countByCat(c.id) > 0 && `(${countByCat(c.id)})`}
          </button>
        ))}
      </div>

      {/* ── Document list ── */}
      <div style={CARD} className="px-4">
        {filtered.length === 0 ? (
          <div className="py-14 text-center">
            <FolderOpen className="w-10 h-10 mx-auto mb-3" style={{ color: '#2a2a2a' }} strokeWidth={1} />
            <p className="text-sm font-medium" style={{ color: '#333' }}>
              {search || activecat ? 'Aucun résultat' : 'Aucun document encore'}
            </p>
            {!search && !activecat && (
              <p className="text-xs mt-1" style={{ color: '#222' }}>
                Ajoutez des liens vers vos contrats, actes et documents importants.
              </p>
            )}
          </div>
        ) : (
          filtered.map(doc => (
            <DocCard
              key={doc.id}
              doc={doc}
              onDelete={handleDelete}
              canDelete={user?.isAdmin || doc.addedById === user?.id}
            />
          ))
        )}
      </div>

      {/* ── Add modal ── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-3xl p-6 fade-up"
            style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}>

            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold text-base">Ajouter un document</h3>
              <button onClick={() => setShowAdd(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                <X className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label style={LABEL}>Nom du document</label>
                <input style={INPUT} placeholder="Contrat de société.pdf"
                  value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} />
              </div>
              <div>
                <label style={LABEL}>Catégorie</label>
                <select style={INPUT} value={form.categorie} onChange={e => setForm(p => ({ ...p, categorie: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={LABEL}>Description (optionnel)</label>
                <input style={INPUT} placeholder="Contrat signé, version finale..."
                  value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div>
                <label style={LABEL}>Lien URL (Google Drive, Dropbox...)</label>
                <input style={INPUT} placeholder="https://drive.google.com/..."
                  value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
                  type="url" />
                <p className="text-[10px] mt-1.5" style={{ color: '#333' }}>
                  Partagez le lien depuis Google Drive ou Dropbox
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={handleAdd}
                className="flex-1 py-3.5 rounded-2xl text-black font-bold text-sm transition active:scale-95"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', boxShadow: '0 6px 20px rgba(245,158,11,0.25)' }}>
                Ajouter
              </button>
              <button onClick={() => setShowAdd(false)}
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
