import Head from 'next/head';
import Link from 'next/link';

export default function Privacy() {
  return (
    <div className="container" style={{ padding: '18px 12px' }}>
      <Head>
        <title>Privacy Policy — StudyGK Hub</title>
        <meta name="description" content="Privacy policy for StudyGK Hub covering localStorage, saved exercises and AdSense." />
      </Head>

      <main style={{ maxWidth: 880, margin: '0 auto' }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Privacy Policy</h1>

        <p style={{ color: '#333', lineHeight: 1.6 }}>
          Effective date: {new Date().toISOString().slice(0,10)}
        </p>

        <h2 style={{ fontSize: 18, marginTop: 12 }}>Summary</h2>
        <p style={{ color: '#333', lineHeight: 1.6 }}>
          StudyGK Hub collects minimal data to provide the service. We do not sell personal information.
          This page explains what we collect, why, and how you can contact us.
        </p>

        <h3 style={{ marginTop: 12 }}>What we collect</h3>
        <ul style={{ lineHeight: 1.8 }}>
          <li>LocalStorage: We store last-used username/displayName to make the typing tutor convenient.</li>
          <li>Saved exercises & feedback: If you save a practice or submit feedback, that content and the username you provide are stored on our server so you can retrieve them later.</li>
          <li>Logs & analytics: Basic server logs and anonymous analytics may be collected to monitor and improve the site.</li>
        </ul>

        <h3 style={{ marginTop: 12 }}>Google AdSense and third-party tools</h3>
        <p style={{ color: '#333', lineHeight: 1.6 }}>
          We use Google AdSense to display adverts. AdSense and advertising partners may use cookies or other
          storage to serve personalized ads. Please refer to Google's <a href="https://policies.google.com/technologies/ads">ad technologies</a> for details.
        </p>

        <h3 style={{ marginTop: 12 }}>No targeted collection here</h3>
        <p style={{ color: '#333', lineHeight: 1.6 }}>
          We do not intentionally collect sensitive personal information. If you choose to provide personal
          data in feedback or saved exercises, it may be stored as part of that content. You can contact us
          at <a href="mailto:studygkhub@gmail.com">studygkhub@gmail.com</a> to request removal of saved content.
        </p>

        <h3 style={{ marginTop: 12 }}>Links and third parties</h3>
        <p style={{ color: '#333', lineHeight: 1.6 }}>
          This site may link to third-party sites. We are not responsible for their privacy practices.
        </p>

        <h3 style={{ marginTop: 12 }}>Contact</h3>
        <p style={{ color: '#333', lineHeight: 1.6 }}>
          For privacy enquiries, contact <a href="mailto:studygkhub@gmail.com">studygkhub@gmail.com</a>.
        </p>

        <p style={{ marginTop: 18 }}>
          Back to <Link href="/">Home</Link>
        </p>
      </main>
    </div>
  );
}
