import { useState } from 'react';
import { Eye, EyeOff, AlertCircle, ArrowLeft, Mail, KeyRound,
         CheckCircle2, RefreshCw, UserPlus, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { pushNotification } from './NotificationCenter';

const IS  = { background:'#111', border:'1px solid #222', color:'#fff', borderRadius:16, padding:'14px 16px', fontSize:14, width:'100%', outline:'none', fontWeight:500 };
const LS  = { fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', color:'#555', marginBottom:6, display:'block' };
const BTN = { background:'linear-gradient(135deg,#f59e0b,#fbbf24)', boxShadow:'0 8px 28px rgba(245,158,11,0.25)' };

function Spinner() {
  return <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor:'rgba(0,0,0,0.2)', borderTopColor:'#000' }} />;
}
function Err({ msg }) {
  if (!msg) return null;
  return (
    <div className="flex items-center gap-2 rounded-2xl px-4 py-3 fade-up"
      style={{ background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.15)' }}>
      <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
      <p className="text-red-400 text-xs font-medium">{msg}</p>
    </div>
  );
}
function BackBtn({ onClick, label = 'Retour à la connexion' }) {
  return (
    <button type="button" onClick={onClick}
      className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition"
      style={{ color:'#444' }}
      onMouseEnter={e => e.currentTarget.style.color='#888'}
      onMouseLeave={e => e.currentTarget.style.color='#444'}>
      <ArrowLeft className="w-3.5 h-3.5" />{label}
    </button>
  );
}

// ── Registration form ─────────────────────────────────────────────────────────
function RegisterForm({ onBack, onSuccess }) {
  const { registerUser } = useAuth();
  const [form, setForm]     = useState({ nom:'', username:'', password:'' });
  const [showPwd, setShow]  = useState(false);
  const [loading, setLoad]  = useState(false);
  const [error, setError]   = useState('');

  const submit = e => {
    e.preventDefault();
    setLoad(true); setError('');
    setTimeout(() => {
      const res = registerUser(form);
      setLoad(false);
      if (!res.ok) { setError(res.error); return; }
      // Notify admin
      pushNotification({
        titre: '🆕 Nouvelle demande de compte',
        message: `${form.nom} (@${form.username}) a demandé un accès. Approuvez dans Gestion des comptes.`,
        type: 'info',
      });
      onSuccess(form.nom);
    }, 700);
  };

  return (
    <form onSubmit={submit} className="w-full max-w-[320px] space-y-3 fade-up">
      <div className="text-center mb-5">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.2)' }}>
          <UserPlus className="w-6 h-6 text-amber-400" strokeWidth={1.5} />
        </div>
        <h2 className="text-white font-bold text-lg tracking-tight">Créer un compte</h2>
        <p className="text-xs mt-1.5" style={{ color:'#555' }}>
          Votre demande sera examinée par l'administrateur.
        </p>
      </div>

      <div>
        <label style={LS}>Nom complet</label>
        <input style={IS} placeholder="Jean Tremblay" autoCapitalize="words"
          value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} />
      </div>
      <div>
        <label style={LS}>Identifiant</label>
        <input style={IS} placeholder="jean.tremblay" autoCapitalize="none" autoCorrect="off"
          value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value.toLowerCase().replace(/\s/g,'.') }))} />
      </div>
      <div>
        <label style={LS}>Mot de passe</label>
        <div className="relative">
          <input style={{ ...IS, paddingRight:48 }} type={showPwd ? 'text' : 'password'} placeholder="Minimum 6 caractères"
            value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
          <button type="button" onClick={() => setShow(p => !p)}
            className="absolute right-4 top-1/2 -translate-y-1/2 transition" style={{ color:'#444' }}>
            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <Err msg={error} />

      <button type="submit" disabled={loading}
        className="w-full py-4 rounded-2xl text-black font-bold text-sm transition disabled:opacity-40 flex items-center justify-center"
        style={BTN}>
        {loading ? <Spinner /> : 'Envoyer la demande'}
      </button>
      <BackBtn onClick={onBack} />
    </form>
  );
}

