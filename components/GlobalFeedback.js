import React, { useState } from 'react';

export default function GlobalFeedback() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  const submit = async () => {
    if (!text) return;
    setSubmitting(true);
    try {
      await fetch('/api/questions/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: text }) });
      setText('');
      setMsg('Thanks for your feedback');
      setTimeout(() => setMsg(''), 3000);
      setOpen(false);
    } catch (e) {
      setMsg('Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', right: 12, bottom: 12, zIndex: 9999 }}>
      <div style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)', borderRadius: 6, background: '#fff', width: 320 }}>
        <div style={{ padding: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700 }}>Reviews</div>
          <div>
            <button onClick={() => setOpen((o) => !o)} style={{ padding: '6px 10px' }}>{open ? 'Close' : 'Write Review'}</button>
          </div>
        </div>
        {open && (
          <div style={{ padding: 8, borderTop: '1px solid #eee' }}>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} style={{ width: '100%', padding: 8 }} placeholder="Write review..." />
            <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setText(''); setMsg(''); setOpen(false); }} disabled={submitting}>Cancel</button>
              <button onClick={submit} disabled={submitting || !text}>{submitting ? 'Submitting...' : 'Submit'}</button>
            </div>
          </div>
        )}
        {msg && <div style={{ padding: 8, fontSize: 13, color: '#333' }}>{msg}</div>}
      </div>
    </div>
  );
}
