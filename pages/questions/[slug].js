import React from 'react';
import Head from 'next/head';
const Question = require('../../models/question');

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

export default function QuestionPage({ item }) {
  if (!item) return <div style={{ padding: 20 }}>Question not found</div>;
  const metaDescription = makeDescription(item.solution || '', item.question_english || item.question_hindi || 'StudyGK question', 150);
  // Append typing-practice / HCM exam intent to GK question pages for SEO
  const seoSuffix = ' Practice typing and GK questions for Stenographer, Clerk, Data Entry Operator, UDC/LDC, Typist, Junior Secretariat Assistant, Office Assistant, Computer Operator and other Railway/Banking posts. Prepare for exams requiring typing tests (CRPF HCM, CISF HCM, Delhi Police HCM).';

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <Head>
        <title>{(item.question_english || item.question_hindi || 'Question')} — StudyGK</title>
        <meta name="description" content={(metaDescription + ' ' + seoSuffix).slice(0, 300)} />
        <meta name="keywords" content="Stenographer typing practice, Clerk typing test, Data Entry Operator practice, UDC typing, LDC typing, Typist, Junior Secretariat Assistant typing, Office Assistant typing, Computer Operator typing, Railway HCM, Bank HCM, CRPF HCM, CISF HCM, Delhi Police HCM, typing tutor, GK practice" />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_BASE_URL || 'https://studygkhub.com'}/questions/${item.slug}`} />
        <meta property="og:title" content={item.question_english || item.question_hindi} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary" />
      </Head>

      <h1>{item.question_english || item.question_hindi}</h1>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify((() => {
        const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://studygkhub.com';
        const article = {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: item.question_english || item.question_hindi || '',
          description: (item.solution || '').slice(0,160) || '',
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `${base}/questions/${item.slug}`
          },
          datePublished: item.createdAt || undefined,
          author: { "@type": "Organization", name: "StudyGK" },
          publisher: { "@type": "Organization", name: "StudyGK Hub", url: base, logo: { "@type": "ImageObject", url: `${base}/logo.png` } }
        };

        // BreadcrumbList for better indexing/navigation
        const bread = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: base + '/' },
            { "@type": "ListItem", position: 2, name: "Questions", item: base + '/questions' }
          ]
        };
        // add category as third breadcrumb if available
        if (item.category) {
          bread.itemListElement.push({ "@type": "ListItem", position: 3, name: item.category, item: `${base}/?category=${encodeURIComponent(item.category)}` });
          bread.itemListElement.push({ "@type": "ListItem", position: 4, name: (item.question_english || item.question_hindi || '').slice(0,60), item: `${base}/questions/${item.slug}` });
        } else {
          bread.itemListElement.push({ "@type": "ListItem", position: 3, name: (item.question_english || item.question_hindi || '').slice(0,60), item: `${base}/questions/${item.slug}` });
        }

        return { article, breadcrumb: bread };
      })()) }} />
      <div style={{ marginTop: 12 }}>
        <ul>
          {['options_1_english','options_2_english','options_3_english','options_4_english'].map((k) => (
            item[k] ? <li key={k} style={{ marginTop: 6 }}>{item[k]}</li> : null
          ))}
        </ul>
      </div>

      <div style={{ marginTop: 12 }}>
        <strong>Answer:</strong> {item.answer}
      </div>

      {item.solution && (
        <div style={{ marginTop: 12, background: '#f8f8f8', padding: 12, borderRadius: 6 }}>
          <div dangerouslySetInnerHTML={{ __html: item.solution }} />
        </div>
      )}

      {/* Typing practice CTA removed to avoid duplication; use the dedicated Typing Tutor page */}
    </div>
  );
}

export async function getServerSideProps(context) {
  const { slug } = context.params;
  const item = await Question.findBySlug(slug);
  if (!item) return { props: { item: null } };
  // increment hits (non-blocking)
  Question.incrementHits(item.id).catch(() => {});
  // serialize dates
  if (item.createdAt) item.createdAt = new Date(item.createdAt).toISOString();
  return { props: { item } };
}
