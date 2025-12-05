import Head from 'next/head';
import Link from 'next/link';

export default function About() {
  return (
    <div className="container" style={{ padding: '18px 12px' }}>
      <Head>
        <title>About — StudyGK Hub</title>
        <meta name="description" content="About StudyGK Hub — typing tutor, question practice and GK resources." />
      </Head>

      <main style={{ maxWidth: 880, margin: '0 auto' }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>About StudyGK Hub</h1>

        <p style={{ color: '#333', lineHeight: 1.6 }}>
          StudyGK Hub is a lightweight learning site that helps users prepare for competitive
          exams and typing tests. The site provides:
        </p>

        <ul style={{ lineHeight: 1.8 }}>
          <li>Typing Tutor — timed typing practice tailored to common HCM/Clerk/Stenographer tests.</li>
          <li>Question Practice — multiple-choice GK questions with explanations and review features.</li>
          <li>News & Articles — short study notes and updates to help with exam preparation.</li>
        </ul>

        <p style={{ color: '#333', lineHeight: 1.6 }}>
          Our goal is to provide practical, no-friction practice tools. The Typing Tutor supports
          saving simple practice exercises and local progress so you can practise anywhere.
        </p>

        <h2 style={{ fontSize: 18, marginTop: 20 }}>What we collect</h2>
        <p style={{ color: '#333', lineHeight: 1.6 }}>
          We try to minimize personal data collection. Usernames and display names you enter for saving
          exercises are stored with saved lessons, and the app stores a last-used username/displayName in
          localStorage to make the experience persistent. Any saved lessons or feedback you submit are stored
          on the server so you can access them later. We do not sell personal data.
        </p>

        <h2 style={{ fontSize: 18, marginTop: 20 }}>Contact & feedback</h2>
        <p style={{ color: '#333', lineHeight: 1.6 }}>
          If you have questions or concerns, please email us at <a href="mailto:studygkhub@gmail.com">studygkhub@gmail.com</a>.
        </p>

        <p style={{ marginTop: 18 }}>
          <Link href="/privacy">Privacy Policy</Link> · <Link href="/terms">Terms</Link> · <Link href="/contact">Contact</Link>
        </p>
      </main>
    </div>
  );
}