// ── Pending approval screen ───────────────────────────────────────────────────
function PendingScreen({ nom, onBack }) {
  return (
    <div className="w-full max-w-[320px] text-center fade-up space-y-5">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
        style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)' }}>
        <Clock className="w-8 h-8 text-amber-400" strokeWidth={1.5} />
      </div>
      <div>
        <h2 className="text-white font-bold text-lg">Demande envoyée!</h2>
        <p className="text-sm mt-2 leading-relaxed" style={{ color:'#555' }}>
          Bonjour <strong className="text-white">{nom}</strong>, votre demande a été soumise.
          L'administrateur doit l'approuver avant que vous puissiez vous connecter.
        </p>
      </div>
      <div className="rounded-2xl p-4 text-left space-y-2"
        style={{ background:'rgba(245,158,11,0.05)', border:'1px solid rgba(245,158,11,0.12)' }}>
        {['Demande reçue ✓', "Approbation admin en cours…", 'Connexion disponible'].map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black"
              style={{ background: i === 0 ? '#00d084' : '#1a1a1a', color: i === 0 ? '#000' : '#333' }}>
              {i === 0 ? '✓' : i + 1}
            </div>
            <span className="text-xs font-medium" style={{ color: i === 0 ? '#00d084' : '#3a3a3a' }}>{s}</span>
          </div>
        ))}
      </div>
      <BackBtn onClick={onBack} label="Retour à la connexion" />
    </div>
  );
}

// ── Forgot password — Step 1 ──────────────────────────────────────────────────
function StepUsername({ onBack, onSuccess }) {
  const { requestReset } = useAuth();
  const [username, setU]    = useState('');
  const [loading, setLoad]  = useState(false);
  const [error, setError]   = useState('');

  const submit = e => {
    e.preventDefault();
    if (!username.trim()) { setError('Veuillez saisir votre identifiant.'); return; }
    setLoad(true); setError('');
    setTimeout(() => {
      const res = requestReset(username.trim());
      setLoad(false);
      if (!res.ok) { setError(res.error); return; }
      onSuccess({ username: username.trim(), code: res.code, nom: res.nom });
    }, 700);
  };

  return (
    <form onSubmit={submit} className="w-full max-w-[320px] space-y-4 fade-up">
      <div className="text-center mb-5">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.2)' }}>
          <Mail className="w-6 h-6 text-amber-400" strokeWidth={1.5} />
        </div>
        <h2 className="text-white font-bold text-lg tracking-tight">Mot de passe oublié</h2>
        <p className="text-xs mt-1.5" style={{ color:'#555' }}>Entrez votre identifiant pour recevoir un code.</p>
      </div>
      <div>
        <label style={LS}>Identifiant</label>
        <input style={IS} autoCapitalize="none" placeholder="Votre identifiant"
          value={username} onChange={e => setU(e.target.value)} />
      </div>
      <Err msg={error} />
      <button type="submit" disabled={loading}
        className="w-full py-4 rounded-2xl text-black font-bold text-sm transition disabled:opacity-40 flex items-center justify-center"
        style={BTN}>
        {loading ? <Spinner /> : 'Envoyer le code'}
      </button>
      <BackBtn onClick={onBack} />
    </form>
  );
}

