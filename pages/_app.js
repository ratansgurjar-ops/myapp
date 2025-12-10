import '../styles/globals.css';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import SiteHeader from '../components/SiteHeader';
import GlobalFeedback from '../components/GlobalFeedback';

function MyApp({ Component, pageProps }) {
  const [theme, setTheme] = useState('light');
  const router = useRouter();

  useEffect(() => {
    try {
      const saved = localStorage.getItem('site_theme');
      if (saved) { setTheme(saved); return; }
    } catch (e) {}
    // default to light
    setTheme('light');
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('site_theme', theme); } catch (e) {}
  }, [theme]);

  useEffect(() => {
    // send a visit record to server; server will ignore local/private IPs
    try {
      fetch('/api/visits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: window.location.pathname, ua: navigator.userAgent }) });
    } catch (e) {
      // ignore
    }
  }, []);

  // Determine admin routes from router.pathname so server and client render the same
  const isAdminRoute = (router && router.pathname && (router.pathname.startsWith('/admin') || router.pathname.startsWith('/ad81188')));

  return (
    <div>
      {!isAdminRoute && <SiteHeader />}
      <div style={{ position: 'fixed', right: 12, top: 12 }}>
        <button onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}>{theme === 'light' ? 'Dark' : 'Light'}</button>
      </div>
      <Component {...pageProps} />
      {!isAdminRoute && <GlobalFeedback />}
    </div>
  );
}

export default MyApp;
