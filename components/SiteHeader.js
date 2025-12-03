import React from 'react';

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container header-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexDirection: 'row' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, textAlign: 'left', flexDirection: 'column' }}>
          <div>
            <h1 style={{ margin: 0 }}>StudyGK</h1>
            <div className="header-subtexts">
              <div className="desc">Practice MCQs, News & Typing Tutor</div>
              <div className="hindi">प्रैक्टिस MCQs, समाचार और टाइपिंग ट्यूटर</div>
              <div className="lead">Prepare for SSC, CGL, UPSC and more — daily GK practice</div>
              <div className="hindi">SSC, CGL, UPSC और अन्य परीक्षाओं की तैयारी — दैनिक GK अभ्यास</div>
            </div>
          </div>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={() => { window.location.href = '/'; }}
            style={{
              fontWeight: 800,
              color: '#ffffff',
              background: '#003366',
              border: 'none',
              padding: '10px 18px',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 16,
              boxShadow: '0 4px 10px rgba(0,0,0,0.12)'
            }}
          >
            GK Practice
          </button>

          <button
            onClick={() => { window.location.href = '/typing-tutor'; }}
            style={{
              fontWeight: 800,
              color: '#ffffff',
              background: '#003366',
              border: 'none',
              padding: '10px 18px',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 16,
              boxShadow: '0 4px 10px rgba(0,0,0,0.12)'
            }}
          >
            Typing Tutor
          </button>
        </div>
      </div>
    </header>
  );
}
