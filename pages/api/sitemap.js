// Server-only sitemap API: require DB inside handler to avoid bundling mysql2
export default async function handler(req, res) {
  try {
    const { getPool } = require('../../lib/db');
    const pool = await getPool();

    const [questions] = await pool.query('SELECT slug, updatedAt, createdAt FROM questions LIMIT 50000');
    const [news] = await pool.query('SELECT slug, type, updatedAt, createdAt FROM news LIMIT 50000');

    const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://studygkhub.com';
    const urls = [{ loc: base + '/', lastmod: new Date().toISOString() }];

    questions.forEach((q) => {
      const last = (q.updatedAt || q.createdAt || new Date()).toISOString();
      if (q.slug) urls.push({ loc: `${base}/questions/${q.slug}`, lastmod: last });
    });
    news.forEach((n) => {
      const last = (n.updatedAt || n.createdAt || new Date()).toISOString();
      if (!n.slug) return;
      const path = (n.type && n.type === 'ad') ? `/advertisements/${n.slug}` : `/news/${n.slug}`;
      urls.push({ loc: `${base}${path}`, lastmod: last });
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls.map(u => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>`).join('\n') +
      `\n</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.status(200).send(xml);
  } catch (err) {
    console.error('sitemap API error', err && (err.stack || err.message || err));
    res.status(500).send('Internal Server Error');
  }
}
