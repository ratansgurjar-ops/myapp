import React, { useState } from 'react';
import QuestionList from '../components/QuestionList';
import NewsTicker from '../components/NewsTicker';

export default function Home({ questions, total, news, categories = [], initialQ = '', initialCategory = '', initialChapter = '', initialPage = 1, initialLimit = 10 }) {
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
      <header className="site-header">
        <div className="container header-inner">
          <div>
            <h1>StudyGK — General Knowledge MCQs</h1>
            <p className="lead">Welcome! Practice daily with curated MCQs and explanations.</p>
            <p className="sub">Exam से सम्बंधित news updates सबसे पहले — latest results, advertisements और important notifications भी यहाँ दिखेंगे।</p>
          </div>
        </div>
      </header>

      <div className="container layout">
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
              <select value={selectedCategory} onChange={e=>setSelectedCategory(e.target.value)} style={{padding:6,fontSize:12,marginLeft:8}}>
                <option value="">All Categories</option>
                {categories.map(c => (<option key={c} value={c}>{c}</option>))}
              </select>
              <select value={selectedChapter} onChange={e=>setSelectedChapter(e.target.value)} style={{padding:6,fontSize:12}}>
                <option value="">All Chapters</option>
                {Array.from(new Set(questions.map(i=>i.chapter_name).filter(Boolean))).map(ch => (<option key={ch} value={ch}>{ch}</option>))}
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
                return (
                  <>
                    <button onClick={() => { if (page > 1) window.location.href = paramsBase(page - 1); }} disabled={page <= 1}>Prev</button>
                    <div style={{ padding: '6px 12px', alignSelf: 'center' }}>Page {page} of {totalPages}</div>
                    <button onClick={() => { if (page < totalPages) window.location.href = paramsBase(page + 1); }} disabled={page >= totalPages}>Next</button>
                  </>
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
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://studygkhub.com';
  const q = context.query.q || '';
  const category = context.query.category || '';
  const chapter = context.query.chapter || '';
  const pageNum = parseInt(context.query.page || '1');
  // first page shows 10, subsequent pages show 5
  const limit = pageNum <= 1 ? 10 : 5;
  let offset = 0;
  if (pageNum <= 1) offset = 0;
  else offset = 10 + (pageNum - 2) * 5;
  // Use built-in fetch available in Node 18+ / Next.js server environment
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (category) params.set('category', category);
  if (chapter) params.set('chapter', chapter);
  params.set('page', String(pageNum)); params.set('limit', String(limit));
  // when filtering by category or chapter, return a random selection
  if (category || chapter) params.set('random', '1');
  // include offset so API can handle mixed page sizes
  params.set('offset', String(offset));
  const resQ = await fetch(`${base}/api/questions?${params.toString()}`);
  const newsParams = new URLSearchParams();
  if (q) newsParams.set('q', q);
  newsParams.set('page', '1'); newsParams.set('limit', '50');
  const resN = await fetch(`${base}/api/news?${newsParams.toString()}`);
  const qd = await resQ.json().catch(() => ({ items: [], total: 0 }));
  const nd = await resN.json().catch(() => ({ items: [] }));
  // ensure items have type default 'news'
  const news = (nd.items || []).map(n => ({ type: n.type || 'news', ...n }));
  // build categories from questions
  const cats = Array.from(new Set((qd.items || []).map(i => i.category).filter(Boolean)));
  return { props: { questions: qd.items || [], total: qd.total || 0, news, categories: cats, initialQ: q, initialCategory: category, initialChapter: chapter, initialPage: pageNum, initialLimit: limit } };
}
