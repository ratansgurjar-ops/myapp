import React from 'react';
import TypingTutor from '../components/TypingTutor';

export default function TypingTutorPage() {
  return (
    <>
      <div style={{ width: '100%', background: '#f7fbff', padding: '18px 12px', boxSizing: 'border-box' }}>
        <div style={{ maxWidth: 980, margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
          <div style={{ color: '#003366', lineHeight: 1.25 }}>
            <div style={{ margin: '6px 0', fontSize: 22, fontWeight: 600 }}>Typing Practice for Stenographer, Clerk & Data Entry — Head Constable (Ministerial) Exam Prep</div>
            <div style={{ margin: '6px 0 14px 0', fontSize: 15 }}>Realistic timed typing tests for CRPF Head Constable (Ministerial), CISF Head Constable (Ministerial), Delhi Police Head Constable (Ministerial), BSF Head Constable (Ministerial) — Practice lessons for Stenographer, Clerk, DEO, UDC & LDC</div>
          </div>
        </div>
      </div>

      <div className="container layout">
        <main style={{ flex: 1 }}>
          <section style={{ marginTop: 8 }}>
            <TypingTutor />
          </section>
        </main>
      </div>
    </>
  );
}
