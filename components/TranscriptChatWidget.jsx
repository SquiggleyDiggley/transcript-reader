"use client";
import React, { useEffect, useState } from 'react';

export default function TranscriptChatWidget({ transcriptId = '', transcriptPayload = null, chatContextKey = '', title = 'Chat', emptyHint = 'No data', initialAssistantMessage = '' }) {
  const key = `transcript_chat_${chatContextKey || transcriptId}`;
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(messages));
  }, [key, messages]);

  function addMessage(role, text) {
    const next = [...messages, { role, text, time: Date.now() }];
    setMessages(next);
  }

  return (
    <div style={styles.wrapper}>
      {open && (
        <div style={styles.panel}>
          <div style={styles.header}>{title}</div>
          <div style={styles.body}>
            {messages.length === 0 ? <div style={styles.empty}>{emptyHint}</div> : messages.map((m, i) => <div key={i} style={m.role === 'assistant' ? styles.assistant : styles.user}>{m.text}</div>)}
          </div>
          <div style={styles.footer}>
            <input style={styles.input} placeholder="Ask a question..." id="chat-input" />
            <button
              style={styles.send}
              onClick={() => {
                const el = document.getElementById('chat-input');
                if (!el) return;
                const txt = el.value.trim();
                if (!txt) return;
                addMessage('user', txt);
                addMessage('assistant', initialAssistantMessage || 'Thanks — I received your question.');
                el.value = '';
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      <button style={styles.toggle} onClick={() => setOpen((v) => !v)}>
        {open ? 'Close' : 'Chat'}
      </button>
    </div>
  );
}

const styles = {
  wrapper: { position: 'fixed', right: '18px', bottom: '18px', zIndex: 9999 },
  toggle: { padding: '0.5rem 0.75rem', borderRadius: '10px', background: '#1d4ed8', color: '#fff', border: 'none', fontWeight: 800 },
  panel: { width: '320px', height: '400px', background: '#fff', border: '1px solid #e6eef8', borderRadius: '10px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 8px 24px rgba(2,6,23,0.08)' },
  header: { padding: '0.6rem', borderBottom: '1px solid #eef2ff', fontWeight: 800, background: '#f8fafc' },
  body: { flex: 1, padding: '0.6rem', overflow: 'auto' },
  footer: { padding: '0.4rem', display: 'flex', gap: '0.4rem', borderTop: '1px solid #eef2ff' },
  input: { flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid #e6eef8' },
  send: { padding: '0.45rem 0.65rem', borderRadius: '8px', background: '#0f172a', color: '#fff', border: 'none' },
  empty: { color: '#64748b' },
  user: { textAlign: 'right', margin: '0.25rem 0', padding: '0.35rem 0.6rem', background: '#eef2ff', borderRadius: '8px' },
  assistant: { textAlign: 'left', margin: '0.25rem 0', padding: '0.35rem 0.6rem', background: '#f1f5f9', borderRadius: '8px' },
};
