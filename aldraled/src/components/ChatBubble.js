import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const SUGGESTIONS = [
  'Welke producten zijn geschikt voor bedrijfswagens?',
  'Hoe snel wordt er geleverd?',
  'Hebben jullie CE-gecertificeerde producten?',
  'Kan ik een offerte aanvragen?',
];

export default function ChatBubble() {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [unread, setUnread]     = useState(0);
  const [greeted, setGreeted]   = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Greeting after 3s
  useEffect(() => {
    if (greeted) return;
    const t = setTimeout(() => {
      setMessages([{
        role: 'assistant',
        content: 'Hoi! 👋 Ik ben de ALRA LED assistent. Heb je een vraag over onze producten of wil je een offerte? Ik help je graag!',
      }]);
      setUnread(1);
      setGreeted(true);
    }, 3000);
    return () => clearTimeout(t);
  }, [greeted]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    const userMsg = { role: 'user', content: msg };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const history = [...messages, userMsg];
      const res = await axios.post(`${API_URL}/api/ai/storefront-chat`, { messages: history });
      const reply = { role: 'assistant', content: res.data.result };
      setMessages(m => [...m, reply]);
      if (!open) setUnread(u => u + 1);
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Sorry, even geen verbinding. Bel ons gerust direct!' }]);
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const primaryRgb = 'rgb(var(--color-primary))';
  const primaryAlpha = (a) => `rgba(var(--color-primary)/${a})`;

  const { i18n } = useTranslation();
  const [general, setGeneral] = useState({});

  useEffect(() => {
    const lang = (i18n.resolvedLanguage || i18n.language || 'nl').split('-')[0];
    axios.get(`${API_URL}/api/content/general`, { params: { lang } })
      .then(res => setGeneral(res.data))
      .catch(() => {});
  }, [i18n.resolvedLanguage, i18n.language]);

  const toggleOpen = () => setOpen(!open);

  return (
    <>
      {/* ── Chat panel ─────────────────────────── */}
      <div className={`fixed bottom-24 right-5 z-50 w-[360px] max-w-[calc(100vw-2rem)] transition-all duration-300 ease-out ${
        open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}>
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col"
          style={{ maxHeight: '520px' }}>

          {/* Header */}
          <div className="px-5 py-4 flex items-center gap-3 shrink-0"
            style={{ background: `linear-gradient(135deg, rgb(var(--color-primary)), rgba(var(--color-primary)/0.8))` }}>
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-sm">
                AI
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-sm leading-none">ALRA LED Assistent</p>
              <p className="text-white/60 text-xs mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                Online · antwoordt direct
              </p>
            </div>
            <button onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-black shrink-0 mb-0.5"
                    style={{ background: primaryRgb }}>
                    AI
                  </div>
                )}
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'text-white rounded-br-sm'
                    : 'bg-white text-gray-700 rounded-bl-sm shadow-sm border border-gray-100'
                }`}
                  style={msg.role === 'user' ? { background: primaryRgb } : {}}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start items-end gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-black shrink-0"
                  style={{ background: primaryRgb }}>AI</div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Quick suggestions */}
            {messages.length <= 1 && !loading && (
              <div className="space-y-1.5 pt-1">
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => send(s)}
                    className="w-full text-left text-xs px-3 py-2 bg-white border border-gray-100 rounded-xl hover:border-primary/40 hover:bg-primary/5 text-gray-600 transition-all"
                    style={{ '--primary': primaryRgb }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 bg-white border-t border-gray-100 flex gap-2 shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Stel een vraag..."
              className="flex-1 text-sm px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary/50 transition-colors bg-gray-50"
            />
            <button onClick={() => send()}
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all hover:brightness-110 disabled:opacity-40 shrink-0"
              style={{ background: primaryRgb }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Bubble button ──────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
        style={{ background: `linear-gradient(135deg, rgb(var(--color-primary)), rgba(var(--color-primary)/0.75))` }}
      >
        {/* Pulse ring */}
        {!open && unread === 0 && (
          <span className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ background: primaryRgb }} />
        )}

        {/* Unread badge */}
        {unread > 0 && !open && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white">
            {unread}
          </span>
        )}

        {open ? (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>
    </>
  );
}
