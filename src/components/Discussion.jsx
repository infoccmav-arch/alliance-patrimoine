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

const EMOJI_REACTIONS = ['👍','🔥','💰','🏠','✅','💪'];

// Deterministic avatar color per author name
const AVATAR_PALETTE = [
  ['#f59e0b','#b45309'], ['#00d084','#00956e'], ['#818cf8','#4f46e5'],
  ['#f87171','#dc2626'], ['#60a5fa','#2563eb'], ['#c084fc','#9333ea'],
  ['#fb923c','#ea580c'], ['#34d399','#059669'], ['#e879f9','#a21caf'],
  ['#38bdf8','#0284c7'],
];
function authorColor(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  const [a, b] = AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
  return `linear-gradient(135deg,${a},${b})`;
}

// ── localStorage fallback ────────────────────────────────────────────────────
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
  const [messages,    setMessages]   = useState([]);
  const [localMsgs,   setLocalMsgs]  = useLocalMessages();
  const [connected,   setConnected]  = useState(false);
  const [reactionMenu, setReactionMenu] = useState(null); // message id
  const [text,        setText]       = useState('');
  const [cat,         setCat]        = useState('general');
  const [filterCat,   setFilterCat]  = useState('all');
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  const msgs    = isSupabaseReady ? messages   : localMsgs;
  const setMsgs = isSupabaseReady ? setMessages : setLocalMsgs;

  // ── Supabase real-time ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseReady) return;
    supabase.from('messages').select('*').order('date', { ascending: true })
      .then(({ data }) => { if (data) setMessages(data); });
    const channel = supabase.channel('messages-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
        ({ new: row }) => setMessages(p => [...p, row]))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' },
        ({ new: row }) => setMessages(p => p.map(m => m.id === row.id ? row : m)))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' },
        ({ old: row }) => setMessages(p => p.filter(m => m.id !== row.id)))
      .subscribe(s => setConnected(s === 'SUBSCRIBED'));
    return () => supabase.removeChannel(channel);
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs.length]);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const now = new Date();
    const msg = {
      id: Date.now(),
      text: trimmed, cat,
      author: user?.nom || user?.username || 'Anonyme',
      authorInitial: (user?.nom || user?.username || '?').charAt(0).toUpperCase(),
      isAdmin: user?.isAdmin || false,
      time: now.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' }),
      date: now.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' }),
      pinned: false,
      reactions: {},
    };
    if (isSupabaseReady) { await supabase.from('messages').insert(msg); }
    else { setMsgs(p => [...p, msg]); }
    setText('');
    inputRef.current?.focus();
  };

  const togglePin = async (id) => {
    const target = msgs.find(m => m.id === id);
    if (!target) return;
    if (isSupabaseReady) await supabase.from('messages').update({ pinned: !target.pinned }).eq('id', id);
    else setMsgs(p => p.map(m => m.id === id ? { ...m, pinned: !m.pinned } : m));
  };

  const deleteMsg = async (id) => {
    if (isSupabaseReady) await supabase.from('messages').delete().eq('id', id);
    else setMsgs(p => p.filter(m => m.id !== id));
  };

  const addReaction = async (msgId, emoji) => {
    setReactionMenu(null);
    const target = msgs.find(m => m.id === msgId);
    if (!target) return;
    const reactions = { ...(target.reactions || {}) };
    const me = user?.username || 'anon';
    const voters = reactions[emoji] || [];
    reactions[emoji] = voters.includes(me) ? voters.filter(v => v !== me) : [...voters, me];
    if (reactions[emoji].length === 0) delete reactions[emoji];
    if (isSupabaseReady) await supabase.from('messages').update({ reactions }).eq('id', msgId);
    else setMsgs(p => p.map(m => m.id === msgId ? { ...m, reactions } : m));
  };

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  const filtered = msgs.filter(m => filterCat === 'all' || m.cat === filterCat);
  const pinned   = msgs.filter(m => m.pinned);
  const getCat   = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[0];

  const grouped = [];
  let lastDate = null;
  filtered.forEach(m => {
    if (m.date !== lastDate) { grouped.push({ type: 'date', date: m.date }); lastDate = m.date; }
    grouped.push({ type: 'msg', ...m });
  });

  const isMine = (msg) => (user?.nom || user?.username) === msg.author;

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]" onClick={() => reactionMenu && setReactionMenu(null)}>

      {/* Pinned messages */}
      {pinned.length > 0 && (
        <div className="mb-3 rounded-2xl p-3 flex flex-col gap-2"
          style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <Pin className="w-3 h-3 text-amber-400" />
            <span className="text-amber-400 text-xs font-bold">Épinglés</span>
          </div>
          {pinned.map(m => (
            <div key={m.id} className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                style={{ background: authorColor(m.author) }}>
                {m.authorInitial}
              </div>
              <span className="text-[11px] text-amber-100/70 font-medium truncate">{m.author}:</span>
              <span className="text-[11px] text-slate-400 truncate">{m.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Status + filters */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {isSupabaseReady && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full flex-shrink-0"
            style={{ background: connected ? 'rgba(0,208,132,0.07)' : 'rgba(255,77,77,0.07)', border: `1px solid ${connected ? 'rgba(0,208,132,0.18)' : 'rgba(255,77,77,0.18)'}` }}>
            {connected
              ? <Wifi className="w-2.5 h-2.5" style={{ color: '#00d084' }} />
              : <WifiOff className="w-2.5 h-2.5" style={{ color: '#ff4d4d' }} />}
            <span className="text-[9px] font-bold" style={{ color: connected ? '#00d084' : '#ff4d4d' }}>
              {connected ? 'Live' : '…'}
            </span>
          </div>
        )}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar flex-1">
          <button onClick={() => setFilterCat('all')}
            className="flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold transition"
            style={{ background: filterCat==='all' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)', color: filterCat==='all' ? '#fff' : '#444', border: `1px solid ${filterCat==='all' ? 'rgba(255,255,255,0.12)' : 'transparent'}` }}>
            Tous
          </button>
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setFilterCat(c.id)}
              className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition"
              style={{ background: filterCat===c.id ? `${c.color}18` : 'rgba(255,255,255,0.03)', color: filterCat===c.id ? c.color : '#444', border: `1px solid ${filterCat===c.id ? `${c.color}35` : 'transparent'}` }}>
              <c.icon className="w-2.5 h-2.5" />{c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5" style={{ minHeight: 0 }}>
        {grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-10">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.15)' }}>
              <MessageCircle className="w-7 h-7" style={{ color: 'rgba(96,165,250,0.4)' }} />
            </div>
            <p className="text-sm text-center" style={{ color: '#444' }}>Aucun message encore.<br/>Lancez la conversation !</p>
          </div>
        ) : (
          grouped.map((item, i) => {
            if (item.type === 'date') return (
              <div key={`d-${i}`} className="flex items-center gap-3 py-2">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
                <span className="text-[9px] font-bold uppercase tracking-widest px-2" style={{ color: '#333' }}>{item.date}</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
              </div>
            );

            const mine    = isMine(item);
            const catInfo = getCat(item.cat);
            const grad    = authorColor(item.author);
            const rxs     = item.reactions || {};
            const hasRxs  = Object.keys(rxs).length > 0;

            return (
              <div key={item.id} className={`flex gap-2 group ${mine ? 'flex-row-reverse' : 'flex-row'}`}>

                {/* Avatar */}
                {!mine && (
                  <div className="flex-shrink-0 flex flex-col items-center gap-1 mt-1">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black"
                      style={{ background: grad, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                      {item.authorInitial}
                    </div>
                  </div>
                )}

                <div className={`max-w-[76%] flex flex-col gap-0.5 ${mine ? 'items-end' : 'items-start'}`}>
                  {/* Author name */}
                  {!mine && (
                    <div className="flex items-center gap-1.5 px-1 mb-0.5">
                      <span className="text-[11px] font-bold" style={{ color: '#666' }}>{item.author}</span>
                      {item.isAdmin && <Star className="w-2.5 h-2.5 text-amber-400" fill="#f59e0b" />}
                    </div>
                  )}

                  {/* Bubble */}
                  <div className="relative group/bubble">
                    <div className="rounded-2xl px-4 py-2.5"
                      style={{
                        background: mine
                          ? 'linear-gradient(135deg,#f59e0b,#d97706)'
                          : 'rgba(255,255,255,0.05)',
                        border: mine ? 'none' : '1px solid rgba(255,255,255,0.07)',
                        borderBottomRightRadius: mine ? 6 : 18,
                        borderBottomLeftRadius:  mine ? 18 : 6,
                        boxShadow: mine ? '0 4px 16px rgba(245,158,11,0.2)' : 'none',
                      }}>

                      {/* Category tag */}
                      {item.cat !== 'general' && (
                        <div className="flex items-center gap-1 mb-1.5">
                          <catInfo.icon className="w-2.5 h-2.5" style={{ color: mine ? 'rgba(255,255,255,0.7)' : catInfo.color }} />
                          <span className="text-[9px] font-bold uppercase tracking-wide"
                            style={{ color: mine ? 'rgba(255,255,255,0.7)' : catInfo.color }}>
                            {catInfo.label}
                          </span>
                        </div>
                      )}

                      <p className="text-sm leading-relaxed" style={{ color: mine ? '#fff' : '#ccc' }}>{item.text}</p>
                      <p className="text-[9px] mt-1.5 font-medium" style={{ color: mine ? 'rgba(255,255,255,0.5)' : '#333', textAlign: mine ? 'right' : 'left' }}>
                        {item.time}
                      </p>
                    </div>

                    {/* Hover actions */}
                    <div className={`absolute top-0 ${mine ? 'left-0 -translate-x-full pr-1' : 'right-0 translate-x-full pl-1'} flex items-center gap-0.5 opacity-0 group-hover/bubble:opacity-100 transition`}>
                      <button onClick={(e) => { e.stopPropagation(); setReactionMenu(reactionMenu===item.id ? null : item.id); }}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] transition hover:scale-110"
                        style={{ background: 'rgba(255,255,255,0.08)' }}>😊</button>
                      <button onClick={() => togglePin(item.id)}
                        className="w-6 h-6 rounded-full flex items-center justify-center transition hover:scale-110"
                        style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <Pin className="w-3 h-3" style={{ color: item.pinned ? '#f59e0b' : '#555' }} />
                      </button>
                      {(mine || user?.isAdmin) && (
                        <button onClick={() => deleteMsg(item.id)}
                          className="w-6 h-6 rounded-full flex items-center justify-center transition hover:scale-110"
                          style={{ background: 'rgba(255,255,255,0.08)' }}>
                          <Trash2 className="w-3 h-3" style={{ color: '#555' }} />
                        </button>
                      )}
                    </div>

                    {/* Reaction picker */}
                    {reactionMenu === item.id && (
                      <div className={`absolute bottom-full mb-1.5 ${mine ? 'right-0' : 'left-0'} flex items-center gap-1 p-1.5 rounded-2xl fade-up z-20`}
                        style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}
                        onClick={e => e.stopPropagation()}>
                        {EMOJI_REACTIONS.map(emoji => (
                          <button key={emoji} onClick={() => addReaction(item.id, emoji)}
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-base transition hover:scale-125 hover:bg-white/10">
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Reactions display */}
                  {hasRxs && (
                    <div className={`flex flex-wrap gap-1 px-1 ${mine ? 'justify-end' : 'justify-start'}`}>
                      {Object.entries(rxs).map(([emoji, voters]) => {
                        const iReacted = voters.includes(user?.username || '');
                        return (
                          <button key={emoji} onClick={() => addReaction(item.id, emoji)}
                            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-bold transition hover:scale-105"
                            style={{ background: iReacted ? 'rgba(0,208,132,0.12)' : 'rgba(255,255,255,0.06)', border: `1px solid ${iReacted ? 'rgba(0,208,132,0.25)' : 'rgba(255,255,255,0.08)'}`, color: iReacted ? '#00d084' : '#888' }}>
                            {emoji}<span>{voters.length}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ── */}
      <div className="mt-3 rounded-2xl p-3" style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex gap-1.5 mb-2.5 overflow-x-auto no-scrollbar">
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setCat(c.id)}
              className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition"
              style={{ background: cat===c.id ? `${c.color}18` : 'rgba(255,255,255,0.04)', color: cat===c.id ? c.color : '#444', border: `1px solid ${cat===c.id ? `${c.color}35` : 'transparent'}` }}>
              <c.icon className="w-2.5 h-2.5" />{c.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            {/* My avatar in input */}
            <div className="absolute left-2.5 bottom-2.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-black flex-shrink-0"
              style={{ background: authorColor(user?.nom || user?.username || '?') }}>
              {(user?.nom || user?.username || '?').charAt(0).toUpperCase()}
            </div>
            <textarea ref={inputRef} rows={1} value={text}
              onChange={e => { setText(e.target.value); e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,100)+'px'; }}
              onKeyDown={handleKey}
              placeholder="Message..."
              className="w-full rounded-xl pl-9 pr-3 py-2.5 text-sm resize-none overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'white', outline: 'none', minHeight: 40, lineHeight: '1.5' }} />
          </div>
          <button onClick={send} disabled={!text.trim()}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition flex-shrink-0 disabled:opacity-25 active:scale-90"
            style={{ background: text.trim() ? 'linear-gradient(135deg,#f59e0b,#b45309)' : 'rgba(255,255,255,0.06)', boxShadow: text.trim() ? '0 4px 12px rgba(245,158,11,0.3)' : 'none' }}>
            <Send className="w-4 h-4 text-white" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
