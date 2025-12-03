import React, { useState } from 'react';
import QuestionCard from './QuestionCard';

export default function QuestionList({ initial = [], total = 0, displayLang = null, selectedCategory = '', selectedChapter = '', searchQuery = '', disableLoadMore = false }) {
  const [items, setItems] = useState(initial);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    setLoading(true);
    const next = page + 1;
    const params = new URLSearchParams();
    params.set('q', searchQuery || '');
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedChapter) params.set('chapter', selectedChapter);
    // if filters are active, request random selection on subsequent pages as well
    if (selectedCategory || selectedChapter) params.set('random', '1');
    const res = await fetch(`/api/questions?${params.toString()}&page=${next}&limit=10`);
    const data = await res.json();
    setItems((s) => s.concat(data.items));
    setPage(next);
    setLoading(false);
  };

  return (
    <div>
      {items.map((it) => <QuestionCard key={it.id || it._id || it.slug} item={it} displayLang={displayLang} />)}
      {!disableLoadMore && items.length < total && (
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <button onClick={loadMore} disabled={loading}>{loading ? 'Loading...' : 'Load more'}</button>
        </div>
      )}
    </div>
  );
}
