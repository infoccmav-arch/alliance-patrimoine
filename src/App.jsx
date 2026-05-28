import { useState, useEffect, useRef, useCallback } from 'react';
import {
  LayoutDashboard, Building2, CheckSquare, MessageCircle,
  Calculator, LogOut, Shield, ChevronRight,
  FileText, Wallet, User, FileDown, Search,
  WifiOff, Wifi, CloudUpload,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage       from './components/LoginPage';
import Dashboard       from './components/Dashboard';
import Membres         from './components/Membres';
import Proprietes      from './components/Proprietes';
import Franchises      from './components/Franchises';
import Finances        from './components/Finances';
import PlanAction      from './components/PlanAction';
import GestionComptes  from './components/GestionComptes';
import Discussion      from './components/Discussion';
import Calculatrice    from './components/Calculatrice';
import Documents       from './components/Documents';
import Profil          from './components/Profil';
import NotificationCenter, {
  checkCotisationReminder, checkCapitalGoals, checkProprieteGoals,
} from './components/NotificationCenter';
import { genererRapportPDF } from './components/RapportPDF';
import { ToastContainer, toast } from './components/Toast';
import ConfettiCanvas, { fireConfetti } from './components/Confetti';
import SearchModal     from './components/SearchModal';
import PullToRefresh   from './components/PullToRefresh';
import SplashScreen    from './components/SplashScreen';
import { useSwipe }    from './hooks/useSwipe';
import { haptic }      from './utils/haptic';
import { useSharedData }   from './hooks/useSharedData';
import { useOfflineQueue, getQueueSize } from './hooks/useOfflineQueue';
import { isSupabaseReady } from './lib/supabase';
import { initialMembers }  from './data/initialData';
import './index.css';

const ALL_TABS = [
  { id:'dashboard',    label:'Accueil',  icon:LayoutDashboard, adminOnly:false },
  { id:'proprietes',   label:'Immo',     icon:Building2,       adminOnly:false },
  { id:'calculatrice', label:'Calcul',   icon:Calculator,      adminOnly:false },
  { id:'discussion',   label:'Chat',     icon:MessageCircle,   adminOnly:false },
  { id:'plan',         label:'Plan',     icon:CheckSquare,     adminOnly:true  },
];

// ── Offline / sync status banner ────────────────────────────────────────────
function ConnectionBanner() {
  const [online,    setOnline]    = useState(navigator.onLine);
  const [syncing,   setSyncing]   = useState(false);
  const [pending,   setPending]   = useState(getQueueSize);
  const [showSync,  setShowSync]  = useState(false);
  const { flush } = useOfflineQueue();

  useEffect(() => {
    const onOnline  = () => { setOnline(true); setPending(getQueueSize()); };
    const onOffline = () => { setOnline(false); };
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);

    const onFlushed = (e) => {
      setPending(e.detail.remaining);
      setSyncing(false);
      if (e.detail.remaining === 0) {
        setShowSync(true);
        setTimeout(() => setShowSync(false), 3000);
      }
    };
    window.addEventListener('ig-queue-flushed', onFlushed);

    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('ig-queue-flushed', onFlushed);
    };
  }, [flush]);

  // Show offline banner
  if (!online) return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold"
      style={{ background: 'rgba(239,68,68,0.92)', backdropFilter: 'blur(8px)', color: 'white' }}>
      <WifiOff className="w-3.5 h-3.5" />
      Hors ligne — modifications sauvegardées localement
      {pending > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px]" style={{ background: 'rgba(0,0,0,0.25)' }}>{pending} en attente</span>}
    </div>
  );

  // Show sync success briefly
  if (showSync) return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold fade-up"
      style={{ background: 'rgba(0,208,132,0.9)', backdropFilter: 'blur(8px)', color: 'white' }}>
      <Wifi className="w-3.5 h-3.5" />
      Synchronisation complète — toutes les données sont à jour
    </div>
  );

  // Show pending writes badge (top-right) when online but queue not empty
  if (pending > 0 && isSupabaseReady) return (
    <div className="fixed top-3 right-4 z-50 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-bold cursor-pointer"
      style={{ background: 'rgba(245,158,11,0.9)', color: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.4)' }}
      onClick={() => { setSyncing(true); flush(); }}>
      <CloudUpload className="w-3 h-3" />
      {syncing ? 'Sync…' : `${pending} en attente`}
    </div>
  );

  return null;
}

