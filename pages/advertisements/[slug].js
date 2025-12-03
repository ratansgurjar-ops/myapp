import React from 'react';
import Head from 'next/head';
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

export default function AdPage({ item }) {
  if (!item) return <div style={{ padding: 20 }}>Advertisement not found</div>;
  const metaDescription = makeDescription(item.description || item.content || '', item.title || '', 150);

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <Head>
          <title>{item.title} — StudyGK</title>
          <meta name="description" content={metaDescription} />
          <link rel="canonical" href={`${process.env.NEXT_PUBLIC_BASE_URL || 'https://studygkhub.com'}/advertisements/${item.slug}`} />
          <meta property="og:title" content={item.title} />
          <meta property="og:description" content={metaDescription} />
          <meta property="og:type" content="article" />
          {item.image && <meta property="og:image" content={item.image} />}
          <meta name="twitter:card" content={item.image ? 'summary_large_image' : 'summary'} />
      </Head>

      <div style={{ marginBottom: 12 }}><a href="/">← Back to homepage</a></div>
      <h1>{item.title}</h1>
      {item.image && <img src={item.image} alt="" style={{ maxWidth: '100%', marginTop: 12 }} />}
      <div style={{ marginTop: 12 }} dangerouslySetInnerHTML={{ __html: item.content }} />
    </div>
  );
}

export async function getServerSideProps(context) {
  const { slug } = context.params;
  const item = await News.findBySlug(slug);
  if (!item) return { props: { item: null } };
  // ensure this is an ad; if not, redirect to news detail
  if (item.type !== 'ad') {
    return { redirect: { destination: `/news/${slug}`, permanent: false } };
  }
  News.incrementHits(item.id).catch(() => {});
  if (item.createdAt) item.createdAt = new Date(item.createdAt).toISOString();
  if (item.updatedAt) item.updatedAt = new Date(item.updatedAt).toISOString();
  return { props: { item } };
}
