// ── Ultra-minimal SVG Sparkline — Wealthsimple style ────────────────────────
export default function Sparkline({ data = [], color = '#00d084', width = 72, height = 28, positive = true }) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });

  const pathD = `M ${pts.join(' L ')}`;

  // Closed fill path
  const fillD = `M ${pts[0]} L ${pts.join(' L ')} L ${width},${height} L 0,${height} Z`;

  const c = positive ? '#00d084' : '#ff4d4d';

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sg-${c.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={c} stopOpacity={0.18} />
          <stop offset="100%" stopColor={c} stopOpacity={0}    />
        </linearGradient>
      </defs>
      <path d={fillD} fill={`url(#sg-${c.replace('#','')})`} />
      <path d={pathD} stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Deterministic pseudo-random data generator (seed-based) ─────────────────
export function generateSparkData(seed, length = 12, trend = 1) {
  let s = seed;
  const lcg = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 16) / 65535; };
  const data = [];
  let v = 50;
  for (let i = 0; i < length; i++) {
    v += (lcg() - 0.48) * 12 + trend * 0.8;
    v  = Math.max(10, Math.min(90, v));
    data.push(+v.toFixed(2));
  }
  return data;
}