function PageTransition({ tabKey, children }) {
  const [key, setKey] = useState(tabKey);
  const [anim, setAnim] = useState('');
  useEffect(() => {
    if (tabKey === key) return;
    setAnim('page-exit');
    const t1 = setTimeout(() => { setKey(tabKey); setAnim('page-enter'); }, 160);
    const t2 = setTimeout(() => setAnim(''), 360);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [tabKey]);
  return <div className={`page-anim ${anim}`} key={key}>{children}</div>;
}

function useChatUnread(activeTab) {
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    if (activeTab === 'discussion') { localStorage.setItem('ig_chat_seen', Date.now()); setUnread(0); }
  }, [activeTab]);
  useEffect(() => {
    const id = setInterval(() => {
      if (activeTab === 'discussion') return;
      try {
        const msgs = JSON.parse(localStorage.getItem('ig_messages') || '[]');
        const seen = +(localStorage.getItem('ig_chat_seen') || 0);
        setUnread(msgs.filter(m => new Date(m.timestamp).getTime() > seen).length);
      } catch {}
    }, 2500);
    return () => clearInterval(id);
  }, [activeTab]);
  return unread;
}

const MILESTONES = [10000, 25000, 50000, 100000, 200000, 500000, 1000000];
function useMilestone(capital) {
  const fired = useRef(new Set(JSON.parse(localStorage.getItem('ig_milestones') || '[]')));
  useEffect(() => {
    for (const m of MILESTONES) {
      if (capital >= m && !fired.current.has(m)) {
        fired.current.add(m);
        localStorage.setItem('ig_milestones', JSON.stringify([...fired.current]));
        fireConfetti(); haptic.success();
        const label = m >= 1000000 ? `${m/1000000}M$` : `${m/1000}k$`;
        toast.success(`Objectif atteint — ${label} de capital!`, 5000);
        break;
      }
    }
  }, [capital]);
}

