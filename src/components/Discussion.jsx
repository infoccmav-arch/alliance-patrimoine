import { useState, useEffect, useRef } from 'react';
import { Send, Pin, Trash2, MessageCircle, TrendingUp, Building2, AlertCircle, Star, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseReady } from '../lib/supabase';

const CATEGORIES = [
  { id: 'general',     label: 'Général',    icon: MessageCircle, color: '#60a5fa' },
  { id: 'opportunite', label: 'Opportunité', icon: TrendingUp,    color: '#10b981' },
  { id: 'immo',        label: 'Immobilier',  icon: Building2,     color: '#f59e0b' },
  { id: 'urgent',      label: 'Urgent',      icon: AlertCircle,   color: '#ef4444' },
];

// ── localStorage fallback storage ────────────────────────────────────────────
function useLocalMessages() {
  const [state, setState] = useState(() => {
    try { const s = localStorage.getItem('ig_messages'); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  useEffect(() => {
    const id = setInterval(() => {
      try { const s = localStorage.getItem('ig_messages'); if (s) setState(JSON.parse(s)); } catch {}
    }, 2000);
    return () => clearInterval(id);
  }, []);
  const set = (val) => {
    const next = typeof val === 'function' ? val(state) : val;
    setState(next);
    try { localStorage.setItem('ig_messages', JSON.stringify(next)); } catch {}
  };
  return [state, set];
}

export default function Discussion() {
  const { user } = useAuth();

  // ── Message state — Supabase or localStorage ──────────────────────────────
  const [messages,   setMessages]  = useState([]);
  const [localMsgs,  setLocalMsgs] = useLocalMessages();
  const [connected,  setConnected] = useState(false);

  // Use Supabase when ready, fall back to localStorage polling
  const msgs      = isSupabaseReady ? messages   : localMsgs;
  const setMsgs   = isSupabaseReady ? setMessages : setLocalMsgs;

  const [text,      setText]     = useState('');
  const [cat,       setCat]      = useState('general');
  const [filterCat, setFilterCat]= useState('all');
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  // ── Supabase real-time setup ──────────────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseReady) return;

    // Initial load
    supabase.from('messages').select('*').order('date', { ascending: true })
      .then(({ data }) => { if (data) setMessages(data); });

    // Real-time subscription
    const channel = supabase.channel('messages-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
        ({ new: row }) => setMessages(prev => [...prev, row]))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' },
        ({ new: row }) => setMessages(prev => prev.map(m => m.id === row.id ? row : m)))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' },
        ({ old: row }) => setMessages(prev => prev.filter(m => m.id !== row.id)))
      .subscribe((status) => setConnected(status === 'SUBSCRIBED'));

    return () => supabase.removeChannel(channel);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs.length]);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const now = new Date();
    const msg = {
      id: Date.now(),
      text: trimmed,
      cat,
      author: user?.nom || user?.username || 'Anonyme',
      authorInitial: (user?.nom || user?.username || '?').charAt(0).toUpperCase(),
      isAdmin: user?.isAdmin || false,
      time: now.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' }),
      date: now.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' }),
      pinned: false,
    };
    if (isSupabaseReady) {
      await supabase.from('messages').insert(msg);
      // real-time subscription will add it to state automatically
    } else {
      setMsgs(prev => [...prev, msg]);
    }
    setText('');
    inputRef.current?.focus();
  };

  const togglePin = async (id) => {
    const target = msgs.find(m => m.id === id);
    if (!target) return;
    if (isSupabaseReady) {
      await supabase.from('messages').update({ pinned: !target.pinned }).eq('id', id);
    } else {
      setMsgs(prev => prev.map(m => m.id === id ? { ...m, pinned: !m.pinned } : m));
    }
  };

  const deleteMsg = async (id) => {
    if (isSupabaseReady) {
      await supabase.from('messages').delete().eq('id', id);
    } else {
      setMsgs(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const filtered = msgs.filter(m => filterCat === 'all' || m.cat === filterCat);
  const pinned   = msgs.filter(m => m.pinned);

  const getCat = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[0];

  // Group messages by date
  const grouped = [];
  let lastDate = null;
  filtered.forEach(m => {
    if (m.date !== lastDate) { grouped.push({ type: 'date', date: m.date }); lastDate = m.date; }
    grouped.push({ type: 'msg', ...m });
  });

  const isMine = (msg) => (user?.nom || user?.username) === msg.author;

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">

      {/* Pinned messages */}
      {pinned.length > 0 && (
        <div className="mb-3 rounded-xl p-3 flex flex-col gap-2" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <div className="flex items-center gap-1.5 mb-1">
            <Pin className="w-3 h-3 text-amber-400" />
            <span className="text-amber-400 text-xs font-semibold">Épinglés</span>
          </div>
          {pinned.map(m => (
            <div key={m.id} className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#f59e0b,#b45309)' }}>
                {m.authorInitial}
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-medium">{m.author} · </span>
                <span className="text-slate-300 text-xs">{m.text}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Supabase status badge */}
      {isSupabaseReady && (
        <div className="flex items-center gap-1.5 mb-3 px-3 py-1.5 rounded-full w-fit"
          style={{ background: connected ? 'rgba(0,208,132,0.07)' : 'rgba(255,77,77,0.07)', border: `1px solid ${connected ? 'rgba(0,208,132,0.18)' : 'rgba(255,77,77,0.18)'}` }}>
          {connected
            ? <Wifi className="w-3 h-3" style={{ color: '#00d084' }} strokeWidth={2} />
            : <WifiOff className="w-3 h-3" style={{ color: '#ff4d4d' }} strokeWidth={2} />}
          <span className="text-[10px] font-bold" style={{ color: connected ? '#00d084' : '#ff4d4d' }}>
            {connected ? 'Temps réel actif' : 'Reconnexion…'}
          </span>
        </div>
      )}

      {/* Category filters */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1 no-scrollbar">
        <button onClick={() => setFilterCat('all')}
          className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition"
          style={{ background: filterCat === 'all' ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)', color: filterCat === 'all' ? '#f59e0b' : '#64748b', border: `1px solid ${filterCat === 'all' ? 'rgba(245,158,11,0.3)' : 'transparent'}` }}>
          Tous ({msgs.length})
        </button>
        {CATEGORIES.map(c => {
          const count = messages.filter(m => m.cat === c.id).length;
          const active = filterCat === c.id;
          return (
            <button key={c.id} onClick={() => setFilterCat(c.id)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition"
              style={{ background: active ? `${c.color}18` : 'rgba(255,255,255,0.04)', color: active ? c.color : '#64748b', border: `1px solid ${active ? `${c.color}40` : 'transparent'}` }}>
              <c.icon className="w-3 h-3" />
              {c.label} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1" style={{ minHeight: 0 }}>
        {grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-10">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
              <MessageCircle className="w-7 h-7 text-amber-400/50" />
            </div>
            <p className="text-slate-500 text-sm text-center">Aucun message pour l'instant.<br/>Lancez la conversation !</p>
          </div>
        ) : (
          grouped.map((item, i) => {
            if (item.type === 'date') return (
              <div key={`d-${i}`} className="flex items-center gap-3 py-2">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
                <span className="text-slate-600 text-[10px] font-medium px-2">{item.date}</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
              </div>
            );

            const mine = isMine(item);
            const catInfo = getCat(item.cat);

            return (
              <div key={item.id} className={`flex gap-2 group ${mine ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                {!mine && (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-1"
                    style={{ background: 'linear-gradient(135deg,#1d4ed8,#1e3a8a)' }}>
                    {item.authorInitial}
                  </div>
                )}

                <div className={`max-w-[78%] ${mine ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                  {/* Author + time */}
                  {!mine && (
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-slate-400 text-[10px] font-semibold">{item.author}</span>
                      {item.isAdmin && <Star className="w-2.5 h-2.5 text-amber-400" />}
                    </div>
                  )}

                  {/* Bubble */}
                  <div className="relative rounded-2xl px-3.5 py-2.5"
                    style={{
                      background: mine ? 'linear-gradient(135deg,#f59e0b,#b45309)' : '#0e1f38',
                      border: mine ? 'none' : '1px solid rgba(255,255,255,0.06)',
                      borderBottomRightRadius: mine ? 4 : 16,
                      borderBottomLeftRadius: mine ? 16 : 4,
                    }}>
                    {/* Category badge */}
                    {item.cat !== 'general' && (
                      <div className="flex items-center gap-1 mb-1.5">
                        <catInfo.icon className="w-2.5 h-2.5" style={{ color: mine ? 'rgba(255,255,255,0.7)' : catInfo.color }} />
                        <span className="text-[9px] font-semibold uppercase tracking-wide"
                          style={{ color: mine ? 'rgba(255,255,255,0.7)' : catInfo.color }}>
                          {catInfo.label}
                        </span>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed" style={{ color: mine ? 'white' : '#e2e8f0' }}>
                      {item.text}
                    </p>
                    <p className="text-[9px] mt-1 text-right" style={{ color: mine ? 'rgba(255,255,255,0.55)' : '#475569' }}>
                      {item.time}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 px-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => togglePin(item.id)}
                      className="p-1 rounded-lg transition hover:bg-white/5"
                      title={item.pinned ? 'Désépingler' : 'Épingler'}>
                      <Pin className="w-3 h-3" style={{ color: item.pinned ? '#f59e0b' : '#475569' }} />
                    </button>
                    {(mine || user?.isAdmin) && (
                      <button onClick={() => deleteMsg(item.id)}
                        className="p-1 rounded-lg transition hover:bg-white/5">
                        <Trash2 className="w-3 h-3 text-slate-600 hover:text-red-400" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-3 rounded-2xl p-3" style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.07)' }}>
        {/* Category selector */}
        <div className="flex gap-1.5 mb-2.5">
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setCat(c.id)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition"
              style={{ background: cat === c.id ? `${c.color}20` : 'rgba(255,255,255,0.04)', color: cat === c.id ? c.color : '#475569', border: `1px solid ${cat === c.id ? `${c.color}40` : 'transparent'}` }}>
              <c.icon className="w-2.5 h-2.5" />
              {c.label}
            </button>
          ))}
        </div>

        {/* Text input row */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              rows={1}
              value={text}
              onChange={e => { setText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'; }}
              onKeyDown={handleKey}
              placeholder="Écrire un message... (Entrée pour envoyer)"
              className="w-full rounded-xl px-3 py-2.5 text-sm resize-none overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'white', outline: 'none', minHeight: 40, lineHeight: '1.5' }}
            />
          </div>
          <button onClick={send} disabled={!text.trim()}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition flex-shrink-0 disabled:opacity-30"
            style={{ background: text.trim() ? 'linear-gradient(135deg,#f59e0b,#b45309)' : 'rgba(255,255,255,0.06)' }}>
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
