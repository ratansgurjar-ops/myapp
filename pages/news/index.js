import React from 'react';
const News = require('../../models/news');

export default function NewsArchive({ items = [], total = 0, page = 1, type = 'all' }) {
  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1>News & Advertisements</h1>
      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <a href="/">Home</a>
          <div style={{ marginLeft: 'auto' }}>
            <a href="/news?type=all">All</a> | <a href="/news?type=news">News</a> | <a href="/news?type=ad">Ads</a>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
          {items.map(it => {
            const href = (it.link && it.link.length) ? it.link : (it.type === 'ad' ? `/advertisements/${it.slug}` : `/news/${it.slug}`);
            return (
              <div key={it.id || it.slug} style={{ padding: 12, border: '1px solid #eee', borderRadius: 6 }}>
                <h3 style={{ margin: 0 }}><a href={href}>{it.title}</a></h3>
                <div style={{ fontSize: 13, color: '#666', marginTop: 8 }}>{(it.content || '').replace(/<[^>]*>/g, '').slice(0, 400)}{(it.content||'').length>400?'...':''}</div>
                <div style={{ marginTop: 8 }}><a href={href}>Read more</a></div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 16 }}>
          <div>Showing page {page} — total {total}</div>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  const type = context.query.type || 'all';
  const page = parseInt(context.query.page || '1');
  const limit = parseInt(context.query.limit || '50');
  const data = await News.findNews({ page, limit, type, includeInactive: false });
  // normalize date fields to strings so Next.js can serialize them
  (data.items || []).forEach(i => {
    if (i.createdAt) i.createdAt = new Date(i.createdAt).toISOString();
    if (i.updatedAt) i.updatedAt = new Date(i.updatedAt).toISOString();
  });
  return { props: { items: data.items || [], total: data.total || 0, page: page, type } };
}
