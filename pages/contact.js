import Head from 'next/head';
import Link from 'next/link';

export default function Contact() {
  return (
    <div className="container" style={{ padding: '18px 12px' }}>
      <Head>
        <title>Contact — StudyGK Hub</title>
        <meta name="description" content="Contact StudyGK Hub — reach out for questions, feedback and support." />
      </Head>

      <main style={{ maxWidth: 760, margin: '0 auto' }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Contact</h1>

        <p style={{ color: '#333', lineHeight: 1.6 }}>
          We welcome feedback and questions. For general enquiries, site issues or partnership requests,
          please email us at:
        </p>

        <p style={{ marginTop: 12 }}>
          <a href="mailto:studygkhub@gmail.com" style={{ fontWeight: 700, color: '#0b66c2' }}>studygkhub@gmail.com</a>
        </p>

        <h2 style={{ fontSize: 18, marginTop: 20 }}>What to include</h2>
        <p style={{ color: '#333', lineHeight: 1.6 }}>
          When reporting bugs or asking for help, please include a short description, the page URL,
          and any relevant screenshots or steps to reproduce the issue. We aim to reply as soon as possible.
        </p>

        <p style={{ marginTop: 18 }}>
          Back to <Link href="/">Home</Link>
        </p>
      </main>
    </div>
  );
}
