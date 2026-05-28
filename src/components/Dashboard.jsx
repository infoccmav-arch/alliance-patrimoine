import { useState, useEffect, useRef } from 'react';
import {
  TrendingUp, Building2, User, AlertCircle, Star, Clock,
} from 'lucide-react';
import {
  AreaChart, Area, ResponsiveContainer, Tooltip,
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis,
} from 'recharts';
import Sparkline, { generateSparkData } from './Sparkline';
import { useAuth } from '../context/AuthContext';

const fmtCAD  = (v) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M$`;
  if (v >= 1_000)     return `${(v / 1_000).toFixed(1)}k$`;
  return `${Math.round(v).toLocaleString('fr-CA')}$`;
};
const fmtFull = (v) => Math.round(v).toLocaleString('fr-CA', { style:'currency', currency:'CAD', maximumFractionDigits:0 });

// ── Animated counter hook ────────────────────────────────────────────────────
function useCountUp(target, duration = 1400) {
  const [value, setValue] = useState(0);
  const raf = useRef(null);
  const start = useRef(null);
  const from = useRef(0);

  useEffect(() => {
    from.current = 0;
    start.current = null;
    const animate = (ts) => {
      if (!start.current) start.current = ts;
      const elapsed = ts - start.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out expo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(Math.round(from.current + (target - from.current) * eased));
      if (progress < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return value;
}

// Animated number display
function AnimNum({ value, format = 'full', duration = 1400 }) {
  const animated = useCountUp(value, duration);
  if (format === 'full') return <>{fmtFull(animated).replace('CA', '')}</>;
  if (format === 'cad')  return <>{fmtCAD(animated)}</>;
  return <>{animated.toLocaleString('fr-CA')}</>;
}

const projData = [
  {a:'A1',v:200000},{a:'A2',v:450000},{a:'A3',v:750000},{a:'A4',v:1200000},
  {a:'A5',v:2000000},{a:'A6',v:3200000},{a:'A7',v:5000000},{a:'A8',v:7000000},
  {a:'A9',v:9500000},{a:'A10',v:12000000},
];

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#1a1a1a', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'8px 12px' }}>
      {label && <p style={{ color:'#555', fontSize:10, marginBottom:2 }}>{label}</p>}
      <p className="num text-white font-bold text-sm">{fmtCAD(payload[0].value)}</p>
    </div>
  );
};

function SectionLabel({ label }) {
  return <p className="text-xs font-semibold uppercase tracking-[0.12em] mb-2" style={{ color:'#3a3a3a' }}>{label}</p>;
}

function AssetRow({ icon, iconBg, label, sub, value, change, sparkData, isPositive, delay=0 }) {
  return (
    <div className="flex items-center gap-4 py-4 fade-up"
      style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', animationDelay:`${delay}ms` }}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
        style={{ background: iconBg || 'rgba(255,255,255,0.06)' }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{label}</p>
        <p className="text-xs mt-0.5 truncate" style={{ color:'#5a5a5a' }}>{sub}</p>
      </div>
      {sparkData && <div className="flex-shrink-0 opacity-80"><Sparkline data={sparkData} positive={isPositive} width={56} height={24} /></div>}
      <div className="flex-shrink-0 text-right">
        <p className="text-sm font-bold num text-white">{value}</p>
        <p className="text-xs font-semibold num mt-0.5" style={{ color:isPositive?'#00d084':'#ff4d4d' }}>{change}</p>
      </div>
    </div>
  );
}

// ── Beautiful personal member card ───────────────────────────────────────────
function CartePersonnelle({ membre, totalCapital, totalMembres, totalPort, membres }) {
  const totalCotis = membres.filter(m=>m.actif).reduce((s,m)=>s+(+m.cotisation||0),0);
  const partPct    = totalCotis > 0 ? ((+membre.cotisation||0)/totalCotis)*100 : (1/Math.max(totalMembres,1))*100;
  const valeurPart = totalPort * (partPct / 100);
  const proj5ans   = valeurPart * 8;
  const proj10ans  = valeurPart * 18;
  const prog       = Math.min(100, Math.round(((new Date().getMonth()+1)/12)*100));

  // Mini bar chart for cotisation progress
  const moisNom = new Date().toLocaleDateString('fr-CA', { month:'long', year:'numeric' });

  return (
    <div className="fade-up" style={{ position:'relative', overflow:'hidden' }}>
      {/* Ambient glow */}
      <div style={{ position:'absolute', top:-40, right:-40, width:160, height:160, borderRadius:'50%', background:'radial-gradient(circle, rgba(0,208,132,0.08) 0%, transparent 70%)', pointerEvents:'none' }} />

      <div className="rounded-2xl p-5" style={{ background:'linear-gradient(135deg, rgba(0,208,132,0.06) 0%, rgba(0,208,132,0.02) 100%)', border:'1px solid rgba(0,208,132,0.15)' }}>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-black font-black text-lg flex-shrink-0"
            style={{ background:'linear-gradient(135deg,#00d084,#00b870)', boxShadow:'0 4px 16px rgba(0,208,132,0.3)' }}>
            {membre.nom.charAt(0)}
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-base leading-tight">{membre.nom}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background:'rgba(0,208,132,0.12)', color:'#00d084' }}>
                {membre.role || 'Actionnaire'}
              </span>
              <span className="text-[10px]" style={{ color:'#555' }}>• {moisNom}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color:'#3a3a3a' }}>Ma part</p>
            <p className="text-xl font-black num" style={{ color:'#00d084' }}>{partPct.toFixed(1)}%</p>
          </div>
        </div>

        {/* 3 main stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label:'Cotisation', value: fmtCAD(membre.cotisation), sub:'/mois', color:'#fff' },
            { label:'Valeur actuelle', value: valeurPart < 1000 ? valeurPart.toFixed(0)+'$' : fmtCAD(valeurPart), sub:'de ta part', color:'#f59e0b' },
            { label:'Total cotisé', value: fmtCAD(membre.totalCotise || 0), sub:'à vie', color:'#818cf8' },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className="rounded-xl p-3 text-center" style={{ background:'rgba(0,0,0,0.25)', border:'1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color:'#444' }}>{label}</p>
              <p className="text-sm font-black num leading-tight" style={{ color }}>{value}</p>
              <p className="text-[9px] mt-0.5" style={{ color:'#333' }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Projection bar */}
        <div className="rounded-xl p-3.5 mb-4" style={{ background:'rgba(0,0,0,0.2)', border:'1px solid rgba(255,255,255,0.04)' }}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-3 h-3" style={{ color:'#00d084' }} />
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color:'#00d084' }}>Projection de richesse</p>
          </div>
          <div className="flex items-center justify-between gap-3">
            {[
              { label:'Maintenant', value: valeurPart, color:'#555' },
              { label:'5 ans', value: proj5ans, color:'#f59e0b' },
              { label:'10 ans', value: proj10ans, color:'#00d084' },
            ].map(({ label, value, color }, i) => (
              <div key={i} className="flex-1 text-center">
                <p className="text-[9px] font-semibold mb-1.5" style={{ color:'#444' }}>{label}</p>
                <p className="text-xs font-black num" style={{ color }}>
                  {value >= 1_000_000 ? `${(value/1_000_000).toFixed(1)}M$` : value >= 1000 ? `${(value/1000).toFixed(0)}k$` : `${Math.round(value)}$`}
                </p>
              </div>
            ))}
          </div>
          {/* Visual arrow line */}
          <div className="flex items-center gap-1 mt-3 px-4">
            <div className="flex-1 rounded-full" style={{ height:2, background:'linear-gradient(90deg, #333, #f59e0b, #00d084)' }} />
            <span style={{ color:'#00d084', fontSize:10 }}>→</span>
          </div>
        </div>

        {/* Annual progress */}
        <div>
          <div className="flex justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" style={{ color:'#555' }} />
              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color:'#444' }}>Progression {new Date().getFullYear()}</p>
            </div>
            <p className="text-[10px] font-black num" style={{ color:'#00d084' }}>{prog}%</p>
          </div>
          <div className="rounded-full overflow-hidden" style={{ height:3, background:'#1a1a1a' }}>
            <div style={{ width:`${prog}%`, background:'linear-gradient(90deg,#00b870,#00d084)', height:'100%', transition:'width 1.2s cubic-bezier(.16,1,.3,1)', boxShadow:'0 0 8px rgba(0,208,132,0.4)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SmartReminders({ membres, transactions }) {
  const moisStr = new Date().toISOString().substring(0,7);
  const prevStr = new Date(new Date().getFullYear(), new Date().getMonth()-1, 1).toISOString().substring(0,7);
  const paidNow = transactions.filter(t => t.categorie==='Cotisation' && t.membreId && t.date?.startsWith(moisStr)).map(t=>t.membreId);
  const lateMembers = membres.filter(m => {
    if (!m.actif) return false;
    return !transactions.some(t => t.membreId===m.id && t.categorie==='Cotisation' && (t.date?.startsWith(moisStr) || t.date?.startsWith(prevStr)));
  });
  const unpaidNow = membres.filter(m => m.actif && !paidNow.includes(m.id));
  if (lateMembers.length===0 && unpaidNow.length===0) return null;
  const target = lateMembers.length > 0 ? lateMembers : unpaidNow;
  const msg = lateMembers.length > 0
    ? 'aucune cotisation sur 2 mois.'
    : `cotisation de ${new Date().toLocaleDateString('fr-CA',{month:'long'})} non enregistrée.`;
  return (
    <div className="rounded-2xl p-4 fade-up" style={{ background:'rgba(245,158,11,0.04)', border:'1px solid rgba(245,158,11,0.12)' }}>
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle className="w-3.5 h-3.5 text-amber-400" strokeWidth={2} />
        <p className="text-xs font-bold uppercase tracking-widest text-amber-400">Rappels</p>
      </div>
      <p className="text-xs" style={{ color:'#888' }}>
        <span className="text-white font-semibold">{target.map(m=>m.nom.split(' ')[0]).join(', ')}</span>{' '}— {msg}
      </p>
    </div>
  );
}

function CapitalChart({ transactions, capital }) {
  const now = new Date();
  let base = capital;
  const reversed = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    const m = d.toISOString().substring(0,7);
    const net = transactions.filter(t=>t.date?.startsWith(m)).reduce((s,t)=>s+(t.type==='entree'?t.montant:-t.montant),0);
    reversed.push({ mois: d.toLocaleDateString('fr-CA',{month:'short'}), v: Math.max(0,base), net });
    base -= net;
  }
  const chartData = reversed.reverse();
  return (
    <div className="fade-up">
      <SectionLabel label="Capital — 12 mois" />
      <div className="rounded-2xl overflow-hidden" style={{ background:'#0d0d0d', border:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ height:110 }} className="px-2 pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top:4, right:4, left:4, bottom:0 }}>
              <defs>
                <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#00d084" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#00d084" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <Tooltip content={<Tip />} cursor={{ stroke:'rgba(0,208,132,0.15)', strokeWidth:1 }} />
              <XAxis dataKey="mois" tick={{ fontSize:9, fill:'#333', fontWeight:600 }} tickLine={false} axisLine={false} />
              <Area type="monotone" dataKey="v" stroke="#00d084" fill="url(#cg)" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function AssetPie({ capital, proprietes, franchises }) {
  const valImmo  = proprietes.reduce((s,p)=>s+(+p.valeurActuelle||+p.prixAchat||0),0);
  const valFranc = franchises.reduce((s,f)=>s+(+(f.investissement||'').replace(/\D/g,'')||0),0);
  const data = [
    { name:'Liquidités', value:capital,  color:'#00d084' },
    { name:'Immobilier', value:valImmo,  color:'#818cf8' },
    { name:'Franchises', value:valFranc, color:'#f59e0b' },
  ].filter(d=>d.value>0);
  if (data.length < 2) return null;
  const total = data.reduce((s,d)=>s+d.value,0);
  return (
    <div className="fade-up">
      <SectionLabel label="Répartition des actifs" />
      <div className="rounded-2xl p-4" style={{ background:'#0d0d0d', border:'1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-4">
          <div style={{ width:80, height:80, flexShrink:0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={22} outerRadius={36} dataKey="value" paddingAngle={3} strokeWidth={0}>
                  {data.map((d,i)=><Cell key={i} fill={d.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2.5">
            {data.map((d,i)=>(
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background:d.color }} />
                  <span className="text-xs font-medium" style={{ color:'#888' }}>{d.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold num text-white">{fmtCAD(d.value)}</span>
                  <span className="text-[10px] ml-1.5 num" style={{ color:'#444' }}>{Math.round((d.value/total)*100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ContribBar({ membres, transactions }) {
  const now = new Date();
  const maxCot = membres.filter(m=>m.actif).reduce((s,m)=>s+m.cotisation,0);
  if (maxCot===0) return null;
  const data = [];
  for (let i=5; i>=0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    const m = d.toISOString().substring(0,7);
    const v = transactions.filter(t=>t.categorie==='Cotisation'&&t.date?.startsWith(m)).reduce((s,t)=>s+t.montant,0);
    data.push({ mois: d.toLocaleDateString('fr-CA',{month:'short'}), v });
  }
  return (
    <div className="fade-up">
      <SectionLabel label="Cotisations — 6 mois" />
      <div className="rounded-2xl overflow-hidden" style={{ background:'#0d0d0d', border:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ height:90 }} className="px-2 pt-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barCategoryGap="30%">
              <XAxis dataKey="mois" tick={{ fontSize:9, fill:'#333', fontWeight:600 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background:'#111', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, color:'#fff', fontSize:11 }}
                cursor={{ fill:'rgba(255,255,255,0.02)' }}
                formatter={v=>[`${v.toLocaleString('fr-CA')} $`,'Cotisations']} />
              <Bar dataKey="v" fill="#f59e0b" radius={[5,5,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ membres, proprietes, franchises, capital, transactions=[], onNavigate }) {
  const { user } = useAuth();
  const [showChart, setShowChart] = useState(false);

  const cotisation  = membres.filter(m=>m.actif).reduce((s,m)=>s+m.cotisation,0);
  const valeurP     = proprietes.reduce((s,p)=>s+(+p.valeurActuelle||+p.prixAchat||0),0);
  const hypo        = proprietes.reduce((s,p)=>s+(+p.hypotheque||0),0);
  const cashflow    = proprietes.reduce((s,p)=>s+(+p.cashflow||0),0);
  const valeurNette = valeurP - hypo;
  const totalPort   = capital + valeurNette;
  const totalM      = membres.filter(m=>m.actif).length;
  const monMembre   = user?.membreId ? membres.find(m=>String(m.id)===String(user.membreId)) : null;

  const phases = [
    { t:'Fondations légales',  done:true },
    { t:'1er achat immobilier',done:proprietes.length>=1 },
    { t:'Rénovation BRRRR',    done:proprietes.length>=2 },
    { t:'3 propriétés',        done:proprietes.length>=3 },
    { t:'Immeuble à revenus',  done:proprietes.length>=5 },
    { t:'1re franchise',       done:franchises.length>=1 },
    { t:'Empire 10M$+',        done:valeurNette>=10000000 },
  ];
  const nextPhase = phases.find(p=>!p.done);
  const doneCount = phases.filter(p=>p.done).length;
  const progPct   = Math.round((doneCount/phases.length)*100);

  const assets = [
    { id:'capital', icon:'$', iconBg:'rgba(0,208,132,0.15)', label:'Capital liquide', sub:`+${cotisation.toLocaleString('fr-CA')} $/mois`, value:fmtCAD(capital), change:`+${cotisation.toLocaleString('fr-CA')} $/m`, isPositive:true, sparkData:generateSparkData(101,14,2) },
    ...proprietes.map((p,i)=>{ const val=+p.valeurActuelle||+p.prixAchat||0; const cf=+p.cashflow||0; return { id:p.id, icon:'🏠', iconBg:'rgba(129,140,248,0.12)', label:p.adresse?p.adresse.split(',')[0]:`Propriété ${i+1}`, sub:p.ville||p.status||'Immo', value:fmtCAD(val), change:cf!==0?`${cf>=0?'+':''}${cf.toLocaleString('fr-CA')} $/m`:p.status||'BRRRR', isPositive:cf>=0, sparkData:generateSparkData(p.id||i+200,14,1.5) }; }),
    ...franchises.map((f,i)=>({ id:`fr-${f.id}`, icon:'🏪', iconBg:'rgba(245,158,11,0.1)', label:f.nom||`Franchise ${i+1}`, sub:f.secteur||'Franchise', value:f.investissement?fmtCAD(+(f.investissement).replace(/\D/g,'')):'—', change:f.status||'En cours', isPositive:true, sparkData:generateSparkData(f.id||i+400,14,1) })),
  ];

  return (
    <div className="space-y-7 pb-4">

      <SmartReminders membres={membres} transactions={transactions} />

      {/* Personal member card */}
      {monMembre && (
        <CartePersonnelle
          membre={monMembre}
          totalCapital={capital}
          totalMembres={totalM}
          totalPort={totalPort}
          membres={membres}
        />
      )}

      {/* ── Portfolio header with animated numbers ── */}
      <div className="fade-up">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] mb-3" style={{ color:'#3a3a3a' }}>Valeur nette totale</p>
        <button onClick={()=>setShowChart(s=>!s)} className="w-full text-left">
          <p className="text-5xl font-black text-white num tracking-tight leading-none">
            <AnimNum value={totalPort} format="full" duration={1600} />
          </p>
          <div className="flex items-center gap-2 mt-2.5">
            <span className="text-sm font-bold num" style={{ color:'#00d084' }}>+{cotisation.toLocaleString('fr-CA')} $/mois</span>
            <span className="text-xs font-medium" style={{ color:'#3a3a3a' }}>· {totalM} membres actifs</span>
          </div>
        </button>
        <div className="mt-4 overflow-hidden transition-all duration-500" style={{ height:showChart?100:0, opacity:showChart?1:0 }}>
          <ResponsiveContainer width="100%" height={96}>
            <AreaChart data={projData} margin={{ top:4,right:0,left:0,bottom:0 }}>
              <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00d084" stopOpacity={0.2} /><stop offset="100%" stopColor="#00d084" stopOpacity={0} /></linearGradient></defs>
              <Tooltip content={<Tip />} cursor={{ stroke:'rgba(0,208,132,0.2)', strokeWidth:1 }} />
              <Area type="monotone" dataKey="v" stroke="#00d084" fill="url(#pg)" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <button onClick={()=>setShowChart(s=>!s)} className="mt-2 text-[11px] font-semibold transition" style={{ color:'#3a3a3a' }} onMouseEnter={e=>e.currentTarget.style.color='#00d084'} onMouseLeave={e=>e.currentTarget.style.color='#3a3a3a'}>
          {showChart?'↑ Masquer':'↓ Projection 10 ans → 12M$'}
        </button>
      </div>

      {/* Quick stats with animated numbers */}
      <div className="grid grid-cols-3 gap-2 fade-up">
        {[
          { label:'Cotis./mois', value:cotisation,        color:'#00d084',  fmt:'cad'  },
          { label:'Cashflow',    value:cashflow,          color:cashflow>=0?'#00d084':'#ff4d4d', fmt:'cad' },
          { label:'Propriétés',  value:proprietes.length, color:'#818cf8',  fmt:'count'},
        ].map(s=>(
          <div key={s.label} style={{ background:'#0d0d0d',border:'1px solid rgba(255,255,255,0.05)',borderRadius:14 }} className="px-3 py-3.5 text-center">
            <p className="text-xs font-medium" style={{ color:'#3a3a3a' }}>{s.label}</p>
            <p className="text-base font-black num mt-1 tracking-tight" style={{ color:s.color }}>
              {s.fmt==='count'
                ? <AnimNum value={s.value} format="count" duration={800} />
                : <AnimNum value={s.value} format="cad" duration={1200} />
              }
            </p>
          </div>
        ))}
      </div>

      <CapitalChart transactions={transactions} capital={capital} />
      <AssetPie capital={capital} proprietes={proprietes} franchises={franchises} />
      <ContribBar membres={membres} transactions={transactions} />

      {/* Asset list */}
      <div className="fade-up">
        <SectionLabel label="Portefeuille détaillé" />
        {assets.length===0
          ? <p className="py-10 text-center text-sm" style={{ color:'#3a3a3a' }}>Aucun actif pour l'instant.</p>
          : assets.map((a,i)=><AssetRow key={a.id} {...a} delay={i*30} />)}
      </div>

      {/* Members breakdown */}
      <div className="fade-up">
        <SectionLabel label="Richesse par membre" />
        <div className="rounded-2xl overflow-hidden" style={{ background:'#0d0d0d',border:'1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center px-4 py-2.5" style={{ borderBottom:'1px solid rgba(255,255,255,0.05)', background:'rgba(255,255,255,0.02)' }}>
            <p className="flex-1 text-[10px] font-bold uppercase tracking-widest" style={{ color:'#3a3a3a' }}>Membre</p>
            <p className="text-[10px] font-bold uppercase tracking-widest w-24 text-right" style={{ color:'#3a3a3a' }}>Part</p>
            <p className="text-[10px] font-bold uppercase tracking-widest w-24 text-right" style={{ color:'#3a3a3a' }}>Valeur</p>
          </div>
          {membres.filter(m=>m.actif).map((m,i,arr)=>{
            const isMe = monMembre && String(monMembre.id)===String(m.id);
            const totalCotis = arr.reduce((s,mb)=>s+(+mb.cotisation||0),0);
            const partPct = totalCotis>0 ? ((+m.cotisation||0)/totalCotis)*100 : (1/arr.length)*100;
            const valeurPart = totalPort * (partPct/100);
            const proj10ans = totalPort > 0 ? valeurPart * 18 : (+(m.cotisation||0)*12*10*(partPct/100));
            return (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3.5"
                style={{ borderBottom:i<arr.length-1?'1px solid rgba(255,255,255,0.04)':'none', background:isMe?'rgba(0,208,132,0.03)':'transparent' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-black text-xs font-black flex-shrink-0"
                  style={{ background:isMe?'#00d084':'linear-gradient(135deg,#f59e0b,#fbbf24)' }}>
                  {m.nom.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold truncate" style={{ color:isMe?'#00d084':'#ddd' }}>{m.nom}</p>
                    {isMe && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full" style={{ background:'rgba(0,208,132,0.1)',color:'#00d084' }}>Moi</span>}
                  </div>
                  <p className="text-[10px] num" style={{ color:'#444' }}>{m.cotisation.toLocaleString('fr-CA')} $/mois</p>
                </div>
                <div className="w-24 text-right">
                  <p className="text-xs font-bold num" style={{ color:'#f59e0b' }}>{partPct.toFixed(1)}%</p>
                  <p className="text-[10px]" style={{ color:'#3a3a3a' }}>→ 10a: {proj10ans>=1_000_000?(proj10ans/1_000_000).toFixed(1)+'M$':(proj10ans/1000).toFixed(0)+'k$'}</p>
                </div>
                <div className="w-24 text-right">
                  <p className="text-sm font-black num" style={{ color:isMe?'#00d084':'#fff' }}>
                    {valeurPart>=1_000_000?(valeurPart/1_000_000).toFixed(2)+'M':(valeurPart/1000).toFixed(0)+'k'}$
                  </p>
                </div>
              </div>
            );
          })}
          <div className="flex items-center px-4 py-3" style={{ borderTop:'1px solid rgba(255,255,255,0.07)', background:'rgba(255,255,255,0.02)' }}>
            <p className="flex-1 text-xs font-bold" style={{ color:'#555' }}>Total portefeuille</p>
            <p className="text-sm font-black num" style={{ color:'#00d084' }}>
              <AnimNum value={totalPort} format="cad" duration={1400} />
            </p>
          </div>
        </div>
      </div>

      {/* Roadmap */}
      <div className="fade-up">
        <SectionLabel label="Feuille de route" />
        <div style={{ background:'#0d0d0d',border:'1px solid rgba(255,255,255,0.05)',borderRadius:18 }} className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-white">{nextPhase?nextPhase.t:'Empire accompli 🎯'}</p>
            <span className="text-xs font-bold num" style={{ color:'#00d084' }}>{progPct}%</span>
          </div>
          <div className="rounded-full overflow-hidden" style={{ height:2,background:'#1a1a1a' }}>
            <div style={{ width:`${progPct}%`,background:'#00d084',height:'100%',transition:'width 1s cubic-bezier(.16,1,.3,1)' }} />
          </div>
          <p className="text-xs mt-2" style={{ color:'#3a3a3a' }}>{doneCount}/{phases.length} étapes</p>
          <div className="flex items-center gap-1.5 mt-3">
            {phases.map((p,i)=><div key={i} title={p.t} className="flex-1 rounded-full" style={{ height:3,background:p.done?'#00d084':'#1a1a1a',transition:'background 0.5s' }} />)}
          </div>
        </div>
      </div>

      {/* Objectifs */}
      <div className="fade-up">
        <SectionLabel label="Objectifs" />
        <div className="space-y-2">
          {[
            {label:'An 5 — 2M$',target:2_000_000,cf:'15k$/m'},
            {label:'An 7 — 5M$',target:5_000_000,cf:'35k$/m'},
            {label:'An 10 — 12M$',target:12_000_000,cf:'80k$/m'},
          ].map(o=>{
            const p=Math.min(100,(totalPort/o.target)*100);
            return (
              <div key={o.label} className="flex items-center gap-4 py-3" style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-medium text-white">{o.label}</p>
                    <p className="text-xs num font-semibold" style={{ color:'#5a5a5a' }}>{o.cf}</p>
                  </div>
                  <div className="rounded-full overflow-hidden" style={{ height:2,background:'#1a1a1a' }}>
                    <div style={{ width:`${p}%`,height:'100%',background:p>=100?'#00d084':'rgba(0,208,132,0.4)',transition:'width 1.2s cubic-bezier(.16,1,.3,1)' }} />
                  </div>
                </div>
                <p className="text-xs font-bold num flex-shrink-0" style={{ color:p>=100?'#00d084':'#3a3a3a',minWidth:36,textAlign:'right' }}>{Math.round(p)}%</p>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
