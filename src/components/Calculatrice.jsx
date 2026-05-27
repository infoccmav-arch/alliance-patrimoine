import { useState, useMemo } from 'react';
import { Calculator, DollarSign, Percent, Calendar, TrendingDown, Info, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

// ── helpers ──────────────────────────────────────────────────────────────────
function pmt(rate, nper, pv) {
  // Standard mortgage payment formula
  if (rate === 0) return pv / nper;
  return (pv * rate * Math.pow(1 + rate, nper)) / (Math.pow(1 + rate, nper) - 1);
}

function fmt(n, decimals = 0) {
  return n.toLocaleString('fr-CA', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtCad(n) {
  return `${fmt(n)} $`;
}

// Canadian mortgage: payments semi-annually compounded, monthly payment
function canadianMonthlyRate(annualRate) {
  // Canada: rate compounded semi-annually
  const semi = annualRate / 2;
  return Math.pow(1 + semi, 1 / 6) - 1;
}

// ── Slider Input ─────────────────────────────────────────────────────────────
function SliderField({ label, value, onChange, min, max, step, prefix, suffix, hint }) {
  const [raw, setRaw] = useState(String(value));
  const pct = ((value - min) / (max - min)) * 100;

  // Sync raw when slider changes
  const handleSlider = (v) => { onChange(v); setRaw(String(v)); };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-bold text-white"
          style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
          {prefix && <span className="text-amber-400">{prefix}</span>}
          <input
            type="text"
            inputMode="decimal"
            value={raw}
            onChange={e => setRaw(e.target.value)}
            onBlur={() => {
              const v = parseFloat(raw);
              if (!isNaN(v)) {
                const clamped = Math.min(max, Math.max(min, v));
                onChange(clamped);
                setRaw(String(clamped));
              } else {
                setRaw(String(value));
              }
            }}
            className="w-24 bg-transparent text-right outline-none text-white font-bold"
          />
          {suffix && <span className="text-amber-400">{suffix}</span>}
        </div>
      </div>
      <div className="relative h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div className="absolute left-0 top-0 h-full rounded-full"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #b45309, #f59e0b)' }} />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => handleSlider(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="absolute w-4 h-4 rounded-full -top-1 -translate-x-1/2 transition-all"
          style={{ left: `${pct}%`, background: '#f59e0b', boxShadow: '0 0 0 3px rgba(245,158,11,0.25), 0 2px 8px rgba(0,0,0,0.4)' }} />
      </div>
      {hint && <p className="text-[11px] text-slate-600">{hint}</p>}
    </div>
  );
}

// ── Amortization row ─────────────────────────────────────────────────────────
function AmortTable({ rows }) {
  const [show, setShow] = useState(false);
  const displayed = show ? rows : rows.slice(0, 12);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center justify-between px-4 py-3"
        style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="text-sm font-semibold text-white">Tableau d'amortissement</span>
        <span className="text-xs text-slate-500">{rows.length} mois</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {['Mois', 'Versement', 'Intérêts', 'Capital', 'Solde'].map(h => (
                <th key={h} className="px-3 py-2 text-left font-semibold text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.map((r, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td className="px-3 py-2 text-slate-500 font-mono">{r.month}</td>
                <td className="px-3 py-2 text-white font-mono">{fmtCad(r.payment)}</td>
                <td className="px-3 py-2 font-mono" style={{ color: '#f87171' }}>{fmtCad(r.interest)}</td>
                <td className="px-3 py-2 font-mono" style={{ color: '#34d399' }}>{fmtCad(r.principal)}</td>
                <td className="px-3 py-2 text-slate-400 font-mono">{fmtCad(r.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 12 && (
        <button onClick={() => setShow(s => !s)}
          className="w-full flex items-center justify-center gap-2 py-3 text-xs text-slate-500 hover:text-amber-400 transition"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {show ? <><ChevronUp className="w-3.5 h-3.5" /> Réduire</> : <><ChevronDown className="w-3.5 h-3.5" /> Voir tout ({rows.length} mois)</>}
        </button>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const DEFAULTS = { prix: 350000, mise: 20, taux: 5.5, amort: 25 };

export default function Calculatrice() {
  const [prix,  setPrix]  = useState(DEFAULTS.prix);
  const [mise,  setMise]  = useState(DEFAULTS.mise);   // %
  const [taux,  setTaux]  = useState(DEFAULTS.taux);   // % annual
  const [amort, setAmort] = useState(DEFAULTS.amort);  // years

  const reset = () => { setPrix(DEFAULTS.prix); setMise(DEFAULTS.mise); setTaux(DEFAULTS.taux); setAmort(DEFAULTS.amort); };

  const calc = useMemo(() => {
    const miseVal    = prix * (mise / 100);
    const emprunt    = prix - miseVal;
    const nper       = amort * 12;
    const monthRate  = canadianMonthlyRate(taux / 100);
    const payment    = pmt(monthRate, nper, emprunt);

    const totalPaid     = payment * nper;
    const totalInterest = totalPaid - emprunt;
    const ratioInteret  = (totalInterest / emprunt) * 100;

    // Amortization table
    let balance = emprunt;
    const rows  = [];
    for (let m = 1; m <= nper; m++) {
      const interest  = balance * monthRate;
      const principal = payment - interest;
      balance         = Math.max(0, balance - principal);
      rows.push({ month: m, payment: Math.round(payment), interest: Math.round(interest), principal: Math.round(principal), balance: Math.round(balance) });
    }

    // CMHC insurance (Canada): required if mise < 20%
    let cmhc = 0;
    if (mise < 5) cmhc = 0;
    else if (mise < 10)  cmhc = emprunt * 0.0400;
    else if (mise < 15)  cmhc = emprunt * 0.031;
    else if (mise < 20)  cmhc = emprunt * 0.028;

    // Cash-flow estimate (rough): assume 0.6% of price/month rental yield
    const loyerEstime = prix * 0.005;
    const cashflow    = loyerEstime - payment;

    return { miseVal, emprunt, payment, totalPaid, totalInterest, ratioInteret, cmhc, loyerEstime, cashflow, rows };
  }, [prix, mise, taux, amort]);

  const cashflowPositif = calc.cashflow >= 0;

  return (
    <div className="space-y-5">

      {/* ── Inputs card ── */}
      <div className="rounded-2xl p-5 space-y-6"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(245,158,11,0.12)' }}>
              <Calculator className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="text-white font-semibold">Paramètres</h3>
          </div>
          <button onClick={reset}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-400 transition px-2 py-1 rounded-lg"
            style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
            <RotateCcw className="w-3 h-3" /> Réinitialiser
          </button>
        </div>

        <SliderField
          label="Prix d'achat"
          value={prix} onChange={setPrix}
          min={50000} max={2000000} step={5000}
          prefix="$" suffix=""
          hint="Prix de la propriété avant négociation"
        />
        <SliderField
          label="Mise de fonds"
          value={mise} onChange={setMise}
          min={5} max={50} step={0.5}
          prefix="" suffix="%"
          hint={mise < 20 ? '⚠️ Mise < 20% → assurance CMHC obligatoire' : '✓ Mise ≥ 20% → pas d\'assurance CMHC'}
        />
        <SliderField
          label="Taux d'intérêt (annuel)"
          value={taux} onChange={setTaux}
          min={1} max={12} step={0.05}
          prefix="" suffix="%"
          hint="Taux canadien composé semi-annuellement"
        />
        <SliderField
          label="Période d'amortissement"
          value={amort} onChange={setAmort}
          min={5} max={30} step={1}
          prefix="" suffix=" ans"
          hint={amort > 25 ? '⚠️ Max 25 ans si mise de fonds < 20%' : ''}
        />
      </div>

      {/* ── Result cards ── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Monthly payment — big */}
        <div className="col-span-2 rounded-2xl p-5 text-center"
          style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(180,83,9,0.06) 100%)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mb-1">Versement mensuel</p>
          <p className="text-4xl font-black text-white tracking-tight">
            {fmtCad(Math.round(calc.payment))}
          </p>
          <p className="text-slate-500 text-xs mt-1">par mois pendant {amort} ans</p>
        </div>

        {/* Mise de fonds */}
        <StatCard icon={DollarSign} color="#f59e0b" label="Mise de fonds" value={fmtCad(Math.round(calc.miseVal))} sub={`${mise}% du prix`} />
        {/* Emprunt */}
        <StatCard icon={TrendingDown} color="#60a5fa" label="Montant emprunté" value={fmtCad(Math.round(calc.emprunt))} sub="Solde hypothèque" />
        {/* Total intérêts */}
        <StatCard icon={Percent} color="#f87171" label="Intérêts totaux" value={fmtCad(Math.round(calc.totalInterest))} sub={`${fmt(calc.ratioInteret, 1)}% du prêt`} />
        {/* Total remboursé */}
        <StatCard icon={Calendar} color="#34d399" label="Total remboursé" value={fmtCad(Math.round(calc.totalPaid))} sub="Capital + intérêts" />
      </div>

      {/* ── CMHC ── */}
      {calc.cmhc > 0 && (
        <div className="rounded-2xl p-4 flex items-start gap-3"
          style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)' }}>
          <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-300 text-sm font-semibold">Assurance CMHC requise</p>
            <p className="text-slate-400 text-xs mt-0.5">
              Mise de fonds &lt; 20% → prime d'assurance estimée à <strong className="text-amber-300">{fmtCad(Math.round(calc.cmhc))}</strong>
              {' '}(ajoutée au solde hypothécaire). Nouveau versement mensuel ≈ {fmtCad(Math.round(pmt(canadianMonthlyRate(taux / 100), amort * 12, calc.emprunt + calc.cmhc)))}.
            </p>
          </div>
        </div>
      )}

      {/* ── Cash-flow estimé ── */}
      <div className="rounded-2xl p-4"
        style={{ background: cashflowPositif ? 'rgba(52,211,153,0.07)' : 'rgba(248,113,113,0.07)', border: `1px solid ${cashflowPositif ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}` }}>
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: cashflowPositif ? '#34d399' : '#f87171' }} />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold" style={{ color: cashflowPositif ? '#34d399' : '#f87171' }}>
                Cash-flow estimé (location)
              </p>
              <span className="text-sm font-bold" style={{ color: cashflowPositif ? '#34d399' : '#f87171' }}>
                {cashflowPositif ? '+' : ''}{fmtCad(Math.round(calc.cashflow))}/mois
              </span>
            </div>
            <p className="text-slate-500 text-xs mt-1">
              Loyer estimé <strong className="text-slate-400">{fmtCad(Math.round(calc.loyerEstime))}</strong> (0,5% du prix)
              − versement <strong className="text-slate-400">{fmtCad(Math.round(calc.payment))}</strong>.
              {' '}Note: estimation approximative, excluant taxes, assurances et entretien.
            </p>
          </div>
        </div>
      </div>

      {/* ── Amortization table ── */}
      <AmortTable rows={calc.rows} />
    </div>
  );
}

function StatCard({ icon: Icon, color, label, value, sub }) {
  return (
    <div className="rounded-2xl p-4"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2"
        style={{ background: `${color}18` }}>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <p className="text-white font-bold text-base leading-tight">{value}</p>
      <p className="text-slate-400 text-[10px] mt-0.5 font-medium">{label}</p>
      <p className="text-slate-600 text-[10px]">{sub}</p>
    </div>
  );
}
