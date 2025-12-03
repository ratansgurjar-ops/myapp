import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';

const { verifyAdminSession } = require('../../../lib/adminAuth');

export default function AdminDashboard({ initialLoggedIn = false }){
  const [status, setStatus] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [registerStatus, setRegisterStatus] = useState('');
  const [loggedIn, setLoggedIn] = useState(true);
  const [adminName, setAdminName] = useState('');
  const [selectedSection, setSelectedSection] = useState('dashboard');

  const [questions, setQuestions] = useState([]);
  const [newsList, setNewsList] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [visitsStats, setVisitsStats] = useState(null);
  const [visitFrom, setVisitFrom] = useState('');
  const [visitTo, setVisitTo] = useState('');
  const [visitItems, setVisitItems] = useState([]);

  // Upload / manual question state
  const [uploadMode, setUploadMode] = useState('bulk');
  const [manualQuestion, setManualQuestion] = useState({
    category: '', chapter_name: '', question_english: '', question_hindi: '',
    optionA_en: '', optionB_en: '', optionC_en: '', optionD_en: '',
    optionA_hi: '', optionB_hi: '', optionC_hi: '', optionD_hi: '',
    correct_answer: 'A', explanation_en: '', explanation_hi: ''
  });

  async function saveManualQuestion(ev){
    ev && ev.preventDefault();
    try{
      const mapped = {
        question_english: manualQuestion.question_english,
        question_hindi: manualQuestion.question_hindi,
        options_1_english: manualQuestion.optionA_en,
        options_2_english: manualQuestion.optionB_en,
        options_3_english: manualQuestion.optionC_en,
        options_4_english: manualQuestion.optionD_en,
        options_1_hindi: manualQuestion.optionA_hi,
        options_2_hindi: manualQuestion.optionB_hi,
        options_3_hindi: manualQuestion.optionC_hi,
        options_4_hindi: manualQuestion.optionD_hi,
        answer: manualQuestion.correct_answer,
        category: manualQuestion.category,
        chapter_name: manualQuestion.chapter_name,
        solution: manualQuestion.explanation_en || manualQuestion.explanation_hi || null
      };
      await fetch('/api/questions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(mapped), credentials: 'same-origin' });
      setStatus('Question saved');
      setManualQuestion({ category: '', chapter_name: '', question_english: '', question_hindi: '', optionA_en: '', optionB_en: '', optionC_en: '', optionD_en: '', optionA_hi: '', optionB_hi: '', optionC_hi: '', optionD_hi: '', correct_answer: 'A', explanation_en: '', explanation_hi: '' });
      refreshAll();
    }catch(e){ setStatus('Save failed'); }
  }

  // question UI state
  const [qSearch, setQSearch] = useState('');
  const [qPage, setQPage] = useState(1);
  const Q_PAGE_SIZE = 20;
  const [questionLangs, setQuestionLangs] = useState({});
  const [editingRowId, setEditingRowId] = useState(null);
  const [editRowData, setEditRowData] = useState({});
  const [filterCategory, setFilterCategory] = useState('');
  const [filterChapter, setFilterChapter] = useState('');
  const [newsForm, setNewsForm] = useState({ title: '', content: '', type: 'news', link: '', image: '', tags: '', active: 1 });
  const [editingNewsId, setEditingNewsId] = useState(null);

  function setQuestionLang(id, lang) {
    setQuestionLangs(prev => ({ ...prev, [id]: lang }));
  }

  useEffect(() => {
    const n = typeof window !== 'undefined' ? (localStorage.getItem('admin_name') || '') : '';
    if (n) setAdminName(n);
    refreshAll();
  }, []);

  function selectSection(section){
    setSelectedSection(section);
    if(section === 'questions') setQPage(1);
    refreshAll();
  }

  async function refreshAll() {
    try {
      setStatus('Loading...');
      const headers = { 'Accept': 'application/json' };
      const [qRes, nRes, fRes, vRes] = await Promise.all([
        fetch('/api/questions?page=1&limit=10000', { headers, credentials: 'same-origin' }), fetch('/api/news?page=1&limit=10000', { headers, credentials: 'same-origin' }), fetch('/api/feedbacks?unresolved=1', { headers, credentials: 'same-origin' }), fetch('/api/visits', { headers, credentials: 'same-origin' })
      ]);

      // if any endpoint returned 401, user is not authenticated
      if (qRes.status === 401 || nRes.status === 401 || fRes.status === 401) {
        setLoggedIn(false);
        setStatus('Not authenticated');
        setQuestions([]);
        setNewsList([]);
        setFeedbacks([]);
        return;
      }

      if (!qRes.ok || !nRes.ok || !fRes.ok) {
        setStatus('DB/API unavailable — please check DB/API');
        setQuestions([]);
        setNewsList([]);
        setFeedbacks([]);
        return;
      }

      const qjson = await qRes.json().catch(() => []);
      const njson = await nRes.json().catch(() => []);
      const f = await fRes.json().catch(() => []);
      const v = await vRes.json().catch(() => null);
      const q = Array.isArray(qjson) ? qjson : (Array.isArray(qjson.items) ? qjson.items : []);
      setQuestions(q);
      const nitems = Array.isArray(njson) ? njson : (Array.isArray(njson.items) ? njson.items : []);
      setNewsList(nitems);
      setFeedbacks(Array.isArray(f) ? f : (Array.isArray(f.items) ? f.items : []));
      if (v) setVisitsStats(v);
      setStatus('Loaded');
      setLoggedIn(true);
    } catch (e) {
      setStatus('Network error — failed to load data');
      setQuestions([]);
      setNewsList([]);
      setFeedbacks([]);
    }
  }

  async function fetchVisits(opts){
    try{
      const headers = { 'Accept': 'application/json' };
      let url = '/api/visits';
      if(opts && (opts.range || opts.from || opts.to)){
        const params = [];
        if(opts.range) params.push(`range=${encodeURIComponent(opts.range)}`);
        if(opts.from) params.push(`from=${encodeURIComponent(opts.from)}`);
        if(opts.to) params.push(`to=${encodeURIComponent(opts.to)}`);
        url += '?' + params.join('&');
      }
      const res = await fetch(url, { headers, credentials: 'same-origin' });
      if(!res.ok) { setStatus('Visits fetch failed'); return; }
      const j = await res.json();
      setVisitsStats({ total: j.total, last24: j.last24 });
      setVisitItems(Array.isArray(j.items) ? j.items : []);
      setStatus('Visits loaded');
    }catch(e){ setStatus('Visits fetch error'); }
  }

  async function login(ev) {
    ev.preventDefault();
    setStatus('Logging in...');
    const email = ev.target.email.value;
    const password = ev.target.password.value;
    try {
      const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }), credentials: 'same-origin' });
      // Try to read the response as text first so we can gracefully handle HTML/error pages
      const raw = await res.text();
      let j = null;
      try {
        j = raw ? JSON.parse(raw) : null;
      } catch (parseErr) {
        // response was not JSON (likely an HTML error page). Log and surface a friendly message.
        console.warn('admin.login: response not JSON', { status: res.status, statusText: res.statusText, bodyPreview: raw && raw.slice(0,200) });
        if (!res.ok) {
          setStatus(`Login failed: ${res.status} ${res.statusText}`);
          return;
        }
        setStatus('Login failed: unexpected server response');
        return;
      }

      if (!res.ok) {
        setStatus(j && j.error ? j.error : `Login failed: ${res.status} ${res.statusText}`);
        return;
      }

      if (j && j.ok) {
        setLoggedIn(true);
        setStatus('Logged in');
        refreshAll();
      } else {
        setStatus(j && j.error ? j.error : 'Login failed');
      }
    } catch (err) {
      console.error('login error', err);
      setStatus('Network error — login failed');
    }
  }

  // Forgot / Reset password UI state and handlers
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStatus, setForgotStatus] = useState('');
  const [forgotToken, setForgotToken] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [resetStatus, setResetStatus] = useState('');
  // Security question verification before allowing reset
  const [showResetVerify, setShowResetVerify] = useState(false);
  const [secAnswer, setSecAnswer] = useState('');
  const [secVerifyStatus, setSecVerifyStatus] = useState('');

  async function sendForgot(ev){
    ev && ev.preventDefault && ev.preventDefault();
    const form = ev && ev.target ? ev.target : null;
    const email = form ? (form.email && form.email.value) : '';
    const securityAnswer = form ? (form.securityAnswer && form.securityAnswer.value) : '';
    if(!email) { setForgotStatus('Email required'); return; }
    setForgotStatus('Requesting reset...');
    try{
      const res = await fetch('/api/admin/forgot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, securityAnswer }), credentials: 'same-origin' });
      const j = await res.json().catch(()=>null);
      if(!res.ok) return setForgotStatus(j && j.error ? j.error : `Failed: ${res.status}`);
      setForgotStatus(j && j.message ? j.message : 'If account exists, reset requested');
      if(j && j.token) setForgotToken(j.token);
    }catch(e){ console.error('forgot error', e); setForgotStatus('Network error'); }
  }

  async function doReset(ev){
    ev && ev.preventDefault && ev.preventDefault();
    const form = ev && ev.target ? ev.target : null;
    const token = form ? (form.token && form.token.value) : '';
    const password = form ? (form.password && form.password.value) : '';
    if(!token || !password) { setResetStatus('Token and new password required'); return; }
    setResetStatus('Resetting...');
    try{
      const res = await fetch('/api/admin/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }), credentials: 'same-origin' });
      const j = await res.json().catch(()=>null);
      if(!res.ok) return setResetStatus(j && j.error ? j.error : `Failed: ${res.status}`);
      setResetStatus(j && j.message ? j.message : 'Password updated');
      // after reset, hide reset form so admin can login
      setShowReset(false);
    }catch(e){ console.error('reset error', e); setResetStatus('Network error'); }
  }

  async function logout() {
    try {
      const res = await fetch('/api/admin/logout', { method: 'POST', credentials: 'same-origin' });
      if (res && res.ok) {
        try { localStorage.removeItem('admin_name'); } catch (e) {}
        setLoggedIn(false);
        setStatus('Logged out');
        // redirect to login page so server-side auth also applies
        if (typeof window !== 'undefined') window.location.href = '/ad81188/admin/login';
        return;
      }
    } catch (e) { /* ignore */ }
    try { localStorage.removeItem('admin_name'); } catch (e) {}
    setLoggedIn(false); setStatus('Logged out');
  }

  const filtered = questions.filter(q => {
    if (!q) return false;
    if (!qSearch) return true;
    const hay = `${q.question_english || ''} ${q.question_hindi || ''} ${q.options_1_english||''} ${q.options_2_english||''} ${q.options_3_english||''} ${q.options_4_english||''} ${q.options_1_hindi||''} ${q.options_2_hindi||''} ${q.options_3_hindi||''} ${q.options_4_hindi||''} ${q.solution||''}`;
    if (filterCategory && String(q.category||'') !== String(filterCategory)) return false;
    if (filterChapter && String(q.chapter_name||'') !== String(filterChapter)) return false;
    return hay.toLowerCase().includes(qSearch.toLowerCase());
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / Q_PAGE_SIZE));
  const pageItems = filtered.slice((qPage-1)*Q_PAGE_SIZE, qPage*Q_PAGE_SIZE);

  async function deleteQuestion(q){
    if(!confirm(`Delete this question?\nEN: ${q.question_english || ''}\nHI: ${q.question_hindi || ''}`)) return;
    await fetch(`/api/questions/${q.id}`, { method:'DELETE', credentials: 'same-origin' });
    refreshAll();
  }

  function normalizeRow(it){
    const keys = Object.keys(it||{});
    const hasExpected = keys.some(k => k.startsWith('options_1_english') || k === 'question_english');
    if(hasExpected) return it;
    return {
      question_english: it.question_english || it.question || it['Question (English)'] || it['question_en'] || it['question'],
      question_hindi: it.question_hindi || it['question_hi'] || it['Question (Hindi)'],
      options_1_english: it.options_1_english || it.optionA_en || it.option1_en || it['A_en'] || it['optionA_en'],
      options_2_english: it.options_2_english || it.optionB_en || it.option2_en || it['B_en'] || it['optionB_en'],
      options_3_english: it.options_3_english || it.optionC_en || it.option3_en || it['C_en'] || it['optionC_en'],
      options_4_english: it.options_4_english || it.optionD_en || it.option4_en || it['D_en'] || it['optionD_en'],
      options_1_hindi: it.options_1_hindi || it.optionA_hi || it.option1_hi || it['A_hi'],
      options_2_hindi: it.options_2_hindi || it.optionB_hi || it.option2_hi || it['B_hi'],
      options_3_hindi: it.options_3_hindi || it.optionC_hi || it.option3_hi || it['C_hi'],
      options_4_hindi: it.options_4_hindi || it.optionD_hi || it.option4_hi || it['D_hi'],
      answer: it.answer || it.correct_answer || it.correct || it.Answer,
      category: it.category || it.Category,
      chapter_name: it.chapter_name || it.chapter || it.Chapter,
      solution: it.solution || it.explanation || it.solution_en || it.analysis
    };
  }

  async function handleBulkFile(e){
    const file = e.target.files && e.target.files[0]; if(!file) return;
    Papa.parse(file,{header:true,complete: async (res)=>{
      try{
        const rows = (res.data || []).map(normalizeRow);
        const r = await fetch('/api/questions/bulk',{method:'POST',headers:{'Content-Type':'application/json'}, body:JSON.stringify(rows), credentials: 'same-origin'});
        const j = await r.json().catch(()=>null);
        if (!r.ok) {
          setStatus(j && j.error ? `Bulk failed: ${j.error}` : `Bulk failed: ${r.status}`);
          return;
        }
        if (j && j.inserted !== undefined) setStatus(`Bulk uploaded: ${j.inserted} inserted`);
        else setStatus('Bulk uploaded');
        refreshAll();
      }catch(err){ console.error(err); setStatus('Bulk failed'); }
    }});
  }

  function exportQuestionsCSV(){
    const headers = ['question_english','question_hindi','options_1_english','options_2_english','options_3_english','options_4_english','options_1_hindi','options_2_hindi','options_3_hindi','options_4_hindi','answer','category','chapter_name','solution'];
    const rows = questions.map(q => headers.reduce((acc,h)=>{ acc[h]=q[h]||''; return acc; }, {}));
    const csv = Papa.unparse(rows, { columns: headers });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'questions_export.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  async function resolveFeedback(id, resolve){ await fetch(`/api/feedbacks/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({resolved: resolve, resolvedBy: adminName || 'admin'}), credentials: 'same-origin'}); refreshAll(); }

  return (
    <div style={{display:'flex',gap:20,padding:20}}>
      <aside style={{width:240}}>
        <div style={{display:'flex',gap:8,marginBottom:12}}>
          <button onClick={logout} style={{padding:'8px 12px'}}>Logout</button>
          <div style={{marginLeft:'auto'}}>
            <input placeholder="Admin name" value={adminName} onChange={e=>setAdminName(e.target.value)} style={{padding:6,width:140}} />
            <div><button onClick={()=>{localStorage.setItem('admin_name', adminName||''); setStatus('Saved name');}} style={{width:'100%',marginTop:6}}>Save</button></div>
          </div>
        </div>
        <nav style={{display:'flex',flexDirection:'column',gap:8}}>
          <button onClick={()=>selectSection('dashboard')} style={{padding:'12px',textAlign:'left'}}>Dashboard</button>
          <button onClick={()=>selectSection('questions')} style={{padding:'12px',textAlign:'left'}}>Questions</button>
          <button onClick={()=>selectSection('hits')} style={{padding:'12px',textAlign:'left'}}>Hits</button>
          <button onClick={()=>selectSection('news')} style={{padding:'12px',textAlign:'left'}}>News / Ads</button>
          <button onClick={()=>selectSection('feedbacks')} style={{padding:'12px',textAlign:'left'}}>Reviews</button>
          <button onClick={()=>selectSection('upload')} style={{padding:'12px',textAlign:'left'}}>Question Create</button>
          <a href="/ad81188/admin/typing-tutor"><button style={{padding:'12px',textAlign:'left'}}>Typing Tutor (Admin)</button></a>
        </nav>
      </aside>

      <main style={{flex:1}}>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginBottom:10}}>
          <button onClick={() => exportQuestionsCSV()} style={{padding:'6px 10px'}}>Download CSV</button>
        </div>
        {selectedSection === 'dashboard' && (
          <div>
            <h3>Dashboard</h3>
            <div style={{display:'flex',gap:12}}>
              <div style={{flex:1,border:'1px solid #eee',padding:12}}><div style={{color:'#666'}}>Questions</div><div style={{fontSize:22}}>{questions.length}</div></div>
              <div style={{flex:1,border:'1px solid #eee',padding:12}}><div style={{color:'#666'}}>News</div><div style={{fontSize:22}}>{newsList.length}</div></div>
              <div style={{flex:1,border:'1px solid #eee',padding:12}}><div style={{color:'#666'}}>Reviews (unresolved)</div><div style={{fontSize:22}}>{feedbacks.length}</div></div>
            </div>
            <div style={{marginTop:12}}>
              <h4>Visits</h4>
              <div style={{display:'flex',gap:12}}>
                <div style={{border:'1px solid #eee',padding:12}}><div style={{color:'#666'}}>Total</div><div style={{fontSize:20}}>{visitsStats ? visitsStats.total : '—'}</div></div>
                <div style={{border:'1px solid #eee',padding:12}}><div style={{color:'#666'}}>Last 24h</div><div style={{fontSize:20}}>{visitsStats ? visitsStats.last24 : '—'}</div></div>
              </div>
              {visitItems && visitItems.length>0 && (
                <div style={{marginTop:8,border:'1px solid #eee',borderRadius:6,overflow:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse'}}>
                    <thead style={{background:'#fafafa',fontWeight:600}}>
                      <tr><th style={{padding:8}}>Date</th><th style={{padding:8}}>Count</th></tr>
                    </thead>
                    <tbody>
                      {visitItems.map(it=> (
                        <tr key={it.dt} style={{borderTop:'1px solid #f7f7f7'}}><td style={{padding:8}}>{it.dt}</td><td style={{padding:8}}>{it.cnt}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedSection === 'hits' && (
          <div>
            <h3>Hits</h3>
            <div style={{display:'flex',gap:8,marginBottom:12}}>
              <div style={{flex:1}}>
                <button onClick={()=>fetchVisits()} style={{padding:'8px 12px',marginRight:8}}>Total</button>
                <button onClick={()=>fetchVisits({ range: '7days' })} style={{padding:'8px 12px',marginRight:8}}>Last 7 days</button>
                <button onClick={()=>fetchVisits({ range: 'month' })} style={{padding:'8px 12px',marginRight:8}}>This month</button>
                <button onClick={()=>fetchVisits({ range: 'year' })} style={{padding:'8px 12px'}}>This year</button>
              </div>
            </div>
            <div style={{display:'flex',gap:8,marginBottom:8}}>
              <input type="date" value={visitFrom||''} onChange={e=>setVisitFrom(e.target.value)} style={{padding:6}} />
              <input type="date" value={visitTo||''} onChange={e=>setVisitTo(e.target.value)} style={{padding:6}} />
              <button onClick={()=>fetchVisits({ from: visitFrom, to: visitTo })} style={{padding:'8px 12px'}}>Apply</button>
            </div>

            <div style={{display:'flex',gap:12}}>
              <div style={{border:'1px solid #eee',padding:12}}><div style={{color:'#666'}}>Total</div><div style={{fontSize:20}}>{visitsStats ? visitsStats.total : '—'}</div></div>
              <div style={{border:'1px solid #eee',padding:12}}><div style={{color:'#666'}}>Last 24h</div><div style={{fontSize:20}}>{visitsStats ? visitsStats.last24 : '—'}</div></div>
            </div>

            {visitItems && visitItems.length>0 && (
              <div style={{marginTop:12,border:'1px solid #eee',borderRadius:6,overflow:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead style={{background:'#fafafa',fontWeight:600}}>
                    <tr><th style={{padding:8}}>Date</th><th style={{padding:8}}>Count</th></tr>
                  </thead>
                  <tbody>
                    {visitItems.map(it=> (
                      <tr key={it.dt} style={{borderTop:'1px solid #f7f7f7'}}><td style={{padding:8}}>{it.dt}</td><td style={{padding:8}}>{it.cnt}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {selectedSection === 'questions' && (
          <div>
            <h3>Questions</h3>
            <div style={{display:'flex',gap:8,marginBottom:8,alignItems:'center'}}>
              <input placeholder="Search (question/options/solution)" value={qSearch} onChange={e=>{setQSearch(e.target.value);}} style={{padding:6,flex:1}} />
              <button onClick={()=>setQPage(1)} style={{padding:'6px 8px',fontSize:12}}>Search</button>
              <select value={filterCategory} onChange={e=>{setFilterCategory(e.target.value); setQPage(1);}} style={{padding:6,fontSize:12}}>
                <option value="">All Categories</option>
                {Array.from(new Set(questions.map(x=>x.category).filter(Boolean))).map(c=> <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={filterChapter} onChange={e=>{setFilterChapter(e.target.value); setQPage(1);}} style={{padding:6,fontSize:12}}>
                <option value="">All Chapters</option>
                {Array.from(new Set(questions.map(x=>x.chapter_name).filter(Boolean))).map(c=> <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div style={{border:'1px solid #eee',borderRadius:6,overflow:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead style={{background:'#fafafa',fontWeight:600}}>
                  <tr>
                    <th style={{padding:8,borderBottom:'1px solid #f1f1f1',textAlign:'left',width:60}}>SL</th>
                    <th style={{padding:8,borderBottom:'1px solid #f1f1f1',textAlign:'left',width:'45%'}}>question</th>
                    <th style={{padding:8,borderBottom:'1px solid #f1f1f1',textAlign:'left'}}>options_1</th>
                    <th style={{padding:8,borderBottom:'1px solid #f1f1f1',textAlign:'left'}}>options_2</th>
                    <th style={{padding:8,borderBottom:'1px solid #f1f1f1',textAlign:'left'}}>options_3</th>
                    <th style={{padding:8,borderBottom:'1px solid #f1f1f1',textAlign:'left'}}>options_4</th>
                    <th style={{padding:8,borderBottom:'1px solid #f1f1f1',textAlign:'left'}}>answer</th>
                    <th style={{padding:8,borderBottom:'1px solid #f1f1f1',textAlign:'left'}}>flags</th>
                    <th style={{padding:8,borderBottom:'1px solid #f1f1f1',textAlign:'left'}}>category</th>
                    <th style={{padding:8,borderBottom:'1px solid #f1f1f1',textAlign:'left'}}>chapter_name</th>
                    <th style={{padding:8,borderBottom:'1px solid #f1f1f1',textAlign:'left'}}>solution</th>
                    <th style={{padding:8,borderBottom:'1px solid #f1f1f1',textAlign:'left'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((q, idx) => {
                    const overallIndex = (qPage - 1) * Q_PAGE_SIZE + idx;
                    const serial = Math.max(1, filtered.length - overallIndex);
                    const lang = (questionLangs[q.id] === 'hi') ? 'hindi' : 'english';
                    const questionText = (questionLangs[q.id] === 'hi') ? (q.question_hindi || q.question_english) : (q.question_english || q.question_hindi);
                    const isEditing = editingRowId === q.id;
                    return (
                      <tr key={q.id} style={{borderTop:'1px solid #f7f7f7'}}>
                        <td style={{padding:8,verticalAlign:'top',textAlign:'left'}}>{serial}</td>
                        <td style={{padding:8,verticalAlign:'top',minWidth:320}}>
                          <div style={{display:'flex',alignItems:'flex-start',gap:8}}>
                            <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start'}}>
                              <span onClick={() => setQuestionLang(q.id, 'en')} style={{cursor:'pointer',fontSize:12,color:(questionLangs[q.id]||'en')==='en' ? '#222' : '#666',marginBottom:2}}>EN</span>
                              <span onClick={() => setQuestionLang(q.id, 'hi')} style={{cursor:'pointer',fontSize:12,color:(questionLangs[q.id]||'en')==='hi' ? '#222' : '#666'}}>HI</span>
                            </div>
                            <div style={{flex:1}}>
                              {isEditing ? (
                                <div>
                                  <textarea value={editRowData.question_english || ''} onChange={e=>setEditRowData(prev=>({...prev, question_english: e.target.value}))} style={{width:'100%',marginBottom:6,resize:'both'}} />
                                  <textarea value={editRowData.question_hindi || ''} onChange={e=>setEditRowData(prev=>({...prev, question_hindi: e.target.value}))} style={{width:'100%',resize:'both'}} />
                                </div>
                              ) : (
                                <div>{questionText}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{padding:8,verticalAlign:'top'}}>
                          {isEditing ? (
                            <div>
                              <div style={{fontSize:11,fontWeight:600,marginBottom:4}}>EN</div>
                              <textarea value={editRowData.options_1_english||''} onChange={e=>setEditRowData(prev=>({...prev, options_1_english: e.target.value}))} style={{width:200,resize:'both',marginBottom:6}} />
                              <div style={{fontSize:11,fontWeight:600,marginBottom:4}}>HI</div>
                              <textarea value={editRowData.options_1_hindi||''} onChange={e=>setEditRowData(prev=>({...prev, options_1_hindi: e.target.value}))} style={{width:200,resize:'both'}} />
                            </div>
                          ) : (
                            (q[`options_1_${lang}`] || '')
                          )}
                        </td>
                        <td style={{padding:8,verticalAlign:'top'}}>
                          {isEditing ? (
                            <div>
                              <div style={{fontSize:11,fontWeight:600,marginBottom:4}}>EN</div>
                              <textarea value={editRowData.options_2_english||''} onChange={e=>setEditRowData(prev=>({...prev, options_2_english: e.target.value}))} style={{width:200,resize:'both',marginBottom:6}} />
                              <div style={{fontSize:11,fontWeight:600,marginBottom:4}}>HI</div>
                              <textarea value={editRowData.options_2_hindi||''} onChange={e=>setEditRowData(prev=>({...prev, options_2_hindi: e.target.value}))} style={{width:200,resize:'both'}} />
                            </div>
                          ) : (
                            (q[`options_2_${lang}`] || '')
                          )}
                        </td>
                        <td style={{padding:8,verticalAlign:'top'}}>
                          {isEditing ? (
                            <div>
                              <div style={{fontSize:11,fontWeight:600,marginBottom:4}}>EN</div>
                              <textarea value={editRowData.options_3_english||''} onChange={e=>setEditRowData(prev=>({...prev, options_3_english: e.target.value}))} style={{width:200,resize:'both',marginBottom:6}} />
                              <div style={{fontSize:11,fontWeight:600,marginBottom:4}}>HI</div>
                              <textarea value={editRowData.options_3_hindi||''} onChange={e=>setEditRowData(prev=>({...prev, options_3_hindi: e.target.value}))} style={{width:200,resize:'both'}} />
                            </div>
                          ) : (
                            (q[`options_3_${lang}`] || '')
                          )}
                        </td>
                        <td style={{padding:8,verticalAlign:'top'}}>
                          {isEditing ? (
                            <div>
                              <div style={{fontSize:11,fontWeight:600,marginBottom:4}}>EN</div>
                              <textarea value={editRowData.options_4_english||''} onChange={e=>setEditRowData(prev=>({...prev, options_4_english: e.target.value}))} style={{width:200,resize:'both',marginBottom:6}} />
                              <div style={{fontSize:11,fontWeight:600,marginBottom:4}}>HI</div>
                              <textarea value={editRowData.options_4_hindi||''} onChange={e=>setEditRowData(prev=>({...prev, options_4_hindi: e.target.value}))} style={{width:200,resize:'both'}} />
                            </div>
                          ) : (
                            (q[`options_4_${lang}`] || '')
                          )}
                        </td>
                        <td style={{padding:8,verticalAlign:'top'}}>{isEditing ? <select value={editRowData.answer||''} onChange={e=>setEditRowData(prev=>({...prev, answer: e.target.value}))}><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option></select> : (q.answer || '')}</td>
                        <td style={{padding:8,verticalAlign:'top'}}>{isEditing ? <input value={editRowData.flags_count||0} disabled /> : (q.flags_count || 0)}</td>
                        <td style={{padding:8,verticalAlign:'top'}}>{isEditing ? <input value={editRowData.category||''} onChange={e=>setEditRowData(prev=>({...prev, category: e.target.value}))} /> : (q.category || '')}</td>
                        <td style={{padding:8,verticalAlign:'top'}}>{isEditing ? <input value={editRowData.chapter_name||''} onChange={e=>setEditRowData(prev=>({...prev, chapter_name: e.target.value}))} /> : (q.chapter_name || '')}</td>
                        <td style={{padding:8,verticalAlign:'top'}}>{isEditing ? <textarea value={editRowData.solution||''} onChange={e=>setEditRowData(prev=>({...prev, solution: e.target.value}))} style={{width:200,resize:'both'}} /> : (q.solution || '')}</td>
                        <td style={{padding:8,verticalAlign:'top'}}>
                          <div style={{display:'flex',gap:8}}>
                            {isEditing ? (
                              <>
                                <button onClick={async ()=>{
                                  try{
                                    await fetch(`/api/questions/${q.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editRowData), credentials: 'same-origin' });
                                    setEditingRowId(null); setEditRowData({}); refreshAll();
                                  }catch(err){ setStatus('Save failed'); }
                                }}>Save</button>
                                <button onClick={()=>{ setEditingRowId(null); setEditRowData({}); }}>Cancel</button>
                              </>
                            ) : (
                              <>
                                <button onClick={()=>{ setEditingRowId(q.id); setEditRowData({ question_english: q.question_english || '', question_hindi: q.question_hindi || '', options_1_english: q.options_1_english || q.options_1 || '', options_2_english: q.options_2_english || q.options_2 || '', options_3_english: q.options_3_english || q.options_3 || '', options_4_english: q.options_4_english || q.options_4 || '', options_1_hindi: q.options_1_hindi || '', options_2_hindi: q.options_2_hindi || '', options_3_hindi: q.options_3_hindi || '', options_4_hindi: q.options_4_hindi || '', answer: q.answer || '', category: q.category || '', chapter_name: q.chapter_name || '', solution: q.solution || '', flags_count: q.flags_count || 0 }); }}>Edit</button>
                                <button onClick={() => deleteQuestion(q)}>Delete</button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{display:'flex',justifyContent:'space-between',marginTop:8}}>
              <div>Page {qPage} / {totalPages}</div>
              <div>
                <button onClick={() => setQPage(p => Math.max(1, p - 1))}>Prev</button>
                <button onClick={() => setQPage(p => Math.min(totalPages, p + 1))}>Next</button>
              </div>
            </div>
          </div>
        )}

        {selectedSection === 'upload' && (
          <div>
            <h3>Question Create</h3>
            <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:12}}>
              <label style={{display:'flex',alignItems:'center',gap:6}}><input type="radio" checked={uploadMode==='bulk'} onChange={()=>setUploadMode('bulk')} /> Bulk (.csv)</label>
              <label style={{display:'flex',alignItems:'center',gap:6}}><input type="radio" checked={uploadMode==='manual'} onChange={()=>setUploadMode('manual')} /> Manual</label>
            </div>

            {uploadMode === 'bulk' && (
              <div>
                <input type="file" accept=".csv" onChange={handleBulkFile} />
                <div style={{color:'#666',marginTop:8}}>CSV header should map to question fields (category,chapter_name,question_english,question_hindi,optionA_en,optionB_en,optionC_en,optionD_en,optionA_hi,optionB_hi,optionC_hi,optionD_hi,correct_answer,explanation_en,explanation_hi)</div>
              </div>
            )}

            {uploadMode === 'manual' && (
              <form onSubmit={saveManualQuestion} style={{border:'1px solid #eee',padding:12,borderRadius:6}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  <input placeholder="Category" value={manualQuestion.category} onChange={e=>setManualQuestion({...manualQuestion, category: e.target.value})} />
                  <input placeholder="Chapter name" value={manualQuestion.chapter_name} onChange={e=>setManualQuestion({...manualQuestion, chapter_name: e.target.value})} />
                  <input placeholder="Question (English)" value={manualQuestion.question_english} onChange={e=>setManualQuestion({...manualQuestion, question_english: e.target.value})} required />
                  <input placeholder="Question (Hindi)" value={manualQuestion.question_hindi} onChange={e=>setManualQuestion({...manualQuestion, question_hindi: e.target.value})} />
                  <input placeholder="Option A (EN)" value={manualQuestion.optionA_en} onChange={e=>setManualQuestion({...manualQuestion, optionA_en: e.target.value})} />
                  <input placeholder="Option B (EN)" value={manualQuestion.optionB_en} onChange={e=>setManualQuestion({...manualQuestion, optionB_en: e.target.value})} />
                  <input placeholder="Option C (EN)" value={manualQuestion.optionC_en} onChange={e=>setManualQuestion({...manualQuestion, optionC_en: e.target.value})} />
                  <input placeholder="Option D (EN)" value={manualQuestion.optionD_en} onChange={e=>setManualQuestion({...manualQuestion, optionD_en: e.target.value})} />
                  <input placeholder="Option A (HI)" value={manualQuestion.optionA_hi} onChange={e=>setManualQuestion({...manualQuestion, optionA_hi: e.target.value})} />
                  <input placeholder="Option B (HI)" value={manualQuestion.optionB_hi} onChange={e=>setManualQuestion({...manualQuestion, optionB_hi: e.target.value})} />
                  <input placeholder="Option C (HI)" value={manualQuestion.optionC_hi} onChange={e=>setManualQuestion({...manualQuestion, optionC_hi: e.target.value})} />
                  <input placeholder="Option D (HI)" value={manualQuestion.optionD_hi} onChange={e=>setManualQuestion({...manualQuestion, optionD_hi: e.target.value})} />
                  <div style={{gridColumn:'1 / -1',display:'flex',gap:8,alignItems:'center'}}>
                    <label>Correct:</label>
                    <select value={manualQuestion.correct_answer} onChange={e=>setManualQuestion({...manualQuestion, correct_answer: e.target.value})}>
                      <option>A</option><option>B</option><option>C</option><option>D</option>
                    </select>
                    
                    <input placeholder="Explanation (EN)" value={manualQuestion.explanation_en} onChange={e=>setManualQuestion({...manualQuestion, explanation_en: e.target.value})} style={{flex:1}} />
                    <input placeholder="Explanation (HI)" value={manualQuestion.explanation_hi} onChange={e=>setManualQuestion({...manualQuestion, explanation_hi: e.target.value})} style={{flex:1}} />
                  </div>
                </div>
                <div style={{marginTop:8}}><button type="submit">Save Question</button></div>
              </form>
            )}
          </div>
        )}

        {selectedSection === 'news' && (
          <div>
            <h3>News / Ads</h3>

            <div style={{border:'1px solid #eee',padding:12,borderRadius:6,marginBottom:12}}>
              <form onSubmit={async (ev)=>{
                ev && ev.preventDefault();
                try{
                  const headers = { 'Content-Type': 'application/json' };
                  if (editingNewsId) {
                    await fetch(`/api/news/${editingNewsId}`, { method: 'PATCH', headers, body: JSON.stringify(newsForm), credentials: 'same-origin' });
                    setStatus('News updated');
                  } else {
                    await fetch('/api/news', { method: 'POST', headers, body: JSON.stringify(newsForm), credentials: 'same-origin' });
                    setStatus('News created');
                  }
                  setNewsForm({ title: '', content: '', type: 'news', link: '', image: '', tags: '', active: 1 });
                  setEditingNewsId(null);
                  refreshAll();
                }catch(err){ console.error(err); setStatus('Save failed'); }
              }}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  <input placeholder="Title" value={newsForm.title} onChange={e=>setNewsForm({...newsForm, title: e.target.value})} required />
                  <select value={newsForm.type} onChange={e=>setNewsForm({...newsForm, type: e.target.value})}><option value="news">News</option><option value="ad">Ad</option></select>
                  <input placeholder="Link (optional)" value={newsForm.link} onChange={e=>setNewsForm({...newsForm, link: e.target.value})} />
                  <input placeholder="Image URL (optional)" value={newsForm.image} onChange={e=>setNewsForm({...newsForm, image: e.target.value})} />
                  <input placeholder="Tags (comma separated)" value={newsForm.tags} onChange={e=>setNewsForm({...newsForm, tags: e.target.value})} />
                  <label style={{display:'flex',alignItems:'center',gap:8}}><input type="checkbox" checked={!!newsForm.active} onChange={e=>setNewsForm({...newsForm, active: e.target.checked ? 1 : 0})} /> Active</label>
                  <div style={{gridColumn:'1 / -1'}}>
                    <textarea placeholder="Content / description" value={newsForm.content} onChange={e=>setNewsForm({...newsForm, content: e.target.value})} style={{width:'100%',minHeight:80,resize:'vertical'}} />
                  </div>
                </div>
                <div style={{marginTop:8,display:'flex',gap:8}}>
                  <button type="submit">{editingNewsId ? 'Update' : 'Create'}</button>
                  {editingNewsId && <button type="button" onClick={()=>{ setEditingNewsId(null); setNewsForm({ title: '', content: '', type: 'news', link: '', image: '', tags: '', active: 1 }); }}>Cancel</button>}
                </div>
              </form>
            </div>

            <div style={{border:'1px solid #eee',borderRadius:6,overflow:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead style={{background:'#fafafa',fontWeight:600}}>
                  <tr>
                    <th style={{padding:8,borderBottom:'1px solid #f1f1f1',textAlign:'left',width:60}}>SL</th>
                    <th style={{padding:8,borderBottom:'1px solid #f1f1f1',textAlign:'left'}}>Title</th>
                    <th style={{padding:8,borderBottom:'1px solid #f1f1f1',textAlign:'left'}}>Type</th>
                    <th style={{padding:8,borderBottom:'1px solid #f1f1f1',textAlign:'left'}}>Created</th>
                    <th style={{padding:8,borderBottom:'1px solid #f1f1f1',textAlign:'left'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {newsList.map((n, i) => (
                    <tr key={n.id} style={{borderTop:'1px solid #f7f7f7'}}>
                      <td style={{padding:8}}>{newsList.length - i}</td>
                      <td style={{padding:8}}><div style={{fontWeight:600}}>{n.title}</div><div style={{fontSize:12,color:'#666'}}>{(n.content||'').slice(0,200)}{(n.content||'').length>200?'...':''}</div></td>
                      <td style={{padding:8}}>{n.type}</td>
                      <td style={{padding:8}}>{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</td>
                      <td style={{padding:8}}>
                        <div style={{display:'flex',gap:8,alignItems:'center'}}>
                          <button onClick={()=>{ setEditingNewsId(n.id); setNewsForm({ title: n.title||'', content: n.content||'', type: n.type||'news', link: n.link||'', image: n.image||'', tags: n.tags||'', active: n.active?1:0 }); }}>Edit</button>
                          <button onClick={async ()=>{ if(!confirm(`Delete news?\n${n.title || ''}`)) return; await fetch(`/api/news/${n.id}`, { method: 'DELETE', credentials: 'same-origin' }); refreshAll(); }}>Delete</button>
                          <button onClick={async ()=>{ try{ await fetch(`/api/news/${n.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ active: n.active ? 0 : 1 }), credentials: 'same-origin' }); refreshAll(); }catch(e){ setStatus('Toggle failed'); } }}>{n.active ? 'Active' : 'Inactive'}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedSection === 'feedbacks' && (
          <div>
            <h3>Reviews (Unresolved)</h3>
            <div style={{border:'1px solid #eee',borderRadius:6,overflow:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead style={{background:'#fafafa',fontWeight:600}}>
                  <tr>
                    <th style={{padding:8,borderBottom:'1px solid #f1f1f1',textAlign:'left',width:60}}>SL</th>
                    <th style={{padding:8,borderBottom:'1px solid #f1f1f1',textAlign:'left'}}>Review</th>
                    <th style={{padding:8,borderBottom:'1px solid #f1f1f1',textAlign:'left'}}>Q#</th>
                    <th style={{padding:8,borderBottom:'1px solid #f1f1f1',textAlign:'left'}}>Created</th>
                    <th style={{padding:8,borderBottom:'1px solid #f1f1f1',textAlign:'left'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbacks.map((f, i) => (
                    <tr key={f.id} style={{borderTop:'1px solid #f7f7f7'}}>
                      <td style={{padding:8}}>{feedbacks.length - i}</td>
                      <td style={{padding:8}}><div style={{fontSize:14}}>{f.content}</div></td>
                      <td style={{padding:8}}>{String((f.question_seq||f.question_id)||'').padStart(2,'0')}</td>
                      <td style={{padding:8}}>{f.createdAt ? new Date(f.createdAt).toLocaleString() : ''}</td>
                      <td style={{padding:8}}>
                        <div style={{display:'flex',gap:8}}>
                          <button onClick={()=>resolveFeedback(f.id,true)}>Resolve</button>
                          <button onClick={async ()=>{ if(!confirm('Delete review?')) return; await fetch(`/api/feedbacks/${f.id}`, { method: 'DELETE', credentials: 'same-origin' }); refreshAll(); }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{marginTop:12,color:'#666'}}><strong>Status:</strong> {status}</div>
      </main>
    </div>
  );
}

export async function getServerSideProps(context) {
  const admin = await verifyAdminSession(context.req);
  if (!admin) {
    return {
      redirect: {
        destination: '/ad81188/admin/login',
        permanent: false
      }
    };
  }
  return { props: { initialLoggedIn: true } };
}

