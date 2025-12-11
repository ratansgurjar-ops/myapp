import React, { useState } from 'react';
import Head from 'next/head';
import QuestionList from '../components/QuestionList';
import NewsTicker from '../components/NewsTicker';
import FooterAd from '../components/FooterAd';

export default function Home({ questions, total, news, categories = [], chapters = [], initialQ = '', initialCategory = '', initialChapter = '', initialPage = 1, initialLimit = 10 }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || '');
  const [selectedChapter, setSelectedChapter] = useState(initialChapter || '');
  const [displayLang, setDisplayLang] = useState('both');

  // initialize search from server-side query and auto-clear after 5s
  React.useEffect(() => {
    if (initialQ) {
      setSearch(initialQ);
      const t = setTimeout(() => {
        setSearch('');
        try {
          // navigate to same page but remove `q` param so server returns full results
          const params = new URLSearchParams();
          if (initialCategory) params.set('category', initialCategory);
          if (initialChapter) params.set('chapter', initialChapter);
          if (initialPage) params.set('page', String(initialPage));
          const url = params.toString() ? `/?${params.toString()}` : '/';
          window.location.href = url;
        } catch (e) {
          // if window not available or navigation fails, just clear search
        }
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [initialQ]);

  return (
    <div style={{ padding: 0, fontFamily: 'Arial, sans-serif' }}>
      <Head>
        <title>Typing Practice for Stenographer, Clerk & Data Entry — HCM Exam Prep</title>
        <meta name="description" content="Typing practice and timed tests for Stenographer, Clerk, DEO, UDC/LDC and Railway/Bank HCM exams. Prepare for CRPF HCM, CISF HCM, Delhi Police HCM with realistic lessons." />
        <meta name="keywords" content="Stenographer typing practice, Clerk typing test, Data Entry Operator practice, CRPF HCM, CISF HCM, Delhi Police HCM, typing tutor" />
        <meta property="og:title" content="Typing Practice for Stenographer, Clerk & Data Entry — HCM Exam Prep" />
        <meta property="og:description" content="Free online typing tests & lessons tailored for Stenographer, Clerk, DEO and Railway/Bank HCM exams (CRPF/CISF/Delhi Police)." />
        {/* Short Hindi title/description for reference/search engines (optional) */}
        <meta name="title-hi" content="टाइपिंग प्रैक्टिस — Stenographer, Clerk, Data Entry (HCM परीक्षा तैयारी)" />
        <meta name="description-hi" content="Stenographer, Clerk, DEO, UDC/LDC और Railway/Bank HCM परीक्षाओं के लिए समयबद्ध टाइपिंग टेस्ट और अभ्यास। (CRPF HCM, CISF HCM, Delhi Police HCM)" />
      </Head>
      {/* SiteHeader is rendered globally in _app.js; avoid duplicating here */}

      <div className="container layout">
        {/* header intentionally removed to avoid duplicate GK/typing text; main content follows */}
        <main style={{ flex: 1 }}>
          <section style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
              <input placeholder="Search (question/options/solution)" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 260, padding: 6, borderRadius: 6, border: '1px solid #ddd' }} />
              <button onClick={() => {
                const params = new URLSearchParams();
                if (search) params.set('q', search);
                else if (initialQ) params.set('q', initialQ);
                if (selectedCategory) params.set('category', selectedCategory);
                else if (initialCategory) params.set('category', initialCategory);
                if (selectedChapter) params.set('chapter', selectedChapter);
                else if (initialChapter) params.set('chapter', initialChapter);
                params.set('page', '1');
                const url = `/?${params.toString()}`;
                window.location.href = url;
              }} style={{padding:'6px 8px',fontSize:12}}>Search</button>
              <select value={selectedCategory} onChange={e=>{
                const val = e.target.value;
                setSelectedCategory(val);
                const params = new URLSearchParams();
                if (search) params.set('q', search);
                else if (initialQ) params.set('q', initialQ);
                if (val) params.set('category', val);
                else if (initialCategory) {
                  // don't set category param when empty
                }
                if (selectedChapter) params.set('chapter', selectedChapter);
                else if (initialChapter) params.set('chapter', initialChapter);
                params.set('page', '1');
                const url = params.toString() ? `/?${params.toString()}` : '/';
                window.location.href = url;
              }} style={{padding:6,fontSize:12,marginLeft:8}}>
                <option value="">All Categories</option>
                {categories.map(c => (<option key={c} value={c}>{c}</option>))}
              </select>
              <select value={selectedChapter} onChange={e=>{
                const val = e.target.value;
                setSelectedChapter(val);
                const params = new URLSearchParams();
                if (search) params.set('q', search);
                else if (initialQ) params.set('q', initialQ);
                if (selectedCategory) params.set('category', selectedCategory);
                else if (initialCategory) params.set('category', initialCategory);
                if (val) params.set('chapter', val);
                params.set('page', '1');
                const url = params.toString() ? `/?${params.toString()}` : '/';
                window.location.href = url;
              }} style={{padding:6,fontSize:12}}>
                <option value="">All Chapters</option>
                {chapters.map(ch => (<option key={ch} value={ch}>{ch}</option>))}
              </select>
              <select value={displayLang} onChange={e=>setDisplayLang(e.target.value)} style={{marginLeft:'auto',padding:6,fontSize:12}}>
                <option value="both">Both</option>
                <option value="english">English</option>
                <option value="hindi">Hindi</option>
              </select>
            </div>

            <QuestionList initial={questions} total={total} displayLang={displayLang} selectedCategory={selectedCategory} selectedChapter={selectedChapter} searchQuery={search} disableLoadMore={true} />
            {/* Pagination controls */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12, gap: 8 }}>
              {(() => {
                const page = parseInt(initialPage || 1);
                const limit = parseInt(initialLimit || (page === 1 ? 10 : 5));
                // compute total pages with page1=10, others=5
                let totalPages = 1;
                if (total > 10) totalPages = 1 + Math.ceil((total - 10) / 5);
                const paramsBase = (p) => {
                  const params = new URLSearchParams();
                    const curQ = (search && search.length) ? search : initialQ;
                    const curCat = (selectedCategory && selectedCategory.length) ? selectedCategory : initialCategory;
                    const curCh = (selectedChapter && selectedChapter.length) ? selectedChapter : initialChapter;
                    if (curQ) params.set('q', curQ);
                    if (curCat) params.set('category', curCat);
                    if (curCh) params.set('chapter', curCh);
                  params.set('page', String(p));
                  return `/?${params.toString()}`;
                };
                // render up to 3 numeric page buttons and an ellipsis when more pages exist
                const visiblePages = [];
                if (totalPages <= 3) {
                  for (let i = 1; i <= totalPages; i++) visiblePages.push(i);
                } else {
                  if (page <= 2) {
                    visiblePages.push(1, 2, 3);
                  } else if (page >= totalPages - 1) {
                    visiblePages.push(totalPages - 2, totalPages - 1, totalPages);
                  } else {
                    visiblePages.push(page - 1, page, page + 1);
                  }
                }
                return (
                  <div className="pagination">
                    {visiblePages.map(pn => (
                      <button key={pn} onClick={() => { window.location.href = paramsBase(pn); }} className={pn === page ? 'current' : ''}>{pn}</button>
                    ))}
                    {totalPages > Math.max(...visiblePages) && (
                      <span className="ellipsis">...</span>
                    )}
                  </div>
                );
              })()}
            </div>
          </section>
        </main>

        <aside>
          {(news.filter(n => n.type === 'news' && n.active).length > 0) && (
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',margin:'0 0 8px'}}>
                <h3 style={{ margin: 0 }}>News</h3>
                { (news.filter(n => n.type === 'news' && n.active).length > 6) && <a href="/news?type=news" style={{fontSize:13}}>more...</a> }
              </div>
              <div style={{ border: '2px solid #000', borderRadius: 6, padding: 8, height: 240, overflow: 'auto' }}>
                {news.filter(n => n.type === 'news' && n.active).map(n => {
                  const raw = (n.content || '').replace(/<[^>]*>/g, '');
                  const previewLen = 120;
                  const showMore = raw.length > previewLen;
                  const preview = showMore ? raw.slice(0, previewLen) : raw;
                  const href = n.link && n.link.length ? n.link : (`/news/${n.slug}`);
                  return (
                    <div key={n.id || n.slug} style={{ padding: 8, borderBottom: '1px solid #f1f1f1' }}>
                      <div style={{ fontWeight: 600 }}><a href={href}>{n.title}</a></div>
                      <div style={{ fontSize: 13, color: '#666', display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', flex: 1 }}>{preview}{showMore ? '...' : ''}</div>
                        {showMore && <a href={href} style={{ fontSize: 13 }}>more</a>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(news.filter(n => n.type === 'ad' && n.active).length > 0) && (
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',margin:'0 0 8px'}}>
                <h3 style={{ margin: 0 }}>Advertisements</h3>
                { (news.filter(n => n.type === 'ad' && n.active).length > 6) && <a href="/news?type=ad" style={{fontSize:13}}>more...</a> }
              </div>
              <div style={{ border: '2px solid #000', borderRadius: 6, padding: 8, height: 240, overflow: 'auto' }}>
                {news.filter(n => n.type === 'ad' && n.active).map(n => {
                  const raw = (n.content || '').replace(/<[^>]*>/g, '');
                  const previewLen = 120;
                  const showMore = raw.length > previewLen;
                  const preview = showMore ? raw.slice(0, previewLen) : raw;
                  const href = n.link && n.link.length ? n.link : (`/advertisements/${n.slug}`);
                  return (
                    <div key={n.id || n.slug} style={{ padding: 8, borderBottom: '1px solid #f1f1f1' }}>
                      <div style={{ fontWeight: 600 }}><a href={href}>{n.title}</a></div>
                      <div style={{ fontSize: 13, color: '#666', display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', flex: 1 }}>{preview}{showMore ? '...' : ''}</div>
                        {showMore && <a href={href} style={{ fontSize: 13 }}>more</a>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
        <FooterAd />
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  const q = context.query.q || '';
  const category = context.query.category || '';
  const chapter = context.query.chapter || '';
  const pageNum = parseInt(context.query.page || '1');
  // first page shows 10, subsequent pages show 5
  const limit = pageNum <= 1 ? 10 : 5;
  let offset = 0;
  if (pageNum <= 1) offset = 0;
  else offset = 10 + (pageNum - 2) * 5;

  // Call models directly on the server to avoid making HTTP requests to our own API
  const Question = require('../models/question');
  const News = require('../models/news');
  const qd = await Question.findQuestions({ q, category, chapter, page: pageNum, limit, random: !!(category || chapter), offset }).catch(() => ({ items: [], total: 0 }));
  const nd = await News.findNews({ q, page: 1, limit: 50 }).catch(() => ({ items: [] }));

  // Convert Date objects (from mysql rows) to ISO strings so Next.js can serialize them
  const questions = (qd.items || []).map(i => ({
    ...i,
    createdAt: i.createdAt && i.createdAt.toISOString ? i.createdAt.toISOString() : (i.createdAt || null),
    updatedAt: i.updatedAt && i.updatedAt.toISOString ? i.updatedAt.toISOString() : (i.updatedAt || null)
  }));

  // ensure items have type default 'news' and serialize dates
  const news = (nd.items || []).map(n => ({
    type: n.type || 'news',
    ...n,
    createdAt: n.createdAt && n.createdAt.toISOString ? n.createdAt.toISOString() : (n.createdAt || null),
    updatedAt: n.updatedAt && n.updatedAt.toISOString ? n.updatedAt.toISOString() : (n.updatedAt || null)
  }));

  // fetch all available categories and chapters for filters
  let cats = [];
  let chaps = [];
  try {
    const meta = await Question.listCategoriesAndChapters();
    cats = meta.categories || [];
    chaps = meta.chapters || [];
  } catch (e) {
    // fallback: build from returned questions
    cats = Array.from(new Set(questions.map(i => i.category).filter(Boolean)));
    chaps = Array.from(new Set(questions.map(i => i.chapter_name).filter(Boolean)));
  }

  return { props: { questions, total: qd.total || 0, news, categories: cats, chapters: chaps, initialQ: q, initialCategory: category, initialChapter: chapter, initialPage: pageNum, initialLimit: limit } };
}