function AppContent() {
  const { user, logout } = useAuth();
  const [tab, setTab]             = useState('dashboard');
  const [showProfile, setProfile] = useState(false);
  const [showSearch, setSearch]   = useState(false);

  const [membres,      setMembres]      = useSharedData('membres',      initialMembers);
  const [proprietes,   setProprietes]   = useSharedData('proprietes',   []);
  const [franchises,   setFranchises]   = useSharedData('franchises',   []);
  const [transactions, setTransactions] = useSharedData('transactions', []);
  const [capital,      setCapital]      = useSharedData('capital',      0);
  const [checklist,    setChecklist]    = useSharedData('checklist',    {});
  const [documents,    setDocuments]    = useSharedData('documents',    []);

  const unread = useChatUnread(tab);
  useMilestone(capital);

  useEffect(() => {
    const h = (e) => { if ((e.metaKey||e.ctrlKey) && e.key==='k') { e.preventDefault(); setSearch(true); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
  useEffect(() => { checkCotisationReminder(membres); }, [membres]);
  useEffect(() => { checkCapitalGoals(capital); }, [capital]);
  useEffect(() => { checkProprieteGoals(proprietes.length); }, [proprietes.length]);
  useEffect(() => { if (user && !user.isAdmin && tab==='plan') setTab('dashboard'); }, [user, tab]);

  if (!user) return <LoginPage />;

  const TABS = ALL_TABS.filter(t => !t.adminOnly || user.isAdmin);
  const initials = (user.nom || user.username).charAt(0).toUpperCase();

  const navigate = useCallback((newTab) => { haptic.tap(); setTab(newTab); }, []);

  const navTabIds = TABS.map(t => t.id);
  const currentNavIdx = navTabIds.indexOf(tab);
  const swipeHandlers = useSwipe(
    () => { if (currentNavIdx >= 0 && currentNavIdx < navTabIds.length-1) navigate(navTabIds[currentNavIdx+1]); },
    () => { if (currentNavIdx > 0) navigate(navTabIds[currentNavIdx-1]); }
  );

  const handleRefresh = async () => {
    haptic.light();
    await new Promise(r => setTimeout(r, 800));
    toast.info('Données actualisées');
  };

  const handleExportPDF = () => {
    genererRapportPDF({ membres, capital, proprietes, franchises, transactions });
    toast.success('Rapport PDF ouvert dans un nouvel onglet');
  };

  const PAGE_TITLE = {
    dashboard:    ['Tableau de bord',    'Votre progression en temps réel'],
    proprietes:   ['Portefeuille Immo',   'Gérez vos actifs immobiliers'],
    finances:     ['Finances',            'Suivi des flux et cotisations'],
    membres:      ['Équipe',              'Les actionnaires du groupe'],
    franchises:   ['Franchises',          'Vos entreprises en franchise'],
    discussion:   ['Discussion',          'Partagez des opportunités'],
    calculatrice: ['Calculatrice',        'Simulez votre hypothèque'],
    plan:         ["Plan d'action",       'Étapes vers la liberté financière'],
    comptes:      ['Comptes',             'Gestion des accès'],
    documents:    ['Documents',           'Contrats, actes et fichiers'],
    profil:       ['Mon profil',          'Vos informations et statistiques'],
  };
  const [title, subtitle] = PAGE_TITLE[tab] || ['',''];

  const PageContent = () => {
    if (tab==='dashboard')    return <Dashboard   membres={membres} proprietes={proprietes} franchises={franchises} capital={capital} transactions={transactions} onNavigate={navigate} />;
    if (tab==='membres')      return <Membres     membres={membres} setMembres={setMembres} transactions={transactions} />;
    if (tab==='proprietes')   return <Proprietes  proprietes={proprietes} setProprietes={setProprietes} setCapital={setCapital} />;
    if (tab==='franchises')   return <Franchises  franchises={franchises} setFranchises={setFranchises} />;
    if (tab==='finances')     return <Finances    membres={membres} capital={capital} setCapital={setCapital} transactions={transactions} setTransactions={setTransactions} />;
    if (tab==='discussion')   return <Discussion />;
    if (tab==='calculatrice') return <Calculatrice />;
    if (tab==='documents')    return <Documents   documents={documents} setDocuments={setDocuments} />;
    if (tab==='profil')       return <Profil      membres={membres} transactions={transactions} proprietes={proprietes} capital={capital} />;
    if (tab==='comptes')      return <GestionComptes membres={membres} setMembres={setMembres} />;
    if (tab==='plan') {
      if (!user.isAdmin) return (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.15)' }}>
            <Shield className="w-6 h-6 text-amber-400" strokeWidth={1.5} />
          </div>
          <p className="text-white font-bold text-base">Accès restreint</p>
          <p className="text-sm text-center max-w-xs" style={{ color:'#3a3a3a' }}>Le plan d'action est réservé à l'administrateur.</p>
        </div>
      );
      return <PlanAction checklist={checklist} setChecklist={setChecklist} />;
    }
    return null;
  };

  return (
    <div className="min-h-screen flex" style={{ background:'#000' }}>
      <ConnectionBanner />
      <ConfettiCanvas />
      <ToastContainer />
      <SearchModal open={showSearch} onClose={()=>setSearch(false)} membres={membres} proprietes={proprietes} transactions={transactions} documents={documents} onNavigate={navigate} />

      {/* ── SIDEBAR — desktop/tablet only ─────────────────────────────── */}
      <aside className="hidden md:flex flex-col flex-shrink-0"
        style={{ width:220, background:'#080808', borderRight:'1px solid rgba(255,255,255,0.05)', position:'sticky', top:0, height:'100vh' }}>
        <div className="flex items-center gap-2.5 px-5 py-5" style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
          <div className="relative">
            <img src="/logo.png" alt="Alliance" className="w-8 h-8 rounded-xl object-contain" style={{ background:'#fff', padding:'2px' }} />
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full pulse-dot" style={{ background:isSupabaseReady?'#00d084':'#f59e0b', border:'1.5px solid #080808' }} />
          </div>
          <div className="leading-none">
            <p className="font-bold text-white text-[12px] tracking-tight">Alliance Patrimoine</p>
            <p className="text-[8px] font-bold tracking-[0.22em] mt-0.5 text-gradient">INC.</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {[
            ...TABS,
            { id:'sep1' },
            { id:'finances',  label:'Finances',  icon:Wallet   },
            { id:'membres',   label:'Équipe',     icon:User     },
            { id:'documents', label:'Documents',  icon:FileText },
            ...(user.isAdmin ? [{ id:'comptes', label:'Comptes', icon:Shield }] : []),
          ].map((t,i) => {
            if (t.id==='sep1') return <div key={i} style={{ height:1, background:'rgba(255,255,255,0.04)', margin:'8px 0' }} />;
            const active = tab===t.id;
            return (
              <button key={t.id} onClick={()=>navigate(t.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background:active?'rgba(0,208,132,0.08)':'transparent', color:active?'#00d084':'#555', border:active?'1px solid rgba(0,208,132,0.15)':'1px solid transparent' }}
                onMouseEnter={e=>{ if(!active){e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.color='#888';} }}
                onMouseLeave={e=>{ if(!active){e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#555';} }}>
                <div className="relative">
                  <t.icon className="w-4 h-4" strokeWidth={active?2.2:1.6} />
                  {t.id==='discussion' && unread>0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-3.5 rounded-full flex items-center justify-center text-[8px] font-black text-white" style={{ background:'#ef4444', padding:'0 2px', boxShadow:'0 0 0 1.5px #080808' }}>
                      {unread>9?'9+':unread}
                    </span>
                  )}
                </div>
                {t.label}
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-4" style={{ borderTop:'1px solid rgba(255,255,255,0.04)' }}>
          <button onClick={()=>navigate('profil')} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition mb-1"
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.04)'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-black text-xs font-black" style={{ background:'linear-gradient(135deg,#f59e0b,#fbbf24)' }}>{initials}</div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-semibold text-white truncate">{user.nom||user.username}</p>
              <p className="text-[10px] truncate" style={{ color:'#444' }}>@{user.username}</p>
            </div>
          </button>
          <button onClick={()=>{logout();toast.info('À bientôt!');}} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition" style={{ color:'#444' }}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(239,68,68,0.06)';e.currentTarget.style.color='#ef4444';}}
            onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='#444';}}>
            <LogOut className="w-3.5 h-3.5" /> Se déconnecter
          </button>
        </div>
      </aside>

      {/* ── MAIN ────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 glass" style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', paddingTop:'max(12px, env(safe-area-inset-top))' }}>
          <div className="flex items-center gap-2.5 md:hidden">
            <div className="relative">
              <img src="/logo.png" alt="Alliance" className="w-7 h-7 rounded-xl object-contain" style={{ background:'#fff', padding:'2px' }} />
              <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full" style={{ background:isSupabaseReady?'#00d084':'#f59e0b', border:'1.5px solid #000' }} />
            </div>
            <p className="font-bold text-white text-[12px] tracking-tight">Alliance Patrimoine</p>
          </div>
          <div className="hidden md:block">
            <h1 className="text-white font-bold text-base tracking-tight">{title}</h1>
            <p className="text-xs" style={{ color:'#3a3a3a' }}>{subtitle}</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center px-2.5 py-1.5 rounded-full num text-xs font-bold" style={{ background:'rgba(0,208,132,0.08)', border:'1px solid rgba(0,208,132,0.15)', color:'#00d084' }}>
              {capital.toLocaleString('fr-CA')} $
            </div>
            <button onClick={()=>setSearch(true)} className="w-8 h-8 rounded-full flex items-center justify-center transition active:scale-90" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
              <Search className="w-3.5 h-3.5" style={{ color:'#666' }} strokeWidth={2} />
            </button>
            <NotificationCenter />
            <button onClick={()=>setProfile(p=>!p)} className="md:hidden w-8 h-8 rounded-full flex items-center justify-center text-black text-xs font-black" style={{ background:'linear-gradient(135deg,#f59e0b,#fbbf24)' }}>{initials}</button>
            {(tab==='finances'||tab==='documents') && user.isAdmin && (
              <button onClick={handleExportPDF} className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.15)', color:'#f59e0b' }}>
                <FileDown className="w-3.5 h-3.5" /> PDF
              </button>
            )}
          </div>
        </header>

        {showProfile && (
          <>
            <div className="fixed inset-0 z-30" onClick={()=>setProfile(false)} />
            <div className="absolute top-[56px] right-4 z-40 rounded-2xl p-2.5 w-56 fade-up" style={{ background:'#111', border:'1px solid rgba(255,255,255,0.08)', boxShadow:'0 24px 64px rgba(0,0,0,0.8)' }}>
              <div className="flex items-center gap-3 px-2 py-2.5 mb-1">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-black font-black text-sm" style={{ background:'linear-gradient(135deg,#f59e0b,#fbbf24)' }}>{initials}</div>
                <div>
                  <p className="text-white font-semibold text-sm leading-tight">{user.nom||user.username}</p>
                  <p className="text-[11px]" style={{ color:'#555' }}>@{user.username}</p>
                </div>
              </div>
              <div className="h-px my-1" style={{ background:'rgba(255,255,255,0.05)' }} />
              {[
                {icon:User,     label:'Mon profil',   onClick:()=>{navigate('profil');   setProfile(false);}},
                {icon:Wallet,   label:'Finances',     onClick:()=>{navigate('finances'); setProfile(false);}},
                {icon:FileText, label:'Documents',    onClick:()=>{navigate('documents');setProfile(false);}},
                ...(user.isAdmin?[{icon:Shield,label:'Comptes',onClick:()=>{navigate('comptes');setProfile(false);}}]:[]),
                {icon:FileDown, label:'Rapport PDF',  onClick:()=>{handleExportPDF();setProfile(false);}},
              ].map((item,i)=>(
                <button key={i} onClick={item.onClick} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-400 transition"
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.05)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <item.icon className="w-4 h-4 text-amber-500" />{item.label}<ChevronRight className="w-3 h-3 ml-auto opacity-30" />
                </button>
              ))}
              <div className="h-px my-1" style={{ background:'rgba(255,255,255,0.05)' }} />
              <button onClick={()=>{logout();setProfile(false);toast.info('À bientôt!');}} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition" style={{ color:'#ef4444' }}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(239,68,68,0.08)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <LogOut className="w-4 h-4" /> Se déconnecter
              </button>
            </div>
          </>
        )}

        {tab!=='dashboard' && (
          <div className="md:hidden px-5 pt-5 pb-1 flex items-start justify-between">
            <div>
              <h1 className="text-white font-bold text-xl tracking-tight">{title}</h1>
              <p className="text-xs mt-0.5" style={{ color:'#3a3a3a' }}>{subtitle}</p>
            </div>
            {(tab==='finances'||tab==='documents') && user.isAdmin && (
              <button onClick={handleExportPDF} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.15)', color:'#f59e0b' }}>
                <FileDown className="w-3.5 h-3.5" /> PDF
              </button>
            )}
          </div>
        )}

        <PullToRefresh onRefresh={handleRefresh}>
          <div {...swipeHandlers}>
            <div className="w-full max-w-lg mx-auto px-4 py-4 pb-32 md:pb-10">
              <PageTransition tabKey={tab}><PageContent /></PageTransition>
            </div>
          </div>
        </PullToRefresh>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40" style={{ paddingBottom:'env(safe-area-inset-bottom, 8px)' }}>
          <div className="relative flex items-center justify-around px-2 py-3"
            style={{ background:'rgba(12,12,12,0.96)', backdropFilter:'blur(48px) saturate(180%)', WebkitBackdropFilter:'blur(48px) saturate(180%)', borderTop:'1px solid rgba(255,255,255,0.07)', boxShadow:'0 -1px 0 rgba(255,255,255,0.04)' }}>
            {TABS.map(t=>{
              const active = tab===t.id;
              return (
                <button key={t.id} onClick={()=>navigate(t.id)}
                  className="relative flex flex-col items-center gap-1.5 px-4 py-2 rounded-xl transition-all duration-150 active:scale-85">
                  {active && <div className="absolute inset-0 rounded-xl" style={{ background:'rgba(0,208,132,0.07)', border:'1px solid rgba(0,208,132,0.1)' }} />}
                  <div className="relative">
                    <t.icon className="w-5 h-5 relative z-10" strokeWidth={active?2.2:1.6} style={{ color:active?'#fff':'#3a3a3a' }} />
                    {t.id==='discussion' && unread>0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white z-20"
                        style={{ background:'#ef4444', padding:'0 3px', boxShadow:'0 0 0 2px #000' }}>
                        {unread>9?'9+':unread}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] font-bold tracking-wide relative z-10" style={{ color:active?'#00d084':'#3a3a3a' }}>{t.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

function AppWithSplash() {
  const [splashDone, setSplashDone] = useState(false);
  return (
    <>
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
      <AuthProvider><AppContent /></AuthProvider>
    </>
  );
}

export default function App() {
  return <AppWithSplash />;
}
