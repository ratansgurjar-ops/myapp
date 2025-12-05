import Head from 'next/head';
import Link from 'next/link';

export default function Terms() {
  return (
    <div className="container" style={{ padding: '18px 12px' }}>
      <Head>
        <title>Terms of Use — StudyGK Hub</title>
        <meta name="description" content="Terms of use for StudyGK Hub." />
      </Head>

      <main style={{ maxWidth: 880, margin: '0 auto' }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Terms of Use</h1>

        <p style={{ color: '#333', lineHeight: 1.6 }}>
          Welcome to StudyGK Hub. By using this site you agree to these terms. Please read them carefully.
        </p>

        <h3 style={{ marginTop: 12 }}>Use of the service</h3>
        <p style={{ color: '#333', lineHeight: 1.6 }}>
          The content on this site (questions, typing lessons, articles) is provided for study and practice only.
          You may use the content for personal, educational, and non-commercial purposes.
        </p>

        <h3 style={{ marginTop: 12 }}>No warranty</h3>
        <p style={{ color: '#333', lineHeight: 1.6 }}>
          The site and its content are provided "as is". We endeavour to keep content accurate but we do not
          guarantee completeness or suitability for any specific purpose. Use at your own risk.
        </p>

        <h3 style={{ marginTop: 12 }}>User content</h3>
        <p style={{ color: '#333', lineHeight: 1.6 }}>
          Feedback and saved exercises you submit may be publicly visible (where applicable). Do not submit
          sensitive personal data. By submitting content you grant the site a licence to store and display it.
        </p>

        <h3 style={{ marginTop: 12 }}>Advertising</h3>
        <p style={{ color: '#333', lineHeight: 1.6 }}>
          We may display ads (e.g., Google AdSense). Ad content is served by third parties and is subject to
          their terms and policies.
        </p>

        <h3 style={{ marginTop: 12 }}>Contact</h3>
        <p style={{ color: '#333', lineHeight: 1.6 }}>
          For questions about these terms, contact <a href="mailto:studygkhub@gmail.com">studygkhub@gmail.com</a>.
        </p>

        <p style={{ marginTop: 18 }}>
          Back to <Link href="/">Home</Link>
        </p>
      </main>
    </div>
  );
}
