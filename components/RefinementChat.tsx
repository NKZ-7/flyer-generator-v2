'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  status?: 'pending' | 'done' | 'error';
}

interface RefinementChatProps {
  onRefine: (message: string) => void;
  isRefining: boolean;
}

export function RefinementChat({ onRefine, isRefining }: RefinementChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const prevRefiningRef = useRef(false);

  // When isRefining transitions true → false, mark the last pending message as done
  useEffect(() => {
    if (prevRefiningRef.current && !isRefining) {
      setMessages((prev) => {
        const lastPending = [...prev].reverse().findIndex((m) => m.status === 'pending');
        if (lastPending === -1) return prev;
        const idx = prev.length - 1 - lastPending;
        const updated = [...prev];
        updated[idx] = { ...updated[idx], text: '✓ Done — new version added', status: 'done' };
        return updated;
      });
    }
    prevRefiningRef.current = isRefining;
  }, [isRefining]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isRefining) return;

    setMessages((prev) => [
      ...prev,
      { role: 'user', text: trimmed },
      { role: 'assistant', text: 'Refining…', status: 'pending' },
    ]);
    setInput('');
    onRefine(trimmed);
  }

  return (
    <div className="h-full flex flex-col bg-[#0d0d0f]">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-zinc-800 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
            Refine with AI
          </span>
          <span className="text-[10px] text-zinc-600">Describe changes in plain English</span>
        </div>
      </div>

      {/* Message list */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-0">
        {messages.length === 0 && (
          <p className="text-[11px] text-zinc-600 text-center pt-2">
            e.g. &ldquo;Make the headline bigger&rdquo; · &ldquo;Change to blue tones&rdquo; · &ldquo;Add more energy&rdquo;
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'user' ? (
              <div className="max-w-[80%] bg-amber-400/15 border border-amber-400/25 text-amber-200 text-xs px-3 py-1.5 rounded-2xl rounded-tr-sm">
                {msg.text}
              </div>
            ) : (
              <div
                className={`max-w-[80%] text-xs px-3 py-1.5 rounded-2xl rounded-tl-sm flex items-center gap-1.5 ${
                  msg.status === 'done'
                    ? 'bg-emerald-400/10 border border-emerald-400/25 text-emerald-300'
                    : msg.status === 'error'
                    ? 'bg-red-400/10 border border-red-400/25 text-red-300'
                    : 'bg-zinc-800 border border-zinc-700 text-zinc-400'
                }`}
              >
                {msg.status === 'pending' && (
                  <span className="w-3 h-3 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin shrink-0" />
                )}
                {msg.text}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="px-3 pb-3 pt-2 shrink-0 border-t border-zinc-800 flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isRefining}
          placeholder={isRefining ? 'Refining your flyer…' : 'Describe a change…'}
          className="flex-1 bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded-lg px-3 py-2 placeholder-zinc-600 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 transition-colors disabled:opacity-40"
        />
        <button
          type="submit"
          disabled={isRefining || !input.trim()}
          className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all shrink-0 ${
            isRefining || !input.trim()
              ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700'
              : 'bg-amber-400 text-zinc-950 hover:bg-amber-300'
          }`}
        >
          Send
        </button>
      </form>
    </div>
  );
}
