// Keep DB and models server-only by requiring them inside getServerSideProps

function generateSiteMap(urls) {
  return `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls
      .map(
        (u) => `
      <url>
        <loc>${u.loc}</loc>
        <lastmod>${u.lastmod}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.6</priority>
      </url>`
      )
      .join('')}
  </urlset>`;
}

export async function getServerSideProps({ res }) {
  const { getPool } = require('../lib/db');
  const pool = await getPool();
  const [questions] = await pool.query('SELECT slug, updatedAt, createdAt FROM questions LIMIT 50000');
  const [news] = await pool.query('SELECT slug, type, updatedAt, createdAt FROM news LIMIT 50000');

  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://studygkhub.com';
  const urls = [
    { loc: base + '/', lastmod: new Date().toISOString() }
  ];

  questions.forEach((q) => {
    const last = (q.updatedAt || q.createdAt || new Date()).toISOString();
    urls.push({ loc: `${base}/questions/${q.slug}`, lastmod: last });
  });
  news.forEach((n) => {
    const last = (n.updatedAt || n.createdAt || new Date()).toISOString();
    const path = (n.type && n.type === 'ad') ? `/advertisements/${n.slug}` : `/news/${n.slug}`;
    urls.push({ loc: `${base}${path}`, lastmod: last });
  });

  const xml = generateSiteMap(urls);
  res.setHeader('Content-Type', 'text/xml');
  res.write(xml);
  res.end();

  return { props: {} };
}

export default function SiteMap() {
  return null;
}
