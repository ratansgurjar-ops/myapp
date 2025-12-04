import React, { useState, useRef, useEffect } from 'react';

const TOKEN_REGEX = /(\s+|[A-Za-z0-9]+|[^\sA-Za-z0-9])/g;

const classifyTokenKind = (value) => {
  if (!value) return 'word';
  if (/^\s+$/.test(value)) return 'space';
  if (/^[A-Za-z0-9]+$/.test(value)) return 'word';
  return 'punct';
};

// Tokenize a string into token metadata (words, punctuation, whitespace) with indices.
const tokenizeWithIndices = (s) => {
  const res = [];
  if (!s) return res;
  let match;
  while ((match = TOKEN_REGEX.exec(s)) !== null) {
    const value = match[0];
    res.push({
      token: value,
      word: value,
      start: match.index,
      end: match.index + value.length,
      kind: classifyTokenKind(value)
    });
  }
  return res;
};

const cloneToken = (token) => ({ ...token });

// Align expected and typed tokens using edit distance.
const alignWords = (expectedTokens, typedTokens) => {
  const m = expectedTokens.length;
  const n = typedTokens.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (expectedTokens[i - 1].word === typedTokens[j - 1].word ? 0 : 1)
      );
    }
  }
  let i = m;
  let j = n;
  const ops = [];
  while (i > 0 || j > 0) {
    if (
      i > 0 &&
      j > 0 &&
      dp[i][j] === dp[i - 1][j - 1] + (expectedTokens[i - 1].word === typedTokens[j - 1].word ? 0 : 1)
    ) {
      if (expectedTokens[i - 1].word === typedTokens[j - 1].word) {
        ops.unshift({ type: 'eq', exp: expectedTokens[i - 1], got: typedTokens[j - 1], expIndex: i - 1, gotIndex: j - 1 });
      } else {
        ops.unshift({ type: 'sub', exp: expectedTokens[i - 1], got: typedTokens[j - 1], expIndex: i - 1, gotIndex: j - 1 });
      }
      i -= 1;
      j -= 1;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      ops.unshift({ type: 'del', exp: expectedTokens[i - 1], got: null, expIndex: i - 1, gotIndex: null });
      i -= 1;
    } else {
      ops.unshift({ type: 'ins', exp: null, got: typedTokens[j - 1], expIndex: null, gotIndex: j - 1 });
      j -= 1;
    }
  }
  while (ops.length && ops[ops.length - 1].type === 'del') {
    ops.pop();
  }
  return ops;
};

const escapeHtml = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const formatWhitespaceTokenHtml = (token) => {
  if (!token) return '';
  return token.split('').map((ch) => {
    if (ch === ' ') return '&middot;';
    if (ch === '\t') return '<span style="color:#666">⇥</span>';
    if (ch === '\n') return '<span style="color:#666">↵</span><br/>';
    return escapeHtml(ch);
  }).join('');
};

const formatTokenHtml = (token, kind, options = {}) => {
  const { exposeWhitespace = false } = options;
  if (kind === 'space') {
    if (!token) return '';
    if (exposeWhitespace) return formatWhitespaceTokenHtml(token);
    return token
      .replace(/ /g, '&nbsp;')
      .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
      .replace(/\n/g, '<br/>');
  }
  return escapeHtml(token || '');
};


