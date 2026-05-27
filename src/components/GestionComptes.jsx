import { useState } from 'react';
import { UserPlus, Key, Trash2, Shield, Eye, EyeOff, Check, X, AlertCircle, Clock, CheckCircle2, UserX } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function GestionComptes({ membres, setMembres }) {
  const { user, users, pendingUsers, createUser, approveUser, rejectUser, deleteUser, changePassword } = useAuth();

  const autoAddMembre = (u) => {
    if (!setMembres) return;
    const nom = u.nom || u.username;
    if (membres.some(m => m.nom?.toLowerCase() === nom.toLowerCase())) return;
    const newId = membres.length > 0 ? Math.max(...membres.map(m => m.id)) + 1 : 1;
    setMembres(prev => [...prev, { id: newId, nom, cotisation: 750, creditScore: 700, role: 'Actionnaire', actif: true, totalCotise: 0 }]);
  };

  const [showCreate, setShowCreate] = useState(false);
  const [showChangePwd, setShowChangePwd] = useState(null); // userId
  const [newUser, setNewUser] = useState({ username: '', password: '', membreId: '', isAdmin: false });
  const [pwdForm, setPwdForm] = useState({ old: '', new: '', confirm: '' });
  const [showPwd, setShowPwd] = useState({});
  const [msg, setMsg] = useState({ type: '', text: '' });

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 3000);
  };

  const handleCreate = () => {
    if (!newUser.username || !newUser.password) return showMsg('error', 'Remplissez tous les champs');
    if (newUser.password.length < 6) return showMsg('error', 'Mot de passe minimum 6 caractères');
    const result = createUser(newUser);
    if (result.ok) {
      showMsg('success', `Compte "${newUser.username}" créé avec succès`);
      setNewUser({ username: '', password: '', membreId: '', isAdmin: false });
      setShowCreate(false);
    } else {
      showMsg('error', result.error);
    }
  };

  const handleDelete = (id, username) => {
    if (!confirm(`Supprimer le compte "${username}" ?`)) return;
    const result = deleteUser(id);
    if (result.ok) showMsg('success', 'Compte supprimé');
    else showMsg('error', result.error);
  };

  const handleChangePwd = (uid) => {
    if (pwdForm.new !== pwdForm.confirm) return showMsg('error', 'Les mots de passe ne correspondent pas');
    if (pwdForm.new.length < 6) return showMsg('error', 'Minimum 6 caractères');
    const result = changePassword(uid, pwdForm.old, pwdForm.new);
    if (result.ok) {
      showMsg('success', 'Mot de passe modifié');
      setShowChangePwd(null);
      setPwdForm({ old: '', new: '', confirm: '' });
    } else {
      showMsg('error', result.error);
    }
  };

  const togglePwd = (key) => setShowPwd(p => ({ ...p, [key]: !p[key] }));

  const getMembre = (membreId) => membres.find(m => m.id === +membreId);

  const filteredUsers = user?.isAdmin ? users : users.filter(u => u.id === user?.id);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Comptes</h2>
          <p className="text-slate-400 text-sm mt-1">Gérer les accès des membres</p>
        </div>
        {user?.isAdmin && (
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition">
            <UserPlus className="w-4 h-4" /> Nouveau compte
          </button>
        )}
      </div>

      {/* Message */}
      {msg.text && (
        <div className={`flex items-center gap-2 rounded-xl px-4 py-3 ${msg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
          {msg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span className="text-sm">{msg.text}</span>
        </div>
      )}

      {/* ── Demandes en attente (admin seulement) ── */}
      {user?.isAdmin && pendingUsers.length > 0 && (
        <div className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(245,158,11,0.25)', background: 'rgba(245,158,11,0.04)' }}>
          <div className="flex items-center gap-2 px-4 py-3"
            style={{ borderBottom: '1px solid rgba(245,158,11,0.12)' }}>
            <Clock className="w-4 h-4 text-amber-400" strokeWidth={2} />
            <span className="text-amber-400 font-bold text-sm">Demandes en attente</span>
            <span className="ml-auto text-xs font-black px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
              {pendingUsers.length}
            </span>
          </div>
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {pendingUsers.map(u => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-black text-sm font-black flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#f59e0b,#fbbf24)' }}>
                  {(u.nom || u.username).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{u.nom || u.username}</p>
                  <p className="text-xs truncate" style={{ color: '#5a5a5a' }}>
                    @{u.username}
                    {u.registeredAt && <span> · {new Date(u.registeredAt).toLocaleDateString('fr-CA', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => { approveUser(u.id); autoAddMembre(u); showMsg('success', `Compte de ${u.nom || u.username} approuvé ✓`); }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95"
                    style={{ background: 'rgba(0,208,132,0.1)', border: '1px solid rgba(0,208,132,0.2)', color: '#00d084' }}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approuver
                  </button>
                  <button
                    onClick={() => { rejectUser(u.id); showMsg('success', `Demande refusée.`); }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition active:scale-95"
                    style={{ background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.15)', color: '#ff4d4d' }}>
                    <UserX className="w-3.5 h-3.5" /> Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mon compte */}
      <div className="bg-[#0a0a0a] border border-amber-500/30 rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white font-bold text-lg">
            {user?.nom?.charAt(0) || user?.username?.charAt(0)}
          </div>
          <div>
            <p className="text-white font-semibold">{user?.nom || user?.username}</p>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-sm">@{user?.username}</span>
              {user?.isAdmin && (
                <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Admin
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowChangePwd(user?.id)}
          className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#222] text-white px-3 py-2 rounded-xl text-sm transition"
        >
          <Key className="w-4 h-4" /> Changer mon mot de passe
        </button>
      </div>

      {/* Liste comptes (admin seulement) */}
      {user?.isAdmin && (
        <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-4">
          <h3 className="text-white font-semibold mb-4">Tous les comptes ({users.length})</h3>
          <div className="space-y-3">
            {filteredUsers.map(u => {
              const membre = u.membreId ? getMembre(u.membreId) : null;
              return (
                <div key={u.id} className="flex items-center gap-3 p-3 bg-[#0a0a0a] rounded-xl">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {(u.nom || u.username).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-sm">{u.nom || u.username}</span>
                      {u.isAdmin && <span className="bg-yellow-500/20 text-yellow-400 text-xs px-1.5 py-0.5 rounded-full">Admin</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-xs">@{u.username}</span>
                      {membre && <span className="text-slate-500 text-xs">— {membre.nom}</span>}
                    </div>
                  </div>
                  {u.id !== 'admin' && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setShowChangePwd(u.id); setPwdForm({ old: '', new: '', confirm: '' }); }} className="text-slate-400 hover:text-amber-400 p-1.5 rounded-lg hover:bg-[#1a1a1a] transition">
                        <Key className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(u.id, u.username)} className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-[#1a1a1a] transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Guide */}
      <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-4">
        <h3 className="text-slate-300 font-semibold mb-3 text-sm">Comment ajouter les membres</h3>
        <div className="space-y-2">
          {[
            { num: '1', text: 'Cliquez "Nouveau compte" pour chaque membre' },
            { num: '2', text: 'Choisissez un nom d\'utilisateur simple (ex: jean.tremblay)' },
            { num: '3', text: 'Donnez un mot de passe temporaire (ex: invest2024)' },
            { num: '4', text: 'Envoyez les accès par message privé à chaque membre' },
            { num: '5', text: 'Chaque membre change son mot de passe à la connexion' },
          ].map(s => (
            <div key={s.num} className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{s.num}</span>
              <p className="text-slate-400 text-sm">{s.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Modal créer compte */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-white font-bold text-lg mb-4">Créer un compte</h3>
            <div className="space-y-3">
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Nom d'affichage</label>
                <input className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 text-white" placeholder="Jean Tremblay" value={newUser.nom || ''} onChange={e => setNewUser(p => ({ ...p, nom: e.target.value }))} />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Nom d'utilisateur</label>
                <input className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 text-white" placeholder="jean.tremblay" value={newUser.username} onChange={e => setNewUser(p => ({ ...p, username: e.target.value.toLowerCase().replace(/\s/g, '.') }))} />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Mot de passe temporaire</label>
                <div className="relative">
                  <input type={showPwd.create ? 'text' : 'password'} className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 pr-10 text-white" placeholder="Minimum 6 caractères" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} />
                  <button type="button" onClick={() => togglePwd('create')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300">
                    {showPwd.create ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Lié au membre (optionnel)</label>
                <select className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 text-white" value={newUser.membreId} onChange={e => setNewUser(p => ({ ...p, membreId: e.target.value }))}>
                  <option value="">Aucun lien</option>
                  {membres.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="isAdmin" checked={newUser.isAdmin} onChange={e => setNewUser(p => ({ ...p, isAdmin: e.target.checked }))} className="w-4 h-4" />
                <label htmlFor="isAdmin" className="text-slate-300 text-sm">Accès administrateur</label>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleCreate} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-xl font-medium transition">Créer</button>
              <button onClick={() => setShowCreate(false)} className="flex-1 bg-[#1a1a1a] hover:bg-[#222] text-white py-2 rounded-xl font-medium transition">Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal changer mot de passe */}
      {showChangePwd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-white font-bold text-lg mb-4">Changer le mot de passe</h3>
            <div className="space-y-3">
              {!user?.isAdmin && (
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Ancien mot de passe</label>
                  <div className="relative">
                    <input type={showPwd.old ? 'text' : 'password'} className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 pr-10 text-white" value={pwdForm.old} onChange={e => setPwdForm(p => ({ ...p, old: e.target.value }))} />
                    <button type="button" onClick={() => togglePwd('old')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {showPwd.old ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Nouveau mot de passe</label>
                <div className="relative">
                  <input type={showPwd.new ? 'text' : 'password'} className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 pr-10 text-white" value={pwdForm.new} onChange={e => setPwdForm(p => ({ ...p, new: e.target.value }))} />
                  <button type="button" onClick={() => togglePwd('new')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPwd.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Confirmer le mot de passe</label>
                <div className="relative">
                  <input type={showPwd.confirm ? 'text' : 'password'} className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 pr-10 text-white" value={pwdForm.confirm} onChange={e => setPwdForm(p => ({ ...p, confirm: e.target.value }))} />
                  <button type="button" onClick={() => togglePwd('confirm')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPwd.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => handleChangePwd(showChangePwd)} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-xl font-medium transition">Changer</button>
              <button onClick={() => { setShowChangePwd(null); setPwdForm({ old: '', new: '', confirm: '' }); }} className="flex-1 bg-[#1a1a1a] hover:bg-[#222] text-white py-2 rounded-xl font-medium transition">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
