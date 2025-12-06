import React from 'react';
import Head from 'next/head';
import TypingTutor from '../components/TypingTutor';

export default function TypingTutorPage() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://studygkhub.com';
  const title = 'Typing Tutor — Realistic typing practice for HCM exams';
  const desc = 'Realistic timed typing practice for Delhi Police, CRPF, CISF Head Constable and similar exams. Practice lessons for Stenographer, Clerk, DEO, UDC & LDC.';

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href={`${base}/typing-tutor`} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${base}/typing-tutor`} />
        <meta name="twitter:card" content="summary" />
      </Head>

      <div style={{ width: '100%', background: '#f7fbff', padding: '8px 12px', boxSizing: 'border-box' }}>
        <div style={{ maxWidth: 980, margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
          <div style={{ color: '#003366', lineHeight: 1.2 }}>
            <div style={{ margin: '4px 0', fontSize: 18, fontWeight: 700 }}>Typing Practice for Stenographer, Clerk & Data Entry</div>
            <div style={{ margin: '4px 0 8px 0', fontSize: 14, color:'#033' }}>{desc}</div>
          </div>
        </div>
      </div>

      <div className="container layout">
        <main style={{ flex: 1 }}>
          <section style={{ marginTop: 0 }}>
            <TypingTutor />
          </section>
        </main>
      </div>
    </>
  );
}
