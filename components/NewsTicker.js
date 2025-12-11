import React from 'react';

export default function NewsTicker({ news = [] }) {
  if (!Array.isArray(news) || news.length === 0) return null;

  return (
    <div className="news-ticker" style={{ padding: 8, border: '1px solid #ddd', borderRadius: 6, overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {news.slice(0, 10).map((n) => (
          <a key={n.id || n.slug} href={n.link && n.link.length ? n.link : (`/news/${n.slug}`)} style={{ textDecoration: 'none', color: '#003366', fontWeight: 600 }}>
            {n.title}
          </a>
        ))}
      </div>
    </div>
  );
}
