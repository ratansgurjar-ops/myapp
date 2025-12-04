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

  // include known important static pages for indexing
  const staticPaths = [
    '/typing-tutor',
    '/news',
    '/advertisements',
    '/questions'
  ];
  staticPaths.forEach(p => urls.push({ loc: base + p, lastmod: new Date().toISOString() }));

  // Try adding pages under /typing (e.g., cisf-hcm, crpf-hcm, delhi-police-hcm)
  try {
    const fs = require('fs');
    const path = require('path');
    const typingDir = path.join(process.cwd(), 'pages', 'typing');
    if (fs.existsSync(typingDir)) {
      const files = fs.readdirSync(typingDir);
      files.forEach(f => {
        if (!f.endsWith('.js') && !f.endsWith('.jsx') && !f.endsWith('.ts') && !f.endsWith('.tsx')) return;
        // skip api files or index files
        if (f === 'index.js' || f === 'index.jsx' || f.startsWith('_')) return;
        const name = f.replace(/\.jsx?$|\.tsx?$/i, '');
        urls.push({ loc: `${base}/typing/${name}`, lastmod: new Date().toISOString() });
      });
    }
  } catch (e) {
    // ignore filesystem errors; sitemap will at least include staticPaths
  }

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
  // Add a robots header to encourage indexing and log generation for debugging
  try {
    res.setHeader('Content-Type', 'text/xml');
    res.setHeader('X-Robots-Tag', 'index, follow');
  } catch (e) {
    // ignore header errors
  }
  // small debug log to help with production troubleshooting (visible in server logs)
  try { console.log('sitemap.xml generated with', urls.length, 'urls'); } catch (e) {}
  res.write(xml);
  res.end();

  return { props: {} };
}

export default function SiteMap() {
  return null;
}
