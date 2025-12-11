import React, { useEffect } from 'react';

export default function FooterAd({ className }) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // ignore errors (ads not available in dev, etc.)
    }
  }, []);

  return (
    <div className={className} style={{ width: '100%', textAlign: 'center', marginTop: 24 }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', margin: '0 auto', maxWidth: 728 }}
        data-ad-client="ca-pub-4799680224544946"
        data-ad-slot="1234567890"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