// ── Forgot password — Step 2 ──────────────────────────────────────────────────
function StepCode({ data, onBack, onSuccess }) {
  const { confirmReset } = useAuth();
  const [code, setCode]     = useState('');
  const [pwd,  setPwd]      = useState('');
  const [pwd2, setPwd2]     = useState('');
  const [show, setShow]     = useState(false);
  const [loading, setLoad]  = useState(false);
  const [error, setError]   = useState('');

  const submit = e => {
    e.preventDefault();
    if (code.length !== 6)   { setError('Le code doit comporter 6 chiffres.'); return; }
    if (pwd.length < 6)       { setError('Minimum 6 caractères.'); return; }
    if (pwd !== pwd2)         { setError('Les mots de passe ne correspondent pas.'); return; }
    setLoad(true); setError('');
    setTimeout(() => {
      const res = confirmReset(data.username, code, pwd);
      setLoad(false);
      if (!res.ok) { setError(res.error); return; }
      onSuccess();
    }, 700);
  };

  return (
    <form onSubmit={submit} className="w-full max-w-[320px] space-y-3 fade-up">
      <div className="text-center mb-3">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.2)' }}>
          <KeyRound className="w-6 h-6 text-amber-400" strokeWidth={1.5} />
        </div>
        <h2 className="text-white font-bold text-lg tracking-tight">Vérification</h2>
      </div>
      <div className="rounded-2xl p-4" style={{ background:'rgba(245,158,11,0.05)', border:'1px solid rgba(245,158,11,0.12)' }}>
        <p className="text-xs mb-2" style={{ color:'#888' }}>Code pour <strong className="text-white">{data.nom}</strong> :</p>
        <p className="text-3xl font-black tracking-[0.3em] num text-center text-gradient py-1">{data.code}</p>
        <p className="text-[10px] text-center mt-1" style={{ color:'#3a3a3a' }}>Valide 15 minutes</p>
      </div>
      <div>
        <label style={LS}>Code (6 chiffres)</label>
        <input style={{ ...IS, textAlign:'center', letterSpacing:'0.35em', fontSize:20, fontWeight:800 }}
          type="text" inputMode="numeric" maxLength={6} placeholder="000000"
          value={code} onChange={e => setCode(e.target.value.replace(/\D/g,'').slice(0,6))} />
      </div>
      <div>
        <label style={LS}>Nouveau mot de passe</label>
        <div className="relative">
          <input style={{ ...IS, paddingRight:48 }} type={show ? 'text' : 'password'} placeholder="Minimum 6 caractères"
            value={pwd} onChange={e => setPwd(e.target.value)} />
          <button type="button" onClick={() => setShow(p => !p)}
            className="absolute right-4 top-1/2 -translate-y-1/2 transition" style={{ color:'#444' }}>
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <div>
        <label style={LS}>Confirmer</label>
        <input style={IS} type="password" placeholder="Répétez le mot de passe"
          value={pwd2} onChange={e => setPwd2(e.target.value)} />
      </div>
      <Err msg={error} />
      <button type="submit" disabled={loading || code.length !== 6 || !pwd || !pwd2}
        className="w-full py-4 rounded-2xl text-black font-bold text-sm transition disabled:opacity-30 flex items-center justify-center"
        style={BTN}>
        {loading ? <Spinner /> : 'Réinitialiser'}
      </button>
      <button type="button" onClick={onBack}
        className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold transition"
        style={{ color:'#444' }}
        onMouseEnter={e => e.currentTarget.style.color='#888'}
        onMouseLeave={e => e.currentTarget.style.color='#444'}>
        <RefreshCw className="w-3.5 h-3.5" /> Nouveau code
      </button>
    </form>
  );
}

