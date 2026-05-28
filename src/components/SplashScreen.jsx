import { useEffect, useState } from 'react';

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState('in'); // 'in' | 'hold' | 'out'

  useEffect(() => {
    // Hold for 1.6s then fade out
    const t1 = setTimeout(() => setPhase('out'), 1600);
    const t2 = setTimeout(() => onDone(), 2100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        background: '#000',
        opacity: phase === 'out' ? 0 : 1,
        transition: phase === 'out' ? 'opacity 0.5s cubic-bezier(.4,0,.2,1)' : 'none',
        pointerEvents: 'none',
      }}
    >
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)',
        width: 320, height: 320, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,208,132,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
        animation: 'pulse-glow 2s ease-in-out infinite',
      }} />

      {/* Logo container */}
      <div style={{
        animation: 'splash-in 0.6s cubic-bezier(.16,1,.3,1) both',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
      }}>
        {/* Logo */}
        <div style={{
          width: 88, height: 88, borderRadius: 24,
          background: '#fff',
          padding: 8,
          boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 24px 64px rgba(0,208,132,0.2)',
          animation: 'logo-glow 1.5s ease-in-out infinite alternate',
        }}>
          <img src="/logo.png" alt="Alliance" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 14 }} />
        </div>

        {/* Name */}
        <div style={{ textAlign: 'center' }}>
          <p style={{
            color: '#fff', fontWeight: 900, fontSize: 22, letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}>
            Alliance Patrimoine
          </p>
          <p style={{
            fontSize: 11, fontWeight: 900, letterSpacing: '0.25em',
            background: 'linear-gradient(90deg, #00d084, #00b870)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginTop: 4,
          }}>
            INC.
          </p>
        </div>

        {/* Tagline */}
        <p style={{
          color: 'rgba(255,255,255,0.25)', fontSize: 12, fontWeight: 600,
          letterSpacing: '0.08em', marginTop: -4,
          animation: 'fade-in-delay 0.8s 0.4s both',
        }}>
          Construisons la richesse ensemble
        </p>
      </div>

      {/* Loading bar */}
      <div style={{
        position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)',
        width: 120, height: 2, borderRadius: 2, background: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 2,
          background: 'linear-gradient(90deg, #00d084, #00b870)',
          animation: 'loading-bar 1.6s cubic-bezier(.4,0,.2,1) both',
          boxShadow: '0 0 8px rgba(0,208,132,0.6)',
        }} />
      </div>

      <style>{`
        @keyframes splash-in {
          from { opacity: 0; transform: scale(0.85) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes logo-glow {
          from { box-shadow: 0 0 0 1px rgba(255,255,255,0.1), 0 24px 64px rgba(0,208,132,0.15); }
          to   { box-shadow: 0 0 0 1px rgba(255,255,255,0.1), 0 24px 80px rgba(0,208,132,0.35); }
        }
        @keyframes loading-bar {
          from { width: 0; }
          to   { width: 100%; }
        }
        @keyframes fade-in-delay {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.6; transform: translateX(-50%) scale(1); }
          50%       { opacity: 1;   transform: translateX(-50%) scale(1.1); }
        }
      `}</style>
    </div>
  );
}