export default function TypingTutor() {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isExisting, setIsExisting] = useState(false);
  const [sourceText, setSourceText] = useState('');
  // no hard-coded beginner lessons on home page — admin-shared and user-saved will be used
  const [lessonCategory, setLessonCategory] = useState('beginner'); // 'beginner' | 'practice'
  const [timeLimit, setTimeLimit] = useState(60); // seconds
  const [allowBackspace, setAllowBackspace] = useState(true);
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [typed, setTyped] = useState('');
  const [result, setResult] = useState(null);
  const [savedMsg, setSavedMsg] = useState('');
  const [title, setTitle] = useState('');
  const [exercises, setExercises] = useState([]);
  const [exerciseOwner, setExerciseOwner] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [shared, setShared] = useState({});
  const [selectedPractice, setSelectedPractice] = useState('');
  const [typingReady, setTypingReady] = useState(false);
  const [showSavedList, setShowSavedList] = useState(false);
  const textareaRef = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Load last-used username/displayName from localStorage (client-side only)
  useEffect(() => {
    try {
      const u = typeof window !== 'undefined' ? window.localStorage.getItem('typing_last_username') : null;
      const dn = typeof window !== 'undefined' ? window.localStorage.getItem('typing_last_displayName') : null;
      if (u) setUsername(u);
      if (dn) setDisplayName(dn);
    } catch (e) {
      // ignore
    }
    // ensure dropdown closed on mount
    setDropdownOpen(false);
  }, []);

  useEffect(() => {
    let t;
    if (running && timeLeft > 0) {
      t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    }
    if (running && timeLeft === 0) {
      finishTest();
    }
    return () => clearTimeout(t);
  }, [running, timeLeft]);

  const fetchUserExercises = async (u) => {
    if (!u) return setExercises([]);
    try {
      const res = await fetch('/api/typing/get?username=' + encodeURIComponent(u) + '&list=1');
      const j = await res.json();
      const items = j.items || [];
      setExercises(items);
      setExerciseOwner(u);
      // persist last-used username so it remains across refresh/close
      try { if (typeof window !== 'undefined' && u) window.localStorage.setItem('typing_last_username', u); } catch (e) {}
      return items;
    } catch (e) { setExercises([]); }
  };

  const deleteExercise = async (file) => {
    const owner = username;
    if (!owner) { setSavedMsg('Provide username to delete'); return; }
    // Only allow deleting when the exercises currently shown belong to the same username
    if (exerciseOwner !== owner) { setSavedMsg('Cannot delete: not the owner of the displayed list'); return; }
    if (!confirm('Delete this saved lesson?')) return;
    try {
      const res = await fetch('/api/typing/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: owner, file }) });
      const j = await res.json();
      if (j && j.ok) {
        setSavedMsg('Deleted');
        await fetchUserExercises(owner);
        // if currently loaded practice was the deleted one, clear it
        if (selectedPractice === `user:${file}`) {
          setSelectedPractice('');
          setSourceText('');
          setTypingReady(false);
        }
      } else {
        setSavedMsg(j && j.error ? j.error : 'Delete failed');
      }
    } catch (e) { setSavedMsg('Delete failed'); }
  };

  const buildCombinedList = () => {
    const list = [];
    if (shared && shared.text) list.push({ type: 'admin', id: 'admin', title: shared.title || 'Admin Shared', file: null });
    // user's exercises
    (exercises || []).forEach(it => {
      list.push({ type: 'user', id: it.file, title: it.title || '', file: it.file, savedAt: it.savedAt });
    });
    // manual create option last
    list.push({ type: 'manual', id: 'manual-create', title: 'Create Manual Exercise', file: null });
    return list;
  };

  const loadExerciseFile = async (file) => {
    if (!username || !file) return;
    const res = await fetch('/api/typing/get?username=' + encodeURIComponent(username) + '&file=' + encodeURIComponent(file));
    const j = await res.json();
    if (j && j.text) setSourceText(j.text);
    if (j && j.title) setTitle(j.title || '');
    // mark as loaded practice and open manual view
    setSelectedPractice(`user:${file}`);
    setShowPreview(true);
    setIsExisting(true);
    setTypingReady(true);
  };

  const handleSelectPractice = async (val) => {
    setSelectedPractice(val);
    if (!val) return;
    if (val === 'manual-create') {
      // open manual input
      setSourceText('');
      setTitle('');
      setShowPreview(true);
      setTypingReady(false);
      return;
    }
    if (val.startsWith('admin:')) {
      const id = val.split(':')[1];
      const list = (shared && shared[lessonCategory]) || [];
      const item = list.find(it => it.id === id);
      if (item) {
        setSourceText(item.text || '');
        setTitle(item.title || 'Admin Shared');
        setShowPreview(true);
        setTypingReady(true);
      }
      return;
    }
    // user:<file>
    if (val.startsWith('user:')) {
      if (!username) {
        setSavedMsg('Provide username to load selected user practice');
        return;
      }
      const file = val.slice(5);
      await loadExerciseFile(file);
      setShowPreview(true);
      setIsExisting(true);
    }
  };

  const fetchShared = async () => {
    try {
      const res = await fetch('/api/typing/shared');
      const j = await res.json();
      setShared(j || {});
    } catch (e) { setShared({}); }
  };

  const startTest = () => {
    if (!sourceText || !typingReady) {
      setSavedMsg('Practice text not loaded yet');
      return;
    }
    setResult(null);
    setTyped('');
    setTimeLeft(timeLimit);
    setRunning(true);
    setSavedMsg('');
    setTimeout(() => textareaRef.current && textareaRef.current.focus(), 100);
  };

  const finishTest = () => {
    setRunning(false);
    // compute stats based only on what user typed (ignore lesson length for totals)
    const expected = sourceText || '';
    const typedText = typed || '';
    const charsTyped = typedText.length;

    // Compare by words instead of fixed 5-character units. This avoids cascading errors
    // when a user misses a character and shifts the remainder. We treat any word with
    // any mismatch (missing/extra/typo) as ONE wrong word.
    const expTokens = tokenizeWithIndices(expected);
    const gotTokens = tokenizeWithIndices(typedText);
    const ops = alignWords(expTokens, gotTokens);
    const typedCoverageEnd = typedText.length;
    const trimmedOps = ops.filter(op => {
      if (op.type !== 'del') return true;
      const expStart = op.exp && typeof op.exp.start === 'number' ? op.exp.start : null;
      return expStart !== null && expStart < typedCoverageEnd;
    });

    // build wrongs: count substitutions, insertions, and in-text deletions as mistakes (one per token)
    const wrongWords = [];
    trimmedOps.forEach((op, idx) => {
      if (op.type === 'sub') {
        wrongWords.push({
          idx,
          type: 'sub',
          exp: op.exp ? op.exp.token : '',
          expStart: op.exp ? op.exp.start : null,
          expEnd: op.exp ? op.exp.end : null,
          expKind: op.exp ? op.exp.kind : 'word',
          got: op.got ? op.got.token : '',
          gotStart: op.got ? op.got.start : null,
          gotEnd: op.got ? op.got.end : null,
          gotKind: op.got ? op.got.kind : 'word'
        });
      } else if (op.type === 'ins') {
        wrongWords.push({
          idx,
          type: 'ins',
          exp: '',
          expStart: null,
          expEnd: null,
          expKind: 'word',
          got: op.got ? op.got.token : '',
          gotStart: op.got ? op.got.start : null,
          gotEnd: op.got ? op.got.end : null,
          gotKind: op.got ? op.got.kind : 'word'
        });
      } else if (op.type === 'del') {
        const expToken = op.exp;
        const expStart = expToken ? expToken.start : null;
        const withinTypedRange = typeof expStart === 'number' ? expStart < typedCoverageEnd : false;
        if (withinTypedRange && expToken) {
          wrongWords.push({
            idx,
            type: 'del',
            exp: expToken.token || '',
            expStart: expToken.start,
            expEnd: expToken.end,
            expKind: expToken.kind || 'word',
            got: '',
            gotStart: null,
            gotEnd: null,
            gotKind: expToken.kind || 'word'
          });
        }
      }
      // deletions that happen after the user stops typing remain ignored so unfinished tails aren't penalized
    });

    const wrongCount = wrongWords.length;
    const totalWordsTyped = gotTokens.filter(t => t.kind === 'word').length;

    // elapsed time in seconds (use timeLimit minus remaining time)
    const elapsedSeconds = Math.max(1, (timeLimit || 60) - (timeLeft || 0));
    const minutes = elapsedSeconds / 60;

    // gross speed = typed words per minute
    const grossWpm = minutes > 0 ? (totalWordsTyped / minutes) : 0;

    // forgiveness: allow 5% of total typed words as free mistakes
    const allowedMistakes = Math.floor(totalWordsTyped * 0.05);
    const effectiveWrong = Math.max(0, wrongCount - allowedMistakes);

    // net WPM subtracts effective wrong words per minute from gross WPM
    const netWpm = Math.max(0, Math.round(grossWpm - (effectiveWrong / minutes)));

    const accuracyRatio = totalWordsTyped > 0 ? (totalWordsTyped - effectiveWrong) / totalWordsTyped : 0;
    const percent = totalWordsTyped > 0 ? Math.max(0, Math.round(accuracyRatio * 100)) : 0;
    setResult({
      charsTyped,
      totalWords: totalWordsTyped,
      wrongCount,
      allowedMistakes,
      effectiveWrong,
      percent,
      wrongs: wrongWords,
      grossWpm: Math.round(grossWpm),
      netWpm,
      elapsedSeconds,
      elapsedMinutes: minutes,
      ops: trimmedOps
    });
  };

  const exportResultPdf = () => {
    if (!result) return;
    const titleText = title || 'Typing Result';
    const lines = [];
    lines.push(`<h1 style="font-family:Arial,Helvetica,sans-serif">${escapeHtml(titleText)}</h1>`);
    lines.push(`<p style="font-family:Arial,Helvetica,sans-serif">Words typed: <strong>${result.totalWords || 0}</strong></p>`);
    lines.push(`<p style="font-family:Arial,Helvetica,sans-serif">Mistakes: <strong>${result.wrongCount}</strong></p>`);
    lines.push(`<p style="font-family:Arial,Helvetica,sans-serif">Allowed mistakes (5%): <strong>${result.allowedMistakes || 0}</strong></p>`);
    lines.push(`<p style="font-family:Arial,Helvetica,sans-serif">Effective wrong words: <strong>${result.effectiveWrong || 0}</strong></p>`);
    lines.push(`<p style="font-family:Arial,Helvetica,sans-serif">Gross WPM: <strong>${result.grossWpm || 0}</strong></p>`);
    lines.push(`<p style="font-family:Arial,Helvetica,sans-serif">Net WPM: <strong>${result.netWpm || 0}</strong></p>`);
    lines.push(`<p style="font-family:Arial,Helvetica,sans-serif">Percentage: <strong>${result.percent}%</strong></p>`);
    lines.push(`<p style="font-family:Arial,Helvetica,sans-serif">Time used: <strong>${formatMinutes(result.elapsedMinutes)}</strong></p>`);
    if (Array.isArray(result.wrongs) && result.wrongs.length > 0) {
      lines.push('<h3 style="font-family:Arial,Helvetica,sans-serif">Mistakes</h3>');
      lines.push('<table style="width:100%;border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;font-size:14px">');
      lines.push('<thead><tr><th style="text-align:left;border-bottom:1px solid #e5e5e5;padding:6px">Typed</th><th style="text-align:left;border-bottom:1px solid #e5e5e5;padding:6px">Expected</th><th style="text-align:left;border-bottom:1px solid #e5e5e5;padding:6px">Issue</th></tr></thead>');
      lines.push('<tbody>');
      result.wrongs.forEach(w => {
        const exp = formatTokenHtml(w.exp, w.expKind, { exposeWhitespace: true }) || '<em>—</em>';
        const got = formatTokenHtml(w.got, w.gotKind, { exposeWhitespace: true }) || '<em>—</em>';
        const issue = w.type === 'ins' ? 'Extra input' : (w.type === 'del' ? 'Missing' : 'Mismatch');
        lines.push(`<tr><td style="padding:6px;border-bottom:1px solid #f5f5f5">${got}</td><td style="padding:6px;border-bottom:1px solid #f5f5f5">${exp}</td><td style="padding:6px;border-bottom:1px solid #f5f5f5">${issue}</td></tr>`);
      });
      lines.push('</tbody></table>');
    }
    // optionally include the source text truncated for completeness
    // include typed excerpt only
    const typedText = (typeof typed !== 'undefined' && typed) ? typed : '';
    if (typedText) {
      const excerptHtml = buildSourceHtml(typedText, result);
      if (excerptHtml) {
        lines.push('<h3 style="font-family:Arial,Helvetica,sans-serif">Typed (excerpt)</h3>');
        lines.push(`<pre style="font-family:monospace;white-space:pre-wrap;background:#f7f7f7;padding:10px;border-radius:6px">${excerptHtml}</pre>`);
      }
    }

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(titleText)}</title>
      <style>body{padding:24px;color:#111}</style></head><body>${lines.join('')}</body></html>`;

    const w = window.open('', '_blank');
    if (!w) { setSavedMsg('Unable to open print window (blocked)'); return; }
    w.document.open();
    w.document.write(html);
    w.document.close();
    // wait a bit for rendering then trigger print
    setTimeout(() => { try { w.focus(); w.print(); } catch (e) {} }, 400);
  };
  const formatMinutes = (mins) => {
    if (!mins || Number.isNaN(mins)) return '0 sec';
    const rounded = Math.round(mins * 100) / 100;
    if (rounded >= 1) return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded} min`;
    return `${Math.round(rounded * 60)} sec`;
  };

  // NOTE: strict comparison is required for this tutor (match exactly including spaces/punctuation/case).

  // Build HTML for typed excerpt highlighting wrong words in red and showing expected words.
  const buildSourceHtml = (text, summary = {}) => {
    const ops = Array.isArray(summary.ops) ? summary.ops : null;
    if (ops && ops.length) {
      const spans = [];
      let pendingDeletes = [];
      const flushPending = () => {
        if (!pendingDeletes.length) return;
        const expectedHtml = pendingDeletes.map(tok => formatTokenHtml(tok ? tok.token : '', tok ? tok.kind : 'word', { exposeWhitespace: true })).join('');
        spans.push(`<span style="color:#b00;font-weight:600;margin-right:10px">∅ → ${expectedHtml}</span>`);
        pendingDeletes = [];
      };
      ops.forEach(op => {
        if (op.type === 'del') {
          if (op.exp) pendingDeletes.push(op.exp);
          return;
        }
        flushPending();
        if (op.type === 'eq') {
          const token = op.got || op.exp;
          spans.push(`<span>${formatTokenHtml(token ? token.token : '', token ? token.kind : 'word')}</span>`);
        } else if (op.type === 'sub') {
          const typedHtml = formatTokenHtml(op.got ? op.got.token : '', op.got ? op.got.kind : 'word', { exposeWhitespace: true });
          const expected = formatTokenHtml(op.exp ? op.exp.token : '', op.exp ? op.exp.kind : 'word', { exposeWhitespace: true });
          spans.push(`<span style="color:#b00;text-decoration:line-through;margin-right:6px">${typedHtml}</span><span style="color:#080;font-weight:600;margin-right:10px">→ ${expected}</span>`);
        } else if (op.type === 'ins') {
          const typedHtml = formatTokenHtml(op.got ? op.got.token : '', op.got ? op.got.kind : 'word', { exposeWhitespace: true });
          spans.push(`<span style="color:#b00;text-decoration:line-through;margin-right:10px">${typedHtml}</span>`);
        }
      });
      flushPending();
      return spans.join('');
    }

    if (!text) return '';
    const wrongs = summary && summary.wrongs ? summary.wrongs : [];
    const tokens = tokenizeWithIndices(text);
    const wrongMap = {};
    (wrongs || []).forEach(w => {
      if (typeof w.gotStart === 'number') wrongMap[w.gotStart] = w;
    });
    const spans = [];
    tokens.forEach(token => {
      const wrong = wrongMap[token.start];
      const typedHtml = formatTokenHtml(token.token, token.kind, { exposeWhitespace: !!wrong });
      if (wrong && wrong.type === 'sub') {
        const expected = formatTokenHtml(wrong.exp, wrong.expKind, { exposeWhitespace: true });
        spans.push(`<span style="color:#b00;text-decoration:line-through;margin-right:6px">${typedHtml}</span><span style="color:#080;font-weight:600;margin-right:8px">→ ${expected}</span>`);
      } else if (wrong && wrong.type === 'ins') {
        spans.push(`<span style="color:#b00;text-decoration:line-through;margin-right:6px">${typedHtml}</span>`);
      } else {
        spans.push(`<span>${typedHtml}</span>`);
      }
    });
    return spans.join(' ');
  };

  const onTypedChange = (e) => {
    const val = e.target.value;
    // if not allowing backspace, prevent shrinking
    if (!allowBackspace && val.length < typed.length) return;
    setTyped(val);
  };

  const saveExercise = async () => {
    if (!username) { setSavedMsg('Provide username before saving'); return; }
    // for manual-created exercises, assign a Lesson number suffix/prefix
    let sendTitle = title || '';
    if (selectedPractice === 'manual-create') {
      // fetch existing items to determine next lesson number
      const existing = await fetchUserExercises(username) || [];
      const next = (existing.length || 0) + 1;
      if (sendTitle) sendTitle = `Lesson ${next} - ${sendTitle}`;
      else sendTitle = `Lesson ${next} - Manual Exercise`;
    }
    const payload = { username, text: sourceText, title: sendTitle || '', displayName: displayName || '' };
    const res = await fetch('/api/typing/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const j = await res.json();
    if (j && j.error) setSavedMsg(j.error);
    else {
      // persist username/displayName locally (last one wins)
      try { if (typeof window !== 'undefined' && username) window.localStorage.setItem('typing_last_username', username); } catch (e) {}
      try { if (typeof window !== 'undefined' && displayName) window.localStorage.setItem('typing_last_displayName', displayName); } catch (e) {}
      setSavedMsg('Saved exercise for ' + username);
      // refresh exercises list for this username
      const items = await fetchUserExercises(username) || [];
      // if API returned the saved file path, select and open it for practice
      if (j && j.file) {
        try {
          const fname = String(j.file).split('/').pop();
          setSelectedPractice(`user:${fname}`);
          // load it so typing can begin
          await loadExerciseFile(fname);
          setShowPreview(true);
          setTypingReady(true);
        } catch (e) {}
      } else if (items.length > 0) {
        // select latest
        setSelectedPractice(`user:${items[0].file}`);
        await loadExerciseFile(items[0].file);
        setShowPreview(true);
        setTypingReady(true);
      }
      setIsExisting(true);
    }
  };

  const loadExercise = async () => {
    // legacy: try fetch latest?
    if (!username) { setSavedMsg('Provide username to load'); return; }
    await fetchUserExercises(username);
    setSavedMsg('Loaded list for ' + username);
  };

  useEffect(()=>{ fetchShared(); }, []);
  // When username or isExisting changes, fetch exercises only when existing user selected.
  // Also ensure the practice dropdown stays closed until user explicitly toggles it.
  useEffect(()=>{
    setDropdownOpen(false);
    if (username && isExisting) fetchUserExercises(username);
  }, [username, isExisting]);

  // previously persisted saved-list owner logic removed; dropdown handles saved list now

  return (
    <div style={{ padding: 12 }}>
      <h2>Typing Tutor</h2>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12, overflowX: 'auto', paddingBottom: 6 }}>
        <label style={{ flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', gap:8, whiteSpace: 'nowrap' }}>
          <input type="checkbox" checked={isExisting} onChange={e=>setIsExisting(e.target.checked)} />
          <span style={{ fontSize:14 }}>Existing user</span>
        </label>

        <input placeholder="Username (a-z0-9_-)" value={username} onChange={e=>setUsername(e.target.value)} style={{ padding:8, width:160, minWidth:120, flex: '0 0 auto' }} />

        {!isExisting && (
          <input placeholder="Your full name" value={displayName} onChange={e=>setDisplayName(e.target.value)} style={{ padding:8, width:180, minWidth:140, flex: '0 0 auto' }} />
        )}

        <div style={{ display:'inline-flex', gap:8, alignItems:'center', flex: '0 0 auto' }}>
          {!isExisting && (
            <button onClick={async ()=>{ if(!username){ setSavedMsg('Provide username before saving'); return;} await saveExercise(); }} style={{ padding:'8px 12px' }}>Save</button>
          )}
          {isExisting && (
            <button onClick={async ()=>{ 
              if (!username) { setSavedMsg('Provide username to show'); return; }
              await fetchUserExercises(username);
              setDropdownOpen(true);
            }} style={{ padding:'8px 12px' }}>Show</button>
          )}
        </div>

        <div style={{ display:'inline-flex', alignItems:'center', gap:8, flex: '0 0 auto' }}>
          <span style={{ fontWeight:600, whiteSpace: 'nowrap' }}>Category:</span>
          <select value={lessonCategory} onChange={e=>setLessonCategory(e.target.value)} style={{ padding:6, width:120 }}>
            <option value="beginner">Beginner</option>
            <option value="practice">Practice</option>
          </select>
        </div>

        <label style={{ display:'inline-flex', alignItems:'center', gap:8, flex: '0 0 auto', whiteSpace: 'nowrap' }}>
          <span style={{ fontSize:13 }}>Time (min)</span>
          <input type="number" step="0.5" value={timeLimit/60} onChange={e=>{ const v = Number(e.target.value||0); setTimeLimit(Math.max(0.5, v) * 60); }} style={{ width:70, padding:6 }} />
        </label>

        <label style={{ display:'inline-flex', alignItems:'center', gap:8, flex: '0 0 auto', whiteSpace: 'nowrap' }}>
          <input type="checkbox" checked={allowBackspace} onChange={e=>setAllowBackspace(e.target.checked)} />
          <span style={{ fontSize:13 }}>Allow Backspace</span>
        </label>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display:'block', marginBottom:6, fontWeight:600 }}>Select Practice</label>
        <div style={{ position: 'relative', display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ flex:1 }}>
            <div role="button" tabIndex={0} onClick={()=>setDropdownOpen(d=>!d)} onKeyDown={(e)=>{ if(e.key==='Enter') setDropdownOpen(d=>!d); }} style={{ padding:8, border:'1px solid #ccc', borderRadius:4, display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}>
              <div style={{ color: selectedPractice ? '#000' : '#666' }}>
                {selectedPractice === 'manual-create' ? 'Create Manual Exercise...' : (
                  selectedPractice && selectedPractice.startsWith('admin:') ? ( (shared && shared[lessonCategory] && shared[lessonCategory].find(it=>`admin:${it.id}`===selectedPractice)) ? (shared[lessonCategory].find(it=>`admin:${it.id}`===selectedPractice).title) : 'Admin Exercise' ) : (
                    selectedPractice && selectedPractice.startsWith('user:') ? (exercises.find(it=>`user:${it.file}`===selectedPractice)?.title || '') : '-- choose practice --'
                  )
                )}
              </div>
              <div style={{ marginLeft:8 }}>{dropdownOpen ? '▴' : '▾'}</div>
            </div>
            {dropdownOpen && (
              <div style={{ position:'absolute', zIndex:50, background:'#fff', border:'1px solid #ddd', width:'100%', marginTop:6, borderRadius:4, maxHeight:220, overflow:'auto' }}>
                <div onClick={()=>{ 
                    setDropdownOpen(false);
                    if(!username) {
                      setSavedMsg('Please create a username first to save manual exercises. Enter a username and click Save.');
                      // focus username input if possible
                      try { const el = document.querySelector('input[placeholder="Username (a-z0-9_-)"]'); if(el) el.focus(); } catch(e) {}
                      return;
                    }
                    setSelectedPractice('manual-create');
                  }} style={{ padding:8, cursor:'pointer', borderBottom:'1px solid #f1f1f1' }}>Create Manual Exercise...</div>
                {Array.isArray(shared && shared[lessonCategory]) && (shared[lessonCategory] || []).filter(it=>it.visible).map(it => (
                  <div key={`admin:${it.id}`} onClick={()=>{ setDropdownOpen(false); handleSelectPractice(`admin:${it.id}`); }} style={{ padding:8, cursor:'pointer', borderBottom:'1px solid #f9f9f9' }}>{it.title || 'Shared Exercise'}</div>
                ))}
                {(exercises || []).map(it => (
                  <div key={it.file} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:8, borderBottom:'1px solid #f9f9f9' }}>
                    <div onClick={()=>{ setDropdownOpen(false); handleSelectPractice(`user:${it.file}`); }} style={{ cursor:'pointer', flex:1 }}>{it.title ? it.title : ''}</div>
                    <div>
                      {/* show delete only when exercises belong to current username and username is set */}
                      {username && exerciseOwner === username ? (
                        <button onClick={(e)=>{ e.stopPropagation(); deleteExercise(it.file); }} style={{ background:'transparent', border:'none', color:'crimson', cursor:'pointer' }} title="Delete">✕</button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <button onClick={()=>{ if (!selectedPractice) { setSavedMsg('Choose a practice first'); return; } handleSelectPractice(selectedPractice); }} style={{ padding:'8px 12px' }}>Practice</button>
            <label style={{ display:'inline-flex', alignItems:'center', gap:6 }}><input type="checkbox" checked={showPreview} onChange={e=>setShowPreview(e.target.checked)} /> Show preview</label>
          </div>
        </div>
      </div>

      <div style={{ color: 'green', fontSize: 12, marginBottom:8 }}>
        Note: You can upload unlimited lessons, but only up to 2 saved lessons are kept per user at a time; older saved lessons are auto-removed (old files also auto-clean after 10 days).
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 300 }}>
          <div style={{ marginBottom: 8 }} />

          {selectedPractice === 'manual-create' ? (
            <div>
              <div style={{ display:'flex', gap:8, marginBottom:6 }}>
                <input placeholder="Practice title (optional)" value={title} onChange={e=>setTitle(e.target.value)} style={{ flex:1, padding:8 }} />
              </div>
              <textarea rows={6} value={sourceText} onChange={e=>setSourceText(e.target.value)} style={{ width: '100%', padding:8 }} placeholder="Type or paste text to practice" />
              <div style={{ marginTop:8 }}>
                <button onClick={saveExercise} disabled={!username} style={{ padding:'8px 12px' }}>Save</button>
              </div>
            </div>
          ) : (selectedPractice && (selectedPractice.startsWith('user:') || selectedPractice.startsWith('admin:'))) ? (
            <div />
          ) : (
            <div style={{ padding:8, background:'#f9f9f9', borderRadius:6, color:'#333' }}>
              Select a practice (lesson, admin or saved) then click Practice to open it here.
            </div>
          )}

          {/* beginner lessons are available in Select Practice when 'Beginner' checkbox is enabled */}
        </div>

        <div style={{ width: 260 }}>
          {/* controls moved to header for compact layout */}
        </div>
      </div>

      <div style={{ marginTop:12 }}>
        {showPreview && selectedPractice !== 'manual-create' && (
          <div>
            <div style={{ border: '1px solid #ddd', padding: 8, minHeight: 120, maxHeight: 220, overflow: 'auto', whiteSpace: 'pre-wrap' }}>{sourceText || <em>No text loaded</em>}</div>
            {/* live counts: characters, words, 5-char units */}
            <div style={{ marginTop: 6, fontSize: 13, color: '#444' }}>
              {(() => {
                const s = sourceText || '';
                const chars = s.length;
                const words = (s.trim().length === 0) ? 0 : (s.trim().match(/\S+/g) || []).length;
                const units = Math.ceil(chars / 5);
                return `${words} words · ${chars} characters · ${units} units (5‑char)`;
              })()}
            </div>
          </div>
        )}

        {/* Admin shared preview removed from here — it's available via Select Practice */}
      </div>

      <div style={{ marginTop:12, display:'flex', gap:8 }}>
        <button onClick={startTest} disabled={!sourceText || running || !typingReady}>Start Practice</button>
        <button onClick={finishTest} disabled={!running}>Finish Now</button>
        <div style={{ marginLeft: 'auto', alignSelf: 'center' }}>{running ? `Time left: ${timeLeft}s` : 'Not running'}</div>
      </div>

      <div style={{ marginTop:12 }}>
        <textarea
          ref={textareaRef}
          placeholder={running ? 'Keep typing...' : 'Click Start Practice to begin'}
          value={typed}
          readOnly={!running}
          onChange={onTypedChange}
          onKeyDown={(e)=>{ if (!running) { e.preventDefault(); return; } if (!allowBackspace && e.key === 'Backspace') e.preventDefault(); }}
          rows={8}
          style={{
            width: '100%',
            padding:12,
            borderRadius:8,
            border:'1px solid #cce',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Monaco, monospace',
            fontSize:16,
            lineHeight:1.5,
            background: running ? '#fcfeff' : '#f0f4f8',
            opacity: running ? 1 : 0.7
          }}
        />
      </div>

      {result && (
        <div style={{ marginTop:12, border: '1px solid #eee', padding:16, borderRadius:10, background:'#fff', boxShadow:'0 2px 6px rgba(0,0,0,0.03)', maxHeight: '60vh', overflow: 'auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontSize:18, fontWeight:700 }}>Result</div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={exportResultPdf} style={{ padding:'8px 10px' }}>📄 Export PDF</button>
              <button onClick={async ()=>{
                const siteName = 'Study GK Hub';
                const siteUrl = 'https://studygkhub.com/typing-tutor';
                const siteDesc = 'Typing Tutor — Practice timed tests for Stenographer/Clerk/HCM exams and export detailed PDFs.';
                const shareText = `${siteName} Typing Result\nWords: ${result.totalWords || 0}\nMistakes: ${result.wrongCount}\nAccuracy: ${result.percent}%\nTime used: ${formatMinutes(result.elapsedMinutes)}\n${siteDesc}\n${siteUrl}\n(Use Export PDF to attach the detailed sheet.)`;
                const url = siteUrl;
                try {
                  if (navigator.share) {
                    await navigator.share({ title: `${siteName} Typing Result`, text: shareText, url });
                  } else {
                    await navigator.clipboard.writeText(shareText + '\n' + url);
                    setSavedMsg('Result copied to clipboard');
                  }
                } catch (e) { setSavedMsg('Share failed'); }
              }} style={{ padding:'8px 10px' }}>🔗 Share</button>
            </div>
          </div>

          <div style={{ marginTop:12, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div style={{ padding:12, borderRadius:8, background:'#eef6ff' }}>
              <div style={{ color:'#666', fontSize:13 }}>Time used</div>
              <div style={{ fontSize:20, fontWeight:700 }}>{formatMinutes(result.elapsedMinutes)}</div>
            </div>
            <div style={{ padding:12, borderRadius:8, background:'#fbfbff' }}>
                <div style={{ color:'#666', fontSize:13 }}>Words</div>
                  <div style={{ fontSize:20, fontWeight:700 }}>{result.totalWords || 0}</div>
            </div>
            <div style={{ padding:12, borderRadius:8, background:'#fff6f6' }}>
              <div style={{ color:'#666', fontSize:13 }}>Mistakes</div>
              <div style={{ fontSize:20, fontWeight:700, color:'#c33' }}>{result.wrongCount}</div>
            </div>
            <div style={{ padding:12, borderRadius:8, background:'#fffaf0' }}>
              <div style={{ color:'#666', fontSize:13 }}>Effective wrong (after 5%)</div>
              <div style={{ fontSize:18, fontWeight:700 }}>{result.effectiveWrong}</div>
            </div>
            <div style={{ padding:12, borderRadius:8, background:'#f6fffb' }}>
              <div style={{ color:'#666', fontSize:13 }}>Accuracy</div>
              <div style={{ fontSize:20, fontWeight:700, color:'#0a0' }}>{result.percent}%</div>
            </div>
            <div style={{ padding:12, borderRadius:8, background:'#f0f7ff' }}>
              <div style={{ color:'#666', fontSize:13 }}>Gross WPM</div>
              <div style={{ fontSize:20, fontWeight:700 }}>{result.grossWpm || 0}</div>
            </div>
            <div style={{ padding:12, borderRadius:8, background:'#f7fff6' }}>
              <div style={{ color:'#666', fontSize:13 }}>Net WPM</div>
              <div style={{ fontSize:20, fontWeight:700 }}>{result.netWpm || 0}</div>
            </div>
          </div>

          {typed && typed.length > 0 && (
            <div style={{ marginTop:12 }}>
              <div style={{ fontWeight:700, marginBottom:6 }}>Typed (excerpt)</div>
              <div style={{ fontFamily:'monospace', background:'#f7f7f7', padding:12, borderRadius:8, maxHeight:220, overflow:'auto', whiteSpace:'pre-wrap' }} dangerouslySetInnerHTML={{ __html: buildSourceHtml(typed, result) }} />
            </div>
          )}
        </div>
      )}

      {savedMsg && <div style={{ marginTop:12, color: savedMsg.includes('Saved') ? 'green' : 'crimson' }}>{savedMsg}</div>}
    </div>
  );
}
