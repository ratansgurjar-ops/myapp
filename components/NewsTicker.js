import React, { useEffect, useRef, useState } from 'react';

export default function NewsTicker({ items = [] }) {
  const [running, setRunning] = useState(true);
  const boxRef = useRef();

  useEffect(() => {
    if (!boxRef.current) return;
    const el = boxRef.current;
    let pos = 0;
    let rafId;
    const step = () => {
      pos += 0.5;
      if (pos >= el.scrollHeight) pos = 0;
      el.scrollTop = pos;
      if (running) rafId = requestAnimationFrame(step);
    };
    if (running) rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [running, items]);

  return (
    <div style={{ width: 300 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>News / Ads</strong>
        <button onClick={() => setRunning((r) => !r)}>{running ? 'Pause' : 'Play'}</button>
      </div>
      <div ref={boxRef} style={{ height: 300, overflow: 'auto', border: '1px solid #ddd', marginTop: 8, padding: 8 }}>
        {items.map((it) => (
          <div key={it.id || it._id || it.slug} style={{ padding: 8, borderBottom: '1px solid #eee' }}>
            <a href={it.link || `/news/${it.slug}`} style={{ fontWeight: 600 }}>{it.title}</a>
            <div style={{ fontSize: 13 }} dangerouslySetInnerHTML={{ __html: it.content }} />
          </div>
        ))}
      </div>
    </div>
  );
}
