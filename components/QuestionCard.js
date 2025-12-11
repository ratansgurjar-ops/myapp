import React, { useState, useEffect } from 'react';

export default function QuestionCard({ item, displayLang: displayLangProp }) {
  const [show, setShow] = useState(false);
  const [flagging, setFlagging] = useState(false);
  const [flags, setFlags] = useState(item.flags_count || 0);
  
  const [displayLang, setDisplayLang] = useState(displayLangProp || 'both'); // 'english' | 'hindi' | 'both'

  // keep local displayLang in sync when parent prop changes
  useEffect(() => {
    setDisplayLang(displayLangProp || 'both');
  }, [displayLangProp]);

  const onFlag = async () => {
    if (flagging) return;
    setFlagging(true);
    await fetch('/api/questions/flag', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id }) });
    setFlags((f) => f + 1);
    setFlagging(false);
  };

  

  return (
    <div className="question-card" style={{ border: '1px solid #eee', padding: 12, marginBottom: 12, borderRadius: 6 }}>
      <div className="qc-main" style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            {displayLang === 'both' ? (
              <div>
                <div style={{ fontWeight: 700 }}>{item.question_english || ''}</div>
                <div style={{ fontSize: 13, color: '#666', marginTop: 6 }}>{item.question_hindi || ''}</div>
              </div>
            ) : displayLang === 'hindi' ? (
              <div style={{ fontWeight: 700 }}>{item.question_hindi || item.question_english || ''}</div>
            ) : (
              <div style={{ fontWeight: 700 }}>{item.question_english || item.question_hindi || ''}</div>
            )}
          </div>
          
        </div>
        { !displayLangProp && (
          <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
            <button onClick={() => setDisplayLang('english')} style={{ padding: '4px 8px' }}>EN</button>
            <button onClick={() => setDisplayLang('hindi')} style={{ padding: '4px 8px' }}>HI</button>
            <button onClick={() => setDisplayLang('both')} style={{ padding: '4px 8px' }}>Both</button>
          </div>
        )}

        <ul style={{ marginTop: 8, paddingLeft: 0, listStyle: 'none' }}>
          {[1,2,3,4].map((i) => {
            const eng = item[`options_${i}_english`];
            const hin = item[`options_${i}_hindi`];
            if (!eng && !hin) return null;
            const showEng = displayLang === 'english' || displayLang === 'both';
            const showHin = displayLang === 'hindi' || displayLang === 'both';
            return (
              <li key={i} style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ width: 22, flex: '0 0 22px', fontWeight: 700 }}>{i}.</div>
                <div style={{ flex: 1 }}>
                  {showEng && <div style={{ display: 'block' }}>{eng}</div>}
                  {showHin && hin && <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{hin}</div>}
                </div>
              </li>
            );
          })}
        </ul>

        <div style={{ marginTop: 8 }}>
          <button onClick={() => setShow((s) => !s)}>{show ? 'Hide Answer' : 'Show Answer'}</button>
        </div>

        {show && (
          <div style={{ marginTop: 8, background: '#f8f8f8', padding: 8, borderRadius: 4 }}>
            <div><strong>Answer:</strong> {item.answer}</div>
            {item.solution && <div style={{ marginTop: 6 }}><strong>Solution:</strong> <div dangerouslySetInnerHTML={{ __html: item.solution }} /></div>}
          </div>
        )}
      </div>

      {/* flag UI removed per request */}
    </div>
  );
}
