import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const ADMIN_DEFAULT = {
  id: 'admin',
  username: 'admin',
  password: 'admin1234',
  nom: 'Administrateur',
  role: 'Admin',
  membreId: null,
  isAdmin: true,
  status: 'active',
};

function getUsers() {
  try {
    const saved = localStorage.getItem('ig_users');
    if (saved) return JSON.parse(saved);
  } catch {}
  return [ADMIN_DEFAULT];
}

function saveUsers(users) {
  try { localStorage.setItem('ig_users', JSON.stringify(users)); } catch {}
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const s = localStorage.getItem('ig_session');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });
  const [users, setUsers] = useState(getUsers);

  useEffect(() => { saveUsers(users); }, [users]);

  // ── Login — checks status before allowing access ──────────────────────────
  const login = (username, password) => {
    const found = users.find(u =>
      u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );
    if (found) {
      if (found.status === 'pending')
        return { ok: false, pending: true, error: "Votre compte est en attente d'approbation par l'administrateur." };
      if (found.status === 'rejected')
        return { ok: false, error: 'Votre demande a été refusée. Contactez l\'administrateur.' };
      const session = { ...found, password: undefined };
      setUser(session);
      localStorage.setItem('ig_session', JSON.stringify(session));
      return { ok: true };
    }
    return { ok: false, error: 'Identifiant ou mot de passe incorrect.' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ig_session');
  };

  // ── Self-registration — creates account with status: 'pending' ────────────
  const registerUser = (data) => {
    if (!data.username || !data.password || !data.nom)
      return { ok: false, error: 'Remplissez tous les champs.' };
    if (users.find(u => u.username.toLowerCase() === data.username.toLowerCase()))
      return { ok: false, error: 'Ce nom d\'utilisateur est déjà pris.' };
    if (data.password.length < 6)
      return { ok: false, error: 'Le mot de passe doit comporter au moins 6 caractères.' };
    const newUser = {
      ...data,
      id: Date.now().toString(),
      isAdmin: false,
      status: 'pending',
      registeredAt: new Date().toISOString(),
    };
    setUsers(prev => [...prev, newUser]);
    return { ok: true };
  };

  // ── Admin: approve a pending account ─────────────────────────────────────
  const approveUser = (id) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'active' } : u));
    return { ok: true };
  };

  // ── Admin: reject a pending account ──────────────────────────────────────
  const rejectUser = (id) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    return { ok: true };
  };

  // ── Admin: create a user directly (already active) ────────────────────────
  const createUser = (data) => {
    if (users.find(u => u.username.toLowerCase() === data.username.toLowerCase()))
      return { ok: false, error: 'Ce nom d\'utilisateur existe déjà' };
    const newUser = { ...data, id: Date.now().toString(), status: 'active' };
    setUsers(prev => [...prev, newUser]);
    return { ok: true };
  };

  const updateUser = (id, data) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
    if (user?.id === id) {
      const updated = { ...user, ...data, password: undefined };
      setUser(updated);
      localStorage.setItem('ig_session', JSON.stringify(updated));
    }
  };

  const deleteUser = (id) => {
    if (id === 'admin') return { ok: false, error: 'Impossible de supprimer l\'admin' };
    setUsers(prev => prev.filter(u => u.id !== id));
    return { ok: true };
  };

  const changePassword = (id, oldPassword, newPassword) => {
    const found = users.find(u => u.id === id);
    if (!found) return { ok: false, error: 'Utilisateur introuvable' };
    if (found.password !== oldPassword && !user?.isAdmin)
      return { ok: false, error: 'Ancien mot de passe incorrect' };
    setUsers(prev => prev.map(u => u.id === id ? { ...u, password: newPassword } : u));
    return { ok: true };
  };

  // ── Password reset by token ───────────────────────────────────────────────
  const requestReset = (username) => {
    const found = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!found) return { ok: false, error: 'Aucun compte trouvé avec cet identifiant.' };
    const code    = String(Math.floor(100000 + Math.random() * 900000));
    const expires = Date.now() + 15 * 60 * 1000;
    localStorage.setItem('ig_reset_token', JSON.stringify({ username: found.username, code, expires }));
    return { ok: true, code, nom: found.nom || found.username };
  };

  const confirmReset = (username, code, newPassword) => {
    const raw = localStorage.getItem('ig_reset_token');
    if (!raw) return { ok: false, error: 'Aucune demande de réinitialisation active.' };
    const token = JSON.parse(raw);
    if (token.username.toLowerCase() !== username.toLowerCase()) return { ok: false, error: 'Identifiant incorrect.' };
    if (token.code !== code) return { ok: false, error: 'Code invalide. Vérifiez et réessayez.' };
    if (Date.now() > token.expires) {
      localStorage.removeItem('ig_reset_token');
      return { ok: false, error: 'Le code a expiré. Recommencez.' };
    }
    if (newPassword.length < 6) return { ok: false, error: 'Le mot de passe doit comporter au moins 6 caractères.' };
    setUsers(prev => prev.map(u => u.username.toLowerCase() === username.toLowerCase() ? { ...u, password: newPassword } : u));
    localStorage.removeItem('ig_reset_token');
    return { ok: true };
  };

  const pendingUsers = users.filter(u => u.status === 'pending');

  return (
    <AuthContext.Provider value={{
      user, users, pendingUsers,
      login, logout,
      registerUser, approveUser, rejectUser,
      createUser, updateUser, deleteUser,
      changePassword, requestReset, confirmReset,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
