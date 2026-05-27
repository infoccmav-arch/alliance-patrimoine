import { useState, useEffect, useRef } from 'react';
import { Search, X, Building2, Users, DollarSign, FileText, ChevronRight } from 'lucide-react';

const fmtCAD = v => (+v || 0).toLocaleString('fr-CA');

export default function SearchModal({ open, onClose, membres, proprietes, transactions, documents, onNavigate }) {
  const [q, setQ]       = useState('');
  const inputRef        = useRef(null);

  useEffect(() => {
    if (open) { setQ(''); setTimeout(() => inputRef.current?.focus(), 80); }
  }, [open]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!open) return null;

  const low = q.toLowerCase().trim();

  const results = low.length < 1 ? [] : [
    ...membres
      .filter(m => m.nom?.toLowerCase().includes(low))
      .map(m => ({
        type: 'membre', icon: Users, color: '#f59e0b',
        title: m.nom, sub: `${fmtCAD(m.cotisation)} $/mois · ${m.actif ? 'Actif' : 'Inactif'}`,
        tab: 'membres',
      })),
    ...proprietes
      .filter(p => p.adresse?.toLowerCase().includes(low) || p.ville?.toLowerCase().includes(low))
      .map(p => ({
        type: 'propriete', icon: Building2, color: '#818cf8',
        title: p.adresse || 'Propriété', sub: `${p.ville || ''} · ${fmtCAD(+p.valeurActuelle || +p.prixAchat)} $`,
        tab: 'proprietes',
      })),
    ...transactions
      .filter(t => t.description?.toLowerCase().includes(low) || t.categorie?.toLowerCase().includes(low))
      .slice(0, 4)
      .map(t => ({
        type: 'transaction', icon: DollarSign, color: t.type === 'entree' ? '#00d084' : '#f87171',
        title: t.description || t.categorie, sub: `${t.date} · ${t.type === 'entree' ? '+' : '-'}${fmtCAD(t.montant)} $`,
        tab: 'finances',
      })),
    ...(documents || [])
      .filter(d => d.nom?.toLowerCase().includes(low) || d.description?.toLowerCase().includes(low))
      .map(d => ({
        type: 'document', icon: FileText, color: '#60a5fa',
        title: d.nom, sub: d.description || d.categorie,
        tab: 'documents',
      })),
  ];

  const quick = [
    { label: 'Tableau de bord', tab: 'dashboard',    icon: '🏠' },
    { label: 'Propriétés',      tab: 'proprietes',   icon: '🏠' },
    { label: 'Finances',        tab: 'finances',     icon: '💰' },
    { label: 'Discussion',      tab: 'discussion',   icon: '💬' },
    { label: 'Calculatrice',    tab: 'calculatrice', icon: '🧮' },
    { label: 'Documents',       tab: 'documents',    icon: '📁' },
    { label: 'Mon profil',      tab: 'profil',       icon: '👤' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>

      <div className="w-full max-w-md fade-up rounded-2xl overflow-hidden"
        style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 40px 80px rgba(0,0,0,0.8)' }}>

        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: '#555' }} strokeWidth={2} />
          <input
            ref={inputRef}
            value={q} onChange={e => setQ(e.target.value)}
            placeholder="Rechercher membres, propriétés, transactions..."
            className="flex-1 text-sm bg-transparent outline-none text-white"
            style={{ letterSpacing: '-0.01em' }}
          />
          {q && (
            <button onClick={() => setQ('')} className="p-1">
              <X className="w-3.5 h-3.5" style={{ color: '#444' }} />
            </button>
          )}
          <button onClick={onClose}
            className="text-xs font-bold px-2 py-1 rounded-lg transition"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#555' }}>
            Esc
          </button>
        </div>

        {/* Results or Quick nav */}
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {low.length < 1 ? (
            <div className="p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest px-2 pb-2" style={{ color: '#333' }}>Navigation rapide</p>
              <div className="grid grid-cols-2 gap-1.5">
                {quick.map(q => (
                  <button key={q.tab}
                    onClick={() => { onNavigate(q.tab); onClose(); }}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-white transition text-left"
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <span>{q.icon}</span>
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-medium" style={{ color: '#333' }}>Aucun résultat pour "{q}"</p>
              <p className="text-xs mt-1" style={{ color: '#222' }}>Essayez un nom, une adresse, une description...</p>
            </div>
          ) : (
            <div className="p-2">
              {results.map((r, i) => {
                const Icon = r.icon;
                return (
                  <button key={i}
                    onClick={() => { onNavigate(r.tab); onClose(); }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition text-left"
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${r.color}12` }}>
                      <Icon className="w-4 h-4" style={{ color: r.color }} strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{r.title}</p>
                      <p className="text-xs truncate mt-0.5" style={{ color: '#555' }}>{r.sub}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#333' }} />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
