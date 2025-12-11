import React from 'react';
import Head from 'next/head';
import FooterAd from '../../components/FooterAd';
const News = require('../../models/news');

function stripHtml(s) {
  if (!s) return '';
  return String(s).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function makeDescription(primary, fallback, max = 150) {
  const src = stripHtml(primary) || stripHtml(fallback) || '';
  if (!src) return '';
  if (src.length <= max) return src;
  return src.slice(0, max).trim() + '...';
}

export default function NewsPage({ item }) {
  if (!item) return <div style={{ padding: 20 }}>News item not found</div>;
  const metaDescription = makeDescription(item.content || '', item.title || '', 150);

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <Head>
        <title>{item.title} — StudyGK</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_BASE_URL || 'https://studygkhub.com'}/news/${item.slug}`} />
        <meta property="og:title" content={item.title} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="article" />
        {item.image && <meta property="og:image" content={item.image} />}
        <meta name="twitter:card" content={item.image ? 'summary_large_image' : 'summary'} />
        {/* JSON-LD Article structured data for better indexing */}
        {(() => {
          const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://studygkhub.com';
          const ld = {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: item.title,
            description: metaDescription,
            url: `${base}/news/${item.slug}`,
            publisher: { "@type": "Organization", name: "StudyGK Hub", url: base, logo: { "@type": "ImageObject", url: `${base}/logo.png` } },
            author: item.author ? { "@type": "Person", name: item.author } : { "@type": "Organization", name: "StudyGK Hub" }
          };
          if (item.image) ld.image = item.image;
          if (item.createdAt) ld.datePublished = item.createdAt;
          if (item.updatedAt) ld.dateModified = item.updatedAt;
          return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />;
        })()}
      </Head>

      <div style={{ marginBottom: 12 }}><a href="/">← Back to homepage</a></div>
      <h1>{item.title}</h1>
      {item.image && <img src={item.image} alt="" style={{ maxWidth: '100%', marginTop: 12 }} />}
      <div style={{ marginTop: 12 }} dangerouslySetInnerHTML={{ __html: item.content }} />
      <FooterAd />
    </div>
  );
}

export async function getServerSideProps(context) {
  const { slug } = context.params;
  const item = await News.findBySlug(slug);
  if (!item) return { props: { item: null } };
  // If this item is an advertisement, redirect to the advertisements detail page
  if (item.type === 'ad') {
    return { redirect: { destination: `/advertisements/${slug}`, permanent: false } };
  }
  News.incrementHits(item.id).catch(() => {});
  if (item.createdAt) item.createdAt = new Date(item.createdAt).toISOString();
  if (item.updatedAt) item.updatedAt = new Date(item.updatedAt).toISOString();
  return { props: { item } };
}