// ── Forgot password — Step 3 ──────────────────────────────────────────────────
function StepSuccess({ onBack }) {
  return (
    <div className="w-full max-w-[320px] text-center fade-up space-y-5">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
        style={{ background:'rgba(0,208,132,0.08)', border:'1px solid rgba(0,208,132,0.2)' }}>
        <CheckCircle2 className="w-8 h-8" style={{ color:'#00d084' }} strokeWidth={1.5} />
      </div>
      <div>
        <h2 className="text-white font-bold text-lg">Mot de passe mis à jour!</h2>
        <p className="text-sm mt-2" style={{ color:'#555' }}>Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
      </div>
      <button onClick={onBack}
        className="w-full py-4 rounded-2xl text-black font-bold text-sm transition active:scale-95"
        style={BTN}>
        Se connecter
      </button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const { login }             = useAuth();
  // views: 'login' | 'register' | 'register-pending'
  //        | 'forgot-1' | 'forgot-2' | 'forgot-3'
  const [view, setView]       = useState('login');
  const [resetData, setReset] = useState(null);
  const [pendingNom, setPNom] = useState('');
  const [form, setForm]       = useState({ username:'', password:'' });
  const [showPwd, setShow]    = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoad]    = useState(false);
  const [isPending, setIP]    = useState(false);

  const handleLogin = e => {
    e.preventDefault();
    if (!form.username || !form.password) { setError('Veuillez remplir tous les champs.'); return; }
    setLoad(true); setError(''); setIP(false);
    setTimeout(() => {
      const res = login(form.username, form.password);
      setLoad(false);
      if (!res.ok) { setError(res.error); setIP(!!res.pending); }
    }, 700);
  };

  const isSub  = view !== 'login';
  const isSmall = isSub;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background:'#000' }}>

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ background:'radial-gradient(ellipse 70% 40% at 50% 20%, rgba(245,158,11,0.07) 0%, transparent 70%)' }} />

      {/* Logo */}
      <div className={`text-center fade-up transition-all duration-500 ${isSmall ? 'mb-6' : 'mb-10'}`}>
        <div className="relative inline-block">
          <div className="absolute inset-0 rounded-3xl blur-2xl opacity-25"
            style={{ background:'linear-gradient(135deg,#f59e0b,#d97706)', transform:'scale(1.15)' }} />
          <img src="/logo.png" alt="Alliance Patrimoine"
            className={`relative mx-auto rounded-3xl object-contain transition-all duration-500 ${isSmall ? 'w-14 h-14' : 'w-28 h-28'}`}
            style={{ background:'#fff', padding: isSmall ? '5px' : '10px', boxShadow:'0 20px 56px rgba(245,158,11,0.2)' }} />
        </div>
        {!isSmall && (
          <>
            <h1 className="text-white font-bold text-xl mt-5 tracking-tight">Alliance Patrimoine</h1>
            <p className="text-xs font-bold tracking-[0.3em] mt-1 text-gradient">INC.</p>
          </>
        )}
      </div>

      {/* ── Login ── */}
      {view === 'login' && (
        <form onSubmit={handleLogin} className="w-full max-w-[320px] space-y-3 fade-up" style={{ animationDelay:'80ms' }}>

          <div>
            <label style={LS}>Utilisateur</label>
            <input type="text" autoComplete="username" autoCapitalize="none"
              style={IS} placeholder="Votre identifiant"
              value={form.username} onChange={e => setForm(p => ({ ...p, username:e.target.value }))} />
          </div>

          <div>
            <label style={LS}>Mot de passe</label>
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} autoComplete="current-password"
                style={{ ...IS, paddingRight:48 }} placeholder="••••••••"
                value={form.password} onChange={e => setForm(p => ({ ...p, password:e.target.value }))} />
              <button type="button" onClick={() => setShow(p => !p)}
                className="absolute right-4 top-1/2 -translate-y-1/2 transition" style={{ color:'#444' }}
                onMouseEnter={e => e.currentTarget.style.color='#888'}
                onMouseLeave={e => e.currentTarget.style.color='#444'}>
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="button" onClick={() => { setView('forgot-1'); setError(''); }}
              className="text-xs font-semibold transition" style={{ color:'#444' }}
              onMouseEnter={e => e.currentTarget.style.color='#f59e0b'}
              onMouseLeave={e => e.currentTarget.style.color='#444'}>
              Mot de passe oublié?
            </button>
          </div>

          {/* Pending warning */}
          {isPending && (
            <div className="flex items-start gap-2 rounded-2xl px-4 py-3 fade-up"
              style={{ background:'rgba(245,158,11,0.07)', border:'1px solid rgba(245,158,11,0.18)' }}>
              <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-amber-400 text-xs font-medium">{error}</p>
            </div>
          )}
          {!isPending && <Err msg={error} />}

          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-2xl text-black font-bold text-sm transition disabled:opacity-40 flex items-center justify-center mt-1"
            style={BTN}>
            {loading ? <Spinner /> : 'Se connecter'}
          </button>

          {/* Register link */}
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px" style={{ background:'rgba(255,255,255,0.05)' }} />
            <span className="text-[10px] font-semibold" style={{ color:'#3a3a3a' }}>ou</span>
            <div className="flex-1 h-px" style={{ background:'rgba(255,255,255,0.05)' }} />
          </div>
          <button type="button" onClick={() => { setView('register'); setError(''); }}
            className="w-full py-3.5 rounded-2xl text-sm font-bold transition active:scale-95 flex items-center justify-center gap-2"
            style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', color:'#888' }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.07)'; e.currentTarget.style.color='#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.color='#888'; }}>
            <UserPlus className="w-4 h-4" strokeWidth={1.8} />
            Créer un compte
          </button>
        </form>
      )}

      {/* ── Register ── */}
      {view === 'register' && (
        <RegisterForm
          onBack={() => setView('login')}
          onSuccess={nom => { setPNom(nom); setView('register-pending'); }}
        />
      )}

      {/* ── Register pending ── */}
      {view === 'register-pending' && (
        <PendingScreen nom={pendingNom} onBack={() => setView('login')} />
      )}

      {/* ── Forgot 1 ── */}
      {view === 'forgot-1' && (
        <StepUsername
          onBack={() => setView('login')}
          onSuccess={d => { setReset(d); setView('forgot-2'); }}
        />
      )}

      {/* ── Forgot 2 ── */}
      {view === 'forgot-2' && resetData && (
        <StepCode
          data={resetData}
          onBack={() => setView('forgot-1')}
          onSuccess={() => setView('forgot-3')}
        />
      )}

      {/* ── Forgot 3 ── */}
      {view === 'forgot-3' && (
        <StepSuccess onBack={() => { setView('login'); setReset(null); }} />
      )}

      <p className="text-[11px] mt-12 fade-up" style={{ color:'#1f1f1f', animationDelay:'160ms' }}>
        Alliance Patrimoine Inc. © {new Date().getFullYear()}
      </p>
    </div>
  );
}
